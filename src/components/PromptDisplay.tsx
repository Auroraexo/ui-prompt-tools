import { useState } from 'react';

interface PromptDisplayProps {
  prompt: string;
}

export default function PromptDisplay({ prompt }: PromptDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold tracking-tight text-white">
          生成的 Prompt
        </h2>
        <button
          onClick={handleCopy}
          className="px-6 py-2 bg-indigo-500 text-white rounded-3xl font-medium hover:bg-indigo-600 active:scale-95 transition-all duration-300 shadow-[0_10px_30px_rgba(99,102,241,0.3)] hover:shadow-[0_25px_60px_rgba(0,0,0,0.4)] flex items-center gap-2"
        >
          {copied ? (
            <>
              <span>✓</span>
              <span>已复制</span>
            </>
          ) : (
            <>
              <span>📋</span>
              <span>复制</span>
            </>
          )}
        </button>
      </div>

      <div className="bg-zinc-900/50 rounded-xl p-4 border border-white/10">
        <pre className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap font-mono overflow-x-auto">
          {prompt || '请先配置参数以生成 Prompt...'}
        </pre>
      </div>
    </div>
  );
}
