#!/usr/bin/env python3
"""
audit_post.py - Quality & Anti-AI Post Auditor for LinkedIn Posts
Analyzes a draft LinkedIn post for AI buzzwords, sentence burstiness,
hook strength, mobile formatting, and conversational voice.
"""

import sys
import re
import argparse

FORBIDDEN_WORDS = [
    "delve", "tapestry", "testament", "spearhead", "harness", "leverage",
    "paramount", "pivotal", "vital", "crucial", "beacon", "game-changer",
    "groundbreaking", "ever-evolving", "multifaceted", "plethora", "synergy",
    "seamless", "unprecedented", "transformative", "furthermore", "moreover",
    "in light of", "it is worth noting", "it is important to remember",
    "at its core", "elevate", "foster", "showcase", "transcend", "in conclusion"
]

STIFF_PHRASES = [
    "i am excited to announce", "i am thrilled to share", "hope this finds you well",
    "agree?", "thoughts?", "let us know in the comments"
]

def analyze_post(text: str):
    issues = []
    strengths = []
    
    lines = [line.strip() for line in text.strip().split("\n")]
    non_empty_lines = [l for l in lines if l]
    
    if not non_empty_lines:
        print("Error: Empty draft provided.")
        return 1

    # 1. Hook Analysis
    first_line = non_empty_lines[0]
    first_line_len = len(first_line)
    if first_line_len > 140:
        issues.append(f"Hook warning: First line is {first_line_len} chars (exceeds recommended 140 char cutoff for mobile fold).")
    else:
        strengths.append(f"Hook length: {first_line_len} chars (fits cleanly before mobile '...see more').")
        
    first_line_lower = first_line.lower()
    for stiff in STIFF_PHRASES[:3]:
        if stiff in first_line_lower:
            issues.append(f"Generic opening detected: Contains '{stiff}'. Cut it and start in media res.")

    # 2. AI Buzzword Search
    text_lower = text.lower()
    found_buzzwords = []
    for word in FORBIDDEN_WORDS:
        # Match whole word
        pattern = r'\b' + re.escape(word) + r'\b'
        if re.search(pattern, text_lower):
            found_buzzwords.append(word)
            
    if found_buzzwords:
        issues.append(f"AI Buzzwords detected ({len(found_buzzwords)}): {', '.join(found_buzzwords)}. Replace with plain human vocabulary.")
    else:
        strengths.append("Zero common AI buzzwords found. Vocabulary feels organic.")

    # 3. Sentence Length Burstiness & Rhythm
    # Split text into sentences
    sentences = [s.strip() for s in re.split(r'[.!?]+', text) if len(s.strip().split()) > 1]
    sentence_lengths = [len(s.split()) for s in sentences]
    
    if sentence_lengths:
        avg_len = sum(sentence_lengths) / len(sentence_lengths)
        min_len = min(sentence_lengths)
        max_len = max(sentence_lengths)
        variance = max_len - min_len
        
        if variance < 8:
            issues.append(f"Low burstiness warning: Sentences are too uniform in length (lengths vary by only {variance} words). Mix short staccato fragments with longer narrative sentences.")
        else:
            strengths.append(f"Good burstiness: Sentence length spans {min_len} to {max_len} words (Average: {avg_len:.1f} words).")
            
        short_sentences = [l for l in sentence_lengths if l <= 5]
        if short_sentences:
            strengths.append(f"Punchy cadence: Contains {len(short_sentences)} short punchline sentences (<= 5 words).")

    # 4. Whitespace & Mobile Readability
    # Check max consecutive lines without blank line
    max_dense_block = 0
    current_block = 0
    for line in lines:
        if line:
            current_block += 1
            if current_block > max_dense_block:
                max_dense_block = current_block
        else:
            current_block = 0
            
    if max_dense_block > 3:
        issues.append(f"Dense wall of text: Found a block with {max_dense_block} lines without whitespace. Keep paragraphs to 1-2 lines for mobile.")
    else:
        strengths.append("Clean mobile whitespace: Paragraphs are broken up with adequate breathing room.")

    # 5. Contractions Check (Conversational warmth)
    contractions = ["don't", "can't", "it's", "we've", "i've", "you're", "didn't", "wasn't", "couldn't"]
    found_contractions = [c for c in contractions if c in text_lower]
    if not found_contractions:
        issues.append("Stiff tone warning: No contractions detected. Use 'don't', 'it's', 'we've' to sound conversational instead of legalistic.")
    else:
        strengths.append(f"Conversational voice: Uses natural contractions ({', '.join(found_contractions[:4])}).")

    # 6. Call to Action Check
    last_lines = " ".join(non_empty_lines[-2:]).lower()
    for lazy_cta in ["agree?", "thoughts?", "share your thoughts"]:
        if lazy_cta in last_lines:
            issues.append(f"Lazy CTA detected: '{lazy_cta}'. Replace with a specific, peer-inviting question.")

    # Final Score & Output
    score = max(0, 100 - (len(issues) * 18))
    
    print("\n" + "=" * 55)
    print(f" POST QUALITY AUDIT REPORT - SCORE: {score}/100")
    print("=" * 55)
    
    if strengths:
        print("\n✅ WHAT WORKS WELL:")
        for s in strengths:
            print(f"  • {s}")
            
    if issues:
        print("\n⚠️ AREAS TO REFINE:")
        for i in issues:
            print(f"  • {i}")
    else:
        print("\n🎉 Exceptional draft! High burstiness, zero robot buzzwords, and clean mobile rhythm.")
        
    print("=" * 55 + "\n")
    return 0 if score >= 75 else 1

def main():
    parser = argparse.ArgumentParser(description="Audit a LinkedIn post for quality and human voice.")
    parser.add_argument("file", nargs="?", help="Path to text or markdown file containing post draft")
    args = parser.parse_args()

    if args.file:
        try:
            with open(args.file, "r", encoding="utf-8") as f:
                content = f.read()
        except Exception as e:
            print(f"Failed to read file: {e}")
            sys.exit(1)
    else:
        if not sys.stdin.isatty():
            content = sys.stdin.read()
        else:
            print("Provide a file path or pipe text into this script.")
            sys.exit(1)

    sys.exit(analyze_post(content))

if __name__ == "__main__":
    main()
