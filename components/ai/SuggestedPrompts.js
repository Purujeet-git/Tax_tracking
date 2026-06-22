"use client";

import { ArrowRight } from "lucide-react";

export default function SuggestedPrompts({
  title = "Suggested Actions",
  prompts = [],
  onPromptClick,
}) {
  return (
    <div className="mt-12 w-full">
      <h3 className="mb-6 text-xs font-black uppercase text-zinc-500">
        {title}
      </h3>

      <div className="grid gap-4 md:grid-cols-2">
        {prompts.map((prompt) => {
          const Icon = prompt.icon;

          return (
            <button
              key={prompt.id}
              onClick={() => onPromptClick?.(prompt)}
              className="group rounded-lg border-2 border-black bg-white p-5 text-left shadow-[5px_5px_0_#111] transition hover:-translate-y-1 hover:bg-[#9dff7a]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-md border-2 border-black bg-[#f4f4f0]">
                    <Icon className="h-5 w-5 text-black" />
                  </div>

                  <h4 className="text-xl font-black tracking-tighter text-black">
                    {prompt.title}
                  </h4>

                  <p className="mt-2 text-sm font-semibold leading-6 text-zinc-600">
                    {prompt.description}
                  </p>
                </div>

                <ArrowRight className="mt-1 h-5 w-5 text-black transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
