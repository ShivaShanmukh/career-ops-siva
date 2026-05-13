# Story Bank — Master STAR+R Stories

This file accumulates your best interview stories over time. Each evaluation (Block F) adds new stories here. Instead of memorizing 100 answers, maintain 5-10 deep stories that you can bend to answer almost any behavioral question.

## How it works

1. Every time `/career-ops oferta` generates Block F (Interview Plan), new STAR+R stories get appended here
2. Before your next interview, review this file — your stories are already organized by theme
3. The "Big Three" questions can be answered with stories from this bank:
   - "Tell me about yourself" → combine 2-3 stories into a narrative
   - "Tell me about your most impactful project" → pick your highest-impact story
   - "Tell me about a conflict you resolved" → find a story with a Reflection

## Stories

<!-- Stories will be added here as you evaluate offers -->
<!-- Format:
### [Theme] Story Title
**Source:** Report #NNN — Company — Role
**S (Situation):** ...
**T (Task):** ...
**A (Action):** ...
**R (Result):** ...
**Reflection:** What I learned / what I'd do differently
**Best for questions about:** [list of question types this story answers]
-->

### [Delivery] Big Breathing Adventure — NHS Children's Platform
**Source:** Report #001 — Amazon Brand Innovation Lab — Visual Designer
**S:** Voices of Hope UK commissioned a motion-rich interactive wellbeing platform for children at Cambridge University Hospitals. No existing codebase, no team — just a brief.
**T:** Sole developer and designer. Ship from brief to production in 6 weeks, WCAG-compliant, ready for daily NHS clinical use.
**A:** Designed the full interaction language, motion states, and visual system in Figma, then built it in Next.js/React. Ran accessibility checks throughout, not as a final audit.
**R:** 100–200 children use it daily alongside NHS clinicians and parents. Shipped on time.
**Reflection:** Would have run user tests with children earlier — motion had to be revised mid-build when we saw real reactions. Learned that with vulnerable users, motion feedback is content, not decoration.
**Best for questions about:** fast delivery, solo ownership, design-to-code, stakeholder trust, accessibility, healthcare tech

### [Brand / Client] PwC Enterprise Brand Delivery
**Source:** Report #001 — Amazon Brand Innovation Lab — Visual Designer
**S:** Design Associate at PwC, delivering brand experiences for C-suite clients across financial services, healthcare, and consulting simultaneously — 10+ concurrent enterprise accounts.
**T:** Zero-defect delivery under tight enterprise timelines; no room for revision cycles with C-suite stakeholders.
**A:** Built repeatable delivery system for motion campaigns, visual identities, and brand systems. Applied brand constraints as creative tools, not blockers.
**R:** Zero defects across all accounts. Awarded PwC Digital Acumen badge for applied knowledge of digital technologies.
**Reflection:** Enterprise brand work taught me that constraints (brand guidelines, legal reviews, sign-off chains) are design tools — they create the creative problem worth solving.
**Best for questions about:** quality under pressure, client management, brand systems, enterprise delivery, professionalism

### [GenAI / Innovation] Generative Brand Studio Pipeline
**Source:** Report #001 — Amazon Brand Innovation Lab — Visual Designer
**S:** Client needed an automated pipeline to generate brand assets (image, voice, video) without a production team for every output.
**T:** Integrate disparate GenAI APIs into a single coherent, live product — no existing template for this.
**A:** Built n8n orchestration workflow connecting fal.ai (image), ElevenLabs (voice), and Replicate (model swapping) via REST APIs; assembled into a live React UI deployed on Railway.
**R:** Live, deployed, generating brand media end-to-end. Demonstrated that a single engineer can replace a multi-vendor production workflow.
**Reflection:** GenAI pipelines need human review gates built in from day one — raw model output quality is inconsistent. Validation steps are not optional; they are the product.
**Best for questions about:** GenAI, creative automation, pipeline design, rapid prototyping, innovation, tool integration

### [Stakeholder / Scale] Caarya — 15 Simultaneous Client AI Deployments
**Source:** Report #001 — Amazon Brand Innovation Lab — Visual Designer
**S:** Early-stage AI startup with 15 simultaneous startup clients across AI, health, and food sectors. Each had different AI literacy levels and different use cases.
**T:** Design, iterate, and deliver LLM-powered workflows and evaluation frameworks across all 15 — no dedicated PM, no playbook.
**A:** Built repeatable evaluation frameworks, reusable prompt playbooks, and knowledge bases adopted across 3 internal teams. Trained 50+ practitioners on effective LLM usage.
**R:** Reduced client iteration cycles by ~35%. Built a practitioner training programme that scaled beyond individual sessions.
**Reflection:** Would have templated onboarding from week one — documentation scales where meetings don't. The playbook I built in month 3 should have existed in week 1.
**Best for questions about:** client management, AI training, stakeholder communication, scaling, knowledge management, working without a PM

---

## Story 6: Architect Prototype — Shipping Proof-of-Work Before the Interview
**Context:** Architect (tryarchitect.com) Design Engineer application
**S:** Found the Design Engineer role at Architect — noticed their Before/After comparison section could be rebuilt with stronger motion and interaction.
**T:** Build a live, deployed prototype in their exact stack (React + Tailwind + Framer Motion) and submit it as proof of work alongside the application.
**A:** Built and deployed the prototype on Railway. Redesigned the Before/After UI with custom animation and interaction — live at architect-prototype-production.up.railway.app.
**R:** Prototype is still live and functional. The project appears in the CV as "Architect Prototype — Design Engineer Demo."
**Reflection:** Shipping is always more persuasive than describing. If you can show the work before the interview, you've already won the first round.
**Best for questions about:** initiative, design craft, motivation, proof-of-work culture, frontend engineering

---

## Story 7: Big Breathing Adventure — NHS Platform Solo, 6 Weeks Brief-to-Production
**Context:** Voices of Hope UK / Cambridge University Hospitals
**S:** Cambridge University Hospitals needed a motion-rich, interactive children's wellbeing platform. No existing codebase, tight timeline.
**T:** Design and ship a production-ready Next.js platform as sole developer, WCAG-compliant, serving children aged 5–12 alongside NHS clinicians.
**A:** Designed interaction flows, motion states, and visual language. Built in Next.js/React. Implemented WCAG accessibility from the start. Shipped from brief to production in 6 weeks.
**R:** 100–200 children and NHS clinicians using the platform daily at Cambridge University Hospitals.
**Reflection:** Speed and quality are not in conflict when you own the full stack. The constraint of "6 weeks, solo" forced prioritisation, not compromise.
**Best for questions about:** fast delivery, frontend engineering, accessibility, healthcare/regulated environments, solo ownership
