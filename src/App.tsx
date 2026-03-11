import { useState, useEffect, useMemo } from 'react';
import type { ConfigState, UIConfig } from './types/config';
import { defaultConfig } from './data/defaultConfig';
import { generateUIPrompt } from './utils/promptGenerator';
import Header from './components/Header';
import ConfigCard from './components/ConfigCard';
import RightWorkspace from './components/RightWorkspace';
import { loadConfig, loadExpandedByDimension, saveConfig, saveExpandedByDimension } from './storage';

function App() {
  const [config, setConfig] = useState<ConfigState>(() => {
    const res = loadConfig({ fallback: defaultConfig });
    if (res.error) console.warn(res.error);
    return res.value;
  });
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [presetRefreshTrigger, setPresetRefreshTrigger] = useState(0);
  const [dimensionQuery, setDimensionQuery] = useState('');
  const [expandedByDimension, setExpandedByDimension] = useState<Record<string, boolean>>(() => {
    const res = loadExpandedByDimension();
    if (res.error) console.warn(res.error);
    return res.value;
  });

  // 保存配置到 localStorage
  useEffect(() => {
    const res = saveConfig(config);
    if (res.error) console.warn(res.error);
  }, [config]);

  useEffect(() => {
    const res = saveExpandedByDimension(expandedByDimension);
    if (res.error) console.warn(res.error);
  }, [expandedByDimension]);

  // 更新配置项
  const handleUpdate = (
    dimension: string,
    index: number,
    field: keyof UIConfig,
    value: string
  ) => {
    setConfig((prev) => {
      const newConfig = { ...prev };
      const dimensionConfigs = [...(newConfig[dimension] || [])];
      dimensionConfigs[index] = {
        ...dimensionConfigs[index],
        [field]: value,
      };
      newConfig[dimension] = dimensionConfigs;
      return newConfig;
    });
  };

  // 批量更新配置（用于 AI 参数回填）
  const handleBatchUpdate = (newConfig: Partial<ConfigState>) => {
    setConfig((prev) => {
      const updated: ConfigState = { ...prev };
      // 只更新有效的维度配置
      Object.keys(newConfig).forEach((dimension) => {
        const configs = newConfig[dimension];
        if (configs && Array.isArray(configs)) {
          updated[dimension] = configs;
        }
      });
      return updated;
    });
  };

  // 生成 Prompt
  const prompt = useMemo(() => {
    return generateUIPrompt(config);
  }, [config]);

  const dimensions = useMemo(() => Object.keys(config), [config]);

  const visibleDimensions = useMemo(() => {
    const q = dimensionQuery.trim().toLowerCase();
    if (!q) return dimensions;
    return dimensions.filter((dimension) => {
      if (dimension.toLowerCase().includes(q)) return true;
      const items = config[dimension] || [];
      return items.some((it) => {
        return (
          (it.componentName || '').toLowerCase().includes(q) ||
          (it.cssClass || '').toLowerCase().includes(q) ||
          (it.promptFragment || '').toLowerCase().includes(q)
        );
      });
    });
  }, [config, dimensionQuery, dimensions]);

  const scrollToDimension = (dimension: string) => {
    const id = `dim-${encodeURIComponent(dimension)}`;
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const setAllExpanded = (next: boolean) => {
    setExpandedByDimension((prev) => {
      const out = { ...prev };
      dimensions.forEach((d) => {
        out[d] = next;
      });
      return out;
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-4 sm:p-6 lg:p-8" style={{ minHeight: '100vh', backgroundColor: '#09090b' }}>
      <div className="max-w-7xl mx-auto space-y-6" style={{ maxWidth: '80rem', margin: '0 auto' }}>
        <Header />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ display: 'grid', gap: '1.5rem' }}>
          {/* 配置区域 */}
          <div className="space-y-6" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-white/80 font-medium">参数维度</div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAllExpanded(true)}
                      className="px-3 py-1.5 bg-white/5 text-white/70 rounded-xl text-xs font-medium hover:bg-white/10 hover:text-white border border-white/10"
                    >
                      全部展开
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllExpanded(false)}
                      className="px-3 py-1.5 bg-white/5 text-white/70 rounded-xl text-xs font-medium hover:bg-white/10 hover:text-white border border-white/10"
                    >
                      全部收起
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={dimensionQuery}
                  onChange={(e) => setDimensionQuery(e.target.value)}
                  placeholder="搜索维度 / 组件 / 类名 / prompt…"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />

                <div className="flex flex-wrap gap-2">
                  {visibleDimensions.slice(0, 12).map((dimension) => (
                    <button
                      key={dimension}
                      type="button"
                      onClick={() => scrollToDimension(dimension)}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10"
                      title="跳转到该维度"
                    >
                      {dimension}
                    </button>
                  ))}
                  {visibleDimensions.length > 12 ? (
                    <span className="text-xs text-white/40 self-center px-1">
                      +{visibleDimensions.length - 12}…
                    </span>
                  ) : null}
                  {dimensions.length > 0 && visibleDimensions.length === 0 ? (
                    <span className="text-xs text-white/40 self-center px-1">
                      没有匹配项
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {visibleDimensions.map((dimension) => (
              <ConfigCard
                key={dimension}
                dimension={dimension}
                configs={config[dimension]}
                onUpdate={handleUpdate}
                anchorId={`dim-${encodeURIComponent(dimension)}`}
                expanded={expandedByDimension[dimension] ?? true}
                onToggleExpanded={(next) =>
                  setExpandedByDimension((prev) => ({ ...prev, [dimension]: next }))
                }
              />
            ))}
          </div>

          {/* 右侧工作台：Tab 聚焦不同任务 */}
          <div className="lg:sticky lg:top-8 lg:h-fit">
            <RightWorkspace
              config={config}
              prompt={prompt}
              selectedProjectId={selectedProjectId}
              onSelectProject={setSelectedProjectId}
              onLoadConfig={setConfig}
              onApplyConfig={handleBatchUpdate}
              presetRefreshTrigger={presetRefreshTrigger}
              onPresetsChanged={() => setPresetRefreshTrigger((n) => n + 1)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
