#!/usr/bin/env python3
"""
PhonoMorph Atlas Quality Auditor

Two-pass audit of all transformation JSON files:
  Pass 1 (static)  — instant, no LLM, flags structural quality issues
  Pass 2 (LLM)     — Gemini 2.5 Flash + web search, verifies flagged files

Usage:
  python scripts/audit-quality.py --static-only          # fast scan, print report
  python scripts/audit-quality.py                        # static + LLM for HIGH/MEDIUM
  python scripts/audit-quality.py --file eps_to_u        # audit single file
  BATCH_SIZE=50 python scripts/audit-quality.py          # override batch size

Output:
  public/data/audit-report.json  — per-file verdicts (committed to master)
  PRs created for any files where LLM verdict is "fail" with a fix
"""

import argparse
import json
import os
import re
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

try:
    import boto3
    from google import genai
    from google.genai import types
    _LLM_AVAILABLE = True
except ImportError:
    _LLM_AVAILABLE = False

REPO_ROOT = Path(__file__).parent.parent
TRANSFORMATIONS_DIR = REPO_ROOT / "public/data/transformations"
SYMBOLS_DIR = REPO_ROOT / "public/data/symbols"
REPORT_PATH = REPO_ROOT / "public/data/audit-report.json"
TRIED_PATH = REPO_ROOT / "public/data/shards/audit-tried.json"

BATCH_SIZE = int(os.environ.get("BATCH_SIZE", "30"))
AWS_REGION = "eu-central-1"
GEMINI_SECRET = "openclaw/gemini-api-key"
GEMINI_MODEL = "gemini-2.5-flash"

# ─── Static analysis patterns ──────────────────────────────────────────────

HEDGE_WORD_RE = re.compile(
    r"\bsporadic\b|\bsporadically\b|\bmay occur\b|\bpossibly\b|\bpossible\b"
    r"|\bin some\b|\bcertain contexts?\b|\bmight be\b|\bcan occur\b|\bsometimes\b"
    r"|\bnot well.documented\b|\bunclear\b|\buncertain\b|\bnot confirmed\b",
    re.IGNORECASE,
)

GENERIC_CITATION_RE = re.compile(
    r"Ladefoged\b|Maddieson\b"
    r"|Campbell,?\s*(\d{4})?"
    r"|Crystal,?\s*(\d{4})?"
    r"|Hock,?\s*(\d{4})?"
    r"|Handbook of"
    r"|Alkire.*Rosen"
    r"|Wells.*Accents of English"
    r"|Lass.*Historical",
    re.IGNORECASE,
)


# ─── Static analysis ────────────────────────────────────────────────────────

def static_flags(data: dict) -> list[str]:
    """Return list of flag strings for a transformation file. Empty = OK."""
    flags = []
    cert = data.get("certainty", 0)
    sources = data.get("sources", [])

    # Hedge words in example notes paired with high certainty
    notes = [
        ex.get("note", "")
        for eg in data.get("languageExamples", [])
        for ex in eg.get("examples", [])
    ]
    hedged = [n for n in notes if HEDGE_WORD_RE.search(n)]
    if hedged and cert >= 4:
        sample = hedged[0][:80]
        flags.append(f"hedge+cert{cert}: \"{sample}\"")

    # All-generic sources with high certainty
    if sources and cert >= 4 and all(GENERIC_CITATION_RE.search(s) for s in sources):
        flags.append(f"all-generic-sources+cert{cert}")

    # archive.org in sources
    archive = [s for s in sources if "archive.org" in s]
    if archive:
        flags.append(f"archive.org sources ({len(archive)})")

    # Vague language names
    for eg in data.get("languageExamples", []):
        lang = eg.get("language", "")
        if re.search(r"\bvarious\b|\bgeneral\b|\bmultiple\b", lang, re.IGNORECASE):
            flags.append(f"vague language name: \"{lang}\"")

    # languageFamily too broad
    for eg in data.get("languageExamples", []):
        fam = eg.get("languageFamily", "")
        if fam == "Indo-European":
            flags.append(f"languageFamily too broad: \"Indo-European\" (use Germanic/Romance/etc.)")
            break

    return flags


def priority(flags: list[str]) -> str:
    if not flags:
        return "ok"
    high_patterns = ["hedge+cert", "all-generic-sources+cert", "vague language"]
    if any(any(p in f for p in high_patterns) for f in flags):
        return "high"
    return "medium"


