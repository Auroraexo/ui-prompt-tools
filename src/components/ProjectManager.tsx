import { useState, useEffect } from 'react';
import Modal from './Modal';

type Project = {
  id: number;
  name: string;
  description: string | null;
  preset_count: number;
  created_at: string;
};

type ProjectManagerProps = {
  selectedProjectId: number | null;
  onSelectProject: (id: number | null) => void;
};

export default function ProjectManager({
  selectedProjectId,
  onSelectProject,
}: ProjectManagerProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showManage, setShowManage] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [query, setQuery] = useState('');

  const filteredProjects = projects.filter((p) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    );
  });

  const loadProjects = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) {
        throw new Error(`请求失败 (${response.status})`);
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.projects)) {
        setProjects(data.projects);
      }
    } catch (err) {
      setError('加载项目列表失败：' + (err instanceof Error ? err.message : '网络错误'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreateProject = async () => {
    const name = createName.trim();
    if (!name) return;
    const description = createDesc.trim() || null;
    setError('');
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMessage('项目已创建');
        loadProjects();
        onSelectProject(data.project.id);
        setCreateOpen(false);
        setCreateName('');
        setCreateDesc('');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(data.error || '创建失败');
      }
    } catch (err) {
      setError('创建项目失败：' + (err instanceof Error ? err.message : '网络错误'));
    }
  };

  const handleUpdateProject = async (id: number) => {
    if (!editName.trim()) {
      setError('项目名称不能为空');
      return;
    }
    setError('');
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDesc.trim() || null,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMessage('项目已更新');
        setEditingId(null);
        loadProjects();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(data.error || '更新失败');
      }
    } catch (err) {
      setError('更新项目失败：' + (err instanceof Error ? err.message : '网络错误'));
    }
  };

  const handleDeleteProject = async (id: number) => {
    setError('');
    try {
      const response = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setSuccessMessage('项目已删除');
        if (selectedProjectId === id) {
          onSelectProject(null);
        }
        loadProjects();
        setDeleteTarget(null);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(data.error || '删除失败');
      }
    } catch (err) {
      setError('删除项目失败：' + (err instanceof Error ? err.message : '网络错误'));
    }
  };

  const startEdit = (project: Project) => {
    setEditingId(project.id);
    setEditName(project.name);
    setEditDesc(project.description || '');
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/10 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight text-white">
          📁 项目管理
        </h2>
        <button
          type="button"
          onClick={() => {
            setError('');
            setCreateOpen(true);
          }}
          className="px-3 py-1.5 bg-indigo-500 text-white rounded-xl text-xs font-medium hover:bg-indigo-600 active:scale-95 transition-all duration-200"
        >
          + 新建项目
        </button>
      </div>

      <p className="text-sm text-white/60">
        将不同项目的 UI 审美方案分别管理，互不干扰
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

      {/* 项目选择器 — 使用按钮列表替代 select 以兼容深色主题 */}
      <div className="space-y-2">
        <p className="text-sm text-white/70">当前项目：</p>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索项目…"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onSelectProject(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
              selectedProjectId === null
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            全部项目
          </button>
          {filteredProjects.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelectProject(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                selectedProjectId === p.id
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              {p.name} ({p.preset_count ?? 0})
            </button>
          ))}
          {!isLoading && projects.length > 0 && filteredProjects.length === 0 ? (
            <span className="text-xs text-white/40 self-center px-2">
              未找到匹配项目
            </span>
          ) : null}
        </div>
      </div>

      {/* 项目管理面板 */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setShowManage(!showManage)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowManage(!showManage); } }}
        className="text-xs text-white/50 hover:text-white/80 transition-colors cursor-pointer select-none inline-block px-2 py-1 rounded-lg hover:bg-white/5"
      >
        {showManage ? '收起管理面板 ▲' : '展开管理面板 ▼'}
      </div>

      {showManage && (
        <div className="space-y-2 max-h-48 overflow-auto pr-1">
          {isLoading ? (
            <p className="text-xs text-white/50">加载中...</p>
          ) : projects.length === 0 ? (
            <p className="text-xs text-white/50">暂无项目，点击"新建项目"开始</p>
          ) : filteredProjects.length === 0 ? (
            <p className="text-xs text-white/50">未找到匹配项目</p>
          ) : (
            filteredProjects.map((project) => (
              <div
                key={project.id}
                className={`bg-white/5 border rounded-xl p-3 transition-colors ${
                  selectedProjectId === project.id
                    ? 'border-indigo-500/50 bg-indigo-500/5'
                    : 'border-white/10 hover:bg-white/10'
                }`}
              >
                {editingId === project.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="项目名称"
                    />
                    <input
                      type="text"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="描述（可选）"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateProject(project.id)}
                        className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs hover:bg-emerald-500/30"
                      >
                        保存
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 bg-white/5 text-white/60 rounded-lg text-xs hover:bg-white/10"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => onSelectProject(project.id)}
                    >
                      <h4 className="text-sm font-medium text-white truncate">
                        {project.name}
                      </h4>
                      {project.description && (
                        <p className="text-xs text-white/60 mt-0.5 truncate">
                          {project.description}
                        </p>
                      )}
                      <p className="text-[11px] text-white/40 mt-0.5">
                        {project.preset_count ?? 0} 个配置 · {new Date(project.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEdit(project)}
                        className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs hover:bg-blue-500/30"
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(project)}
                        className="px-2 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs hover:bg-red-500/30"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      <Modal
        open={createOpen}
        title="新建项目"
        description="将不同项目的 UI 审美方案分别管理，互不干扰"
        onClose={() => setCreateOpen(false)}
        footer={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="flex-1 rounded-xl bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleCreateProject}
              disabled={!createName.trim()}
              className="flex-1 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              创建
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              项目名称 *
            </label>
            <input
              type="text"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="例如：后台管理系统"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              描述（可选）
            </label>
            <input
              type="text"
              value={createDesc}
              onChange={(e) => setCreateDesc(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="一句话说明该项目的 UI 风格目标"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={!!deleteTarget}
        title="删除项目？"
        description={deleteTarget ? `确定删除项目“${deleteTarget.name}”吗？关联的配置将变为未分类状态。` : ''}
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
                if (deleteTarget) handleDeleteProject(deleteTarget.id);
              }}
              className="flex-1 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
            >
              删除
            </button>
          </div>
        }
      >
        <p className="text-sm text-white/70">
          删除后无法恢复。建议先确认该项目下的配置已导出或克隆到其他项目。
        </p>
      </Modal>
    </div>
  );
}
