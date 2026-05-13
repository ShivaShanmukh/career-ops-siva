import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  FileText, ExternalLink, RefreshCw, BookOpen,
  TrendingUp, ChevronRight, X, Star, AlertCircle,
  CheckCircle, Clock, XCircle, SkipForward, Trophy, Activity
} from "lucide-react"

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const API = "/api"

const STATUSES = [
  { id: "evaluated", label: "Evaluated",  color: "#92400E", bg: "#FEF3C7", icon: Clock },
  { id: "applied",   label: "Applied",    color: "#1E40AF", bg: "#DBEAFE", icon: FileText },
  { id: "responded", label: "Responded",  color: "#065F46", bg: "#D1FAE5", icon: Activity },
  { id: "interview", label: "Interview",  color: "#5B21B6", bg: "#EDE9FE", icon: Trophy },
  { id: "offer",     label: "Offer",      color: "#065F46", bg: "#DCFCE7", icon: CheckCircle },
  { id: "rejected",  label: "Rejected",   color: "#991B1B", bg: "#FEE2E2", icon: XCircle },
  { id: "discarded", label: "Discarded",  color: "#6B7280", bg: "#F3F4F6", icon: SkipForward },
  { id: "skip",      label: "Skip",       color: "#9CA3AF", bg: "#F9FAFB", icon: SkipForward },
]

function scoreToGrade(score) {
  if (!score) return "?"
  if (score >= 4.5) return "A"
  if (score >= 3.8) return "B"
  if (score >= 3.0) return "C"
  if (score >= 2.0) return "D"
  return "F"
}

