import { config as dotenvConfig } from "dotenv"
dotenvConfig()

import express from "express"
import cors from "cors"
import fs from "fs"
import path from "path"
import { watch } from "chokidar"
import Anthropic from "@anthropic-ai/sdk"

const app = express()
app.use(cors())
app.use(express.json())

// ─── PATH CONFIG ──────────────────────────────────────────────────────────────
const DEFAULT_PATH = process.env.CAREER_OPS_PATH ||
  path.join(process.env.USERPROFILE || process.env.HOME || "", "Documents", "career-ops")

function getCareerOpsPath(req) {
  return req.query.path || DEFAULT_PATH
}

// ─── SIVA'S CV ────────────────────────────────────────────────────────────────
const SIVA_CV = `Name: Siva Iyallasomayajula
Location: London UK. Right to work, no sponsorship needed.
Summary: PwC motion designer turned AI engineer. 7 years experience across design, engineering and AI.
Current: Lead Developer MapPal (Python REST APIs, Datadog, Flutter, Google Play in 3 months). Frontend Developer Voices of Hope NHS (Next.js/React, 100-200 children daily, WCAG, 6 weeks solo).
Caarya 2024: AI Technical Lead, 15 client deployments, prompt engineering, evaluation frameworks, 50+ trained, 35% cycle reduction.
PwC 2022-2024: C-suite enterprise clients, financial services and healthcare, Digital Acumen badge.
BYJU'S 2021-2022: 150M+ user platform, design systems, 12 verticals.
Projects: Job Agent (Python/Playwright/40 apps per week/40hrs saved), Heat Pump Calculator (Claude Haiku/8760 data points/2 weeks), Verdant (AI Health SaaS/30+ users/4 weeks), Genai Studio (fal.ai/ElevenLabs/Replicate/n8n), Architect Prototype (React/Tailwind/Framer Motion).
Skills: Anthropic Claude API, OpenAI API, Python, TypeScript, React, Next.js, Node.js, Tailwind, Framer Motion, REST APIs, Playwright, SQLite, Railway, Vercel, Datadog, Figma, Adobe Suite, After Effects, fal.ai, ElevenLabs, Replicate, Claude Code, Cursor.
Education: Masters Game Development and Design Distinction A+, Kingston University London 2024-2025.
Salary: 65000 to 75000 GBP. Open to hybrid and remote.`

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 8000)
}

function appendToTracker(careerOpsPath, { company, role, score, verdict }) {
  const appsPath = path.join(careerOpsPath, "data", "applications.md")
  try {
    const content = fs.readFileSync(appsPath, "utf8")
    const lines = content.split("\n")

    let maxNum = 0
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith("|")) continue
      const fields = trimmed.replace(/^\||\|$/g, "").split("|").map(f => f.trim())
      const num = parseInt(fields[0])
      if (!isNaN(num)) maxNum = Math.max(maxNum, num)
    }

    const nextNum = maxNum + 1
    const today = new Date().toISOString().split("T")[0]
    const scoreIn5 = (score / 20).toFixed(1)
    const note = (verdict || "").slice(0, 80)

    const newRow = `| ${nextNum} | ${today} | ${company || "Unknown"} | ${role || "Unknown"} | ${scoreIn5}/5 | Evaluated | ❌ | pending | ${note} |`

    let lastRowIdx = -1
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim().startsWith("|") && !lines[i].includes("---")) {
        lastRowIdx = i
        break
      }
    }

    if (lastRowIdx >= 0) {
      lines.splice(lastRowIdx + 1, 0, newRow)
      fs.writeFileSync(appsPath, lines.join("\n"), "utf8")
    }
  } catch {
    // Non-fatal — tracker failure does not block evaluation
  }
}

