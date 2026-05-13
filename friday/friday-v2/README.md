# Friday — Job Intelligence Dashboard

Visual frontend for Career-Ops. Reads your career-ops files and displays them beautifully.

## How it works

Career-Ops (terminal) generates files → Friday (browser) reads and displays them.

- `data/applications.md` → Pipeline view
- `reports/*.md` → Full evaluation reports
- `interview-prep/story-bank.md` → STAR stories

## Start

Double-click `start.bat`

Or manually:
```
# Terminal 1 — server
cd server && npm install && node index.js

# Terminal 2 — UI
cd client && npm install && npm run dev
```

Open http://localhost:5174

## Career-Ops path

By default reads from: `C:\Users\{you}\Documents\career-ops`

To use a different path:
```
set CAREER_OPS_PATH=C:\path\to\career-ops
node server/index.js
```
