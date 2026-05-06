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
import subprocess
from pathlib import Path

import boto3
from google import genai
from google.genai import types

REPO_ROOT = Path(__file__).parent.parent
TRANSFORMATIONS_DIR = REPO_ROOT / "public/data/transformations"
SHARDS_DIR = REPO_ROOT / "public/data/shards"
SYMBOLS_DIR = REPO_ROOT / "public/data/symbols"
UNATTESTED_FILE = REPO_ROOT / "public/data/unattested.json"
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

# Phonological feature tables for candidate distance scoring (#6)
# Consonants: (place, manner, voiced)
#   place:  0=bilabial 1=labiodental 2=dental 3=alveolar 4=postalveolar
#           5=palatal 6=velar 7=uvular 8=pharyngeal 9=glottal
#   manner: 0=stop 1=nasal 2=fricative 3=affricate 4=lateral 5=rhotic 6=approximant
CONSONANT_FEATS: dict[str, tuple[int, int, int]] = {
    "p": (0,0,0), "b": (0,0,1),
    "f": (1,2,0), "v": (1,2,1),
    "t": (3,0,0), "d": (3,0,1),
    "s": (3,2,0), "z": (3,2,1),
    "sh": (4,2,0), "zh": (4,2,1),
    "ts": (3,3,0), "tch": (4,3,0),
    "t_palatal": (5,3,0), "d_palatal": (5,3,1),
    "m": (0,1,1), "n": (3,1,1), "ng": (6,1,1), "n_palatal": (5,1,1),
    "k": (6,0,0), "g": (6,0,1),
    "x": (6,2,0), "gamma": (6,2,1),
    "h": (9,2,0), "q": (7,0,0),
    "ain": (8,2,1), "eth": (2,2,1),
    "l": (3,4,1), "l_palatal": (5,4,1),
    "r": (3,5,1),
    "j_glide": (5,6,1), "w_glide": (0,6,1),
    "glottal_stop": (9,0,0),
}

# Vowels: (height, backness, rounded, nasal)
#   height: 0=high 1=mid 2=low  backness: 0=front 1=central 2=back
VOWEL_FEATS: dict[str, tuple[int, int, int, int]] = {
    "i": (0,0,0,0), "e": (1,0,0,0), "eps": (1,0,0,0),
    "a": (2,1,0,0), "ash": (2,0,0,0), "caret": (1,1,0,0),
    "o": (1,2,1,0), "u": (0,2,1,0), "schwa": (1,1,0,0),
    "a_nas": (2,1,0,1), "e_nas": (1,0,0,1), "i_nas": (0,0,0,1),
    "o_nas": (1,2,1,1), "u_nas": (0,2,1,1),
    "ai": (1,0,0,0), "au": (1,1,0,0), "ei": (0,0,0,0),
    "oi": (1,1,0,0), "ou": (1,2,1,0), "ie": (0,0,0,0), "uo": (0,2,1,0),
}

GENERIC_CITATION_RE = re.compile(
    r"Ladefoged\b|Maddieson\b|Campbell,?\s+\d{4}|Crystal,?\s+\d{4}|Hock,?\s+\d{4}|Handbook of",
    re.IGNORECASE,
)


def phone_distance(a_id: str, b_id: str) -> float:
    """Articulatory distance between two phoneme IDs. Lower = more closely related."""
    a_c, b_c = CONSONANT_FEATS.get(a_id), CONSONANT_FEATS.get(b_id)
    a_v, b_v = VOWEL_FEATS.get(a_id), VOWEL_FEATS.get(b_id)
    if a_c and b_c:
        return abs(a_c[0]-b_c[0])/4.5 + abs(a_c[1]-b_c[1])/2.0 + abs(a_c[2]-b_c[2])*0.5
    if a_v and b_v:
        return (abs(a_v[0]-b_v[0]) + abs(a_v[1]-b_v[1]) + abs(a_v[2]-b_v[2]) + abs(a_v[3]-b_v[3])) / 2.0
    return 6.0  # cross-class or unknown


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
    """Read unattested IDs directly from the source file.

    The sharded `unattested-*.json` files are derived build artifacts and
    are no longer committed to git, so we read the single source of truth.
    """
    if not UNATTESTED_FILE.exists():
        return []
    return json.loads(UNATTESTED_FILE.read_text())


