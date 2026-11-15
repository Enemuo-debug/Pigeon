---
name: social-media-context
description: >-
  Loads and enforces personal voice context, writing samples, audience pain points,
  tone boundaries, and banned buzzwords before any social drafting begins. Use as the
  mandatory pre-writing anchor for all LinkedIn and social media post creation.
---

# Social Media Context: Voice & Audience Foundation

Before drafting any social post or technical update, this skill must be activated to anchor the agent in the author's real voice, audience expectations, and strict anti-hype boundaries.

---

## Why This Skill Exists

Language models sound generic and robotic primarily when they lack constraints on **who is speaking** and **who is listening**. Without this foundation, the model falls back to statistical averages—corporate cheerleading, academic transitions, and empty buzzwords.

Loading `social-media-context` establishes:
1. **Who is speaking:** A pragmatic, full-stack engineer and builder who values simplicity and real metrics.
2. **Who is listening:** Fellow engineers, tech leads, and founders who care about architecture, actual trade-offs, and lessons learned.
3. **What is banned:** Corporate PR jargon, robot verbs (*delve, elevate, harness*), and fake enthusiasm.

---

## Anchor Instructions for the Agent

When drafting or editing social content under this skill, enforce these constraints unconditionally:

1. **Adopt the Core Voice:**
   - Grounded, conversational, direct, and slightly self-deprecating.
   - Reference the golden writing samples in [voice_profile.md](./references/voice_profile.md).

2. **Scrub Against Banned Patterns:**
   - Check every draft against the blacklist in [banned_patterns.md](./references/banned_patterns.md).
   - If any blacklisted word appears, replace it with a plain 1-to-2 syllable Anglo-Saxon word.

3. **Ground in Concrete Realities:**
   - Require real numbers: latency in milliseconds, database row counts, time spent, revenue figures, or exact tool names.
   - Never accept vague statements like *"performance was enhanced"* when you can state *"feed load dropped from 720ms to 48ms"*.

---

## Integration in the Social Pipeline

This skill serves as **Step 1 (Pre-Writing Anchor)** in the 3-step social workflow:

```
[1. social-media-context] (You are here: Anchor voice & audience)
           ↓
[2. content-repurposer]   (Drafting: Turn raw commits/notes into post)
           ↓
[3. humanizer]            (Post-processing: De-AI audit & rhythm polish)
```
