#!/usr/bin/env python3
"""
Auto-fill unattested phonetic transformations using Gemini 2.0 Flash
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
SUMMARY_PATH = Path("/tmp/auto-fill-summary.json")

BATCH_SIZE = int(os.environ.get("BATCH_SIZE", "30"))
AWS_REGION = "eu-central-1"
GEMINI_SECRET = "openclaw/gemini-api-key"
GEMINI_MODEL = "gemini-2.0-flash"

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
    return set(index["symbols"].keys())


def load_symbol(symbol_id: str) -> dict:
    path = SYMBOLS_DIR / f"{symbol_id}.json"
    return json.loads(path.read_text()) if path.exists() else {"id": symbol_id}


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
) -> list[tuple[int, str, str, str]]:
    scored = []
    for uid in unattested:
        if uid in existing:
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

Rules:
- Return ONLY a raw JSON object — no markdown fences, no explanation text.
- Follow every style rule in the schema above exactly.
- If no regular, historically attested shift exists after thorough research, \
return exactly: {{"unattested": true}}
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
    return response.text


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

    # Strip trailing period from phoneticEffects
    data["phoneticEffects"] = data["phoneticEffects"].rstrip(".")

    # Remove empty note fields
    for eg in data.get("languageExamples", []):
        for ex in eg.get("examples", []):
            if ex.get("note") == "":
                ex.pop("note")

    # Fix tag order: process terms before language family terms
    tags = data.get("tags", [])
    if tags and tags[0] in FAMILY_TERMS:
        data["tags"] = [t for t in tags if t not in FAMILY_TERMS] + \
                       [t for t in tags if t in FAMILY_TERMS]

    if not data.get("languageExamples"):
        return None

    return data


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
    print(f"  {len(unattested)} unattested | {len(existing)} existing | {len(symbols)} symbols")

    print("Selecting candidates...")
    candidates = select_candidates(unattested, existing, symbols)
    print(f"  Selected {len(candidates)} candidates (batch_size={BATCH_SIZE})")

    if not candidates:
        print("No candidates — exiting.")
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

        time.sleep(1)  # stay within 15 RPM free-tier limit

    print(f"\n{'='*50}")
    print(f"Filled:   {len(filled)}")
    print(f"Skipped:  {len(skipped)}  (unattested per Gemini)")
    print(f"Failed:   {len(failed)}")

    if filled:
        print("\nRebuilding index...")
        subprocess.run(["npm", "run", "rebuild-index"], cwd=REPO_ROOT, check=True)

    summary = {"filled": filled, "skipped": skipped, "failed": failed}
    SUMMARY_PATH.write_text(json.dumps(summary, indent=2))
    print(f"Summary → {SUMMARY_PATH}")

    # Write PR body for the workflow step
    filled_list = "\n".join(f"- `{uid}`" for uid in filled)
    pr_body = (
        f"## Auto-fill results\n\n"
        f"Filled: {len(filled)} | Skipped (unattested): {len(skipped)} | Failed: {len(failed)}\n\n"
        f"### Filled transformations\n{filled_list}\n\n"
        f"---\n"
        f"*Generated by the auto-fill workflow using Gemini 2.0 Flash with Google Search grounding. "
        f"Review each JSON file before merging.*"
    )
    Path("/tmp/pr-body.md").write_text(pr_body)
    print("PR body → /tmp/pr-body.md")

    if not filled:
        print("Nothing filled — workflow will skip PR creation.")
        sys.exit(0)


if __name__ == "__main__":
    main()
