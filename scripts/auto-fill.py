#!/usr/bin/env python3
"""
Auto-fill unattested phonetic transformations using Gemini 2.5 Flash
with native Google Search grounding.

See docs/auto-fill-pipeline.md for design documentation.
"""

import json
import os
import re
import sys
import time
import glob
import subprocess
from pathlib import Path

import boto3
from google import genai
from google.genai import types

REPO_ROOT = Path(__file__).parent.parent
TRANSFORMATIONS_DIR = REPO_ROOT / "public/data/transformations"
SHARDS_DIR = REPO_ROOT / "public/data/shards"
SYMBOLS_DIR = REPO_ROOT / "public/data/symbols"
SKILL_PATH = REPO_ROOT / ".gemini/skills/phonomorph-researcher/SKILL.md"
WORKFLOW_PATH = REPO_ROOT / ".github/workflows/auto-fill.yml"
TRIED_PATH = SHARDS_DIR / "autofill-tried.json"
FAILED_PATH = SHARDS_DIR / "autofill-failed.json"
SUMMARY_PATH = Path("/tmp/auto-fill-summary.json")

BATCH_SIZE = int(os.environ.get("BATCH_SIZE", "30"))
# A parse/schema failure may be transient (Gemini returning malformed JSON).
# Retry up to this many times before promoting the ID to the permanent tried
# cache. Skipped IDs (Gemini-confirmed unattested) bypass this and go straight
# to permanent.
MAX_FAILURE_RETRIES = 3
AWS_REGION = "eu-central-1"
GEMINI_SECRET = "openclaw/gemini-api-key"
GEMINI_MODEL = "gemini-2.5-flash"

REQUIRED_FIELDS = [
    "fromId", "toId", "preamble", "phoneticEffects",
    "languageExamples", "certainty", "commonality", "sources", "tags",
]

FAMILY_TERMS = {
    "Romance", "Germanic", "Slavic", "Sino-Tibetan", "Japonic", "Austronesian",
    "Indo-European", "Semitic", "Afroasiatic", "Dravidian", "Turkic", "Mongolic",
    "Uralic", "Kartvelian", "Niger-Congo", "Bantu", "Mayan", "Indo-Aryan",
    "Iranian", "Celtic", "Baltic", "Koreanic", "Tai-Kadai", "Austroasiatic",
    "Afro-Asiatic", "Nakh-Dagestani", "Quechuan", "Athabaskan", "Algonquian",
    "Cushitic", "Berber", "Chadic", "Nilotic", "Pama-Nyungan", "Na-Dene",
    "Eskimo-Aleut", "Tibeto-Burman", "Oto-Manguean", "Panoan",
}

# Candidates that are phonetically well-motivated — prioritised first
HIGH_VALUE_PAIRS = {
    ("p", "f"), ("t", "s"), ("k", "x"), ("f", "h"), ("b", "v"), ("d", "z"),
    ("g", "x"), ("k", "h"), ("t", "h"), ("p", "b"), ("t", "d"), ("k", "g"),
    ("a", "e"), ("e", "i"), ("o", "u"), ("a", "o"), ("e", "o"), ("i", "e"),
    ("u", "o"), ("a", "schwa"), ("e", "schwa"), ("i", "schwa"), ("o", "schwa"),
    ("n", "ng"), ("l", "r"), ("r", "l"), ("s", "sh"), ("sh", "s"),
    ("m", "n"), ("n", "m"), ("t", "ch"), ("d", "j_affricate"),
    ("l", "u"), ("r", "schwa"), ("v", "u"), ("b", "w"),
}

VOWEL_IDS = {
    "a", "e", "i", "o", "u", "schwa", "ash", "eps", "caret",
    "a_nas", "e_nas", "i_nas", "o_nas", "u_nas",
    "ai", "au", "ei", "oi", "ou", "ie", "uo",
}

CLICK_IDS = {
    "click_alveolar", "click_dental", "click_lateral",
    "click_palatal", "click_retroflex",
}

STOP_NASAL_IDS = {"p", "b", "t", "d", "k", "g", "m", "n", "ng", "q", "glottal_stop"}


# ---------------------------------------------------------------------------
# Secrets
# ---------------------------------------------------------------------------

def get_gemini_key() -> str:
    val = os.environ.get("GEMINI_API_KEY")
    if val:
        return val
    client = boto3.client("secretsmanager", region_name=AWS_REGION)
    return client.get_secret_value(SecretId=GEMINI_SECRET)["SecretString"].strip()