// ─── TITLE TRANSLATIONS ───────────────────────────────────────────────────────
const TITLE_TRANSLATIONS = {
  "Resumen del Rol":        "Role Summary",
  "Match con CV":           "CV Match",
  "Nivel y Estrategia":     "Level and Strategy",
  "Comp y Demanda":         "Compensation",
  "Compensación y Demanda": "Compensation",
  "Plan de Personalización":"Personalisation Plan",
  "Plan de Entrevistas":    "Interview Plan",
  "Plan de Entrevista":     "Interview Plan",
  "Legitimidad del Anuncio":"Posting Legitimacy",
  "Resumo da Vaga":         "Role Summary",
  "Match com CV":           "CV Match",
  "Nível e Estratégia":     "Level and Strategy",
  "Remuneração e Demanda":  "Compensation",
  "Plano de Personalização":"Personalisation Plan",
  "Plano de Entrevistas":   "Interview Plan",
}

function translateTitle(title) {
  return TITLE_TRANSLATIONS[title] ?? title
}

// ─── PARSERS ─────────────────────────────────────────────────────────────────
function parseApplications(careerOpsPath) {
  const paths = [
    path.join(careerOpsPath, "data", "applications.md"),
    path.join(careerOpsPath, "applications.md"),
  ]

  let content = ""
  for (const p of paths) {
    try { content = fs.readFileSync(p, "utf8"); break } catch {}
  }

  if (!content) return []

  const lines = content.split("\n")
  const apps = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("# ") || trimmed.startsWith("|---") || trimmed.startsWith("| #") || trimmed.startsWith("| ---")) continue
    if (!trimmed.startsWith("|")) continue

    const fields = trimmed.replace(/^\||\|$/g, "").split("|").map(f => f.trim())
    if (fields.length < 7) continue

    const scoreMatch  = fields[4]?.match(/(\d+\.?\d*)\/5/)
    const reportMatch = fields[7]?.match(/\[(\d+)\]\(([^)]+)\)/)

    apps.push({
      number:       parseInt(fields[0]) || apps.length + 1,
      date:         fields[1] || "",
      company:      fields[2] || "",
      role:         fields[3] || "",
      scoreRaw:     fields[4] || "",
      score:        scoreMatch ? parseFloat(scoreMatch[1]) : null,
      status:       fields[5] || "",
      hasPDF:       fields[6]?.includes("✅") || false,
      reportPath:   reportMatch ? reportMatch[2] : null,
      reportNumber: reportMatch ? reportMatch[1] : null,
      notes:        fields[8] || "",
    })
  }

  return apps
}

