"use client";

import { PROMPT_TEMPLATES } from "@/lib/constants";
import { useEditorStore } from "@/store/useEditorState";

export function PromptTemplates() {
  const { setPrompt } = useEditorStore();

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide shrink-0">
      {PROMPT_TEMPLATES.map((t) => (
        <button
          key={t.label}
          onClick={() => setPrompt(t.prompt)}
          className="shrink-0 text-xs px-3 py-1.5 rounded-full bg-zinc-900/60 border border-zinc-800/80 text-zinc-500 hover:text-zinc-200 hover:border-purple-500/40 hover:bg-purple-500/10 transition-all whitespace-nowrap"
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