# ---------------------------------------------------------------------------
# Atlas data loading
# ---------------------------------------------------------------------------

def load_unattested() -> list[str]:
    ids: list[str] = []
    for path in sorted(glob.glob(str(SHARDS_DIR / "unattested-*.json"))):
        ids.extend(json.loads(Path(path).read_text()))
    return ids


def load_existing_ids() -> set[str]:
    ids: set[str] = set()
    for path in sorted(glob.glob(str(SHARDS_DIR / "transformations-*.json"))):
        for item in json.loads(Path(path).read_text()):
            ids.add(item["id"])
    return ids


def load_symbol_ids() -> set[str]:
    index = json.loads((REPO_ROOT / "public/data/index.json").read_text())
    return {s["id"] for s in index["symbols"]}


def load_symbol(symbol_id: str) -> dict:
    path = SYMBOLS_DIR / f"{symbol_id}.json"
    return json.loads(path.read_text()) if path.exists() else {"id": symbol_id}


def load_tried_ids() -> set[str]:
    if TRIED_PATH.exists():
        return set(json.loads(TRIED_PATH.read_text()))
    return set()


def load_failed_ids() -> dict[str, int]:
    """Load the transient-failure cache: {id: retry_count}."""
    if FAILED_PATH.exists():
        return json.loads(FAILED_PATH.read_text())
    return {}


def load_in_flight_ids() -> set[str]:
    """IDs being added to public/data/transformations/ in any open PR.

    Prevents re-researching a shift that is already filled in an unmerged
    PR (the file isn't on master yet, but the work is done). Without this
    check, the cron will re-research the same candidate every run until
    the PR merges, producing duplicate PRs that all conflict with each
    other.

    Returns empty set if not in GitHub Actions or if the gh call fails —
    we degrade to the pre-existing duplicate-fill behavior rather than
    block the run on a transient API hiccup.
    """
    if not os.environ.get("GITHUB_ACTIONS"):
        return set()
    try:
        result = subprocess.run(
            ["gh", "pr", "list", "--state", "open", "--json", "files", "--limit", "100"],
            cwd=REPO_ROOT, capture_output=True, text=True, check=True,
        )
        prs = json.loads(result.stdout)
    except (subprocess.CalledProcessError, json.JSONDecodeError, FileNotFoundError) as exc:
        print(f"Could not load in-flight IDs ({exc}); proceeding without.")
        return set()

    ids: set[str] = set()
    for pr in prs:
        for f in pr.get("files", []):
            path = f["path"]
            if path.startswith("public/data/transformations/") and path.endswith(".json"):
                ids.add(Path(path).stem)
    return ids


def save_caches(tried: set[str], failed: dict[str, int]) -> None:
    """Write both caches and commit directly to master (GitHub Actions only).

    The two files are bundled into a single commit so we only push once per
    run. The push uses rebase-and-retry because master may have moved during
    the run; neither file is touched by any other workflow, so a rebase
    should never produce a conflict.
    """
    TRIED_PATH.write_text(json.dumps(sorted(tried), indent=2) + "\n")
    FAILED_PATH.write_text(json.dumps(failed, sort_keys=True, indent=2) + "\n")

    if not os.environ.get("GITHUB_ACTIONS"):
        print("Not in GitHub Actions — caches saved locally only.")
        return

    subprocess.run(["git", "config", "user.name", "github-actions[bot]"], cwd=REPO_ROOT, check=True)
    subprocess.run(["git", "config", "user.email", "github-actions[bot]@users.noreply.github.com"], cwd=REPO_ROOT, check=True)
    subprocess.run(["git", "add", str(TRIED_PATH), str(FAILED_PATH)], cwd=REPO_ROOT, check=True)
    if subprocess.run(["git", "diff", "--cached", "--quiet"], cwd=REPO_ROOT).returncode == 0:
        print("Caches unchanged — skipping commit.")
        return
    subprocess.run(
        ["git", "commit", "-m", f"ci: update autofill caches (tried: {len(tried)} | failed: {len(failed)})"],
        cwd=REPO_ROOT, check=True,
    )
    for attempt in range(5):
        if subprocess.run(["git", "push", "origin", "HEAD"], cwd=REPO_ROOT).returncode == 0:
            print(f"Caches pushed to master (tried: {len(tried)} | failed: {len(failed)}).")
            return
        print(f"Push rejected (attempt {attempt + 1}/5); rebasing onto origin/master.")
        subprocess.run(["git", "fetch", "origin", "master"], cwd=REPO_ROOT, check=True)
        subprocess.run(["git", "rebase", "origin/master"], cwd=REPO_ROOT, check=True)

    # Push exhausted retries — undo the local commit but keep both file
    # changes staged. The workflow's PR-branch step will bundle the caches
    # into the PR commit alongside any newly filled transformations.
    print("Push failed after 5 attempts; rolling back local commit (file changes retained).")
    subprocess.run(["git", "reset", "--soft", "HEAD^"], cwd=REPO_ROOT, check=True)
    raise RuntimeError("Failed to push caches after 5 attempts.")