def load_existing_ids() -> set[str]:
    """Existing transformation IDs from filenames in the source directory.

    Each transformation JSON file is named `{id}.json`, so the directory
    listing IS the canonical set of existing IDs — no need to read the
    sharded build artifacts.
    """
    return {p.stem for p in TRANSFORMATIONS_DIR.glob("*.json")}


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


def load_failed_ids() -> dict[str, dict]:
    """Load the transient-failure cache: {id: {"count": N, "reason": "..."}}."""
    if not FAILED_PATH.exists():
        return {}
    raw = json.loads(FAILED_PATH.read_text())
    # Migrate old format {id: int} to new format {id: {count, reason}}
    return {
        k: (v if isinstance(v, dict) else {"count": v, "reason": "unknown"})
        for k, v in raw.items()
    }


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

    scored.sort(key=lambda x: (-x[0], phone_distance(x[2], x[3]), x[1]))
    return scored[:BATCH_SIZE]


# ---------------------------------------------------------------------------
# Prompt construction
# ---------------------------------------------------------------------------

def load_skill() -> str:
    text = SKILL_PATH.read_text()
    # Strip YAML frontmatter
    return re.sub(r"^---.*?---\s*", "", text, flags=re.DOTALL).strip()


def build_prompt(from_id: str, to_id: str, from_sym: dict, to_sym: dict,
                 prior_failure: str = "") -> str:
    skill = load_skill()
    prompt = f"""{skill}

---

Research the shift: **{from_id}_to_{to_id}**

From symbol: {json.dumps(from_sym)}
To symbol:   {json.dumps(to_sym)}

CRITICAL OUTPUT RULES — failure to follow these will cause your response to be rejected:
1. Your ENTIRE response must be a single JSON object and nothing else.
2. No markdown fences (no ```json), no explanation, no prose before or after the JSON.
3. The JSON must match the schema above exactly (fromId, toId, preamble, phoneticEffects, languageExamples, certainty, commonality, sources, tags).
4. If research finds NO regular, historically attested shift, output exactly this and nothing else: {{"unattested": true}}
5. SOURCES: cite ONLY URLs returned by your search tool in this turn — do not "recall" URLs from training (Wikipedia and archive.org URLs are the dominant fabrication class). Books/articles require full format `Author, A. (Year). Full Title. Publisher.` — the Year field is mandatory; never use "(n.d.)". Never cite Reddit, Quora, Stack Exchange, Wikipedia, Scribd, Calaméo, or Internet Archive as a source. No placeholder text like "verify before merge".
6. LANGUAGES: every `languageExamples[].language` must be a specific named language. NEVER "Various languages", "Multiple families", or similar. If you cannot name a specific language, output `{{"unattested": true}}`.
7. CERTAINTY: certainty=5 requires a specific historical period or dialect AND a citation that directly documents this shift. If your only citations are generic reference works (Ladefoged & Maddieson 1996, Campbell 2013, Hock 1991), set certainty=3.
"""
    if prior_failure:
        prompt += f"\nPRIOR ATTEMPT FEEDBACK: A previous fill for this shift was rejected. Reason: {prior_failure}. Address this specific issue in your response.\n"
    return prompt


# ---------------------------------------------------------------------------
# Gemini call
# ---------------------------------------------------------------------------

