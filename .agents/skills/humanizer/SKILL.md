---
name: humanizer
description: >-
  Applies a rigorous de-AI-ing and anti-slop editing pass to social media drafts.
  Scans drafts against 24 documented AI writing patterns, strips significance inflation,
  kills robotic buzzwords, fixes uniform sentence lengths, and ensures authentic human cadence.
  Use as the final polishing pass before publishing.
---

# Humanizer: De-AI & Anti-Slop Editing Master

This skill acts as the final quality and voice enforcement checkpoint before publishing any LinkedIn post, social thread, or technical article. It rigorously scrubs drafts against the 24 documented AI writing patterns to eliminate robotic symmetry, corporate inflation, and monotonous sentence cadence.

---

## When to Use This Skill

Activate this skill as the **mandatory final editing pass** for:
- Any drafted LinkedIn update or social post.
- Any AI-generated text that feels smooth, sterile, or overly generic.
- Any technical write-up before pushing to production or social queues.

---

## The 3-Step Humanizing Procedure

```
[Draft Post]
     ↓
 1. Detect (Scan for 24 AI Patterns)
     ↓
 2. Humanize (Vary sentence lengths, inject contractions & friction)
     ↓
 3. Voice Verification (Match voice_profile.md)
```

### Step 1: Detect AI Patterns
Review the draft against the complete list of [24 Documented AI Patterns](./references/24_ai_patterns.md):
- Search and eliminate robot verbs (*delve, harness, leverage, elevate, foster*).
- Check for significance inflation and forced antithesis (*"not just X, but Y"*).
- Check em-dash count (limit to 1 maximum per post).

### Step 2: Humanize Structure & Cadence
- **Inject Staccato Punches:** Add at least one short fragment ($\le$ 5 words) after an explanation.
- **Enforce Contractions:** Convert *do not* $\rightarrow$ *don't*, *it is* $\rightarrow$ *it's*, *we have* $\rightarrow$ *we've*.
- **Add Self-Correction & Realism:** Include doubt, embarrassment, or real timestamps.

### Step 3: Run the Automated Audit
Execute the automated audit tool:
```bash
python3 .agents/skills/humanizer/scripts/humanize_audit.py path/to/draft.md
```
Or pipe content directly:
```bash
echo "Draft text..." | python3 .agents/skills/humanizer/scripts/humanize_audit.py
```
Target an audit score of $\ge$ 80/100 with zero failed AI pattern checks before approving for publish.

---

## Reference Material

- [The 24 AI Patterns & Counter-Measures](./references/24_ai_patterns.md): Complete catalog based on WikiProject AI Cleanup standards.
- [Pre-Flight Humanizer Checklist](./references/humanizer_checklist.md): 5-point manual inspection protocol.
