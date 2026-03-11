import { useState } from 'react';
import type { UIConfig } from '../types/config';

interface ConfigCardProps {
  dimension: string;
  configs: UIConfig[];
  onUpdate: (dimension: string, index: number, field: keyof UIConfig, value: string) => void;
  anchorId?: string;
  expanded?: boolean;
  defaultExpanded?: boolean;
  onToggleExpanded?: (next: boolean) => void;
}

export default function ConfigCard({
  dimension,
  configs = [],
  onUpdate,
  anchorId,
  expanded,
  defaultExpanded = true,
  onToggleExpanded,
}: ConfigCardProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isExpanded = typeof expanded === 'boolean' ? expanded : internalExpanded;
  const setExpanded = (next: boolean) => {
    onToggleExpanded?.(next);
    if (typeof expanded !== 'boolean') setInternalExpanded(next);
  };

  if (!configs || configs.length === 0) {
    return null;
  }

  return (
    <div
      id={anchorId}
      className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/10 scroll-mt-24"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!isExpanded)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(!isExpanded); } }}
        className="w-full flex items-center justify-between mb-4 hover:scale-105 transition-transform duration-300 cursor-pointer select-none"
      >
        <h2 className="text-xl font-semibold tracking-tight text-white">
          {dimension}
        </h2>
        <span className="text-white/60 transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
          ▶
        </span>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {configs.map((config, index) => (
            <div
              key={index}
              className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-3"
            >
              <div>
                <label className="block text-sm font-medium tracking-wide text-white/80 mb-1">
                  组件名称
                </label>
                <input
                  type="text"
                  value={config.componentName}
                  onChange={(e) =>
                    onUpdate(dimension, index, 'componentName', e.target.value)
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  placeholder="组件名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium tracking-wide text-white/80 mb-1">
                  CSS 类名
                </label>
                <input
                  type="text"
                  value={config.cssClass}
                  onChange={(e) =>
                    onUpdate(dimension, index, 'cssClass', e.target.value)
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 font-mono text-sm"
                  placeholder="Tailwind CSS 类名"
                />
              </div>

              <div>
                <label className="block text-sm font-medium tracking-wide text-white/80 mb-1">
                  Prompt 片段
                </label>
                <textarea
                  value={config.promptFragment}
                  onChange={(e) =>
                    onUpdate(dimension, index, 'promptFragment', e.target.value)
                  }
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 resize-none text-sm leading-relaxed"
                  placeholder="AI 提示词片段"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