def run_static_pass() -> dict[str, dict]:
    """Read all transformation files, return {stem: {flags, priority}}."""
    results = {}
    files = sorted(TRANSFORMATIONS_DIR.glob("*.json"))
    counts = {"ok": 0, "medium": 0, "high": 0}
    for path in files:
        try:
            data = json.loads(path.read_text())
        except json.JSONDecodeError:
            results[path.stem] = {"flags": ["invalid JSON"], "priority": "high"}
            counts["high"] += 1
            continue
        flags = static_flags(data)
        p = priority(flags)
        results[path.stem] = {"flags": flags, "priority": p}
        counts[p] += 1
    print(f"Static pass: {counts['ok']} ok | {counts['medium']} medium | {counts['high']} high")
    print(f"  Total: {len(results)} files")
    return results


# ─── LLM audit ──────────────────────────────────────────────────────────────

AUDIT_PROMPT_TEMPLATE = """\
You are auditing a PhonoMorph transformation file. Do NOT improve, expand, or add new content.
Your ONLY job is to CHECK whether the existing claims are accurate.

File: {filename}
Content:
{content}

Static analysis flagged this file for: {flag_reasons}

Search for evidence about the specific claims in the languageExamples.
For each language example, verify:
1. Does [{from_symbol}] actually shift to [{to_symbol}] in that language?
2. Is the languageFamily correct (e.g. "Iranian" not "Indo-European" for Persian)?
3. Does the endpoint in the example note match the toId symbol?
4. Are the hedge words in notes ("sporadic", "may occur", etc.) accurate — or do they signal confabulation?

Rules:
- If ALL examples check out: output {{"verdict": "ok"}}
- If examples are partially wrong (wrong family, wrong endpoint, imprecise but real):
  output {{"verdict": "warn", "issues": ["..."], "fixes": {{field: corrected_value, ...}}}}
- If an example CANNOT be verified after web search / is fabricated:
  output {{"verdict": "fail", "issues": ["..."], "replacement": {{corrected_full_json_or_unattested: true}}}}

CRITICAL: Do NOT invent new language examples. You may only verify existing ones or mark them unverified.
Your ENTIRE response must be a single JSON object. No prose, no markdown fences.
"""


def get_gemini_key() -> str:
    if not _LLM_AVAILABLE:
        raise RuntimeError("google-genai and boto3 required for LLM pass: pip install google-genai boto3")
    val = os.environ.get("GEMINI_API_KEY")
    if val:
        return val
    client = boto3.client("secretsmanager", region_name=AWS_REGION)
    return client.get_secret_value(SecretId=GEMINI_SECRET)["SecretString"].strip()


def load_symbol(symbol_id: str) -> dict:
    path = SYMBOLS_DIR / f"{symbol_id}.json"
    return json.loads(path.read_text()) if path.exists() else {"id": symbol_id, "symbol": symbol_id}


def audit_file_llm(client, stem: str, flags: list[str]) -> dict:
    """Run LLM audit on a single file. Returns verdict dict."""
    path = TRANSFORMATIONS_DIR / f"{stem}.json"
    data = json.loads(path.read_text())

    from_sym = load_symbol(data.get("fromId", ""))
    to_sym = load_symbol(data.get("toId", ""))

    prompt = AUDIT_PROMPT_TEMPLATE.format(
        filename=f"{stem}.json",
        content=json.dumps(data, indent=2),
        flag_reasons="; ".join(flags),
        from_symbol=from_sym.get("symbol", data.get("fromId", "")),
        to_symbol=to_sym.get("symbol", data.get("toId", "")),
    )

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            tools=[types.Tool(google_search=types.GoogleSearch())],
            temperature=0.1,
        ),
        http_options=types.HttpOptions(timeout=60_000),
    )

    text = response.text or ""
    m = re.search(r"(\{.*\})", text, re.DOTALL)
    if not m:
        return {"verdict": "error", "issues": ["could not parse JSON response"]}
    try:
        result = json.loads(m.group(1))
        if "verdict" not in result:
            return {"verdict": "error", "issues": ["response missing 'verdict' field"]}
        return result
    except json.JSONDecodeError:
        return {"verdict": "error", "issues": ["invalid JSON in response"]}


