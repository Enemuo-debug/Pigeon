---
name: content-repurposer
description: >-
  Turns raw material—git commits, PR diffs, dev logs, debugging war stories, bug fixes,
  voice notes, or engineering notes—into native, compelling social media drafts while preserving
  original voice and technical authenticity. Use during the drafting phase.
---

# Content Repurposer: Raw Notes to Native Social Drafts

This skill takes messy, unpolished engineering artifacts—git logs, debugging journals, post-mortem notes, voice memo transcripts, and pull requests—and extracts their core narrative arc into a high-engagement, platform-native social media draft.

---

## When to Use This Skill

Activate this skill when:
- You have a raw commit hash, PR description, or git diff you want to broadcast.
- You have rough bullet points or a stream-of-consciousness brain dump.
- You want to turn an internal engineering decision or debugging session into a public "build in public" post.

---

## The 4-Step Repurposing Process

```
[Raw Artifact: Commit / Diff / Log]
               ↓
   1. Extract Friction & Payoff
               ↓
   2. Select Matching Engine
               ↓
   3. Draft with Mobile Pacing
               ↓
   4. Hand off to [humanizer]
```

### Step 1: Extract the Friction, Numbers, and Heuristic
Do not summarize the entire file. Look for:
- What was the specific bug, error code, or latency number?
- What was the emotional frustration (wasted time, embarrassing oversight)?
- What was the permanent fix or guardrail?

### Step 2: Select the Repurposing Engine
Consult [repurposing_frameworks.md](./references/repurposing_frameworks.md):
- **Git Commit / Refactor Engine:** Best for optimizations, dependency drops, and architectural cleanups.
- **Incident / War Story Engine:** Best for Friday bugs, production outages, and subtle logic errors.
- **Architecture Switch Engine:** Best for database migrations, queue additions, and stack choices.
- **Brain Dump Engine:** Best for sprint epiphanies, user discovery calls, and contrarian product lessons.

### Step 3: Format with Native Mobile Rhythm
- Opening hook under 140 characters.
- 1 to 2 sentences per paragraph with whitespace.
- Concrete nouns and real metrics.
- Concluding peer discussion question.

### Step 4: Pass to Humanizer
Once the draft is generated, pass it immediately to `humanizer` for the anti-slop and burstiness polishing pass.

---

## Reference Material

- [Repurposing Frameworks & Templates](./references/repurposing_frameworks.md): Step-by-step extraction checklists.
- [Real Walkthrough Examples](./examples/raw_to_draft_walkthroughs.md): Real before-and-after conversions from git commits and voice notes.
