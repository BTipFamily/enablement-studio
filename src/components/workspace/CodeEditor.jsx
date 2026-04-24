import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileCode, FileJson, FileText, ShieldAlert } from "lucide-react";

export default function CodeEditor({ project, activeTab, onTabChange, onCodeChange }) {
  const tabs = [
    { id: "main", label: "Main", icon: FileCode, content: project?.generated_code || "" },
    { id: "metadata", label: "Metadata", icon: FileJson, content: project?.metadata_schema || "" },
    { id: "readme", label: "README", icon: FileText, content: project?.readme_content || "" },
    { id: "backout", label: "Backout", icon: ShieldAlert, content: project?.backout_content || "" },
  ];

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="h-full flex flex-col">
      <TabsList className="w-full justify-start rounded-none border-b bg-muted/30 px-2 h-10">
        {tabs.map(tab => (
          <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5 text-xs data-[state=active]:bg-background">
            <tab.icon className="w-3 h-3" />
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map(tab => (
        <TabsContent key={tab.id} value={tab.id} className="flex-1 mt-0 p-0">
          <ScrollArea className="h-[calc(100vh-320px)]">
            <textarea
              value={tab.content}
              onChange={(e) => onCodeChange(tab.id, e.target.value)}
              className="w-full h-full min-h-[600px] p-4 font-mono text-xs leading-relaxed bg-card text-card-foreground resize-none focus:outline-none"
              spellCheck={false}
            />
          </ScrollArea>
        </TabsContent>
      ))}
    </Tabs>
  );
}