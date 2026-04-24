import React from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Wand2, Shield, Code2, FolderOpen, ArrowRight, 
  CheckCircle, AlertTriangle, Zap
} from "lucide-react";
import { motion } from "framer-motion";
import HealthBadge from "@/components/shared/HealthBadge";
import { AUTHOR_STANDARDS } from "@/lib/standards-data";
import { getHealthStatus } from "@/lib/standards-data";

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

      {/* Standards Overview */}
      <motion.div {...fadeIn} transition={{ delay: 0.3 }}>
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
        <motion.div {...fadeIn} transition={{ delay: 0.4 }}>
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