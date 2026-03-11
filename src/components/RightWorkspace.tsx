import { useMemo, useState } from 'react';
import type { ConfigState } from '../types/config';
import SandboxPreview from './SandboxPreview';
import ProjectManager from './ProjectManager';
import PresetManager from './PresetManager';
import StyleTranslator from './StyleTranslator';
import AiVisionPanel from './AiVisionPanel';
import PromptDisplay from './PromptDisplay';

type TabKey = 'preview' | 'manage' | 'ai' | 'export' | 'prompt';

type RightWorkspaceProps = {
  config: ConfigState;
  prompt: string;
  selectedProjectId: number | null;
  onSelectProject: (id: number | null) => void;
  onLoadConfig: (config: ConfigState) => void;
  onApplyConfig: (config: Partial<ConfigState>) => void;
  presetRefreshTrigger: number;
  onPresetsChanged: () => void;
};

const TABS: Array<{ key: TabKey; label: string; shortLabel: string }> = [
  { key: 'preview', label: '👁️ 预览', shortLabel: '预览' },
  { key: 'manage', label: '📁 项目&配置', shortLabel: '管理' },
  { key: 'ai', label: '✨ AI', shortLabel: 'AI' },
  { key: 'export', label: '🔄 导出', shortLabel: '导出' },
  { key: 'prompt', label: '🧩 Prompt', shortLabel: 'Prompt' },
];

export default function RightWorkspace({
  config,
  prompt,
  selectedProjectId,
  onSelectProject,
  onLoadConfig,
  onApplyConfig,
  presetRefreshTrigger,
  onPresetsChanged,
}: RightWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('preview');
  const [copied, setCopied] = useState(false);

  const actions = useMemo(() => {
    return {
      copyPrompt: async () => {
        try {
          await navigator.clipboard.writeText(prompt);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch (err) {
          console.error('复制失败:', err);
        }
      },
    };
  }, [prompt]);

  return (
    <section className="space-y-4">
      {/* 顶部工作台导航与高频动作 */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                  activeTab === t.key
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
                }`}
                aria-current={activeTab === t.key ? 'page' : undefined}
              >
                <span className="hidden sm:inline">{t.label}</span>
                <span className="sm:hidden">{t.shortLabel}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={actions.copyPrompt}
              disabled={!prompt}
              className="px-3 py-1.5 bg-indigo-500 text-white rounded-xl text-xs font-medium hover:bg-indigo-600 active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              title="复制生成的 Prompt"
            >
              {copied ? '✓ 已复制' : '📋 复制 Prompt'}
            </button>
            <span className="text-[11px] text-white/40 self-center hidden md:inline">
              {selectedProjectId === null ? '当前：全部项目' : `当前项目 ID：${selectedProjectId}`}
            </span>
          </div>
        </div>
      </div>

      {/* 内容区：不同 Tab 聚焦不同任务 */}
      <div className="space-y-4">
        {activeTab === 'preview' && (
          <SandboxPreview config={config} />
        )}

        {activeTab === 'manage' && (
          <>
            <ProjectManager
              selectedProjectId={selectedProjectId}
              onSelectProject={onSelectProject}
            />
            <PresetManager
              currentConfig={config}
              onLoadConfig={onLoadConfig}
              projectId={selectedProjectId}
              refreshTrigger={presetRefreshTrigger}
            />
          </>
        )}

        {activeTab === 'ai' && (
          <AiVisionPanel
            onApplyConfig={onApplyConfig}
            projectId={selectedProjectId}
            onPresetsChanged={onPresetsChanged}
          />
        )}

        {activeTab === 'export' && (
          <StyleTranslator config={config} />
        )}

        {activeTab === 'prompt' && (
          <PromptDisplay prompt={prompt} />
        )}
      </div>
    </section>
  );
}