# ---------------------------------------------------------------------------
# ID parsing — IDs like "t_retroflex_to_r" or "a_nas_to_e_nas"
# ---------------------------------------------------------------------------

def parse_id(uid: str, symbols: set[str]) -> tuple[str, str] | None:
    """Split uid into (fromId, toId) where both are valid symbol IDs."""
    parts = uid.split("_to_")
    # Try each possible split point
    for i in range(1, len(parts)):
        from_id = "_to_".join(parts[:i])
        to_id = "_to_".join(parts[i:])
        if from_id in symbols and to_id in symbols:
            return from_id, to_id
    return None


# ---------------------------------------------------------------------------
# Candidate scoring and selection
# ---------------------------------------------------------------------------

def score(from_id: str, to_id: str) -> int:
    if from_id in CLICK_IDS or to_id in CLICK_IDS:
        return 0
    if from_id in VOWEL_IDS and to_id in STOP_NASAL_IDS:
        return 0
    if (from_id, to_id) in HIGH_VALUE_PAIRS:
        return 3
    if from_id not in VOWEL_IDS and to_id not in VOWEL_IDS:
        return 2
    if from_id in VOWEL_IDS and to_id in VOWEL_IDS:
        return 2
    return 1


def select_candidates(
    unattested: list[str],
    existing: set[str],
    symbols: set[str],
    tried: set[str],
    in_flight: set[str],
) -> list[tuple[int, str, str, str]]:
    scored = []
    for uid in unattested:
        if uid in existing:
            continue
        if uid in tried:
            continue
        if uid in in_flight:
            continue
        if (TRANSFORMATIONS_DIR / f"{uid}.json").exists():
            continue
        pair = parse_id(uid, symbols)
        if pair is None:
            continue
        from_id, to_id = pair
        s = score(from_id, to_id)
        if s > 0:
            scored.append((s, uid, from_id, to_id))

    scored.sort(key=lambda x: (-x[0], x[1]))
    return scored[:BATCH_SIZE]


# ---------------------------------------------------------------------------
# Prompt construction
# ---------------------------------------------------------------------------

def load_skill() -> str:
    text = SKILL_PATH.read_text()
    # Strip YAML frontmatter
    return re.sub(r"^---.*?---\s*", "", text, flags=re.DOTALL).strip()


def build_prompt(from_id: str, to_id: str, from_sym: dict, to_sym: dict) -> str:
    skill = load_skill()
    return f"""{skill}

---

Research the shift: **{from_id}_to_{to_id}**

From symbol: {json.dumps(from_sym)}
To symbol:   {json.dumps(to_sym)}

CRITICAL OUTPUT RULES — failure to follow these will cause your response to be rejected:
1. Your ENTIRE response must be a single JSON object and nothing else.
2. No markdown fences (no ```json), no explanation, no prose before or after the JSON.
3. The JSON must match the schema above exactly (fromId, toId, preamble, phoneticEffects, languageExamples, certainty, commonality, sources, tags).
4. If research finds NO regular, historically attested shift, output exactly this and nothing else: {{"unattested": true}}
"""


# ---------------------------------------------------------------------------
# Gemini call
# ---------------------------------------------------------------------------

def call_gemini(client: genai.Client, prompt: str) -> str:
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            tools=[types.Tool(google_search=types.GoogleSearch())],
            temperature=0.2,
        ),
    )
    # response.text can be None when search grounding is active;
    # assemble from parts in that case
    if response.text is not None:
        return response.text
    parts = []
    for candidate in response.candidates or []:
        for part in candidate.content.parts or []:
            if hasattr(part, "text") and part.text:
                parts.append(part.text)
    return "\n".join(parts)


# ---------------------------------------------------------------------------
# JSON extraction and validation
# ---------------------------------------------------------------------------

