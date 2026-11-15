# Raw to Draft Walkthroughs

Real examples illustrating how raw, unformatted notes and git commits are transformed into compelling, platform-native social updates.

---

## Example 1: Rough Dev Scratchpad to Build-in-Public Post

### Raw Input Note:
> "Slept 4 hours. Deployed the new OAuth flow for LinkedIn on render. Found out the client_url had quotes around it which broke redirect uri in prod. Fixed it by stripping quotes in deployment script. Also noticed that people linking accounts get confused if they connect twice because there was no way to unlink duplicate accounts. Added an unlink button with a delete cascade on prisma. Site is at pigeon.zurus06.name.ng now."

### Repurposed Social Post:
```text
I just spent 90 minutes debugging an OAuth redirect error in production.

The culprit?
A single pair of escaped quotation marks in an environment variable on Render.

Staging was green. Local was green.
In production, GitHub's authorize URL was getting `%22Ov23...%22` instead of `Ov23...`.
Silent 400 Bad Request.

Fixed it by stripping quotes in our env parser.

While in the codebase, I noticed another friction point:
Users connecting social accounts twice had no way to disconnect the duplicate without asking us to wipe their DB record.

So I shipped a quick update:
1. Added an "Unlink LinkedIn" button with live loading state
2. Handled cascading Prisma deletes on the backend
3. Cleaned up orphan drafts automatically

The entire app is live on our custom domain now (pigeon.zurus06.name.ng).

Moral of the morning:
Check your raw environment variable strings before you spend 2 hours blaming OAuth providers.

What's the smallest typo that has ever caused you the biggest production headache?
```

---

## Example 2: Voice Note Transcript to Contrarian Lesson

### Raw Voice Transcript:
> "Yeah so uh, we had this big argument in the sprint planning today about whether we should build this multi-tenant organization feature. Sales said a lead wanted it. But when I looked at the database, like 95% of our active users are solo founders or single devs. Why are we spending 3 weeks building complex role-based access control for a customer that hasn't even paid us a dollar yet? We canceled the ticket and just focused on making the single-user export 10x faster."

### Repurposed Social Post:
```text
We almost spent 3 weeks building complex multi-tenant permissions.

Why?
Because a sales prospect mentioned they "might need team roles."

Right before sprint kickoff, I ran a quick database query on our actual active users:
94% are solo engineers and indie founders. 
Single seats.

If we had listened to hypothetical enterprise demands, we would have burned 3 weeks building role-based access control that 94% of our actual users would never click.

We killed the ticket.

Instead, we spent 2 days making our CSV export 10x faster—a feature our paying users complain about every week.

Build for the users who actually log in every day. 
Not the imaginary enterprise lead who might sign a contract next quarter.

Have you ever had to kill a feature request right before sprint kickoff?
```