function parseReport(reportPath) {
  try {
    const content = fs.readFileSync(reportPath, "utf8")

    const scoreMatch     = content.match(/\*\*Score:\*\*\s*([\d.]+)\/5/)
    const urlMatch       = content.match(/\*\*URL:\*\*\s*(https?:\/\/\S+)/)
    const dateMatch      = content.match(/\*\*(?:Date|Fecha):\*\*\s*(.+)/)
    const archetypeMatch = content.match(/\*\*(?:Archetype|Arquetipo):\*\*\s*(.+)/)
    const pdfMatch       = content.match(/\*\*PDF:\*\*\s*(.+)/)

    const sections = {}
    const sectionMatches = content.matchAll(/## ([A-H])\) (.+?)\n([\s\S]+?)(?=\n## [A-H]\)|$)/g)
    for (const m of sectionMatches) {
      sections[m[1]] = { title: translateTitle(m[2].trim()), content: m[3].trim() }
    }

    const kwMatch  = content.match(/## Keywords[^#\n]*\n\n(.+)/s)
    const keywords = kwMatch ? kwMatch[1].split(",").map(k => k.trim()).filter(Boolean).slice(0, 15) : []

    return {
      raw:       content,
      score:     scoreMatch ? parseFloat(scoreMatch[1]) : null,
      url:       urlMatch ? urlMatch[1] : null,
      date:      dateMatch ? dateMatch[1].trim() : null,
      archetype: archetypeMatch ? archetypeMatch[1].trim() : null,
      pdf:       pdfMatch ? pdfMatch[1].trim() : null,
      sections,
      keywords,
    }
  } catch {
    return null
  }
}

function parseStoryBank(careerOpsPath) {
  try {
    return fs.readFileSync(path.join(careerOpsPath, "interview-prep", "story-bank.md"), "utf8")
  } catch { return "" }
}

function updateApplicationStatus(careerOpsPath, appNumber, newStatus) {
  const paths = [
    path.join(careerOpsPath, "data", "applications.md"),
    path.join(careerOpsPath, "applications.md"),
  ]

  for (const p of paths) {
    try {
      const content = fs.readFileSync(p, "utf8")
      const lines = content.split("\n")
      let updated = false

      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim()
        if (!trimmed.startsWith("|")) continue
        const fields = trimmed.replace(/^\||\|$/g, "").split("|").map(f => f.trim())
        if (fields.length < 6) continue
        const num = parseInt(fields[0])
        if (num === appNumber) {
          fields[5] = newStatus
          lines[i] = "| " + fields.join(" | ") + " |"
          updated = true
          break
        }
      }

      if (updated) {
        fs.writeFileSync(p, lines.join("\n"), "utf8")
        return { success: true }
      }
    } catch {}
  }
  return { success: false, error: "Could not update" }
}

// ─── ROUTES ──────────────────────────────────────────────────────────────────

// POST /api/evaluate
app.post("/api/evaluate", async (req, res) => {
  const { url, jobText } = req.body

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(400).json({ error: "ANTHROPIC_API_KEY not set. Create a .env file in the server folder with ANTHROPIC_API_KEY=your-key-here" })
  }

  let jdText = jobText || ""

  if (url && !jdText) {
    try {
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
      const fetchRes = await fetch(proxyUrl, { signal: AbortSignal.timeout(20000) })
      const data = await fetchRes.json()
      jdText = stripHtml(data.contents || "")
    } catch {
      return res.status(400).json({ error: "Could not fetch the job page. Try pasting the job description text directly into the field." })
    }
  }

  if (!jdText || jdText.length < 80) {
    return res.status(400).json({ error: "Job description is too short or empty. Paste a URL or some job description text." })
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const prompt = `You are evaluating a job posting for Siva Iyallasomayajula. Return ONLY a valid JSON object. No markdown, no code blocks, no text before or after the JSON.

CANDIDATE CV:
${SIVA_CV}

JOB POSTING${url ? ` (${url})` : ""}:
${jdText.slice(0, 6000)}

Return exactly this JSON structure:
{
  "grade": "B",
  "score": 78,
  "company": "Company Name",
  "role": "Job Title",
  "location": "City, Country or Remote",
  "salary": "salary range or null",
  "verdict": "One honest sentence: should Siva apply and why.",
  "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "gaps": ["specific gap 1", "specific gap 2"],
  "ats_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8", "keyword9", "keyword10"],
  "recommend": true,
  "tailored_summary": "2-3 sentences rewritten for this specific role. Natural voice. No em-dashes. Proper punctuation throughout.",
  "tailored_bullets": [
    "Action verb, specific task description, measurable result.",
    "Action verb, specific task description, measurable result.",
    "Action verb, specific task description, measurable result.",
    "Action verb, specific task description, measurable result.",
    "Action verb, specific task description, measurable result."
  ],
  "cover_note": "Opening paragraph: what specifically about this company and role appeals to Siva, grounded in something real about what they build or who they serve. Direct and human.\\n\\nMiddle paragraph: the most relevant thing Siva has shipped that maps directly to this role, with specific numbers and outcomes.\\n\\nClosing paragraph: what Siva brings that other candidates are unlikely to combine. Confident without being arrogant."
}

RULES:
- Never use em-dashes in any field. Use commas or periods instead.
- Never open the cover note with I am writing, I would like, or I am excited to apply.
- Cover note is exactly 3 paragraphs separated by \\n\\n. No bullet points inside it.
- Bullets: action verb, what was done, quantified result. Past tense for completed work.
- grade must be one of: A B C D F
- score is 0-100
- Return only the JSON object, nothing else.`

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    })

    const raw = message.content[0].text.trim()
    const jsonMatch = raw.match(/\{[\s\S]+\}/)
    if (!jsonMatch) throw new SyntaxError("No JSON in response")

    const evaluation = JSON.parse(jsonMatch[0])
    evaluation.url = url || null

    appendToTracker(getCareerOpsPath(req), evaluation)

    res.json(evaluation)
  } catch (e) {
    if (e instanceof SyntaxError) {
      return res.status(500).json({ error: "Claude returned invalid JSON. Please try again." })
    }
    res.status(500).json({ error: "Evaluation failed: " + e.message })
  }
})

