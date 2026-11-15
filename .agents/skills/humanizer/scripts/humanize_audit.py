#!/usr/bin/env python3
"""
humanize_audit.py - Deep Diagnostic Scanner against the 24 AI Writing Patterns
Scans drafts against WikiProject AI Cleanup standards:
- Forbidden AI words & verbs
- Sentence burstiness and length variance
- Overuse of em-dashes and colons
- Forced antithesis ("not just X, but Y")
- Symmetrical 3-item lists
- Lack of contractions
- Mobile hook length
"""

import sys
import re
import argparse

AI_BUZZWORDS = [
    "delve", "tapestry", "testament", "spearhead", "harness", "leverage",
    "paramount", "pivotal", "vital", "crucial", "beacon", "game-changer",
    "groundbreaking", "ever-evolving", "multifaceted", "plethora", "synergy",
    "seamless", "unprecedented", "transformative", "furthermore", "moreover",
    "in light of", "it is worth noting", "it is important to remember",
    "at its core", "elevate", "foster", "showcase", "transcend", "in conclusion",
    "navigating the", "realm of", "catalyst for"
]

FORCED_ANTITHESIS = [
    r"not just\b.*?\bbut\b",
    r"not only\b.*?\bbut also\b",
    r"it['’]?s not about\b.*?\bit['’]?s about\b"
]

def scan_draft(text: str):
    text_clean = text.strip()
    if not text_clean:
        print("Error: Empty draft provided.")
        return 1

    lines = [l.strip() for l in text_clean.split("\n")]
    non_empty_lines = [l for l in lines if l]
    text_lower = text_clean.lower()
    
    issues = []
    strengths = []

    # 1. Hook length
    first_line = non_empty_lines[0]
    if len(first_line) > 140:
        issues.append(f"[Pattern #2] Hook is {len(first_line)} chars (exceeds 140-char mobile fold). Cut before '...see more'.")
    else:
        strengths.append(f"Hook fits mobile viewport cleanly ({len(first_line)} chars).")

    # 2. AI Buzzword Search
    detected_buzzwords = []
    for word in AI_BUZZWORDS:
        pattern = r'\b' + re.escape(word) + r'\b'
        if re.search(pattern, text_lower):
            detected_buzzwords.append(word)
    if detected_buzzwords:
        issues.append(f"[Pattern #6-8] AI Buzzwords found ({len(detected_buzzwords)}): {', '.join(detected_buzzwords)}.")
    else:
        strengths.append("Zero prohibited robot verbs/adjectives detected.")

    # 3. Em-Dash Overuse
    em_dash_count = text.count("—") + text.count("--")
    if em_dash_count > 2:
        issues.append(f"[Pattern #10] Em-dash overuse: Found {em_dash_count} em-dashes. Limit to 1 per post to avoid artificial cadence.")
    else:
        strengths.append(f"Restrained punctuation ({em_dash_count} em-dashes).")

    # 4. Forced Antithesis ("Not just X, but Y")
    for ant in FORCED_ANTITHESIS:
        if re.search(ant, text_lower):
            issues.append("[Pattern #5] Forced antithesis ('not just X, but Y' or 'not about X, it's about Y') detected. State the insight directly.")
            break

    # 5. Sentence Burstiness & Cadence
    sentences = [s.strip() for s in re.split(r'[.!?]+', text_clean) if len(s.strip().split()) > 1]
    lengths = [len(s.split()) for s in sentences]
    if lengths:
        variance = max(lengths) - min(lengths)
        short_count = len([l for l in lengths if l <= 5])
        avg = sum(lengths) / len(lengths)
        
        if variance < 8:
            issues.append(f"[Pattern #11] Low burstiness (variance: {variance} words). Mix punchy fragments with longer narrative sentences.")
        else:
            strengths.append(f"Healthy sentence burstiness (lengths span {min(lengths)} to {max(lengths)} words, avg: {avg:.1f}).")
            
        if short_count == 0:
            issues.append("[Pattern #11] Missing staccato punch: No short sentences (<= 5 words) detected.")
        else:
            strengths.append(f"Includes {short_count} punchy staccato sentence(s).")

    # 6. Natural Contractions Check
    contractions = ["don't", "can't", "it's", "we've", "i've", "you're", "didn't", "wasn't", "couldn't", "what's", "that's", "here's", "there's", "i'm", "we're"]
    found_c = [c for c in contractions if c in text_lower]
    if not found_c:
        issues.append("[Pattern #12] Rigid phrasing: No natural contractions found. Use 'don't', 'it's', 'we've'.")
    else:
        strengths.append(f"Conversational contractions present ({', '.join(found_c[:3])}).")

    # 7. Lazy CTA check
    last_two_lines = " ".join(non_empty_lines[-2:]).lower()
    for bait in ["agree?", "thoughts?", "let me know your thoughts"]:
        if bait in last_two_lines:
            issues.append(f"[Pattern #17] Lazy engagement bait: '{bait}'. Replace with a peer battle-scar question.")

    # 8. Mobile whitespace
    max_dense = 0
    cur_dense = 0
    for l in lines:
        if l:
            cur_dense += 1
            if cur_dense > max_dense:
                max_dense = cur_dense
        else:
            cur_dense = 0
    if max_dense > 3:
        issues.append(f"[Mobile Readability] Found a block of {max_dense} lines without paragraph breaks.")
    else:
        strengths.append("Clean mobile paragraph spacing (max block <= 3 lines).")

    score = max(0, 100 - (len(issues) * 15))

    print("\n" + "=" * 60)
    print(f" HUMANIZER POST AUDIT - SCORE: {score}/100")
    print("=" * 60)

    if strengths:
        print("\n✅ PASSED HUMAN CHECKS:")
        for s in strengths:
            print(f"  • {s}")

    if issues:
        print("\n⚠️ FAILED AI PATTERN CHECKS:")
        for i in issues:
            print(f"  • {i}")
    else:
        print("\n🎉 Flawless Human Voice! Zero detected AI writing patterns.")

    print("=" * 60 + "\n")
    return 0 if score >= 75 else 1

def main():
    parser = argparse.ArgumentParser(description="Humanizer audit against the 24 AI patterns.")
    parser.add_argument("file", nargs="?", help="Draft file path")
    args = parser.parse_args()

    if args.file:
        try:
            with open(args.file, "r", encoding="utf-8") as f:
                content = f.read()
        except Exception as e:
            print(f"Error reading file: {e}")
            sys.exit(1)
    else:
        if not sys.stdin.isatty():
            content = sys.stdin.read()
        else:
            print("Usage: humanize_audit.py <file> OR pipe text into script.")
            sys.exit(1)

    sys.exit(scan_draft(content))

if __name__ == "__main__":
    main()
