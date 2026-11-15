# Content Repurposing Frameworks: Raw Material to High-Impact Social

How to extract the narrative tension and technical substance from raw engineering artifacts and translate them into native social posts.

---

## Engine 1: The Git Commit / PR Refactor Engine

### Input Material:
A git commit message, git diff, or GitHub Pull Request summary.

### Extraction Checklist:
1. **The Friction:** What was broken, slow, or annoying in the old code?
2. **The Culprit:** Why was it written that way originally? (e.g., ORM convenience, hasty MVP, legacy baggage).
3. **The Exact Action:** What specific lines, queries, or abstractions were removed or added?
4. **The Metric / Payoff:** Latency change, bundle size reduction, disk space saved, or bugs eradicated.
5. **The Heuristic:** What universal engineering lesson emerged from this commit?

### Output Template:
```text
[Line 1: Direct statement of the embarrassing or surprising flaw - <140 chars]

[Line 2-3: The raw metric or latency number that made you cringe]

Here is what was actually happening:
[1-2 sentences breaking down how clean code hid an ugly operational reality]

So we did the unglamorous work:
1. [Specific action taken - tool or query named]
2. [Specific optimization made]
3. [Safety guardrail or test added to CI/CD]

Result:
[Before/after numbers with units]

[1-sentence punchy heuristic or takeaway]

[Peer-inviting question asking for similar experiences]?
```

---

## Engine 2: The Production Bug / Incident Post-Mortem Engine

### Input Material:
A Slack incident thread, Sentry error log, or post-mortem note.

### Extraction Checklist:
1. **The Stakes:** What broke, when did it happen (e.g., Friday night), and what was the impact (dollars, downtime, angry users)?
2. **The Red Herring:** What did you wrongly suspect at first?
3. **The Root Cause:** What tiny, innocent detail caused the cascade (timezone, race condition, missing index)?
4. **The Permanent Fix:** What was added to the codebase so it never happens again?

### Output Template:
```text
[High-stakes hook: Dollar amount, downtime, or bizarre symptom]

Here is what went wrong and how a [N]-line fix solved it:

The Symptom:
[User report or alert details]

The Culprit:
[Specific technical mechanism explained simply]

The Fix:
[Exact code or config adjustment]

What we added to prevent it forever:
• [Test or CI check]
• [Monitoring rule]

[Aphorism or warning to other builders]

What is the nastiest production bug you've had to chase down recently?
```

---

## Engine 3: The Architecture & Tool Switch Engine

### Input Material:
A tech stack choice, library migration, or database restructuring.

### Extraction Checklist:
1. **The Common Warning:** What did conventional wisdom warn you against?
2. **The Reality Ceiling:** Why did existing tools fail to scale?
3. **The Architecture:** What 2-3 components were wired together?
4. **The Result:** What improved, and what trade-off was accepted?

---

## Engine 4: The Raw Voice Note / Dev Log Engine

### Input Material:
A rambling 3-minute voice transcription, rough scratchpad note, or bulleted sprint summary.

### Extraction Checklist:
1. Strip out filler phrases (*"you know", "like", "basically", "I guess"*).
2. Identify the single central epiphany or frustration.
3. Formulate the hook from the strongest emotional statement in the transcript.
4. Structure the body into 1-2 sentence paragraphs with clear whitespace.
5. End with an open-ended inquiry.
