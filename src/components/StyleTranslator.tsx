import { useState, useMemo } from 'react';
import type { ConfigState } from '../types/config';
import {
  translateConfig,
  getFormatFileName,
  type TranslateFormat,
} from '../utils/styleTranslator';
import Modal from './Modal';

type StyleTranslatorProps = {
  config: ConfigState;
};

const FORMAT_TABS: { key: TranslateFormat; label: string; icon: string }[] = [
  { key: 'css-variables', label: 'CSS Variables', icon: '🎨' },
  { key: 'json-theme', label: 'JSON Theme', icon: '📦' },
  { key: 'python-dict', label: 'Python Dict', icon: '🐍' },
  { key: 'raw-css', label: 'Raw CSS', icon: '✏️' },
  { key: 'tailwind-config', label: 'TW Config', icon: '🌊' },
  { key: 'tailwind', label: 'Tailwind', icon: '💨' },
];

export default function StyleTranslator({ config }: StyleTranslatorProps) {
  const [activeFormat, setActiveFormat] = useState<TranslateFormat>('css-variables');
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [writeStatus, setWriteStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [writeOpen, setWriteOpen] = useState(false);
  const [writePath, setWritePath] = useState('');

  const output = useMemo(() => {
    return translateConfig(config, activeFormat);
  }, [config, activeFormat]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = output;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const fileName = getFormatFileName(activeFormat);
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleWriteLocal = async () => {
    const targetPath = writePath.trim();
    if (!targetPath) return;

    setWriteStatus(null);

    try {
      const response = await fetch('/api/export/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: targetPath.trim(),
          content: output,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setWriteStatus({ type: 'success', message: `✅ 已写入 ${data.filePath}` });
        setTimeout(() => setWriteStatus(null), 5000);
        setWriteOpen(false);
        setWritePath('');
      } else {
        setWriteStatus({ type: 'error', message: data.error || '写入失败' });
      }
    } catch (err) {
      setWriteStatus({
        type: 'error',
        message: '写入失败：' + (err instanceof Error ? err.message : '网络错误'),
      });
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/10 space-y-4">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setCollapsed(!collapsed)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCollapsed(!collapsed); } }}
        className="w-full flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity select-none"
      >
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white text-left">
            🔄 多端样式翻译
          </h2>
          <p className="text-sm text-white/60 text-left">
            一套参数，多端复用 — Tailwind → CSS / JSON / Python
          </p>
        </div>
        <span className="text-white/60 text-lg transition-transform duration-200" style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(90deg)' }}>▶</span>
      </div>

      {!collapsed && (
        <>
          {/* 格式选项卡 */}
          <div className="flex flex-wrap gap-2">
            {FORMAT_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveFormat(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                  activeFormat === tab.key
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* 输出区域 */}
          <div className="relative bg-zinc-900/60 rounded-xl border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
              <span className="text-xs text-white/50 font-mono">
                {getFormatFileName(activeFormat)}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-2 py-1 bg-white/5 text-white/70 rounded-lg text-xs hover:bg-white/10 hover:text-white transition-colors"
                >
                  {copied ? '✓ 已复制' : '📋 复制'}
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-2 py-1 bg-white/5 text-white/70 rounded-lg text-xs hover:bg-white/10 hover:text-white transition-colors"
                >
                  ⬇ 下载
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWriteStatus(null);
                    setWritePath(getFormatFileName(activeFormat));
                    setWriteOpen(true);
                  }}
                  className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs hover:bg-emerald-500/30 transition-colors"
                >
                  📁 写入本地
                </button>
              </div>
            </div>

            <pre className="p-4 text-sm text-white/90 leading-relaxed whitespace-pre-wrap font-mono max-h-80 overflow-auto">
              {output}
            </pre>
          </div>

          {/* 写入状态 */}
          {writeStatus && (
            <div
              className={`text-sm rounded-xl px-3 py-2 ${
                writeStatus.type === 'success'
                  ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                  : 'text-red-400 bg-red-500/10 border border-red-500/20'
              }`}
            >
              {writeStatus.message}
            </div>
          )}
        </>
      )}

      <Modal
        open={writeOpen}
        title="写入本地文件"
        description="把当前导出内容写入项目根目录下的指定路径"
        onClose={() => setWriteOpen(false)}
        footer={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setWriteOpen(false)}
              className="flex-1 rounded-xl bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleWriteLocal}
              disabled={!writePath.trim()}
              className="flex-1 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              写入
            </button>
          </div>
        }
      >
        <div>
          <label className="block text-sm font-medium text-white/80 mb-1">
            文件路径（相对于项目根目录）*
          </label>
          <input
            type="text"
            value={writePath}
            onChange={(e) => setWritePath(e.target.value)}
            placeholder={getFormatFileName(activeFormat)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          />
          <p className="mt-2 text-xs text-white/50">
            例如：{getFormatFileName(activeFormat)} 或 styles/{getFormatFileName(activeFormat)}
          </p>
        </div>
      </Modal>
    </div>
  );
}
