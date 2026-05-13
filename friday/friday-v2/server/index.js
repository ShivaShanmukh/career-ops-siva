import express from "express"
import cors from "cors"
import fs from "fs"
import path from "path"
import { watch } from "chokidar"

const app = express()
app.use(cors())
app.use(express.json())

// ─── PATH CONFIG ─────────────────────────────────────────────────────────────
// Default path — user can override via ?path= query param or CAREER_OPS_PATH env
const DEFAULT_PATH = process.env.CAREER_OPS_PATH ||
  path.join(process.env.USERPROFILE || process.env.HOME || "", "Documents", "career-ops")

function getCareerOpsPath(req) {
  return req.query.path || DEFAULT_PATH
}

// ─── PARSERS ─────────────────────────────────────────────────────────────────

function parseApplications(careerOpsPath) {
  // Try both locations
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

    // Format: | # | Date | Company | Role | Score | Status | PDF | Report |
    const scoreMatch = fields[4]?.match(/(\d+\.?\d*)\/5/)
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

const TITLE_TRANSLATIONS = {
  // Spanish
  "Resumen del Rol":        "Role Summary",
  "Match con CV":           "CV Match",
  "Nivel y Estrategia":     "Level and Strategy",
  "Comp y Demanda":         "Compensation",
  "Compensación y Demanda": "Compensation",
  "Plan de Personalización":"Personalisation Plan",
  "Plan de Entrevistas":    "Interview Plan",
  "Plan de Entrevista":     "Interview Plan",
  "Legitimidad del Anuncio":"Posting Legitimacy",
  // Portuguese
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

function parseReport(reportPath) {
  try {
    const content = fs.readFileSync(reportPath, "utf8")

    // Extract key fields from report header
    const scoreMatch   = content.match(/\*\*Score:\*\*\s*([\d.]+)\/5/)
    const urlMatch     = content.match(/\*\*URL:\*\*\s*(https?:\/\/\S+)/)
    const dateMatch    = content.match(/\*\*Date:\*\*\s*(.+)/)
    const archetypeMatch = content.match(/\*\*Archetype:\*\*\s*(.+)/)
    const pdfMatch     = content.match(/\*\*PDF:\*\*\s*(.+)/)

    // Extract sections A-H
    const sections = {}
    const sectionMatches = content.matchAll(/## ([A-H])\) (.+?)\n([\s\S]+?)(?=\n## [A-H]\)|$)/g)
    for (const m of sectionMatches) {
      sections[m[1]] = { title: translateTitle(m[2].trim()), content: m[3].trim() }
    }

    // Extract keywords
    const kwMatch = content.match(/## Keywords Extracted\n\n(.+)/s)
    const keywords = kwMatch ? kwMatch[1].split(",").map(k => k.trim()).filter(Boolean).slice(0, 15) : []

    return {
      raw: content,
      score: scoreMatch ? parseFloat(scoreMatch[1]) : null,
      url: urlMatch ? urlMatch[1] : null,
      date: dateMatch ? dateMatch[1].trim() : null,
      archetype: archetypeMatch ? archetypeMatch[1].trim() : null,
      pdf: pdfMatch ? pdfMatch[1].trim() : null,
      sections,
      keywords,
    }
  } catch {
    return null
  }
}

function parseStoryBank(careerOpsPath) {
  try {
    const content = fs.readFileSync(path.join(careerOpsPath, "interview-prep", "story-bank.md"), "utf8")
    return content
  } catch { return "" }
}

function updateApplicationStatus(careerOpsPath, appNumber, newStatus) {
  const paths = [
    path.join(careerOpsPath, "data", "applications.md"),
    path.join(careerOpsPath, "applications.md"),
  ]

  for (const p of paths) {
    try {
      let content = fs.readFileSync(p, "utf8")
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

// GET /api/applications
app.get("/api/applications", (req, res) => {
  const coPath = getCareerOpsPath(req)
  const apps = parseApplications(coPath)
  res.json({ apps, path: coPath })
})

// GET /api/report/:filename
app.get("/api/report/:filename", (req, res) => {
  const coPath = getCareerOpsPath(req)
  const reportPath = path.join(coPath, "reports", req.params.filename)
  const report = parseReport(reportPath)
  if (!report) return res.status(404).json({ error: "Report not found" })
  res.json(report)
})

// GET /api/report-by-path
app.get("/api/report-by-path", (req, res) => {
  const coPath = getCareerOpsPath(req)
  const relPath = req.query.p
  if (!relPath) return res.status(400).json({ error: "Missing path" })
  const reportPath = path.join(coPath, relPath)
  const report = parseReport(reportPath)
  if (!report) return res.status(404).json({ error: "Report not found" })
  res.json(report)
})

// GET /api/reports — list all reports
app.get("/api/reports", (req, res) => {
  const coPath = getCareerOpsPath(req)
  try {
    const files = fs.readdirSync(path.join(coPath, "reports"))
      .filter(f => f.endsWith(".md"))
      .sort()
      .reverse()
    res.json({ files })
  } catch { res.json({ files: [] }) }
})

// GET /api/story-bank
app.get("/api/story-bank", (req, res) => {
  const coPath = getCareerOpsPath(req)
  res.json({ content: parseStoryBank(coPath) })
})

// PATCH /api/applications/:number/status
app.patch("/api/applications/:number/status", (req, res) => {
  const coPath = getCareerOpsPath(req)
  const result = updateApplicationStatus(coPath, parseInt(req.params.number), req.body.status)
  res.json(result)
})

// GET /api/health
app.get("/api/health", (req, res) => {
  const coPath = getCareerOpsPath(req)
  const exists = fs.existsSync(coPath)
  res.json({ ok: true, path: coPath, careerOpsFound: exists })
})

// GET /api/stats
app.get("/api/stats", (req, res) => {
  const coPath = getCareerOpsPath(req)
  const apps = parseApplications(coPath)
  const byStatus = {}
  for (const app of apps) {
    const s = (app.status || "unknown").toLowerCase()
    byStatus[s] = (byStatus[s] || 0) + 1
  }
  const scores = apps.filter(a => a.score).map(a => a.score)
  const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : null
  res.json({ total: apps.length, byStatus, avgScore, withPDF: apps.filter(a => a.hasPDF).length })
})

// ─── FILE WATCHER — SSE for real-time updates ─────────────────────────────────
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

// ─── START ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3333
app.listen(PORT, () => {
  console.log(`\n✦ Friday server running at http://localhost:${PORT}`)
  console.log(`  Career-Ops path: ${DEFAULT_PATH}`)
  console.log(`  Override: set CAREER_OPS_PATH env var\n`)
})
