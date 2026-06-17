"use client";

import type { ToolInvocation } from "ai";
import { Loader2 } from "lucide-react";

function basename(path: string): string {
  return path.split(/[\\/]/).pop() ?? path;
}

function getLabel(toolName: string, args: Record<string, any>): string {
  const command: string = args?.command ?? "";
  const filename = args?.path ? basename(args.path as string) : "";

  if (toolName === "str_replace_editor") {
    switch (command) {
      case "create":     return `Creating ${filename}`;
      case "str_replace":
      case "insert":     return `Editing ${filename}`;
      case "view":       return `Reading ${filename}`;
      case "undo_edit":  return `Undoing edit on ${filename}`;
    }
  }

  if (toolName === "file_manager") {
    switch (command) {
      case "rename": {
        const newFilename = args?.new_path ? basename(args.new_path as string) : "";
        return `Renaming ${filename} → ${newFilename}`;
      }
      case "delete": return `Deleting ${filename}`;
    }
  }

  return toolName;
}

interface ToolInvocationDisplayProps {
  toolInvocation: ToolInvocation;
}

export function ToolInvocationDisplay({ toolInvocation }: ToolInvocationDisplayProps) {
  const isDone = toolInvocation.state === "result" && toolInvocation.result != null;
  const label = getLabel(toolInvocation.toolName, (toolInvocation as any).args ?? {});

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-neutral-700">{label}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <span className="text-neutral-700">{label}</span>
        </>
      )}
    </div>
  );
}
