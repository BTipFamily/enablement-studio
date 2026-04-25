import React, { useRef, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileCode, FileJson, FileText, ShieldAlert, Pencil } from "lucide-react";

// Map project automation_type + tab to a Monaco language id
function resolveLanguage(tabId, automationType) {
  if (tabId === "metadata") return "json";
  if (tabId === "readme") return "markdown";
  if (tabId === "backout") return "markdown";
  // main tab — infer from automation type
  switch (automationType) {
    case "Python":          return "python";
    case "Ansible Playbook": return "yaml";
    case "PowerShell":      return "powershell";
    case "Bash":            return "shell";
    default:                return "plaintext";
  }
}

const EDITOR_OPTIONS = {
  minimap:           { enabled: false },
  fontSize:          12,
  lineHeight:        20,
  fontFamily:        "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, monospace",
  fontLigatures:     true,
  scrollBeyondLastLine: false,
  wordWrap:          "on",
  tabSize:           2,
  insertSpaces:      true,
  automaticLayout:   true,
  suggestOnTriggerCharacters: true,
  quickSuggestions:  { other: true, comments: false, strings: false },
  parameterHints:    { enabled: true },
  formatOnPaste:     true,
  renderLineHighlight: "line",
  lineNumbers:       "on",
  glyphMargin:       false,
  folding:           true,
  padding:           { top: 12, bottom: 12 },
};

export default function CodeEditor({ project, activeTab, onTabChange, onCodeChange }) {
  const editorRefs = useRef({});

  const tabs = [
    { id: "main",     label: "Main",     icon: FileCode,   content: project?.generated_code  || "" },
    { id: "metadata", label: "Metadata", icon: FileJson,   content: project?.metadata_schema || "" },
    { id: "readme",   label: "README",   icon: FileText,   content: project?.readme_content  || "" },
    { id: "backout",  label: "Backout",  icon: ShieldAlert,content: project?.backout_content  || "" },
  ];

  const handleMount = useCallback((editor, _monaco, tabId) => {
    editorRefs.current[tabId] = editor;
  }, []);

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="h-full flex flex-col">
      <div className="flex items-center border-b bg-muted/30 flex-shrink-0">
        <TabsList className="flex-1 justify-start rounded-none border-0 bg-transparent px-2 h-10">
          {tabs.map(tab => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="gap-1.5 text-xs data-[state=active]:bg-background"
            >
              <tab.icon className="w-3 h-3" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="flex items-center gap-1 pr-3 text-[10px] text-muted-foreground/50 flex-shrink-0">
          <Pencil className="w-2.5 h-2.5" />
          <span>
            {resolveLanguage(activeTab, project?.automation_type)} · checks live
          </span>
        </div>
      </div>

      {tabs.map(tab => (
        <TabsContent
          key={tab.id}
          value={tab.id}
          className="flex-1 mt-0 p-0 data-[state=inactive]:hidden"
          style={{ display: activeTab === tab.id ? "flex" : "none", flexDirection: "column" }}
          forceMount
        >
          <Editor
            height="100%"
            language={resolveLanguage(tab.id, project?.automation_type)}
            value={tab.content}
            onChange={(value) => onCodeChange(tab.id, value ?? "")}
            onMount={(editor, monaco) => handleMount(editor, monaco, tab.id)}
            theme="vs-dark"
            options={EDITOR_OPTIONS}
            loading={
              <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                Loading editor…
              </div>
            }
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}