def extract_json(text: str) -> dict | None:
    # Strip markdown code fences if present
    m = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    raw = m.group(1) if m else re.search(r"(\{.*\})", text, re.DOTALL)
    if not raw:
        return None
    try:
        return json.loads(raw if isinstance(raw, str) else raw.group(1))
    except json.JSONDecodeError:
        return None


def validate_and_fix(data: dict, from_id: str, to_id: str) -> dict | None:
    for field in REQUIRED_FIELDS:
        if field not in data:
            print(f"    missing field: {field}")
            return None

    data["fromId"] = from_id
    data["toId"] = to_id

    try:
        certainty = int(data["certainty"])
        commonality = int(data["commonality"])
    except (ValueError, TypeError):
        return None

    if not (1 <= certainty <= 5) or not (1 <= commonality <= 5):
        return None

    # phoneticEffects must be a comma-separated list of terms, not prose.
    # Strip trailing period, then drop everything from the first mid-sentence
    # period (Gemini sometimes appends an extra sentence).
    pe = data["phoneticEffects"].rstrip(".")
    if ". " in pe:
        pe = pe.split(". ")[0]
    data["phoneticEffects"] = pe

    # Filter out Vertex AI grounding redirect URLs — they are ephemeral.
    # If real sources remain, keep them. If only grounding URLs were provided,
    # substitute a placeholder and lower certainty so the entry is flagged for
    # manual source verification before merge.
    real_sources = [
        s for s in data.get("sources", [])
        if "vertexaisearch" not in s and "grounding-api-redirect" not in s
    ]
    if not real_sources:
        print("    only Vertex grounding URLs — substituting placeholder, lowering certainty")
        data["sources"] = ["Source via Google Search grounding (verify before merge)"]
        data["certainty"] = max(1, int(data.get("certainty", 2)) - 1)
    else:
        data["sources"] = real_sources

    # Remove empty note fields
    for eg in data.get("languageExamples", []):
        for ex in eg.get("examples", []):
            if ex.get("note") == "":
                ex.pop("note")

    # Drop empty related array
    if "related" in data and data["related"] == []:
        del data["related"]

    # Fix tag order: process terms before language family terms
    tags = data.get("tags", [])
    if tags and tags[0] in FAMILY_TERMS:
        data["tags"] = [t for t in tags if t not in FAMILY_TERMS] + \
                       [t for t in tags if t in FAMILY_TERMS]

    if not data.get("languageExamples"):
        return None

    return data


# ---------------------------------------------------------------------------
# Cron self-disable
# ---------------------------------------------------------------------------