def apply_fix(stem: str, llm_result: dict) -> bool:
    """Apply fix to a transformation file. Handles both full replacements (fail)
    and partial field fixes (warn). Returns True if file was updated."""
    verdict = llm_result.get("verdict")
    path = TRANSFORMATIONS_DIR / f"{stem}.json"

    # Apply partial fixes from warn verdicts
    if verdict == "warn":
        fixes = llm_result.get("fixes")
        if fixes and isinstance(fixes, dict) and path.exists():
            data = json.loads(path.read_text())
            data.update(fixes)
            if data.get("commonality", 1) < 1:
                data["commonality"] = 1
            if data.get("certainty", 1) < 1:
                data["certainty"] = 1
            path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
            print(f"  → Patched {stem}.json (warn fixes applied)")
            return True
        return False

    replacement = llm_result.get("replacement")
    if not replacement:
        return False

    path = TRANSFORMATIONS_DIR / f"{stem}.json"

    if replacement is True or replacement == {"unattested": True}:
        # Remove the file — this transformation is unattested
        path.unlink(missing_ok=True)
        print(f"  → Deleted {stem}.json (unattested)")
        return True

    if isinstance(replacement, dict) and replacement.get("unattested"):
        path.unlink(missing_ok=True)
        print(f"  → Deleted {stem}.json (unattested)")
        return True

    if isinstance(replacement, dict) and "fromId" in replacement:
        # Clamp out-of-range values the LLM occasionally produces
        if replacement.get("commonality", 1) < 1:
            replacement["commonality"] = 1
        if replacement.get("certainty", 1) < 1:
            replacement["certainty"] = 1
        # Ensure every languageExamples entry has an examples array
        for eg in replacement.get("languageExamples", []):
            if not isinstance(eg.get("examples"), list):
                eg["examples"] = []
        # Drop entries with empty examples arrays
        replacement["languageExamples"] = [
            eg for eg in replacement.get("languageExamples", [])
            if eg.get("examples")
        ]
        path.write_text(json.dumps(replacement, ensure_ascii=False, indent=2) + "\n")
        print(f"  → Rewrote {stem}.json")
        return True

    return False


# ─── Persistence ────────────────────────────────────────────────────────────

def load_tried() -> set[str]:
    if TRIED_PATH.exists():
        return set(json.loads(TRIED_PATH.read_text()))
    return set()


def save_tried(tried: set[str]) -> None:
    TRIED_PATH.write_text(json.dumps(sorted(tried), indent=2) + "\n")


def load_report() -> dict:
    if REPORT_PATH.exists():
        return json.loads(REPORT_PATH.read_text())
    return {}


def save_report(report: dict) -> None:
    REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")


# ─── CI helpers ─────────────────────────────────────────────────────────────

def commit_and_push(msg: str, paths: list[Path]) -> None:
    if not os.environ.get("GITHUB_ACTIONS"):
        print("Not in GitHub Actions — skipping commit.")
        return
    subprocess.run(["git", "config", "user.name", "github-actions[bot]"], cwd=REPO_ROOT, check=True)
    subprocess.run(["git", "config", "user.email", "github-actions[bot]@users.noreply.github.com"], cwd=REPO_ROOT, check=True)
    for p in paths:
        if p.exists():
            subprocess.run(["git", "add", str(p)], cwd=REPO_ROOT, check=True)
    if subprocess.run(["git", "diff", "--cached", "--quiet"], cwd=REPO_ROOT).returncode == 0:
        print("Nothing to commit.")
        return
    subprocess.run(["git", "commit", "-m", msg], cwd=REPO_ROOT, check=True)
    subprocess.run(["git", "push", "origin", "HEAD"], cwd=REPO_ROOT, check=True)


def create_pr(fixed: list[str], verdicts: dict) -> None:
    if not os.environ.get("GITHUB_ACTIONS"):
        return
    if not fixed:
        return
    branch = f"audit/quality-fix-{int(time.time())}"
    subprocess.run(["git", "checkout", "-b", branch], cwd=REPO_ROOT, check=True)
    for stem in fixed:
        p = TRANSFORMATIONS_DIR / f"{stem}.json"
        if p.exists():
            subprocess.run(["git", "add", str(p)], cwd=REPO_ROOT, check=True)
        else:
            subprocess.run(["git", "rm", "--cached", str(p)], cwd=REPO_ROOT)
    # Include updated index so PR ships with consistent manifest
    subprocess.run(["git", "add", "public/data/index.json", "public/data/shards/"], cwd=REPO_ROOT)
    lines = [f"- `{s}`: {'; '.join(verdicts[s].get('issues', []))}" for s in fixed]
    body = (
        "## Quality audit fixes\n\n"
        "Files corrected by LLM audit (`audit-quality.py`):\n\n"
        + "\n".join(lines)
        + "\n\n---\n*Review each change carefully before merging.*"
    )
    Path("/tmp/audit-pr-body.md").write_text(body)
    subprocess.run(
        ["git", "commit", "-m", f"fix: quality audit corrections ({len(fixed)} files)"],
        cwd=REPO_ROOT, check=True,
    )
    subprocess.run(["git", "push", "origin", branch], cwd=REPO_ROOT, check=True)
    subprocess.run(
        ["gh", "pr", "create", "--title", f"Quality audit: fix {len(fixed)} flagged transformation(s)",
         "--body-file", "/tmp/audit-pr-body.md", "--base", "master"],
        cwd=REPO_ROOT, check=True,
    )


