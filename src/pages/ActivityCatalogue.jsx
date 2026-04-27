import React, { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  GraduationCap, Search, Clock, CalendarDays, User, Plus, Check,
  X, BookOpen, ListChecks, Zap, ChevronRight, Trash2, CheckCircle2,
  Circle, RotateCcw, Users, Layers, Mail, Send,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { recordAdd, recordRemove, recordComplete, recordUncomplete, recordPathApplied, recordDetailView, recordSearch, recordFilterUsed, recordEmailSent } from "@/lib/enablement-stats";

// ─── Activity Data ────────────────────────────────────────────────────────────

const ACTIVITIES = [
  {
    id: "ACT-001", name: "Awareness Workshop",
    format: "Live / Facilitated", formatGroup: "live",
    audienceTier: "Tier 0", tierNums: [0],
    duration: "2 hours", frequency: "Per team onboard", owner: "Platform Architect",
    purpose: "Introduce the automation platform to teams who have had no prior exposure. Create informed stakeholders, not technical practitioners.",
    content: ["Why automation matters to the organization", "What the platform does and does NOT do", "How to get started", "Where to get help"],
    facilitator: "Platform Architect or Enablement Lead",
    successCriteria: "Attendees can describe the platform purpose and identify one use case relevant to their team.",
    materials: ["Slide deck", "Platform demo (read-only)", "FAQ document", "Next-steps guide"],
    scheduling: "Triggered by new team onboarding or organisational change. Run regionally to accommodate time zones.",
  },
  {
    id: "ACT-002", name: "Foundation Skills Workshop",
    format: "Live / Hands-on", formatGroup: "live",
    audienceTier: "Tier 0 → Tier 1", tierNums: [0, 1],
    duration: "Half-day (3.5 hrs)", frequency: "Monthly", owner: "Enablement Lead",
    purpose: "Build hands-on confidence with the platform for teams progressing from Tier 0 to Tier 1. The first time participants touch the platform in a structured, supported environment. No engineer is expected to author automation for production before completing this workshop.",
    content: ["Platform navigation and concepts", "Completing the operator header template", "Building a first automation from a template", "Understanding scope control and input validation", "Running and interpreting results", "Backout design basics", "Where to find patterns and examples"],
    facilitator: "Enablement Lead + Platform Engineer (pair facilitation recommended)",
    successCriteria: "Each participant completes a working automation in the sandbox with a correct operator header before leaving the session.",
    materials: ["Lab guide", "Sandbox environment access", "Curated template library", "Troubleshooting FAQ", "Operator header template"],
    scheduling: "Monthly. Register via self-service calendar. Maximum 15 participants per session.",
    followUp: "Automated email 48 hours post-session with lab guide, Office Hours schedule, and Onboarding Pathway link. COE Member assigned for First Asset Coaching Engagement (ACT-016).",
  },
  {
    id: "ACT-003", name: "Advanced Workshop",
    format: "Live / Hands-on", formatGroup: "live",
    audienceTier: "Tier 1 → Tier 2", tierNums: [1, 2],
    duration: "Full day (6 hrs)", frequency: "Quarterly", owner: "Senior Engineer",
    purpose: "Elevate Tier 1 practitioners to Tier 2 by introducing complex patterns, architecture decisions, and production-readiness standards.",
    content: ["Idempotency and error handling design", "The 7-stage backout pattern in depth", "Secrets management and security patterns", "Performance and scalability considerations", "Structuring automations for maintainability", "Contributing patterns to the shared library", "Code review standards"],
    facilitator: "Senior Engineer or Architect",
    successCriteria: "Each participant leaves with a reviewed, production-ready design for their real use case.",
    scheduling: "Quarterly. Cohort model — participants apply with a use case. Maximum 10 participants.",
  },
  {
    id: "ACT-004", name: "Code Review Sessions",
    format: "Live / Structured", formatGroup: "live",
    audienceTier: "Tier 1–2", tierNums: [1, 2],
    duration: "1 hour", frequency: "Bi-weekly", owner: "Platform Engineer",
    purpose: "Provide structured, blameless peer review of automation code before it progresses to production. Build quality habits and transfer knowledge through direct feedback.",
    content: ["Operator header completeness", "Scope control and input validation", "Idempotency", "Error handling and failure classification", "Backout mechanism and test evidence", "Credential usage", "Naming conventions and logging standards", "Documentation and test coverage"],
    facilitator: "Certified reviewer (ACT-018). Must never be the automation author.",
    successCriteria: "Written feedback in source control. Approved automations tagged for production promotion.",
    scheduling: "Bi-weekly standing slot. Teams book their automation into the slot via shared calendar.",
    note: "Blameless standard: reviews are about the code, not the person. Every review ends with actionable, achievable feedback.",
  },
  {
    id: "ACT-005", name: "Office Hours",
    format: "Live / Open", formatGroup: "live",
    audienceTier: "All Tiers", tierNums: [0, 1, 2, 3],
    duration: "1 hour", frequency: "Weekly", owner: "Rotating Engineer",
    purpose: "Provide an open, low-friction channel for teams to get unblocked on automation problems without needing to schedule a formal session. The most important recurring activity for sustained adoption.",
    content: ["Open video call — drop-in, no agenda", "First-come, first-served", "No advance preparation required", "Bring your screen, your code, or just your question"],
    facilitator: "Rotating Platform Engineer. Rota published monthly. At least one senior engineer per slot.",
    successCriteria: "Attendance trend, unblock rate, repeat attendance.",
    scheduling: "Weekly. Fixed time slot. At least two time slots to accommodate global time zones.",
    note: "Every question logged by topic and frequency. Questions from 3+ different teams in a quarter trigger a COE review item.",
  },
  {
    id: "ACT-006", name: "Lunch & Learn",
    format: "Live / Informal", formatGroup: "live",
    audienceTier: "Tier 0–1", tierNums: [0, 1],
    duration: "45–60 min", frequency: "Bi-weekly", owner: "Any contributor",
    purpose: "Share knowledge informally — new platform features, real team success stories, lessons learned from incidents, emerging patterns — without the formality of a workshop.",
    content: ["30-minute talk + 15-minute Q&A", "New platform feature walkthroughs", "Team success stories and lessons learned", "Incident retrospectives and emerging patterns"],
    facilitator: "Any team member — platform engineers, consuming team engineers, security, or operations.",
    successCriteria: "Cross-team attendance. Recordings published within 24 hours to Demo Library (ACT-014).",
    scheduling: "Bi-weekly. Topics sourced from a public backlog anyone can add to.",
    note: "Lunch & Learns from consuming teams — not the platform team — are the most credible content.",
  },
  {
    id: "ACT-007", name: "Squad Embed / Pairing",
    format: "In-team / 1:1", formatGroup: "inteam",
    audienceTier: "Tier 1–2", tierNums: [1, 2],
    duration: "1–2 days", frequency: "On-demand", owner: "Platform Engineer",
    purpose: "Accelerate a specific team's adoption by embedding a platform engineer directly into their workflow for a defined period. Highest-touch, highest-impact activity for teams that are blocked or moving slowly.",
    content: ["Platform engineer works alongside the team on real automation work", "Pair programming model — team owns and understands everything built", "Not a training session — collaborative delivery"],
    facilitator: "Platform Engineer matched to the team's technology domain where possible.",
    successCriteria: "At the end of the embed, the team should own and understand everything built.",
    scheduling: "On-demand via request form. 2-week lead time. Maximum 2 embeds per platform engineer per sprint.",
    eligibility: "Team has completed Foundation Workshop (ACT-002) and has a specific automation objective for the embed period.",
  },
  {
    id: "ACT-008", name: "Hackathon / Build Day",
    format: "Live / Collaborative", formatGroup: "live",
    audienceTier: "Tier 1–3", tierNums: [1, 2, 3],
    duration: "Full day (6–8 hrs)", frequency: "Semi-annual", owner: "CoP Lead",
    purpose: "Create space for creative exploration, cross-team learning, and accelerated development of new automation use cases. Signals organizational commitment to the enablement programme.",
    content: ["Teams form around a problem and build for a defined period", "Judging criteria reward creativity, reusability, and documentation quality", "Winning automations published to shared pattern library with full attribution", "Cross-functional teams encouraged — pair engineers with operations or business stakeholders"],
    facilitator: "CoP Lead",
    successCriteria: "Published automations, documented patterns, identified use case pipeline, and community energy.",
    scheduling: "Semi-annual. Aligned to programme milestones.",
  },
  {
    id: "ACT-009", name: "Community of Practice (CoP)",
    format: "Live / Community", formatGroup: "live",
    audienceTier: "Tier 2–3", tierNums: [2, 3],
    duration: "1 hour", frequency: "Monthly", owner: "Champion Network",
    purpose: "Sustain momentum beyond the platform team by building a self-organizing practitioner community. The CoP is the long-term engine of the enablement programme.",
    content: ["Platform updates (10 min): new features, deprecations, security advisories", "Team showcase (20 min): one team presents a recently completed automation", "Pattern review (15 min): review of a submitted pattern for shared library inclusion", "Open discussion + retro (15 min): pain points, feature requests, cross-team coordination"],
    facilitator: "Elected CoP Lead from champion network. Platform team attends but does not chair after Month 3.",
    successCriteria: "Consistent attendance from champions. Action items completed between sessions.",
    scheduling: "Monthly. Invitation-based for champions; open attendance for Tier 1 observers.",
  },
  {
    id: "ACT-010", name: "ADR / Design Clinic",
    format: "Live / Advisory", formatGroup: "live",
    audienceTier: "Tier 2–3", tierNums: [2, 3],
    duration: "1–2 hours", frequency: "On-demand", owner: "Architect",
    purpose: "Provide architectural guidance for teams designing complex automations before they build. Prevents costly rework by catching design problems at the whiteboard stage.",
    content: ["Team presents their proposed design", "Architect(s) review against platform standards, security requirements, and operational patterns", "Written design feedback and ADR recommendations produced"],
    facilitator: "Platform Architect. Security Architect invited where credential, network, or data classification concerns exist.",
    successCriteria: "Written design feedback, list of ADRs the team should produce, and a recommended approach for unresolved decisions.",
    scheduling: "On-demand. Teams submit a brief design brief 48 hours in advance to allow preparation.",
  },
  {
    id: "ACT-011", name: "Onboarding Pathway",
    format: "Async / Self-paced", formatGroup: "async",
    audienceTier: "All Tiers", tierNums: [0, 1, 2, 3],
    duration: "4–8 hours", frequency: "Per new joiner", owner: "Enablement Lead",
    purpose: "Provide a structured, self-paced entry point for new joiners so they can reach productive contribution without consuming disproportionate facilitation time.",
    content: ["Module 1: Platform Overview (30 min) — recorded", "Module 2: First Automation Lab (2 hours) — guided lab in sandbox", "Module 3: Standards & Patterns (1 hour) — written guide + self-check quiz", "Module 4: Security & Credentials Essentials (1 hour) — recorded + checklist", "Module 5: Where to Get Help (15 min) — Office Hours, CoP, escalation paths"],
    facilitator: "Self-paced. Buddy from champion network assigned for support.",
    successCriteria: "Pathway completion recorded in enablement tracker. Manager notified on completion.",
    scheduling: "Triggered automatically on team onboarding. Designed to be completed over the first 2 weeks.",
  },
  {
    id: "ACT-012", name: "Pattern Library Review",
    format: "Async / Structured", formatGroup: "async",
    audienceTier: "Tier 2–3", tierNums: [2, 3],
    duration: "Ongoing", frequency: "Continuous", owner: "Platform Engineer",
    purpose: "Continuously grow the shared automation pattern library through structured contribution and review. Prevents duplicate work and elevates code quality across the organization.",
    content: ["Async pull request review process", "Contributors submit patterns; reviewers from platform team and CoP approve", "Pattern must include: description, use case, prerequisites, code, tested examples, known limitations, and author attribution"],
    facilitator: "Platform team and CoP reviewers.",
    successCriteria: "Initial review within 5 business days. Feedback actioned by contributor within 10 business days.",
    scheduling: "Continuous. Contribution is expected of all Tier 3 engineers.",
  },
  {
    id: "ACT-013", name: "Newsletter / Digest",
    format: "Async / Broadcast", formatGroup: "async",
    audienceTier: "All Tiers", tierNums: [0, 1, 2, 3],
    duration: "5 min read", frequency: "Bi-weekly", owner: "Comms Lead",
    purpose: "Maintain ambient awareness of the automation programme across the organization without requiring active participation.",
    content: ["Platform updates", "Upcoming enablement events", "Pattern of the fortnight", "Team spotlight", "Tip of the week"],
    facilitator: "Comms Lead or designated Enablement team member.",
    successCriteria: "Open rate, team story submissions, event registrations driven by digest.",
    scheduling: "Bi-weekly. Curated email or intranet digest — short, scannable, opinionated.",
  },
  {
    id: "ACT-014", name: "Recorded Demo Library",
    format: "Async / On-demand", formatGroup: "async",
    audienceTier: "All Tiers", tierNums: [0, 1, 2, 3],
    duration: "Varies", frequency: "Evergreen", owner: "Any contributor",
    purpose: "Provide an always-available, searchable library of demonstrations, walkthroughs, and how-to recordings.",
    content: ["Captured Lunch & Learns", "Purpose-built walkthroughs", "Office Hours recordings (with consent)", "Workshop recordings"],
    facilitator: "Any contributor.",
    successCriteria: "Content tagged by tier level, use case type, platform component, and team. Quarterly review to flag outdated content.",
    scheduling: "Evergreen. Platform version-stamped on all recordings. Hosted on internal platform.",
  },
  {
    id: "ACT-015", name: "Certification Study Group",
    format: "Live + Async", formatGroup: "live",
    audienceTier: "Tier 2–3", tierNums: [2, 3],
    duration: "6–8 weeks", frequency: "Per cohort", owner: "Champion Network",
    purpose: "Support engineers pursuing formal vendor certification relevant to the automation platform. Signals organizational investment in individual growth.",
    content: ["Weekly 1-hour group study session + peer accountability", "Study guide and practice exam access", "Exam fee sponsorship where applicable", "Dedicated study time allocation"],
    facilitator: "Champion Network.",
    successCriteria: "Cohort completion rate. Certification pass rate.",
    scheduling: "Per cohort, driven by demand. Minimum 4 participants. Managerial endorsement required.",
  },
  {
    id: "ACT-016", name: "First Asset Coaching Engagement",
    format: "In-team / 1:1", formatGroup: "inteam",
    audienceTier: "Tier 1", tierNums: [1],
    duration: "1–2 weeks", frequency: "Once per team", owner: "COE Member",
    purpose: "The first new automation asset an engineer builds after the Foundation Workshop is built as a coached engagement. Without it, theory does not reliably transfer to production quality.",
    content: ["COE engineer attends design session and surfaces unstated assumptions", "Reviews the operator header with the author before any code is written", "Attends the test cycle and helps design failure scenarios", "Reviews the draft pull request with the author — explaining why each checklist item matters", "Does NOT write the automation — the author owns every decision and every line of code"],
    facilitator: "COE Member.",
    successCriteria: "Author owns every decision and every line of code. Automation passes code review on first attempt.",
    scheduling: "Triggered automatically after Foundation Workshop completion. 2-week lead time. Request via COE support channel.",
    note: "Every team receives one coaching engagement. Additional engagements available for complex or unusual scenarios.",
  },
  {
    id: "ACT-017", name: "Legacy Classification Sprint",
    format: "Facilitated / Async", formatGroup: "inteam",
    audienceTier: "All Tiers", tierNums: [0, 1, 2, 3],
    duration: "1 sprint (~2 weeks)", frequency: "Once per team", owner: "Domain Lead + COE",
    purpose: "Every team has automation that predates current standards. The sprint surfaces it, assesses its risk, and creates a structured path to remediation rather than leaving it as invisible technical debt.",
    content: ["Every automation asset catalogued with an entry and an owner", "Each asset classified: Compliant, Legacy, or Non-Compliant", "Risk tier assigned to each Legacy or Non-Compliant asset (High, Medium, Low)", "Remediation plan created for every non-compliant asset", "Exception requests raised for assets that cannot be remediated within the standard grace period"],
    facilitator: "Domain Lead + COE. COE provides classification template and facilitation for Maturity Level 1 and 2 teams.",
    successCriteria: "Complete automation catalogue with owners, classifications, risk tiers, and remediation plans.",
    scheduling: "Concurrent with Steps 3–4 of team onboarding journey (Weeks 2–6 after Foundation Workshop). Mandatory before Phase 2 compliance gates.",
    note: "The classification sprint is not an audit. No findings are reported to management as individual performance indicators.",
  },
  {
    id: "ACT-018", name: "Reviewer Certification",
    format: "Live / Structured", formatGroup: "live",
    audienceTier: "Tier 2–3", tierNums: [2, 3],
    duration: "Half-day (~3 hrs)", frequency: "Per candidate", owner: "COE Member",
    purpose: "A team cannot approve its own automation submissions for production promotion until at least one certified reviewer is in place. Reviewer certification gives the domain lead the authority to fulfil the Automation Reviewer role.",
    content: ["Module 1: The Reviewer's Role — accountability, authority, obligation to give actionable feedback (45 min)", "Module 2: Applying the Review Checklists — each checklist question; common borderline cases (60 min)", "Module 3: Assessing Test Evidence — sufficient evidence; idempotency verification; environmental parity (45 min)", "Module 4: Giving Effective Feedback — writing feedback that explains the gap; practice review on a sample submission (30 min)"],
    facilitator: "COE Enablement Lead.",
    successCriteria: "Reviewers entered in COE reviewer register. Certification renewed annually.",
    scheduling: "On-demand via COE enablement lead. Run for individuals or small groups (2–4 candidates). 1-week lead time.",
  },
];

// ─── Suggested Paths ──────────────────────────────────────────────────────────

const SUGGESTED_PATHS = [
  {
    id: "new-joiner",
    label: "New Joiner Essentials",
    description: "Structured entry path for teams new to the platform",
    tier: "Tier 0 → 1",
    activityIds: ["ACT-011", "ACT-001", "ACT-002", "ACT-005", "ACT-006", "ACT-016", "ACT-017"],
    color: "text-chart-2 bg-chart-2/10 border-chart-2/20",
  },
  {
    id: "practitioner",
    label: "Practitioner Path",
    description: "Advance from hands-on producer to confident practitioner",
    tier: "Tier 1 → 2",
    activityIds: ["ACT-003", "ACT-004", "ACT-007", "ACT-008", "ACT-009", "ACT-010"],
    color: "text-primary bg-primary/10 border-primary/20",
  },
  {
    id: "expert",
    label: "Expert & Champion Path",
    description: "Community leadership, pattern contribution, and certification",
    tier: "Tier 2 → 3",
    activityIds: ["ACT-009", "ACT-010", "ACT-012", "ACT-015", "ACT-018"],
    color: "text-chart-5 bg-chart-5/10 border-chart-5/20",
  },
  {
    id: "full",
    label: "Full Programme",
    description: "All 18 activities across the complete enablement programme",
    tier: "All Tiers",
    activityIds: ACTIVITIES.map(a => a.id),
    color: "text-warning bg-warning/10 border-warning/20",
  },
];

// ─── Email Body Builder ─────────────────────────────────────────────────────

function buildEmailBody(activities, completedIds) {
  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const completedCount = activities.filter(a => completedIds.includes(a.id)).length;

  const lines = [
    "MY ENABLEMENT CURRICULUM",
    "========================",
    `Generated: ${date}`,
    `Activities: ${activities.length} selected | ${completedCount} completed`,
    "",
    "─────────────────────────────────────────────────────",
    "",
  ];

  activities.forEach((a, i) => {
    const done = completedIds.includes(a.id) ? " [COMPLETED]" : "";
    lines.push(`${i + 1}. ${a.id}: ${a.name}${done}`);
    lines.push(`   Format:    ${a.format}`);
    lines.push(`   Audience:  ${a.audienceTier}`);
    lines.push(`   Duration:  ${a.duration}`);
    lines.push(`   Frequency: ${a.frequency}`);
    lines.push(`   Owner:     ${a.owner}`);
    lines.push(`   Purpose:   ${a.purpose}`);
    if (a.successCriteria) lines.push(`   Success:   ${a.successCriteria}`);
    if (a.scheduling) lines.push(`   Scheduling: ${a.scheduling}`);
    lines.push("");
  });

  lines.push("─────────────────────────────────────────────────────");
  lines.push("Generated by Automation Enablement Studio");

  return lines.join("\n");
}

// ─── Email Dialog ─────────────────────────────────────────────────────────────

function EmailCurriculumDialog({ open, onClose, activities, completedIds }) {
  const [email, setEmail] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleSend = () => {
    const trimmed = email.trim();
    if (!trimmed) { setError("Please enter an email address."); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) { setError("Please enter a valid email address."); return; }

    const subject = encodeURIComponent("My Enablement Curriculum");
    const body = encodeURIComponent(buildEmailBody(activities, completedIds));
    window.location.href = `mailto:${encodeURIComponent(trimmed)}?subject=${subject}&body=${body}`;
    recordEmailSent(activities.length);
    setSent(true);
    setError("");
  };

  const handleClose = () => {
    setEmail("");
    setSent(false);
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Email Curriculum
          </DialogTitle>
          <DialogDescription>
            Enter your email address. Your default email client will open pre-filled with your full curriculum so you can send it to yourself or a colleague.
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="py-6 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-chart-2/10 flex items-center justify-center">
              <Send className="w-6 h-6 text-chart-2" />
            </div>
            <p className="font-medium">Email client opened</p>
            <p className="text-sm text-muted-foreground">
              Your email client should have opened with the curriculum pre-filled and addressed to <strong>{email}</strong>. Hit send when ready.
            </p>
            <Button variant="outline" size="sm" onClick={() => setSent(false)}>Send to another address</Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="curriculum-email">Email address</Label>
              <Input
                id="curriculum-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                autoFocus
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>

            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Curriculum summary</p>
              <p className="text-sm">{activities.length} activities</p>
              <ul className="text-xs text-muted-foreground space-y-0.5 mt-1">
                {activities.map(a => (
                  <li key={a.id} className="flex items-center gap-1.5">
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full flex-shrink-0",
                      a.formatGroup === "live" ? "bg-blue-400" : a.formatGroup === "async" ? "bg-violet-400" : "bg-amber-400"
                    )} />
                    <span className="font-mono">{a.id}</span> {a.name}
                    {completedIds.includes(a.id) && <Check className="w-3 h-3 text-chart-2 ml-auto" />}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {!sent && (
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            <Button onClick={handleSend} className="gap-2">
              <Mail className="w-4 h-4" />
              Open Email Client
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FORMAT_GROUP_STYLES = {
  live:   { bg: "bg-blue-50 text-blue-700 border-blue-200",   dot: "bg-blue-500",   label: "Live" },
  async:  { bg: "bg-violet-50 text-violet-700 border-violet-200", dot: "bg-violet-500", label: "Async" },
  inteam: { bg: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500",  label: "In-Team" },
};

const TIER_FILTER_OPTIONS = [
  { value: "all",  label: "All Tiers" },
  { value: "0",    label: "Tier 0" },
  { value: "1",    label: "Tier 1" },
  { value: "2",    label: "Tier 2" },
  { value: "3",    label: "Tier 3" },
];

const FORMAT_FILTER_OPTIONS = [
  { value: "all",    label: "All Formats" },
  { value: "live",   label: "Live" },
  { value: "async",  label: "Async" },
  { value: "inteam", label: "In-Team" },
];

function FormatBadge({ group, className }) {
  const s = FORMAT_GROUP_STYLES[group] ?? FORMAT_GROUP_STYLES.live;
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border", s.bg, className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", s.dot)} />
      {s.label}
    </span>
  );
}

// ─── Activity Card ────────────────────────────────────────────────────────────

function ActivityCard({ activity, isSelected, onSelect, onViewDetail }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          "group hover:shadow-md transition-all duration-200 cursor-pointer border-l-4",
          activity.formatGroup === "live"   && "border-l-blue-400",
          activity.formatGroup === "async"  && "border-l-violet-400",
          activity.formatGroup === "inteam" && "border-l-amber-400",
          isSelected && "ring-2 ring-primary/30 bg-primary/5",
        )}
        onClick={() => onViewDetail(activity)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-[11px] font-mono font-semibold text-muted-foreground">{activity.id}</span>
                <FormatBadge group={activity.formatGroup} />
              </div>
              <h3 className="text-sm font-semibold leading-tight truncate group-hover:text-primary transition-colors">
                {activity.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{activity.purpose}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onSelect(activity.id); }}
              className={cn(
                "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-200 mt-0.5",
                isSelected
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary hover:text-primary"
              )}
              title={isSelected ? "Remove from curriculum" : "Add to curriculum"}
            >
              {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {activity.duration}
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays className="w-3 h-3" /> {activity.frequency}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" /> {activity.audienceTier}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Activity Detail Sheet ────────────────────────────────────────────────────

function ActivityDetailSheet({ activity, isSelected, onSelect, onClose }) {
  if (!activity) return null;
  const s = FORMAT_GROUP_STYLES[activity.formatGroup] ?? FORMAT_GROUP_STYLES.live;

  return (
    <Sheet open={!!activity} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs font-mono font-bold text-muted-foreground">{activity.id}</span>
                <FormatBadge group={activity.formatGroup} />
              </div>
              <SheetTitle className="text-xl font-bold leading-tight">{activity.name}</SheetTitle>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Purpose */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Purpose</h4>
              <p className="text-sm leading-relaxed">{activity.purpose}</p>
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Format",    value: activity.format },
                { label: "Audience",  value: activity.audienceTier },
                { label: "Duration",  value: activity.duration },
                { label: "Frequency", value: activity.frequency },
                { label: "Owner",     value: activity.owner },
              ].map(({ label, value }) => (
                <div key={label} className="bg-muted/50 rounded-lg p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
                  <p className="text-sm font-medium">{value}</p>
                </div>
              ))}
            </div>

            <Separator />

            {/* Content / Agenda */}
            {activity.content?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Content / Agenda</h4>
                <ul className="space-y-1.5">
                  {activity.content.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-0.5 flex-shrink-0">▸</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Facilitator */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Facilitator</h4>
              <p className="text-sm">{activity.facilitator}</p>
            </div>

            {/* Success Criteria */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Success Criteria</h4>
              <p className="text-sm">{activity.successCriteria}</p>
            </div>

            {/* Materials */}
            {activity.materials?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Materials Needed</h4>
                <ul className="space-y-1">
                  {activity.materials.map((m, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-muted-foreground flex-shrink-0" /> {m}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Scheduling */}
            {activity.scheduling && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Scheduling Guidance</h4>
                <p className="text-sm">{activity.scheduling}</p>
              </div>
            )}

            {/* Optional fields */}
            {activity.followUp && (
              <div className="bg-chart-2/10 border border-chart-2/20 rounded-lg p-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-chart-2 mb-1">Follow-up</h4>
                <p className="text-sm">{activity.followUp}</p>
              </div>
            )}
            {activity.eligibility && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">Eligibility</h4>
                <p className="text-sm">{activity.eligibility}</p>
              </div>
            )}
            {activity.note && (
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-warning mb-1">Note</h4>
                <p className="text-sm">{activity.note}</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer action */}
        <div className="p-4 border-t bg-muted/30">
          <Button
            onClick={() => { onSelect(activity.id); onClose(); }}
            className="w-full"
            variant={isSelected ? "outline" : "default"}
          >
            {isSelected ? (
              <><Trash2 className="w-4 h-4 mr-2" /> Remove from Curriculum</>
            ) : (
              <><Plus className="w-4 h-4 mr-2" /> Add to Curriculum</>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Curriculum View ──────────────────────────────────────────────────────────

function CurriculumView({ selectedIds, completedIds, onToggleComplete, onRemove, onClear, onViewDetail, onEmail }) {
  const selectedActivities = ACTIVITIES.filter(a => selectedIds.includes(a.id));
  const completedCount = selectedActivities.filter(a => completedIds.includes(a.id)).length;

  if (selectedActivities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
        <BookOpen className="w-12 h-12 mb-4 opacity-30" />
        <p className="font-medium">No activities selected yet</p>
        <p className="text-sm mt-1">Go to the Catalogue tab and add activities to build your curriculum path.</p>
      </div>
    );
  }

  const liveCount  = selectedActivities.filter(a => a.formatGroup === "live").length;
  const asyncCount = selectedActivities.filter(a => a.formatGroup === "async").length;
  const inteamCount = selectedActivities.filter(a => a.formatGroup === "inteam").length;

  return (
    <div className="space-y-6">
      {/* Progress summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{selectedActivities.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Activities</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-chart-2">{completedCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">
              {selectedActivities.length > 0 ? Math.round((completedCount / selectedActivities.length) * 100) : 0}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              {liveCount > 0 && <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">{liveCount} Live</span>}
              {asyncCount > 0 && <span className="text-[10px] font-medium text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded">{asyncCount} Async</span>}
              {inteamCount > 0 && <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">{inteamCount} In-Team</span>}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Mix</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Curriculum progress</span>
          <span>{completedCount} / {selectedActivities.length}</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-chart-2 rounded-full transition-all duration-500"
            style={{ width: `${selectedActivities.length > 0 ? (completedCount / selectedActivities.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={onEmail}>
          <Mail className="w-3.5 h-3.5" /> Email Curriculum
        </Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onClear}>
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Clear all
        </Button>
      </div>

      {/* Activity list */}
      <div className="space-y-2">
        <AnimatePresence>
          {selectedActivities.map((activity, index) => {
            const isDone = completedIds.includes(activity.id);
            return (
              <motion.div
                key={activity.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.2 }}
              >
                <Card className={cn("transition-all duration-200", isDone && "opacity-60")}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground w-4 text-center flex-shrink-0">{index + 1}</span>
                    <button
                      onClick={() => onToggleComplete(activity.id)}
                      className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all",
                        isDone ? "bg-chart-2 border-chart-2 text-white" : "border-border hover:border-chart-2"
                      )}
                    >
                      {isDone && <Check className="w-3 h-3" />}
                    </button>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onViewDetail(activity)}>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-sm font-medium truncate", isDone && "line-through text-muted-foreground")}>{activity.name}</span>
                        <FormatBadge group={activity.formatGroup} />
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        <span>{activity.audienceTier}</span>
                        <span>·</span>
                        <span>{activity.duration}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onRemove(activity.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ActivityCatalogue() {
  const [activeTab, setActiveTab]         = useState("catalogue");
  const [search, setSearch]               = useState("");
  const [formatFilter, setFormatFilter]   = useState("all");
  const [tierFilter, setTierFilter]       = useState("all");
  const [selectedIds, setSelectedIds]     = useState([]);
  const [completedIds, setCompletedIds]   = useState([]);
  const [detailActivity, setDetailActivity] = useState(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  const filtered = useMemo(() => {
    return ACTIVITIES.filter(a => {
      const matchesSearch = !search ||
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.id.toLowerCase().includes(search.toLowerCase()) ||
        a.purpose.toLowerCase().includes(search.toLowerCase());
      const matchesFormat = formatFilter === "all" || a.formatGroup === formatFilter;
      const matchesTier   = tierFilter === "all" || a.tierNums.includes(Number(tierFilter));
      return matchesSearch && matchesFormat && matchesTier;
    });
  }, [search, formatFilter, tierFilter]);

  // Debounced search tracking — fires 600ms after user stops typing
  const searchDebounceRef = useRef(null);
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (search.trim()) {
      searchDebounceRef.current = setTimeout(() => {
        recordSearch(search.trim(), filtered.length);
      }, 600);
    }
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, [search, filtered.length]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const removing = prev.includes(id);
      if (removing) recordRemove(id); else recordAdd(id);
      return removing ? prev.filter(x => x !== id) : [...prev, id];
    });
  };

  const toggleComplete = (id) => {
    setCompletedIds(prev => {
      const uncompleting = prev.includes(id);
      if (uncompleting) recordUncomplete(id); else recordComplete(id);
      return uncompleting ? prev.filter(x => x !== id) : [...prev, id];
    });
  };

  const applyPath = (path) => {
    const newIds = path.activityIds;
    setSelectedIds(prev => {
      // Record adds for activities newly entering the curriculum
      newIds.forEach(id => { if (!prev.includes(id)) recordAdd(id); });
      // Record removes for activities being replaced/dropped
      prev.forEach(id => { if (!newIds.includes(id)) recordRemove(id); });
      return newIds;
    });
    // Record uncompletes for any completed activities that are being dropped
    completedIds.forEach(id => { if (!newIds.includes(id)) recordUncomplete(id); });
    recordPathApplied(path.id, newIds);
    setCompletedIds([]);
    setActiveTab("curriculum");
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Enablement Activity Catalogue</h1>
            <p className="text-sm text-muted-foreground">Browse all 18 activities and build your personal curriculum path</p>
          </div>
        </div>
      </motion.div>

      {/* Suggested paths */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Suggested Curriculum Paths</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SUGGESTED_PATHS.map(path => (
            <button
              key={path.id}
              onClick={() => applyPath(path)}
              className={cn(
                "text-left p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group",
                path.color,
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold leading-tight">{path.label}</p>
                  <p className="text-xs opacity-70 mt-1 leading-snug">{path.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-0.5" />
              </div>
              <div className="flex items-center justify-between mt-3">
                <Badge variant="outline" className="text-[10px] border-current opacity-60">{path.tier}</Badge>
                <span className="text-[10px] opacity-60">{path.activityIds.length} activities</span>
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <TabsList>
              <TabsTrigger value="catalogue" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Catalogue
                <Badge variant="secondary" className="ml-1 text-[10px]">{ACTIVITIES.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="curriculum" className="gap-2">
                <ListChecks className="w-4 h-4" />
                My Curriculum
                {selectedIds.length > 0 && (
                  <Badge className="ml-1 text-[10px]">{selectedIds.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── Catalogue tab ── */}
          <TabsContent value="catalogue" className="space-y-4 mt-0">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search activities…"
                  className="pl-9 h-9"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Format filter pills */}
              <div className="flex items-center gap-1 flex-wrap">
                {FORMAT_FILTER_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setFormatFilter(opt.value); recordFilterUsed("format", opt.value); }}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-full border transition-all duration-150 font-medium",
                      formatFilter === opt.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Tier filter pills */}
              <div className="flex items-center gap-1 flex-wrap">
                {TIER_FILTER_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setTierFilter(opt.value); recordFilterUsed("tier", opt.value); }}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-full border transition-all duration-150 font-medium",
                      tierFilter === opt.value
                        ? "bg-foreground text-background border-foreground"
                        : "bg-background text-muted-foreground border-border hover:border-foreground/50 hover:text-foreground"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {filtered.length} {filtered.length === 1 ? "activity" : "activities"}
                {(search || formatFilter !== "all" || tierFilter !== "all") && " matching filters"}
              </span>
              {selectedIds.length > 0 && (
                <span className="text-primary font-medium">{selectedIds.length} selected in curriculum</span>
              )}
            </div>

            {/* Activity grid */}
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No activities match your filters</p>
                <button onClick={() => { setSearch(""); setFormatFilter("all"); setTierFilter("all"); }} className="text-sm text-primary mt-2 hover:underline">
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <AnimatePresence mode="popLayout">
                  {filtered.map(activity => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      isSelected={selectedIds.includes(activity.id)}
                      onSelect={toggleSelect}
                      onViewDetail={(a) => { setDetailActivity(a); recordDetailView(a.id); }}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          {/* ── Curriculum tab ── */}
          <TabsContent value="curriculum" className="mt-0">
            <CurriculumView
              selectedIds={selectedIds}
              completedIds={completedIds}
              onToggleComplete={toggleComplete}
              onRemove={(id) => {
                recordRemove(id);
                setSelectedIds(prev => prev.filter(x => x !== id));
                setCompletedIds(prev => prev.filter(x => x !== id));
              }}
              onClear={() => {
                selectedIds.forEach(id => recordRemove(id));
                setSelectedIds([]);
                setCompletedIds([]);
              }}
              onViewDetail={(a) => { setDetailActivity(a); recordDetailView(a.id); }}
              onEmail={() => setEmailDialogOpen(true)}
            />
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Email Dialog */}
      <EmailCurriculumDialog
        open={emailDialogOpen}
        onClose={() => setEmailDialogOpen(false)}
        activities={ACTIVITIES.filter(a => selectedIds.includes(a.id))}
        completedIds={completedIds}
      />

      {/* Detail Sheet */}
      <ActivityDetailSheet
        activity={detailActivity}
        isSelected={detailActivity ? selectedIds.includes(detailActivity.id) : false}
        onSelect={toggleSelect}
        onClose={() => setDetailActivity(null)}
      />
    </div>
  );
}