def disable_cron_schedule() -> None:
    """Remove the schedule: block from the workflow file and push to master.

    Only runs inside GitHub Actions to avoid accidental local commits.
    """
    if not os.environ.get("GITHUB_ACTIONS"):
        print("Not in GitHub Actions — skipping cron disable.")
        return

    text = WORKFLOW_PATH.read_text()
    updated = re.sub(r"  schedule:\n    - cron:.*\n", "", text)
    if updated == text:
        print("Cron schedule block not found — nothing to remove.")
        return

    WORKFLOW_PATH.write_text(updated)
    subprocess.run(["git", "config", "user.name", "github-actions[bot]"], cwd=REPO_ROOT, check=True)
    subprocess.run(["git", "config", "user.email", "github-actions[bot]@users.noreply.github.com"], cwd=REPO_ROOT, check=True)
    subprocess.run(["git", "add", str(WORKFLOW_PATH)], cwd=REPO_ROOT, check=True)
    subprocess.run(
        ["git", "commit", "-m", "ci: disable auto-fill cron — candidate pool exhausted"],
        cwd=REPO_ROOT, check=True,
    )
    subprocess.run(["git", "push", "origin", "HEAD"], cwd=REPO_ROOT, check=True)
    print("Cron schedule disabled — workflow updated on master.")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    print("Loading Gemini API key...")
    api_key = get_gemini_key()
    client = genai.Client(api_key=api_key)

    print("Loading atlas data...")
    unattested = load_unattested()
    existing = load_existing_ids()
    symbols = load_symbol_ids()
    tried = load_tried_ids()
    failed_cache = load_failed_ids()
    in_flight = load_in_flight_ids()
    print(
        f"  {len(unattested)} unattested | {len(existing)} existing | "
        f"{len(symbols)} symbols | {len(tried)} tried | "
        f"{len(failed_cache)} failed-retry | {len(in_flight)} in-flight"
    )

    print("Selecting candidates...")
    candidates = select_candidates(unattested, existing, symbols, tried, in_flight)
    print(f"  Selected {len(candidates)} candidates (batch_size={BATCH_SIZE})")

    if not candidates:
        print("No candidates — disabling cron and exiting.")
        disable_cron_schedule()
        sys.exit(0)

    filled: list[str] = []
    skipped: list[str] = []
    failed: list[str] = []

    for i, (s, uid, from_id, to_id) in enumerate(candidates, 1):
        print(f"\n[{i}/{len(candidates)}] {uid}  (score={s})")
        from_sym = load_symbol(from_id)
        to_sym = load_symbol(to_id)
        prompt = build_prompt(from_id, to_id, from_sym, to_sym)

        try:
            raw = call_gemini(client, prompt)
            data = extract_json(raw)

            if data is None:
                print("  FAIL  could not parse JSON from response")
                failed.append(uid)
            elif data.get("unattested"):
                print("  SKIP  Gemini: no attested shift found")
                skipped.append(uid)
            else:
                validated = validate_and_fix(data, from_id, to_id)
                if validated is None:
                    print("  FAIL  schema validation failed")
                    failed.append(uid)
                else:
                    out = TRANSFORMATIONS_DIR / f"{uid}.json"
                    out.write_text(json.dumps(validated, ensure_ascii=False, indent=2) + "\n")
                    n_examples = sum(len(eg["examples"]) for eg in validated["languageExamples"])
                    print(f"  FILLED  certainty={validated['certainty']}  examples={n_examples}")
                    filled.append(uid)

        except Exception as exc:
            print(f"  ERROR  {exc}")
            failed.append(uid)

        time.sleep(0.2)

    print(f"\n{'='*50}")
    print(f"Filled:   {len(filled)}")
    print(f"Skipped:  {len(skipped)}  (unattested per Gemini)")
    print(f"Failed:   {len(failed)}")

    if filled:
        print("\nRebuilding index...")
        subprocess.run(["npm", "run", "rebuild-index"], cwd=REPO_ROOT, check=True)

    # Write summary + PR body BEFORE attempting the cache push so the
    # workflow can still create a PR if save_caches fails.
    summary = {"filled": filled, "skipped": skipped, "failed": failed}
    SUMMARY_PATH.write_text(json.dumps(summary, indent=2))
    print(f"Summary → {SUMMARY_PATH}")

    filled_list = "\n".join(f"- `{uid}`" for uid in filled)
    pr_body = (
        f"## Auto-fill results\n\n"
        f"Filled: {len(filled)} | Skipped (unattested): {len(skipped)} | Failed: {len(failed)}\n\n"
        f"### Filled transformations\n{filled_list}\n\n"
        f"---\n"
        f"*Generated by the auto-fill workflow using Gemini 2.5 Flash with Google Search grounding. "
        f"Review each JSON file before merging.*"
    )
    Path("/tmp/pr-body.md").write_text(pr_body)
    print("PR body → /tmp/pr-body.md")

    # Update both caches:
    #   - skipped (Gemini-confirmed unattested) → permanent tried cache
    #   - failed (parse/schema errors) → transient cache with retry counter;
    #     promoted to tried cache once retry count reaches MAX_FAILURE_RETRIES
    #   - filled IDs → cleared from failed cache (a successful fill means
    #     prior failures were transient)
    new_tried = tried | set(skipped)
    new_failed = dict(failed_cache)
    for uid in failed:
        count = new_failed.get(uid, 0) + 1
        if count >= MAX_FAILURE_RETRIES:
            new_tried.add(uid)
            new_failed.pop(uid, None)
        else:
            new_failed[uid] = count
    for uid in filled:
        new_failed.pop(uid, None)
    # Defensive: any ID that ended up in tried this run must not also linger
    # in failed (covers the skipped→tried path where the ID was previously
    # in failed-retry).
    for uid in new_tried:
        new_failed.pop(uid, None)

    if new_tried != tried or new_failed != failed_cache:
        print(
            f"\nSaving caches (tried: {len(tried)} → {len(new_tried)}, "
            f"failed-retry: {len(failed_cache)} → {len(new_failed)})..."
        )
        try:
            save_caches(new_tried, new_failed)
        except Exception as exc:
            print(f"WARNING: cache push failed ({exc}); will retry next run.")

    if not filled:
        print("Nothing filled — workflow will skip PR creation.")
        sys.exit(0)


if __name__ == "__main__":
    main()
