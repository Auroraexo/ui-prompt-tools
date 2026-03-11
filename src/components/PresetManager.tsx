import { useState, useEffect } from 'react';
import type { ConfigState } from '../types/config';
import Modal from './Modal';
import { defaultConfig } from '../data/defaultConfig';
import { coercePresetConfigData } from '../utils/normalizeExternalConfig';

type Preset = {
  id: number;
  preset_name: string;
  description: string | null;
  project_id: number | null;
  created_at: string;
  updated_at: string;
};

type PresetManagerProps = {
  currentConfig: ConfigState;
  onLoadConfig: (config: ConfigState) => void;
  projectId?: number | null;
  refreshTrigger?: number;
};

export default function PresetManager({
  currentConfig,
  onLoadConfig,
  projectId,
  refreshTrigger,
}: PresetManagerProps) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Preset | null>(null);
  const [cloneTarget, setCloneTarget] = useState<Preset | null>(null);
  const [cloneName, setCloneName] = useState('');
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<'updated' | 'created'>('updated');

  const visiblePresets = (() => {
    const q = query.trim().toLowerCase();
    const filtered = presets.filter((p) => {
      if (!q) return true;
      return (
        p.preset_name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    });
    const sorted = [...filtered].sort((a, b) => {
      const aT = new Date(sortKey === 'updated' ? a.updated_at : a.created_at).getTime();
      const bT = new Date(sortKey === 'updated' ? b.updated_at : b.created_at).getTime();
      return bT - aT;
    });
    return sorted;
  })();

  // 加载配置列表（支持按项目筛选）
  const loadPresets = async () => {
    setIsLoading(true);
    setError('');
    try {
      const url = projectId ? `/api/presets?project_id=${projectId}` : '/api/presets';
      const response = await fetch(url);

      if (!response.ok) {
        // 尝试优先解析 JSON 错误，否则回退到文本
        const rawText = await response.text();
        try {
          const data = rawText ? JSON.parse(rawText) : null;
          const msg =
            data && data.error
              ? data.error
              : `请求失败（${response.status}）`;
          throw new Error(msg);
        } catch {
          // 非 JSON（例如 HTML 错误页）
          throw new Error(
            rawText
              ? `服务器返回非 JSON 响应（可能是错误页或代理问题），状态码 ${response.status}`
              : `请求失败（${response.status}）`
          );
        }
      }

      // 正常 JSON 返回
      const data = await response.json();

      if (data.success && Array.isArray(data.presets)) {
        setPresets(data.presets);
      } else if (data.error) {
        setError(data.error || '加载配置列表失败');
      } else {
        setError('加载配置列表失败：返回数据格式异常');
      }
    } catch (err) {
      setError('加载配置列表失败：' + (err instanceof Error ? err.message : '网络错误'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPresets();
  }, [projectId, refreshTrigger]);

  // 保存当前配置
  const handleSave = async () => {
    if (!saveName.trim()) {
      setError('请输入配置名称');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const response = await fetch('/api/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preset_name: saveName.trim(),
          description: saveDescription.trim() || null,
          config_data: currentConfig,
          project_id: projectId || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('配置已保存！');
        setSaveName('');
        setSaveDescription('');
        setShowSaveDialog(false);
        loadPresets(); // 重新加载列表
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(data.error || '保存失败');
      }
    } catch (err) {
      setError('保存失败：' + (err instanceof Error ? err.message : '网络错误'));
    } finally {
      setIsSaving(false);
    }
  };

  // 加载配置
  const handleLoad = async (id: number) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/presets/${id}`);

      if (!response.ok) {
        const rawText = await response.text();
        try {
          const data = rawText ? JSON.parse(rawText) : null;
          const msg =
            data && data.error
              ? data.error
              : `加载失败（${response.status}）`;
          throw new Error(msg);
        } catch {
          throw new Error(
            rawText
              ? `服务器返回非 JSON 响应（可能是错误页或代理问题），状态码 ${response.status}`
              : `加载失败（${response.status}）`
          );
        }
      }

      const data = await response.json();

      if (data.success) {
        const rawConfig = data.preset.config_data;
        const configData: ConfigState = coercePresetConfigData(rawConfig, defaultConfig);

        onLoadConfig(configData);
        setSuccessMessage('配置已加载！');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(data.error || '加载失败');
      }
    } catch (err) {
      setError('加载失败：' + (err instanceof Error ? err.message : '网络错误'));
    } finally {
      setIsLoading(false);
    }
  };

  // 删除配置
  const handleDelete = async (id: number) => {
    setError('');

    try {
      const response = await fetch(`/api/presets/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('配置已删除');
        loadPresets(); // 重新加载列表
        setDeleteTarget(null);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(data.error || '删除失败');
      }
    } catch (err) {
      setError('删除失败：' + (err instanceof Error ? err.message : '网络错误'));
    }
  };

  // 克隆配置
  const handleClone = async (id: number) => {
    const newName = cloneName.trim();
    if (!newName) return;
    setError('');

    try {
      const response = await fetch(`/api/presets/${id}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName: newName.trim(), project_id: projectId || null }),
      });

      // 优先处理非 2xx 情况，避免解析 HTML 报 Unexpected token '<'
      if (!response.ok) {
        const rawText = await response.text();
        try {
          const data = rawText ? JSON.parse(rawText) : null;
          const msg =
            data && data.error
              ? data.error
              : `克隆失败（${response.status}）`;
          throw new Error(msg);
        } catch {
          throw new Error(
            rawText
              ? `服务器返回非 JSON 响应（可能是错误页或代理问题），状态码 ${response.status}`
              : `克隆失败（${response.status}）`
          );
        }
      }

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('配置已克隆');
        loadPresets();
        setCloneTarget(null);
        setCloneName('');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(data.error || '克隆失败');
      }
    } catch (err) {
      setError('克隆失败：' + (err instanceof Error ? err.message : '网络错误'));
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/10 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight text-white">
          配置管理
        </h2>
        <button
          type="button"
          onClick={() => setShowSaveDialog(true)}
          className="px-4 py-2 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 active:scale-95 transition-all duration-300 text-sm"
        >
          💾 保存当前配置
        </button>
      </div>

      <p className="text-sm text-white/60">
        将配置保存到数据库，实现多设备同步和团队协作
      </p>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
          {successMessage}
        </div>
      )}

      {/* 保存对话框 */}
      <Modal
        open={showSaveDialog}
        title="保存配置"
        description="将当前参数保存为可复用的配置方案"
        onClose={() => {
          if (isSaving) return;
          setShowSaveDialog(false);
        }}
        footer={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                if (isSaving) return;
                setShowSaveDialog(false);
                setSaveName('');
                setSaveDescription('');
                setError('');
              }}
              disabled={isSaving}
              className="flex-1 rounded-xl bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-60"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !saveName.trim()}
              className="flex-1 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? '保存中...' : '确认保存'}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              配置名称 *
            </label>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="例如：现代毛玻璃风格"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              描述（可选）
            </label>
            <textarea
              value={saveDescription}
              onChange={(e) => setSaveDescription(e.target.value)}
              placeholder="简要描述这个配置方案..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
        </div>
      </Modal>

      {/* 配置列表 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-white/80">已保存的配置</h3>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索配置名称/描述…"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSortKey('updated')}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors border ${
                sortKey === 'updated'
                  ? 'bg-indigo-500 text-white border-indigo-500/30'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 border-white/10'
              }`}
              title="按最近更新排序"
            >
              最近更新
            </button>
            <button
              type="button"
              onClick={() => setSortKey('created')}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors border ${
                sortKey === 'created'
                  ? 'bg-indigo-500 text-white border-indigo-500/30'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 border-white/10'
              }`}
              title="按创建时间排序"
            >
              最近创建
            </button>
          </div>
        </div>

        {isLoading ? (
          <p className="text-xs text-white/50">加载中...</p>
        ) : presets.length === 0 ? (
          <p className="text-xs text-white/50">暂无已保存的配置</p>
        ) : visiblePresets.length === 0 ? (
          <p className="text-xs text-white/50">没有匹配的配置</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-auto pr-1">
            {visiblePresets.map((preset) => (
              <div
                key={preset.id}
                className="bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-white truncate">
                      {preset.preset_name}
                    </h4>
                    {preset.description && (
                      <p className="text-xs text-white/60 mt-1 line-clamp-2">
                        {preset.description}
                      </p>
                    )}
                    <p className="text-[11px] text-white/40 mt-1">
                      {sortKey === 'updated'
                        ? `更新于 ${new Date(preset.updated_at).toLocaleString()}`
                        : `创建于 ${new Date(preset.created_at).toLocaleString()}`}
                    </p>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleLoad(preset.id)}
                      className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/30 transition-colors"
                    >
                      加载
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setError('');
                        setCloneTarget(preset);
                        setCloneName(`${preset.preset_name}（副本）`);
                      }}
                      className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-500/30 transition-colors"
                    >
                      克隆
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(preset)}
                      className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={!!deleteTarget}
        title="删除配置？"
        description={deleteTarget ? `确定删除配置“${deleteTarget.preset_name}”吗？` : ''}
        onClose={() => setDeleteTarget(null)}
        footer={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="flex-1 rounded-xl bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
            >
              取消
            </button>
            <button
              type="button"
              onClick={() => {
                if (deleteTarget) handleDelete(deleteTarget.id);
              }}
              className="flex-1 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
            >
              删除
            </button>
          </div>
        }
      >
        <p className="text-sm text-white/70">删除后无法恢复。</p>
      </Modal>

      <Modal
        open={!!cloneTarget}
        title="克隆配置"
        description={cloneTarget ? `为“${cloneTarget.preset_name}”创建一个副本` : ''}
        onClose={() => {
          setCloneTarget(null);
          setCloneName('');
        }}
        footer={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setCloneTarget(null);
                setCloneName('');
              }}
              className="flex-1 rounded-xl bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
            >
              取消
            </button>
            <button
              type="button"
              onClick={() => {
                if (cloneTarget) handleClone(cloneTarget.id);
              }}
              disabled={!cloneName.trim()}
              className="flex-1 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              克隆
            </button>
          </div>
        }
      >
        <div>
          <label className="block text-sm font-medium text-white/80 mb-1">
            新配置名称 *
          </label>
          <input
            type="text"
            value={cloneName}
            onChange={(e) => setCloneName(e.target.value)}
            placeholder="例如：现代毛玻璃风格（副本）"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </Modal>
    </div>
  );
}
