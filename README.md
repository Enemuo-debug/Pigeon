# 🕊️ Pigeon — Commit to your socials

> Turn your everyday Git activity into authentic, high-impact social media updates on X and LinkedIn—without context switching or breaking your flow state.

---

## ⚡ The Vision

Developers build incredible systems every day, but sharing that progress publicly is full of friction:
- **Context Switching**: Leaving the IDE/terminal to draft posts kills focus.
- **AI Buzzword Fluff**: Standard AI tools generate embarrassing corporate marketing jargon that real software engineers cringe at.
- **Commit Churn**: Micro-commits (`fix typo`, `wip`, `refactor`) create noisy spam if broadcast individually.

**Pigeon** solves this by turning `git push` into the atomic unit of developer advocacy. By adding `#Pigeon` to your commit message, Pigeon ingests the push event, understands the codebase diffs and touched architectural modules, and synthesizes authentic, developer-toned updates tailored to each connected social channel.

---

## ✨ Key Features

- **📦 Per-Push Milestone Aggregation**: Aggregates all commits, touched files, and diffs across an entire push into a single, cohesive update rather than noisy per-commit spam.
- **🧠 Auto-Ascertained Engineering Voice**: Analyzes connected developer profiles upon linking to extract authentic sentence cadence, technical depth, and real developer exemplars—eliminating corporate PR buzzwords.
- **⚡ Just-In-Time (JIT) Repository Discovery**: Zero manual onboarding. The first time you push a tagged commit from any repository, Pigeon discovers, clones, indexes the dependency tree, and builds a Depth-3 architectural map on-demand.
- **🎯 Precision Routing with Groups**: Broadcast globally with `#Pigeon`, or route to specific account clusters using `#Pigeon-g<GroupName>` (e.g. `#Pigeon-gPersonal`, `#Pigeon-gCompany`).
- **🛡️ Unified Push Broadcast Queue**: Review distinct previews tailored for LinkedIn (reflective, architectural write-ups) and X (punchy, concise `#buildinpublic` updates) with a single-click broadcast button.
- **🔒 Frictionless Account Switching & Idempotency**: Built with strict session idempotency to prevent duplicate accounts and an automatic logout-first OAuth handshake giving you complete freedom to switch accounts.
- **🖤 Black & White Liquid Glass UI**: Clean, high-contrast monochrome interface designed specifically for software engineers.

---

## 🏗️ Architecture & Tech Stack

```
┌─────────────────────────────────┐
│        Developer Workflow       │
│  git commit -m "... #Pigeon"    │
│  git push                       │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│         GitHub Webhook          │
│      & Background Poller        │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   Pigeon Backend Engine                     │
│  • JIT AST Codebase Analysis (AST & Depth-3 Walker)         │
│  • Multi-Commit Diff Aggregation Engine                     │
│  • Google Gemini 1.5 Flash (Grounded Voice Synthesis)       │
│  • PostgreSQL 16 + Prisma ORM                               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                 Multi-Channel Dispatch                      │
│  • LinkedIn API v2 (UGC Posts, w_member_social)             │
│  • X (Twitter) API v2                                       │
│  • Unified Push Broadcast Approval Queue                    │
└─────────────────────────────────────────────────────────────┘
```

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express, TypeScript, RESTful API
- **Database**: PostgreSQL 16, Prisma ORM
- **AI Synthesis**: Google Gemini 1.5 Flash
- **Social APIs**: LinkedIn OpenID Connect & UGC API, X API v2
- **Containerization**: Docker & Docker Compose

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Docker](https://www.docker.com/) (for PostgreSQL)
- [Git](https://git-scm.com/)

### 2. Clone the Repository
```bash
git clone https://github.com/Enemuo-debug/Pigeon.git
cd Pigeon
```

### 3. Start Database
```bash
docker compose up -d
```
This spins up PostgreSQL on port `5433` (`postz_db`).

### 4. Configure Backend
```bash
cd server
cp .env.example .env
npm install
npx prisma db push
npm run dev
```

### 5. Configure Frontend
```bash
cd ../client
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 💻 How to Use

### 1. Link Your Social Accounts
Sign in via GitHub on Pigeon, then connect your LinkedIn and/or X accounts. Pigeon automatically profiles your writing style to match your authentic voice.

### 2. Tag Your Commits
In your local repository, commit your code with the `#Pigeon` tag:
```bash
# Broadcast to all connected accounts:
git commit -m "feat: implement rate limiting middleware #Pigeon"

# Or target a specific group (e.g., Personal accounts only):
git commit -m "refactor: simplify database connection pool #Pigeon-gPersonal"

git push origin main
```

### 3. Review & Broadcast
Head over to your **Push Broadcast Queue** on Pigeon to review the tailored previews for LinkedIn and X, edit if desired, and click **Approve & Broadcast to All Channels**.

---

## 📄 License
MIT License. Created for Blockathon.