# ─── Main ───────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="PhonoMorph quality auditor")
    parser.add_argument("--static-only", action="store_true", help="Static analysis only, no LLM")
    parser.add_argument("--file", metavar="STEM", help="Audit a single transformation (e.g. eps_to_u)")
    args = parser.parse_args()

    # ── Single-file mode ──
    if args.file:
        stem = args.file.replace(".json", "")
        path = TRANSFORMATIONS_DIR / f"{stem}.json"
        if not path.exists():
            print(f"File not found: {path}")
            sys.exit(1)
        data = json.loads(path.read_text())
        flags = static_flags(data)
        print(f"Static flags for {stem}: {flags or ['none']}")
        if args.static_only or not flags:
            sys.exit(0)
        print("Running LLM audit...")
        client = genai.Client(api_key=get_gemini_key())
        result = audit_file_llm(client, stem, flags or ["(manual audit)"])
        print(json.dumps(result, indent=2))
        sys.exit(0)

    # ── Full pass ──
    print("=== PhonoMorph Quality Auditor ===\n")
    static_results = run_static_pass()

    # Save/update the report with static results
    report = load_report()
    for stem, info in static_results.items():
        report[stem] = {**report.get(stem, {}), **info}
    save_report(report)
    print(f"Report saved to {REPORT_PATH}")

    if args.static_only:
        high = [s for s, v in static_results.items() if v["priority"] == "high"]
        med = [s for s, v in static_results.items() if v["priority"] == "medium"]
        print(f"\nHIGH ({len(high)}):")
        for s in sorted(high)[:20]:
            print(f"  {s}: {static_results[s]['flags']}")
        if len(high) > 20:
            print(f"  ... and {len(high) - 20} more")
        print(f"\nMEDIUM ({len(med)}):")
        for s in sorted(med)[:10]:
            print(f"  {s}: {static_results[s]['flags']}")
        if len(med) > 10:
            print(f"  ... and {len(med) - 10} more")
        sys.exit(0)

    # ── LLM pass on flagged files ──
    tried = load_tried()
    candidates = [
        stem for stem, info in static_results.items()
        if info["priority"] in ("high", "medium") and stem not in tried
    ]
    candidates.sort(key=lambda s: (0 if static_results[s]["priority"] == "high" else 1, s))
    batch = candidates[:BATCH_SIZE]

    if not batch:
        print("No unflagged candidates remaining — all high/medium files already audited.")
        sys.exit(0)

    WORKERS = int(os.environ.get("WORKERS", "4"))
    print(f"\nLLM audit: {len(batch)} files (batch_size={BATCH_SIZE}, workers={WORKERS}, {len(candidates)} total pending)\n")
    client = genai.Client(api_key=get_gemini_key())

    verdicts: dict[str, dict] = {}
    fixed: list[str] = []

    def _worker(args):
        stem, flags = args
        try:
            result = audit_file_llm(client, stem, flags)
            return stem, result, None
        except Exception as exc:
            return stem, {"verdict": "error", "issues": [str(exc)]}, str(exc)

    with ThreadPoolExecutor(max_workers=WORKERS) as executor:
        futures = {
            executor.submit(_worker, (stem, static_results[stem]["flags"])): stem
            for stem in batch
        }
        completed = 0
        for future in as_completed(futures):
            stem, result, error = future.result()
            completed += 1
            flags = static_results[stem]["flags"]
            print(f"[{completed}/{len(batch)}] {stem}")
            print(f"  flags: {flags}")

            if error:
                print(f"  ERROR: {error}")
                report[stem]["llm_verdict"] = "error"
                report[stem]["llm_issues"] = [error]
            else:
                verdict = result.get("verdict", "error")
                print(f"  verdict: {verdict}", end="")
                if result.get("issues"):
                    print(f" — {'; '.join(result['issues'][:2])}", end="")
                print()

                verdicts[stem] = result
                report[stem]["llm_verdict"] = verdict
                report[stem]["llm_issues"] = result.get("issues", [])

                if verdict == "fail":
                    if apply_fix(stem, result):
                        fixed.append(stem)

            tried.add(stem)

    # Persist
    save_report(report)
    save_tried(tried)

    print(f"\n{'='*50}")
    ok = sum(1 for v in verdicts.values() if v.get("verdict") == "ok")
    warn = sum(1 for v in verdicts.values() if v.get("verdict") == "warn")
    fail = sum(1 for v in verdicts.values() if v.get("verdict") == "fail")
    err = sum(1 for v in verdicts.values() if v.get("verdict") == "error")
    print(f"ok={ok}  warn={warn}  fail={fail}  error={err}  fixed={len(fixed)}")

    if os.environ.get("GITHUB_ACTIONS"):
        commit_and_push(
            f"ci: update audit report ({ok} ok, {warn} warn, {fail} fail)",
            [REPORT_PATH, TRIED_PATH],
        )
        if fixed:
            create_pr(fixed, verdicts)


if __name__ == "__main__":
    main()
