import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Wand2, Shield, Code2, FolderOpen, ArrowRight, 
  CheckCircle, AlertTriangle, Zap, GraduationCap,
  TrendingUp, Users, ListChecks, BarChart3, Clock,
  Plus, Check, RotateCcw, Layers
} from "lucide-react";
import { motion } from "framer-motion";
import HealthBadge from "@/components/shared/HealthBadge";
import { AUTHOR_STANDARDS } from "@/lib/standards-data";
import { getHealthStatus } from "@/lib/standards-data";
import { getStats, clearStats } from "@/lib/enablement-stats";

// ─── Activity metadata (name + format group) for display ─────────────────────
const ACTIVITY_META = {
  "ACT-001": { name: "Awareness Workshop",             group: "live"   },
  "ACT-002": { name: "Foundation Skills Workshop",     group: "live"   },
  "ACT-003": { name: "Advanced Workshop",              group: "live"   },
  "ACT-004": { name: "Code Review Sessions",           group: "live"   },
  "ACT-005": { name: "Office Hours",                   group: "live"   },
  "ACT-006": { name: "Lunch & Learn",                  group: "live"   },
  "ACT-007": { name: "Squad Embed / Pairing",          group: "inteam" },
  "ACT-008": { name: "Hackathon / Build Day",          group: "live"   },
  "ACT-009": { name: "Community of Practice (CoP)",   group: "live"   },
  "ACT-010": { name: "ADR / Design Clinic",            group: "live"   },
  "ACT-011": { name: "Onboarding Pathway",             group: "async"  },
  "ACT-012": { name: "Pattern Library Review",         group: "async"  },
  "ACT-013": { name: "Newsletter / Digest",            group: "async"  },
  "ACT-014": { name: "Recorded Demo Library",          group: "async"  },
  "ACT-015": { name: "Certification Study Group",      group: "live"   },
  "ACT-016": { name: "First Asset Coaching",           group: "inteam" },
  "ACT-017": { name: "Legacy Classification Sprint",   group: "inteam" },
  "ACT-018": { name: "Reviewer Certification",         group: "live"   },
};

const GROUP_STYLE = {
  live:   { dot: "bg-blue-400",   label: "Live",    bar: "bg-blue-400"   },
  async:  { dot: "bg-violet-400", label: "Async",   bar: "bg-violet-400" },
  inteam: { dot: "bg-amber-400",  label: "In-Team", bar: "bg-amber-400"  },
};

const PATH_LABELS = {
  "new-joiner":  "New Joiner Essentials",
  "practitioner":"Practitioner Path",
  "expert":      "Expert & Champion Path",
  "full":        "Full Programme",
};

const EVENT_LABELS = {
  add:        { icon: Plus,      color: "text-primary",  label: "Added"      },
  remove:     { icon: RotateCcw, color: "text-muted-foreground", label: "Removed" },
  complete:   { icon: Check,     color: "text-chart-2",  label: "Completed"  },
  uncomplete: { icon: RotateCcw, color: "text-muted-foreground", label: "Uncompleted" },
  path:       { icon: Layers,    color: "text-warning",  label: "Path applied" },
};