def call_gemini(client: genai.Client, prompt: str) -> tuple[str, dict]:
    """Return (response_text, {input_tokens, output_tokens}).

    Token counts come from response.usage_metadata when available; missing
    counts default to 0 so the running totals never break on a malformed
    response.
    """
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
        text = response.text
    else:
        parts = []
        for candidate in response.candidates or []:
            for part in candidate.content.parts or []:
                if hasattr(part, "text") and part.text:
                    parts.append(part.text)
        text = "\n".join(parts)

    usage = {"input_tokens": 0, "output_tokens": 0}
    meta = getattr(response, "usage_metadata", None)
    if meta:
        usage["input_tokens"] = getattr(meta, "prompt_token_count", 0) or 0
        usage["output_tokens"] = getattr(meta, "candidates_token_count", 0) or 0
    return text, usage


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


def validate_and_fix(data: dict, from_id: str, to_id: str) -> tuple[dict | None, str]:
    """Return (fixed_data, "") on success, or (None, reason) on failure."""
    for field in REQUIRED_FIELDS:
        if field not in data:
            reason = f"missing field: {field}"
            print(f"    {reason}")
            return None, reason

    data["fromId"] = from_id
    data["toId"] = to_id

    try:
        certainty = int(data["certainty"])
        commonality = int(data["commonality"])
    except (ValueError, TypeError):
        return None, "certainty/commonality not an integer"

    if not (1 <= certainty <= 5) or not (1 <= commonality <= 5):
        return None, f"certainty/commonality out of range: cert={certainty} com={commonality}"

    # phoneticEffects must be a comma-separated list of terms, not prose.
    # Strip trailing period, then drop everything from the first mid-sentence
    # period (Gemini sometimes appends an extra sentence).
    pe = data["phoneticEffects"].rstrip(".")
    if ". " in pe:
        pe = pe.split(". ")[0]
    data["phoneticEffects"] = pe

    # Strip Vertex AI grounding redirect URLs — they are ephemeral.
    real_sources = [
        s for s in data.get("sources", [])
        if "vertexaisearch" not in s and "grounding-api-redirect" not in s
    ]

    # Strip annotation parentheticals the model sometimes appends to real
    # citations (e.g. "Doyle, A. (2001). Irish. (Cited in search result 1)").
    # Keep the citation, drop the annotation.
    ANNOTATION_RE = re.compile(
        r"\s*\(?(?:Cited in |as cited in |from |via )?search result \d+\)?",
        re.IGNORECASE,
    )
    real_sources = [ANNOTATION_RE.sub("", s).strip() for s in real_sources]

    # Reject sources that are placeholders, non-academic, or unverifiable.
    # Drop sources matching any of these patterns; if NOTHING remains, fail the fill.
    # Patterns are ordered from most common to least common observed failure mode.
    PLACEHOLDER_RE = re.compile(
        r"verify before merge"
        r"|^Source via "
        r"|grounding(?:\s+api)?(?:\s+redirect)?$"
        r"|research snippet"
        r"|\(n\.d\.\)"           # no date — year required for all citations
        r"|\bReddit\b"           # non-academic forum
        r"|\bQuora\b"            # non-academic Q&A
        r"|\bWikipedia\b"        # encyclopaedia, not a scholarly source for shifts
        r"|^Full text of\b"      # Internet Archive scanned-text title format
        r"|\bInternet Archive\b" # IA links are not citations
        r"|\bCalaméo\b"          # document-sharing platform
        r"|\bScribd\b",          # document-sharing platform
        re.IGNORECASE,
    )
    rejected = [s for s in real_sources if PLACEHOLDER_RE.search(s)]
    real_sources = [s for s in real_sources if s and not PLACEHOLDER_RE.search(s)]
    if rejected:
        print(f"    dropped {len(rejected)} non-academic/unverifiable source(s): "
              + "; ".join(s[:60] for s in rejected))

    if not real_sources:
        print("    no verifiable source after filtering — rejecting")
        return None, "no verifiable sources after filtering placeholders/redirect URLs"
    data["sources"] = real_sources

    # Certainty ceiling (#2): cap based on evidence strength
    n_langs = len(data.get("languageExamples", []))
    if certainty >= 5 and n_langs <= 1:
        print(f"    certainty capped 5→4 (only {n_langs} language example)")
        certainty = 4
        data["certainty"] = 4
    if certainty >= 4 and all(GENERIC_CITATION_RE.search(s) for s in real_sources):
        print(f"    certainty capped {certainty}→3 (all citations are generic reference works)")
        data["certainty"] = 3

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
        return None, "languageExamples is empty"

    return data, ""


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
    fail_reasons: dict[str, str] = {}
    total_input_tokens = 0
    total_output_tokens = 0

    for i, (s, uid, from_id, to_id) in enumerate(candidates, 1):
        prior = failed_cache.get(uid, {})
        prior_failure = prior.get("reason", "") if isinstance(prior, dict) else ""
        dist = phone_distance(from_id, to_id)
        print(f"\n[{i}/{len(candidates)}] {uid}  (score={s} dist={dist:.2f})")
        from_sym = load_symbol(from_id)
        to_sym = load_symbol(to_id)
        prompt = build_prompt(from_id, to_id, from_sym, to_sym, prior_failure)

        try:
            raw, usage = call_gemini(client, prompt)
            total_input_tokens += usage["input_tokens"]
            total_output_tokens += usage["output_tokens"]
            data = extract_json(raw)

            if data is None:
                reason = "could not parse JSON from response"
                print(f"  FAIL  {reason}")
                failed.append(uid)
                fail_reasons[uid] = reason
            elif data.get("unattested"):
                print("  SKIP  Gemini: no attested shift found")
                skipped.append(uid)
            else:
                validated, reason = validate_and_fix(data, from_id, to_id)
                if validated is None:
                    print(f"  FAIL  schema validation: {reason}")
                    failed.append(uid)
                    fail_reasons[uid] = reason
                else:
                    out = TRANSFORMATIONS_DIR / f"{uid}.json"
                    out.write_text(json.dumps(validated, ensure_ascii=False, indent=2) + "\n")
                    n_examples = sum(len(eg["examples"]) for eg in validated["languageExamples"])
                    print(f"  FILLED  certainty={validated['certainty']}  examples={n_examples}")
                    filled.append(uid)

        except Exception as exc:
            reason = str(exc)
            print(f"  ERROR  {reason}")
            failed.append(uid)
            fail_reasons[uid] = reason

        time.sleep(0.2)

    print(f"\n{'='*50}")
    print(f"Filled:   {len(filled)}")
    print(f"Skipped:  {len(skipped)}  (unattested per Gemini)")
    print(f"Failed:   {len(failed)}")
    print(f"Tokens:   input={total_input_tokens}  output={total_output_tokens}")

    if filled:
        print("\nRebuilding index...")
        subprocess.run(["npm", "run", "rebuild-index"], cwd=REPO_ROOT, check=True)

    # Write summary + PR body BEFORE attempting the cache push so the
    # workflow can still create a PR if save_caches fails.
    summary = {
        "filled": filled,
        "skipped": skipped,
        "failed": failed,
        "tokens": {
            "input": total_input_tokens,
            "output": total_output_tokens,
            "total": total_input_tokens + total_output_tokens,
        },
    }
    SUMMARY_PATH.write_text(json.dumps(summary, indent=2))
    print(f"Summary → {SUMMARY_PATH}")

    filled_list = "\n".join(f"- `{uid}`" for uid in filled)
    pr_body = (
        f"## Auto-fill results\n\n"
        f"Filled: {len(filled)} | Skipped (unattested): {len(skipped)} | Failed: {len(failed)}\n\n"
        f"### Filled transformations\n{filled_list}\n\n"
        f"---\n"
        f"*Generated by the auto-fill workflow with search grounding. "
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
        prev = new_failed.get(uid, {"count": 0, "reason": ""})
        count = (prev["count"] if isinstance(prev, dict) else prev) + 1
        if count >= MAX_FAILURE_RETRIES:
            new_tried.add(uid)
            new_failed.pop(uid, None)
        else:
            new_failed[uid] = {"count": count, "reason": fail_reasons.get(uid, "unknown")}
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