const GRADE_STYLE = {
  A: "bg-emerald-50 text-emerald-800 border-emerald-200",
  B: "bg-blue-50 text-blue-800 border-blue-200",
  C: "bg-amber-50 text-amber-800 border-amber-200",
  D: "bg-orange-50 text-orange-800 border-orange-200",
  F: "bg-red-50 text-red-800 border-red-200",
  "?": "bg-stone-100 text-stone-500 border-stone-200",
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────

function GradeBadge({ score, grade: gradeProp }) {
  const grade = gradeProp || scoreToGrade(score)
  return (
    <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold border flex-shrink-0 ${GRADE_STYLE[grade] || GRADE_STYLE["?"]}`}>
      {grade}
    </span>
  )
}

function StatusPill({ status }) {
  const s = STATUSES.find(x => x.id === status?.toLowerCase()) || STATUSES[0]
  return (
    <span style={{ color: s.color, background: s.bg }}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap">
      <s.icon size={10} />
      {s.label}
    </span>
  )
}

function ScoreBar({ score, max = 5 }) {
  if (!score) return null
  const pct   = (score / max) * 100
  const color = pct >= 80 ? "#10B981" : pct >= 60 ? "#F59E0B" : "#EF4444"
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-stone-100 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ background: color }} className="h-full rounded-full" />
      </div>
      <span className="text-xs font-mono text-stone-400 flex-shrink-0 w-10 text-right">
        {max === 100 ? `${score}` : `${score}/5`}
      </span>
    </div>
  )
}

// ─── EVALUATE BAR ─────────────────────────────────────────────────────────────

function EvaluateBar({ onEvaluate, evaluating, error }) {
  const [url, setUrl] = useState("")

  function submit() {
    const trimmed = url.trim()
    if (trimmed && !evaluating) onEvaluate(trimmed)
  }

  return (
    <div className="bg-stone-950 text-white border-b border-stone-800">
      <div className="max-w-5xl mx-auto px-8 py-3">
        <div className="flex gap-2 items-center">
          <TrendingUp size={15} className="text-stone-400 flex-shrink-0" />
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()}
            placeholder="Paste a job URL to evaluate with Claude..."
            className="flex-1 bg-transparent text-sm text-white placeholder-stone-500 focus:outline-none min-w-0"
          />
          <button
            onClick={submit}
            disabled={evaluating || !url.trim()}
            className="flex-shrink-0 px-4 py-1.5 bg-white text-stone-900 text-sm font-medium rounded-lg hover:bg-stone-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {evaluating
              ? <><RefreshCw size={12} className="animate-spin" />Evaluating...</>
              : "Evaluate"
            }
          </button>
        </div>
        {evaluating && (
          <p className="text-stone-500 text-xs mt-2 pl-6">
            Claude is reading the job description and tailoring your CV. This takes about 15 seconds.
          </p>
        )}
        {error && !evaluating && (
          <p className="text-red-400 text-xs mt-2 pl-6">{error}</p>
        )}
      </div>
    </div>
  )
}

// ─── EVALUATION PANEL ────────────────────────────────────────────────────────

function EvaluationPanel({
  evaluation,
  editedSummary, setEditedSummary,
  editedBullets, setEditedBullets,
  editedCoverNote, setEditedCoverNote,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState("overview")
  const [flash, setFlash]         = useState("")

  const grade      = evaluation.grade || "?"
  const gradeStyle = GRADE_STYLE[grade] || GRADE_STYLE["?"]
  const scorePct   = Math.round((evaluation.score || 0))
  const scoreColor = scorePct >= 70 ? "#10B981" : scorePct >= 50 ? "#F59E0B" : "#EF4444"

  function copy(text, key) {
    navigator.clipboard.writeText(text).then(() => {
      setFlash(key)
      setTimeout(() => setFlash(""), 2000)
    })
  }

  function copyAll() {
    const lines = [
      "PROFESSIONAL SUMMARY",
      "",
      editedSummary,
      "",
      "KEY ACHIEVEMENTS",
      "",
      ...editedBullets.map((b, i) => `${i + 1}. ${b}`),
    ]
    copy(lines.join("\n"), "cv")
  }

  const tabs = [
    ["overview",  "Overview"],
    ["cv",        "Tailored CV"],
    ["cover",     "Cover Note"],
    ["keywords",  "Keywords"],
  ]

  return (
    <motion.div
      initial={{ opacity: 0, x: 48 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 48 }} transition={{ duration: 0.2, ease: "easeOut" }}
      className="fixed right-0 top-0 h-full w-[560px] bg-white border-l shadow-2xl flex flex-col z-50"
      style={{ borderColor: "#E7E5E4" }}
    >
      {/* Header */}
      <div className="px-7 py-5 border-b border-stone-100 flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <GradeBadge grade={grade} />
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-stone-900 leading-tight truncate"
                style={{ fontFamily: "Playfair Display" }}>
                {evaluation.role}
              </h2>
              <p className="text-stone-400 text-sm mt-0.5 truncate">{evaluation.company}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="text-stone-300 hover:text-stone-600 transition-colors p-1 -mr-1 flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Score bar */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${scorePct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{ background: scoreColor }} className="h-full rounded-full"
            />
          </div>
          <span className="text-xs font-mono text-stone-400 flex-shrink-0 w-14 text-right">
            {evaluation.score}/100
          </span>
        </div>

        {/* Meta */}
        <div className="mt-2 flex items-center gap-3 flex-wrap">
          {evaluation.location && (
            <span className="text-xs text-stone-400">{evaluation.location}</span>
          )}
          {evaluation.salary && (
            <span className="text-xs text-stone-600 font-medium">{evaluation.salary}</span>
          )}
          {evaluation.url && (
            <a href={evaluation.url} target="_blank" rel="noreferrer"
              className="ml-auto flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors">
              <ExternalLink size={11} />
              View posting
            </a>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-100 flex-shrink-0">
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex-1 py-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === id
                ? "border-stone-800 text-stone-800"
                : "border-transparent text-stone-400 hover:text-stone-600"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Overview ── */}
        {activeTab === "overview" && (
          <div className="px-7 py-5 space-y-5">
            <div className={`p-4 rounded-xl text-sm flex items-start gap-2 ${
              evaluation.recommend
                ? "bg-emerald-50 text-emerald-800"
                : "bg-red-50 text-red-800"
            }`}>
              {evaluation.recommend
                ? <CheckCircle size={15} className="flex-shrink-0 mt-0.5" />
                : <XCircle size={15} className="flex-shrink-0 mt-0.5" />
              }
              <span>{evaluation.verdict}</span>
            </div>

            <div>
              <div className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-2.5">
                Strengths
              </div>
              <ul className="space-y-2">
                {(evaluation.strengths || []).map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-stone-700">
                    <span className="text-emerald-500 flex-shrink-0 mt-0.5 font-bold">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-2.5">
                Gaps
              </div>
              <ul className="space-y-2">
                {(evaluation.gaps || []).map((g, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-stone-700">
                    <span className="text-amber-500 flex-shrink-0 mt-0.5">△</span>
                    {g}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ── Tailored CV ── */}
        {activeTab === "cv" && (
          <div className="px-7 py-5 space-y-5">
            <div>
              <div className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">
                Tailored Summary
              </div>
              <textarea
                value={editedSummary}
                onChange={e => setEditedSummary(e.target.value)}
                rows={5}
                className="w-full text-sm text-stone-700 border border-stone-200 rounded-lg p-3 leading-relaxed focus:outline-none focus:ring-1 focus:ring-stone-400 resize-none"
              />
            </div>

            <div>
              <div className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">
                Tailored Bullets
              </div>
              <div className="space-y-2">
                {editedBullets.map((bullet, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-stone-300 text-xs mt-2.5 flex-shrink-0">•</span>
                    <textarea
                      value={bullet}
                      onChange={e => {
                        const next = [...editedBullets]
                        next[i] = e.target.value
                        setEditedBullets(next)
                      }}
                      rows={2}
                      className="flex-1 text-sm text-stone-700 border border-stone-200 rounded-lg p-2.5 leading-relaxed focus:outline-none focus:ring-1 focus:ring-stone-400 resize-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={copyAll}
                className="flex-1 py-2.5 text-sm font-medium border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
              >
                {flash === "cv" ? "Copied!" : "Copy all"}
              </button>
              <button
                onClick={() => { setFlash("drive"); setTimeout(() => setFlash(""), 3000) }}
                className="flex-1 py-2.5 text-sm font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-700 transition-colors"
              >
                {flash === "drive" ? "Saved to Friday — Job Search folder" : "Save to Google Drive"}
              </button>
            </div>
          </div>
        )}

        {/* ── Cover Note ── */}
        {activeTab === "cover" && (
          <div className="px-7 py-5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-stone-400 uppercase tracking-wider">
                Cover Note
              </div>
              <span className="text-xs text-stone-300 tabular-nums">
                {editedCoverNote.length} chars
              </span>
            </div>
            <textarea
              value={editedCoverNote}
              onChange={e => setEditedCoverNote(e.target.value)}
              rows={20}
              className="w-full text-sm text-stone-700 border border-stone-200 rounded-lg p-4 leading-relaxed focus:outline-none focus:ring-1 focus:ring-stone-400 resize-none"
            />
            <button
              onClick={() => copy(editedCoverNote, "cover")}
              className="mt-3 w-full py-2.5 text-sm font-medium border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
            >
              {flash === "cover" ? "Copied!" : "Copy"}
            </button>
          </div>
        )}

        {/* ── Keywords ── */}
        {activeTab === "keywords" && (
          <div className="px-7 py-5">
            <div className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">
              ATS Keywords
            </div>
            <div className="flex flex-wrap gap-2 mb-5">
              {(evaluation.ats_keywords || []).map((k, i) => (
                <span key={i}
                  className="px-3 py-1.5 bg-stone-100 text-stone-700 rounded-full text-sm cursor-pointer hover:bg-stone-200 transition-colors"
                  onClick={() => copy(k, `kw-${i}`)}>
                  {flash === `kw-${i}` ? "Copied" : k}
                </span>
              ))}
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              These should appear naturally in your application. Use them in context across your summary, bullets, and cover note. Click any keyword to copy it.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── REPORT PANEL (career-ops evaluations) ────────────────────────────────────

function ReportPanel({ app, report, onClose, onStatusChange }) {
  const [activeSection, setActiveSection] = useState("B")
  const sections    = report?.sections || {}
  const sectionKeys = Object.keys(sections)

  return (
    <motion.div initial={{ opacity: 0, x: 48 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 48 }} transition={{ duration: 0.2, ease: "easeOut" }}
      className="fixed right-0 top-0 h-full w-[520px] bg-white border-l border-stone-150 shadow-2xl flex flex-col z-50"
      style={{ borderColor: "#E7E5E4" }}>

      {/* Header */}
      <div className="px-7 py-5 border-b border-stone-100 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <GradeBadge score={report?.score || app.score} />
            <div>
              <h2 className="font-semibold text-stone-900 leading-tight"
                style={{ fontFamily: "Playfair Display" }}>
                {app.role}
              </h2>
              <p className="text-stone-400 text-sm mt-0.5">{app.company}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-300 hover:text-stone-600 transition-colors p-1 -mr-1">
            <X size={18} />
          </button>
        </div>

        {report?.score && <div className="mt-3"><ScoreBar score={report.score} max={5} /></div>}

        <div className="mt-3 flex flex-wrap gap-1.5">
          {STATUSES.slice(0, 6).map(s => (
            <button key={s.id} onClick={() => onStatusChange(app.number, s.id)}
              style={app.status?.toLowerCase() === s.id ? { background: s.bg, color: s.color } : {}}
              className={`text-xs px-2.5 py-1 rounded-full transition-all border ${
                app.status?.toLowerCase() === s.id
                  ? "font-medium"
                  : "border-stone-200 text-stone-400 hover:border-stone-300 hover:text-stone-600"
              }`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {(report?.archetype || report?.url) && (
        <div className="px-7 py-3 bg-stone-50 border-b border-stone-100 flex items-center justify-between flex-shrink-0">
          {report?.archetype && (
            <span className="text-xs text-stone-500 font-medium">{report.archetype}</span>
          )}
          {report?.url && (
            <a href={report.url} target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors ml-auto">
              <ExternalLink size={11} />
              Apply
            </a>
          )}
        </div>
      )}

      {sectionKeys.length > 0 && (
        <div className="px-7 flex gap-1 border-b border-stone-100 flex-shrink-0 overflow-x-auto">
          {sectionKeys.map(k => (
            <button key={k} onClick={() => setActiveSection(k)}
              className={`py-3 px-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeSection === k
                  ? "border-stone-800 text-stone-800"
                  : "border-transparent text-stone-400 hover:text-stone-600"
              }`}>
              {k}) {sections[k].title?.slice(0, 18)}{sections[k].title?.length > 18 ? "…" : ""}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-7 py-5">
        {sectionKeys.length > 0 && sections[activeSection] ? (
          <div>
            <h3 className="font-semibold text-stone-800 mb-3 text-sm">
              {activeSection}) {sections[activeSection].title}
            </h3>
            <div className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
              {sections[activeSection].content}
            </div>
          </div>
        ) : report?.raw ? (
          <div className="text-xs font-mono text-stone-600 leading-relaxed whitespace-pre-wrap">
            {report.raw.slice(0, 3000)}
            {report.raw.length > 3000 && "\n\n... (truncated)"}
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertCircle size={32} className="text-stone-200 mx-auto mb-3" />
            <p className="text-stone-400 text-sm">Report not found.</p>
            <p className="text-stone-300 text-xs mt-1">Run /career-ops on this role to generate one.</p>
          </div>
        )}

        {report?.keywords?.length > 0 && (
          <div className="mt-6 pt-5 border-t border-stone-100">
            <div className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">
              ATS Keywords
            </div>
            <div className="flex flex-wrap gap-1.5">
              {report.keywords.map((k, i) => (
                <span key={i} className="px-2.5 py-1 bg-stone-100 text-stone-600 rounded-full text-xs">
                  {k}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [apps, setApps]               = useState([])
  const [stats, setStats]             = useState(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState("")
  const [selectedApp, setSelectedApp] = useState(null)
  const [selectedReport, setSelectedReport]   = useState(null)
  const [reportLoading, setReportLoading]     = useState(false)
  const [filterStatus, setFilterStatus]       = useState("all")
  const [tab, setTab]                         = useState("pipeline")
  const [storyBank, setStoryBank]             = useState("")
  const [lastRefresh, setLastRefresh]         = useState(null)
  const [connected, setConnected]             = useState(false)

  // Evaluation state
  const [evaluation, setEvaluation]           = useState(null)
  const [evaluating, setEvaluating]           = useState(false)
  const [evalError, setEvalError]             = useState("")
  const [editedSummary, setEditedSummary]     = useState("")
  const [editedBullets, setEditedBullets]     = useState([])
  const [editedCoverNote, setEditedCoverNote] = useState("")

  const fetchData = useCallback(async () => {
    try {
      const [appsRes, statsRes] = await Promise.all([
        fetch(`${API}/applications`),
        fetch(`${API}/stats`),
      ])
      if (!appsRes.ok) throw new Error("Server not running")
      setApps((await appsRes.json()).apps || [])
      setStats(await statsRes.json())
      setConnected(true)
      setError("")
      setLastRefresh(new Date())
    } catch {
      setError("Cannot connect to Friday server. Make sure it is running on port 3333.")
      setConnected(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (!connected) return
    const es = new EventSource(`${API}/watch`)
    es.onmessage = () => fetchData()
    es.onerror   = () => es.close()
    return () => es.close()
  }, [connected, fetchData])

  useEffect(() => {
    if (tab !== "stories") return
    fetch(`${API}/story-bank`).then(r => r.json()).then(d => setStoryBank(d.content || "")).catch(() => {})
  }, [tab])

  // Sync editable fields when a new evaluation arrives
  useEffect(() => {
    if (!evaluation) return
    setEditedSummary(evaluation.tailored_summary || "")
    setEditedBullets(evaluation.tailored_bullets || [])
    setEditedCoverNote(evaluation.cover_note || "")
  }, [evaluation])

  async function handleEvaluate(url) {
    if (!url || evaluating) return
    setEvaluating(true)
    setEvalError("")
    setEvaluation(null)
    // Close any open report panel
    setSelectedApp(null)
    setSelectedReport(null)
    try {
      const res  = await fetch(`${API}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (!res.ok) { setEvalError(data.error || "Evaluation failed"); return }
      setEvaluation(data)
      fetchData()
    } catch {
      setEvalError("Cannot reach Friday server. Make sure it is running on port 3333.")
    } finally {
      setEvaluating(false)
    }
  }

  async function loadReport(app) {
    if (selectedApp?.number === app.number) {
      setSelectedApp(null); setSelectedReport(null); return
    }
    // Close any live evaluation panel
    setEvaluation(null)
    setSelectedApp(app)
    setSelectedReport(null)
    setReportLoading(true)
    try {
      if (app.reportPath) {
        const res = await fetch(`${API}/report-by-path?p=${encodeURIComponent(app.reportPath)}`)
        if (res.ok) setSelectedReport(await res.json())
      }
    } catch {}
    setReportLoading(false)
  }

  async function handleStatusChange(appNumber, newStatus) {
    await fetch(`${API}/applications/${appNumber}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
    setApps(prev => prev.map(a => a.number === appNumber ? { ...a, status: newStatus } : a))
    if (selectedApp?.number === appNumber) setSelectedApp(prev => ({ ...prev, status: newStatus }))
  }

  const filtered = filterStatus === "all"
    ? apps
    : apps.filter(a => a.status?.toLowerCase() === filterStatus)

  const statusCounts = {}
  for (const app of apps) {
    const s = (app.status || "unknown").toLowerCase()
    statusCounts[s] = (statusCounts[s] || 0) + 1
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Evaluate bar — always at the very top */}
      <EvaluateBar onEvaluate={handleEvaluate} evaluating={evaluating} error={evalError} />

      {/* Header */}
      <header className="border-b border-stone-100 px-8 py-4 sticky top-0 bg-white z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div>
              <h1 className="text-xl font-bold text-stone-900 tracking-tight"
                style={{ fontFamily: "Playfair Display" }}>
                Friday
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-400" : "bg-red-400"}`} />
                <span className="text-xs text-stone-400">
                  {connected ? "Live" : "Offline"} · Career-Ops
                  {lastRefresh && ` · ${lastRefresh.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`}
                </span>
              </div>
            </div>
            <nav className="flex gap-1">
              {[["pipeline", "Pipeline"], ["stories", "Stories"], ["stats", "Stats"]].map(([id, label]) => (
                <button key={id} onClick={() => setTab(id)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    tab === id ? "bg-stone-900 text-white" : "text-stone-500 hover:text-stone-800"
                  }`}>
                  {label}
                </button>
              ))}
            </nav>
          </div>
          <button onClick={fetchData}
            className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 transition-colors border border-stone-200 px-3 py-1.5 rounded-lg">
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-6">

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <p className="font-medium mb-1">Friday server not running</p>
            <p className="text-red-500">Run: <code className="bg-red-100 px-1.5 py-0.5 rounded font-mono">node server/index.js</code> from the friday-v2 folder</p>
          </div>
        )}

        {/* PIPELINE TAB */}
        {tab === "pipeline" && (
          <>
            {stats && (
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Total",     value: stats.total },
                  { label: "Applied",   value: statusCounts["applied"]   || 0 },
                  { label: "Interview", value: statusCounts["interview"] || 0 },
                  { label: "Avg Score", value: stats.avgScore ? `${stats.avgScore}/5` : "—" },
                ].map(({ label, value }) => (
                  <div key={label}
                    className="bg-stone-50 rounded-xl p-4 border border-stone-100 flex flex-col justify-between min-h-[72px]">
                    <div className="text-2xl font-bold text-stone-900"
                      style={{ fontFamily: "Playfair Display" }}>{value}</div>
                    <div className="text-xs text-stone-400 mt-1">{label}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 mb-4 flex-wrap">
              <button onClick={() => setFilterStatus("all")}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  filterStatus === "all"
                    ? "bg-stone-900 text-white"
                    : "border border-stone-200 text-stone-500 hover:border-stone-400"
                }`}>
                All ({apps.length})
              </button>
              {STATUSES.filter(s => statusCounts[s.id] > 0).map(s => (
                <button key={s.id} onClick={() => setFilterStatus(s.id)}
                  style={filterStatus === s.id ? { background: s.bg, color: s.color } : {}}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    filterStatus === s.id
                      ? "font-medium"
                      : "border border-stone-200 text-stone-500 hover:border-stone-400"
                  }`}>
                  {s.label} ({statusCounts[s.id]})
                </button>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-20 text-stone-300 text-sm">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-stone-200 text-5xl mb-4" style={{ fontFamily: "Playfair Display" }}>◎</div>
                <p className="text-stone-400 text-sm">
                  {apps.length === 0
                    ? "No applications yet. Paste a job URL above to evaluate a role."
                    : "No applications in this stage."}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <AnimatePresence>
                  {filtered.map((app, i) => (
                    <motion.div key={app.number}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => loadReport(app)}
                      className={`border rounded-xl px-5 py-3.5 cursor-pointer transition-all hover:shadow-sm ${
                        selectedApp?.number === app.number
                          ? "border-stone-400 bg-stone-50"
                          : "border-stone-150 bg-white hover:border-stone-300"
                      }`}
                      style={{ borderColor: selectedApp?.number === app.number ? "#A8A29E" : "#F0EDEC" }}>
                      <div className="flex items-center gap-3">
                        <GradeBadge score={app.score} />
                        <div className="flex-1 min-w-0">
                          {/* Row 1: role (truncates) + company (always visible) */}
                          <div className="flex items-baseline gap-2 mb-1.5">
                            <span className="font-medium text-stone-900 text-sm truncate min-w-0">{app.role}</span>
                            <span className="text-stone-400 text-sm flex-shrink-0 whitespace-nowrap">{app.company}</span>
                          </div>
                          {/* Row 2: status pill + date + score bar on same line */}
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="flex-shrink-0"><StatusPill status={app.status} /></div>
                            <span className="text-stone-300 text-xs flex-shrink-0">{app.date}</span>
                            {app.hasPDF && (
                              <span className="text-xs text-emerald-500 flex items-center gap-0.5 flex-shrink-0">
                                <FileText size={10} />PDF
                              </span>
                            )}
                            {app.score && (
                              <div className="flex-1 min-w-0 ml-1">
                                <ScoreBar score={app.score} max={5} />
                              </div>
                            )}
                          </div>
                        </div>
                        <ChevronRight size={16} className={`text-stone-300 flex-shrink-0 transition-transform ${
                          selectedApp?.number === app.number ? "rotate-90" : ""
                        }`} />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}

        {/* STORIES TAB */}
        {tab === "stories" && (
          <div>
            <h2 className="text-lg font-semibold text-stone-900 mb-4"
              style={{ fontFamily: "Playfair Display" }}>
              STAR Story Bank
            </h2>
            {storyBank ? (
              <pre className="whitespace-pre-wrap font-sans text-sm text-stone-700 leading-relaxed bg-stone-50 p-6 rounded-xl border border-stone-100">
                {storyBank}
              </pre>
            ) : (
              <div className="text-center py-20">
                <BookOpen size={32} className="text-stone-200 mx-auto mb-3" />
                <p className="text-stone-400 text-sm">No stories yet.</p>
                <p className="text-stone-300 text-xs mt-1">Run /career-ops evaluations to build your story bank.</p>
              </div>
            )}
          </div>
        )}

        {/* STATS TAB */}
        {tab === "stats" && stats && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-stone-900" style={{ fontFamily: "Playfair Display" }}>
              Pipeline Statistics
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(stats.byStatus).sort((a, b) => b[1] - a[1]).map(([status, count]) => {
                const s = STATUSES.find(x => x.id === status) || { label: status, color: "#6B7280", bg: "#F3F4F6" }
                return (
                  <div key={status} className="border border-stone-100 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                      <span className="text-sm text-stone-700 capitalize">{s.label}</span>
                    </div>
                    <span className="text-xl font-bold text-stone-900"
                      style={{ fontFamily: "Playfair Display" }}>{count}</span>
                  </div>
                )
              })}
            </div>
            <div className="bg-stone-50 rounded-xl p-5 border border-stone-100">
              <div className="text-sm text-stone-500 mb-1">Average match score</div>
              <div className="text-3xl font-bold text-stone-900" style={{ fontFamily: "Playfair Display" }}>
                {stats.avgScore || "—"}<span className="text-base text-stone-400 font-normal">/5</span>
              </div>
              <div className="text-xs text-stone-400 mt-1">{stats.withPDF} applications with PDF generated</div>
            </div>
          </div>
        )}
      </main>

      {/* Live evaluation panel */}
      <AnimatePresence>
        {evaluation && (
          <EvaluationPanel
            evaluation={evaluation}
            editedSummary={editedSummary}       setEditedSummary={setEditedSummary}
            editedBullets={editedBullets}       setEditedBullets={setEditedBullets}
            editedCoverNote={editedCoverNote}   setEditedCoverNote={setEditedCoverNote}
            onClose={() => { setEvaluation(null); setEvalError("") }}
          />
        )}
      </AnimatePresence>

      {/* Career-ops report panel */}
      <AnimatePresence>
        {selectedApp && (
          <ReportPanel
            app={selectedApp}
            report={reportLoading ? null : selectedReport}
            onClose={() => { setSelectedApp(null); setSelectedReport(null) }}
            onStatusChange={handleStatusChange}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