function formatRelativeTime(isoString) {
  if (!isoString) return "";
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Enablement Engagement panel ─────────────────────────────────────────────

function EnablementEngagement() {
  const [tick, setTick] = React.useState(0);
  const stats = useMemo(() => getStats(), [tick]); // re-read when tick changes

  const actEntries = Object.entries(stats.activities || {});

  const totalAdds       = actEntries.reduce((s, [, v]) => s + (v.addCount || 0), 0);
  const totalCompletions = actEntries.reduce((s, [, v]) => s + (v.completedCount || 0), 0);
  const uniqueActivities = actEntries.filter(([, v]) => (v.addCount || 0) > 0).length;
  const completionRate  = totalAdds > 0 ? Math.round((totalCompletions / totalAdds) * 100) : 0;

  // Top 5 by add count
  const topByAdds = [...actEntries]
    .filter(([, v]) => v.addCount > 0)
    .sort((a, b) => b[1].addCount - a[1].addCount)
    .slice(0, 5);

  // Top 5 by completions
  const topByCompletions = [...actEntries]
    .filter(([, v]) => v.completedCount > 0)
    .sort((a, b) => b[1].completedCount - a[1].completedCount)
    .slice(0, 5);

  // Format distribution
  const formatCounts = { live: 0, async: 0, inteam: 0 };
  actEntries.forEach(([id, v]) => {
    const g = ACTIVITY_META[id]?.group;
    if (g) formatCounts[g] += (v.addCount || 0);
  });
  const formatTotal = Object.values(formatCounts).reduce((s, v) => s + v, 0);

  // Path usage
  const pathEntries = Object.entries(stats.paths || {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);

  // Recent history (first 8)
  const recentHistory = (stats.history || []).slice(0, 8);

  const hasAnyData = totalAdds > 0;

  const handleClear = () => {
    if (window.confirm("Reset all enablement engagement statistics? This cannot be undone.")) {
      clearStats();
      setTick(t => t + 1);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Enablement Engagement</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/ActivityCatalogue">
              <Button variant="ghost" size="sm" className="text-xs">
                Catalogue <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
            {hasAnyData && (
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={handleClear}>
                Reset
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!hasAnyData ? (
          <div className="py-8 text-center text-muted-foreground">
            <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-25" />
            <p className="text-sm font-medium">No engagement data yet</p>
            <p className="text-xs mt-1">Start building curricula in the <Link to="/ActivityCatalogue" className="text-primary hover:underline">Activity Catalogue</Link> to see statistics here.</p>
          </div>
        ) : (
          <>
            {/* Headline stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Curriculum Enrolments", value: totalAdds,        icon: Plus,       color: "text-primary"  },
                { label: "Activities Completed",  value: totalCompletions,  icon: Check,      color: "text-chart-2"  },
                { label: "Unique Activities Used", value: uniqueActivities, icon: BarChart3,  color: "text-chart-5"  },
                { label: "Completion Rate",        value: `${completionRate}%`, icon: TrendingUp, color: completionRate >= 50 ? "text-success" : "text-warning" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-muted/40 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                    <span className="text-xl font-bold">{value}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-tight">{label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top added activities */}
              {topByAdds.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Most Added to Curricula</h4>
                  <div className="space-y-2">
                    {topByAdds.map(([id, v]) => {
                      const meta = ACTIVITY_META[id];
                      const pct = Math.round(((v.addCount || 0) / topByAdds[0][1].addCount) * 100);
                      const gs = GROUP_STYLE[meta?.group] ?? GROUP_STYLE.live;
                      return (
                        <div key={id} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${gs.dot}`} />
                              <span className="font-mono text-muted-foreground flex-shrink-0">{id}</span>
                              <span className="truncate font-medium">{meta?.name ?? id}</span>
                            </div>
                            <span className="font-semibold text-muted-foreground ml-2 flex-shrink-0">{v.addCount}</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${gs.bar}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Top completed activities */}
              {topByCompletions.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Most Completed</h4>
                  <div className="space-y-2">
                    {topByCompletions.map(([id, v]) => {
                      const meta = ACTIVITY_META[id];
                      const pct = Math.round(((v.completedCount || 0) / topByCompletions[0][1].completedCount) * 100);
                      return (
                        <div key={id} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Check className="w-3 h-3 text-chart-2 flex-shrink-0" />
                              <span className="font-mono text-muted-foreground flex-shrink-0">{id}</span>
                              <span className="truncate font-medium">{meta?.name ?? id}</span>
                            </div>
                            <span className="font-semibold text-muted-foreground ml-2 flex-shrink-0">{v.completedCount}</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-chart-2 transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Format distribution + path usage + recent activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Format mix */}
              {formatTotal > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Format Mix</h4>
                  {/* Stacked bar */}
                  <div className="h-3 rounded-full overflow-hidden flex">
                    {Object.entries(formatCounts).map(([g, count]) => {
                      if (!count) return null;
                      const gs = GROUP_STYLE[g];
                      return (
                        <div
                          key={g}
                          className={`h-full ${gs.bar} transition-all duration-500`}
                          style={{ width: `${(count / formatTotal) * 100}%` }}
                          title={`${gs.label}: ${count}`}
                        />
                      );
                    })}
                  </div>
                  <div className="space-y-1">
                    {Object.entries(formatCounts).map(([g, count]) => {
                      if (!count) return null;
                      const gs = GROUP_STYLE[g];
                      return (
                        <div key={g} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${gs.dot}`} />
                            <span>{gs.label}</span>
                          </div>
                          <span className="font-medium">{count} <span className="text-muted-foreground">({Math.round((count / formatTotal) * 100)}%)</span></span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Suggested path usage */}
              {pathEntries.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Paths Applied</h4>
                  <div className="space-y-2">
                    {pathEntries.map(([pathId, count]) => (
                      <div key={pathId} className="flex items-center justify-between text-xs">
                        <span className="truncate">{PATH_LABELS[pathId] ?? pathId}</span>
                        <Badge variant="secondary" className="ml-2 flex-shrink-0 text-[10px]">{count}×</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent activity */}
              {recentHistory.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent Activity</h4>
                  <div className="space-y-2">
                    {recentHistory.map((event, i) => {
                      const ev = EVENT_LABELS[event.type] ?? EVENT_LABELS.add;
                      const Icon = ev.icon;
                      const actName = event.activityId ? (ACTIVITY_META[event.activityId]?.name ?? event.activityId) : null;
                      const pathName = event.pathId ? (PATH_LABELS[event.pathId] ?? event.pathId) : null;
                      return (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <Icon className={`w-3 h-3 mt-0.5 flex-shrink-0 ${ev.color}`} />
                          <div className="flex-1 min-w-0">
                            <span className="font-medium">{ev.label}</span>
                            {actName && <span className="text-muted-foreground"> · {actName}</span>}
                            {pathName && <span className="text-muted-foreground"> · {pathName}{event.activityCount ? ` (${event.activityCount} activities)` : ""}</span>}
                          </div>
                          <span className="text-muted-foreground flex-shrink-0">{formatRelativeTime(event.timestamp)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 }
};

export default function Dashboard() {
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list("-created_date", 10),
  });

  const stats = [
    { label: "Author Standards", value: "7", icon: Shield, color: "text-primary" },
    { label: "Projects", value: projects.length.toString(), icon: FolderOpen, color: "text-chart-2" },
    { 
      label: "Passing", 
      value: projects.filter(p => (p.compliance_score || 0) >= 80).length.toString(), 
      icon: CheckCircle, 
      color: "text-success" 
    },
    { 
      label: "Need Attention", 
      value: projects.filter(p => (p.compliance_score || 0) < 80).length.toString(), 
      icon: AlertTriangle, 
      color: "text-warning" 
    },
  ];

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div {...fadeIn} className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Automation Enablement Studio</h1>
            <p className="text-sm text-muted-foreground">Design, generate, and validate automation with embedded standards</p>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/BuildWizard">
          <Card className="group hover:border-primary/30 hover:shadow-md transition-all duration-300 cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Wand2 className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">New Automation</h3>
                <p className="text-sm text-muted-foreground">Start the guided build wizard</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </CardContent>
          </Card>
        </Link>
        <Link to="/Standards">
          <Card className="group hover:border-primary/30 hover:shadow-md transition-all duration-300 cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-chart-2/10 flex items-center justify-center group-hover:bg-chart-2/20 transition-colors">
                <Shield className="w-6 h-6 text-chart-2" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Browse Standards</h3>
                <p className="text-sm text-muted-foreground">View the 7 author standards</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-chart-2 group-hover:translate-x-1 transition-all" />
            </CardContent>
          </Card>
        </Link>
      </motion.div>

      {/* Stats */}
      <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <span className="text-2xl font-bold">{stat.value}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Enablement Engagement */}
      <motion.div {...fadeIn} transition={{ delay: 0.3 }}>
        <EnablementEngagement />
      </motion.div>

      {/* Standards Overview */}
      <motion.div {...fadeIn} transition={{ delay: 0.4 }}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Author Standards</CardTitle>
              <Link to="/Standards">
                <Button variant="ghost" size="sm" className="text-xs">
                  View All <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {AUTHOR_STANDARDS.map((std, i) => (
                <Link
                  key={std.slug}
                  to={`/Standards?standard=${std.slug}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium group-hover:text-primary transition-colors">{std.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{std.standard_statement}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{std.status}</Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Projects */}
      {projects.length > 0 && (
        <motion.div {...fadeIn} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {projects.slice(0, 5).map(project => (
                  <Link
                    key={project.id}
                    to={`/Workspace?project=${project.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Code2 className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{project.name}</p>
                        <p className="text-xs text-muted-foreground">{project.automation_type} · {project.technology_area}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {project.compliance_score !== undefined && (
                        <HealthBadge 
                          status={getHealthStatus(project.compliance_score)} 
                          score={project.compliance_score} 
                        />
                      )}
                      <Badge variant="outline" className="text-[10px]">{project.status}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}