// GET /api/applications
app.get("/api/applications", (req, res) => {
  const coPath = getCareerOpsPath(req)
  res.json({ apps: parseApplications(coPath), path: coPath })
})

// GET /api/report/:filename
app.get("/api/report/:filename", (req, res) => {
  const coPath    = getCareerOpsPath(req)
  const report    = parseReport(path.join(coPath, "reports", req.params.filename))
  if (!report) return res.status(404).json({ error: "Report not found" })
  res.json(report)
})

// GET /api/report-by-path
app.get("/api/report-by-path", (req, res) => {
  const coPath = getCareerOpsPath(req)
  const relPath = req.query.p
  if (!relPath) return res.status(400).json({ error: "Missing path" })
  const report = parseReport(path.join(coPath, relPath))
  if (!report) return res.status(404).json({ error: "Report not found" })
  res.json(report)
})

// GET /api/reports
app.get("/api/reports", (req, res) => {
  const coPath = getCareerOpsPath(req)
  try {
    const files = fs.readdirSync(path.join(coPath, "reports"))
      .filter(f => f.endsWith(".md")).sort().reverse()
    res.json({ files })
  } catch { res.json({ files: [] }) }
})

// GET /api/story-bank
app.get("/api/story-bank", (req, res) => {
  res.json({ content: parseStoryBank(getCareerOpsPath(req)) })
})

// PATCH /api/applications/:number/status
app.patch("/api/applications/:number/status", (req, res) => {
  const result = updateApplicationStatus(getCareerOpsPath(req), parseInt(req.params.number), req.body.status)
  res.json(result)
})

// GET /api/health
app.get("/api/health", (req, res) => {
  const coPath = getCareerOpsPath(req)
  res.json({ ok: true, path: coPath, careerOpsFound: fs.existsSync(coPath) })
})

// GET /api/stats
app.get("/api/stats", (req, res) => {
  const coPath = getCareerOpsPath(req)
  const apps   = parseApplications(coPath)
  const byStatus = {}
  for (const a of apps) {
    const s = (a.status || "unknown").toLowerCase()
    byStatus[s] = (byStatus[s] || 0) + 1
  }
  const scores   = apps.filter(a => a.score).map(a => a.score)
  const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : null
  res.json({ total: apps.length, byStatus, avgScore, withPDF: apps.filter(a => a.hasPDF).length })
})

// GET /api/watch — SSE real-time updates
app.get("/api/watch", (req, res) => {
  const coPath = getCareerOpsPath(req)
  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache")
  res.setHeader("Connection", "keep-alive")

  const watcher = watch([
    path.join(coPath, "data"),
    path.join(coPath, "reports"),
    path.join(coPath, "interview-prep"),
  ], { ignoreInitial: true, persistent: false })

  watcher.on("all", (event, filePath) => {
    res.write(`data: ${JSON.stringify({ event, file: path.basename(filePath) })}\n\n`)
  })

  req.on("close", () => watcher.close())
})

// ─── START ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3333
app.listen(PORT, () => {
  console.log(`\n✦ Friday server running at http://localhost:${PORT}`)
  console.log(`  Career-Ops path: ${DEFAULT_PATH}`)
  console.log(`  Claude: ${process.env.ANTHROPIC_API_KEY ? "API key loaded" : "⚠  ANTHROPIC_API_KEY not set — add to server/.env"}`)
  console.log(`  Override path: set CAREER_OPS_PATH env var\n`)
})
