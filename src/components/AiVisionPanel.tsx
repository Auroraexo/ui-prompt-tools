import { useEffect, useMemo, useState } from 'react';
import type { ConfigState } from '../types/config';
import Modal from './Modal';
import { convertAIParamsToPartialConfig } from '../utils/normalizeExternalConfig';

type HistoryItem = {
  id: string;
  imageUrl: string;
  question: string;
  answer: string;
  createdAt: number;
};

const HISTORY_KEY = 'ui-tools-vision-history';
const HISTORY_LIMIT = 20;

type AiVisionPanelProps = {
  onApplyConfig?: (config: Partial<ConfigState>) => void;
  projectId?: number | null;
  onPresetsChanged?: () => void;
};

export default function AiVisionPanel({ onApplyConfig, projectId, onPresetsChanged }: AiVisionPanelProps) {
  const [imageUrl, setImageUrl] = useState('');
  const [imageLabel, setImageLabel] = useState('');
  const [visionPrompt, setVisionPrompt] = useState('你看见了什么？');
  const [visionResult, setVisionResult] = useState('');
  const [visionError, setVisionError] = useState('');
  const [isVisionLoading, setIsVisionLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractResult, setExtractResult] = useState('');
  const [pendingConfig, setPendingConfig] = useState<Partial<ConfigState> | null>(null);
  const [lastExtractedParams, setLastExtractedParams] = useState<Record<string, unknown> | null>(null);
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [saveExtractOpen, setSaveExtractOpen] = useState(false);
  const [saveExtractName, setSaveExtractName] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as HistoryItem[];
      if (Array.isArray(parsed)) {
        setHistory(parsed);
      }
    } catch (error) {
      console.error('加载 AI 历史失败:', error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => b.createdAt - a.createdAt);
  }, [history]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setVisionError('');
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setVisionError('请选择图片文件（image/*）');
      return;
    }

    // 这里与后端的 20MB JSON 限制保持一个相对保守的上限（约 10MB 原始文件）
    // base64 后体积会进一步膨胀，如果仍然报体积过大，可以考虑使用图片 URL 方式
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setVisionError('图片体积过大，请压缩后再上传，或改用图片 URL 方式');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setImageUrl(result);
      setImageLabel(file.name);
    };
    reader.onerror = () => {
      console.error('读取图片失败', reader.error);
      setVisionError('读取图片失败，请重试或尝试使用图片 URL');
      setImageUrl('');
      setImageLabel('');
    };
    reader.readAsDataURL(file);
  };

  const handleVisionGenerate = async () => {
    if (!imageUrl.trim()) {
      setVisionError('请先填写图片 URL 或上传图片');
      return;
    }

    setIsVisionLoading(true);
    setVisionError('');
    setVisionResult('');

    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => {
        controller.abort();
      }, 30000); // 30 秒超时

      const response = await fetch('/api/describe-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: imageUrl.trim(),
          text: visionPrompt.trim() || '你看见了什么？',
        }),
        signal: controller.signal,
      });

      window.clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');

      if (isJson) {
        const data = await response.json();

        // 统一优先展示后端返回的 error 字段
        if (!response.ok || data.error) {
          const errorMessage =
            data.error ||
            (response.status === 413
              ? '请求体过大，请尝试使用更小的图片（或压缩后上传），或改用图片 URL 方式'
              : `请求失败（${response.status}）`);
          throw new Error(errorMessage);
        }

        const resultText =
          data.text ||
          (data.raw ? JSON.stringify(data.raw, null, 2) : JSON.stringify(data, null, 2));

        setVisionResult(resultText);

        const newItem: HistoryItem = {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          imageUrl: imageUrl.trim(),
          question: visionPrompt.trim() || '你看见了什么？',
          answer: resultText,
          createdAt: Date.now(),
        };
        setHistory((prev) => [newItem, ...prev].slice(0, HISTORY_LIMIT));
      } else {
        const text = await response.text();
        if (!response.ok) {
          throw new Error(text || `请求失败（${response.status}）`);
        }
        setVisionResult(text);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setVisionError('请求超时，请稍后重试');
      } else {
        const message = error instanceof Error ? error.message : '请求失败';
        setVisionError(message);
      }
    } finally {
      setIsVisionLoading(false);
    }
  };

  const handleUseHistory = (item: HistoryItem) => {
    setImageUrl(item.imageUrl);
    setImageLabel('');
    setVisionPrompt(item.question);
    setVisionResult(item.answer);
    setVisionError('');
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  // 将最新一次提取的参数保存为数据库中的预设
  const handleSaveExtractedPreset = async () => {
    if (!lastExtractedParams) {
      setVisionError('当前没有可保存的提取结果');
      return;
    }

    const themeName = saveExtractName.trim();
    if (!themeName) return;

    setIsSavingPreset(true);
    setVisionError('');

    try {
      const response = await fetch('/api/vision-presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aiExtractedData: lastExtractedParams,
          themeName,
          project_id: projectId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || `保存失败（${response.status}）`);
      }

      setExtractResult((prev) => {
        const prefix = '✅ 已将提取的 UI 参数保存为配置：';
        const msg = `${prefix}${themeName.trim()}`;
        return prev.includes(prefix) ? prev : `${msg}\n\n${prev}`;
      });

      // 通知外部预设列表已变更
      onPresetsChanged?.();
      setSaveExtractOpen(false);
      setSaveExtractName('');
    } catch (error) {
      const message = error instanceof Error ? error.message : '保存提取配置失败';
      setVisionError(message);
    } finally {
      setIsSavingPreset(false);
    }
  };

  // 提取 UI 参数并回填到左侧配置
  const handleExtractParams = async () => {
    if (!imageUrl.trim()) {
      setVisionError('请先填写图片 URL 或上传图片');
      return;
    }

    setIsExtracting(true);
    setVisionError('');
    setExtractResult('');
    setPendingConfig(null);
    setLastExtractedParams(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60秒超时

      const response = await fetch('/api/extract-ui-params', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: imageUrl.trim(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `请求失败 (${response.status})`;
        // 只读取一次响应体，避免出现 body stream already read 错误
        const rawText = await response.text();
        try {
          const errorData = rawText ? JSON.parse(rawText) : null;
          if (errorData && errorData.error) {
            errorMessage = errorData.error;
          } else if (rawText) {
            errorMessage = rawText;
          }
        } catch {
          if (rawText) {
            errorMessage = rawText;
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // 显示提取结果（先只做预览，不立即应用）
      const resultText = data.rawText || JSON.stringify(data.params, null, 2);
      setExtractResult(resultText);

      // 如果解析成功，转换为 ConfigState，等待用户点击按钮应用
      if (data.params) {
        setLastExtractedParams(data.params);
        const convertedConfig = convertAIParamsToPartialConfig(data.params);
        if (Object.keys(convertedConfig).length > 0) {
          setPendingConfig(convertedConfig);
          setExtractResult(
            `✅ 已成功提取 UI 参数，可点击下方按钮一键应用到左侧配置。\n\n${resultText}`
          );
        } else {
          setExtractResult(
            `⚠️ AI 返回了参数，但无法转换为配置格式。\n\n${resultText}`
          );
        }
      } else {
        setExtractResult(
          `⚠️ AI 返回格式不符合预期，请查看原始内容：\n\n${resultText}`
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          setVisionError('请求超时（60 秒），请检查网络或稍后重试');
        } else {
          setVisionError(error.message);
        }
      } else {
        setVisionError('提取 UI 参数失败');
      }
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/10 space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-white mb-2">
          AI 图像理解
        </h2>
        <p className="text-sm text-white/60">
          输入图片链接或上传图片，生成描述并自动保存历史记录
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium tracking-wide text-white/80 mb-1">
            图片 URL
          </label>
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium tracking-wide text-white/80 mb-1">
            上传本地图片
          </label>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-white/70 file:mr-4 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-white file:font-medium hover:file:bg-white/20"
            />
            {imageLabel && (
              <span className="text-xs text-white/50 truncate max-w-[140px]">
                {imageLabel}
              </span>
            )}
          </div>
        </div>

        {imageUrl && (
          <div className="bg-zinc-900/50 rounded-xl p-3 border border-white/10">
            <img
              src={imageUrl}
              alt="预览"
              className="w-full max-h-48 object-contain rounded-lg"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium tracking-wide text-white/80 mb-1">
            提问文本
          </label>
          <input
            type="text"
            value={visionPrompt}
            onChange={(e) => setVisionPrompt(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
            placeholder="你看见了什么？"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleVisionGenerate}
            disabled={isVisionLoading || isExtracting}
            className="px-6 py-2 bg-indigo-500 text-white rounded-3xl font-medium hover:bg-indigo-600 active:scale-95 transition-all duration-300 shadow-[0_10px_30px_rgba(99,102,241,0.3)] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isVisionLoading ? '生成中...' : '生成描述'}
          </button>
          <button
            type="button"
            onClick={handleExtractParams}
            disabled={isVisionLoading || isExtracting}
            className="px-6 py-2 bg-emerald-500 text-white rounded-3xl font-medium hover:bg-emerald-600 active:scale-95 transition-all duration-300 shadow-[0_10px_30px_rgba(16,185,129,0.3)] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isExtracting ? '提取中...' : '✨ 提取参数'}
          </button>
        </div>
      </div>

      {visionError && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
          {visionError}
        </div>
      )}

      {visionResult && (
        <div className="bg-zinc-900/50 rounded-xl p-4 border border-white/10">
          <h4 className="text-xs font-medium text-white/70 mb-2">描述结果</h4>
          <pre className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap font-mono">
            {visionResult}
          </pre>
        </div>
      )}

      {extractResult && (
        <div className="bg-emerald-900/20 rounded-xl p-4 border border-emerald-500/30">
          <h4 className="text-xs font-medium text-emerald-400 mb-2">
            参数提取结果
          </h4>
          {(pendingConfig && onApplyConfig) || lastExtractedParams ? (
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-emerald-200">
                已解析出可用的 UI 参数，你可以一键应用到左侧配置，或直接保存为数据库预设。
              </p>
              <div className="flex gap-2 shrink-0">
                {pendingConfig && onApplyConfig && (
                  <button
                    type="button"
                    onClick={() => {
                      onApplyConfig(pendingConfig);
                      setPendingConfig(null);
                      setExtractResult((prev) =>
                        prev.startsWith('✅ 已成功提取 UI 参数')
                          ? prev.replace(
                              '✅ 已成功提取 UI 参数，可点击下方按钮一键应用到左侧配置。',
                              '✅ 已将提取的 UI 参数应用到左侧配置。'
                            )
                          : `✅ 已将提取的 UI 参数应用到左侧配置。\n\n${prev}`
                      );
                    }}
                    className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-full hover:bg-emerald-600 active:scale-95 transition-all duration-200"
                  >
                    一键应用到左侧配置
                  </button>
                )}
                {lastExtractedParams && (
                  <button
                    type="button"
                    onClick={() => {
                      const defaultName =
                        imageLabel || (imageUrl.startsWith('http') ? imageUrl : 'AI 提取样式');
                      setSaveExtractName(defaultName);
                      setSaveExtractOpen(true);
                      setVisionError('');
                    }}
                    disabled={isSavingPreset}
                    className="px-3 py-1.5 bg-indigo-500 text-white text-xs font-medium rounded-full hover:bg-indigo-600 active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSavingPreset ? '保存中...' : '保存为新配置'}
                  </button>
                )}
              </div>
            </div>
          ) : null}
          <pre className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap font-mono">
            {extractResult}
          </pre>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white/80">历史记录</h3>
          {history.length > 0 && (
            <button
              type="button"
              onClick={handleClearHistory}
              className="text-xs text-white/50 hover:text-white"
            >
              清空
            </button>
          )}
        </div>

        {sortedHistory.length === 0 ? (
          <p className="text-xs text-white/50">暂无历史记录</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-auto pr-1">
            {sortedHistory.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => handleUseHistory(item)}
                className="w-full text-left bg-white/5 border border-white/10 rounded-xl px-3 py-2 hover:bg-white/10 transition-colors"
              >
                <div className="text-xs text-white/80 truncate">
                  {item.question}
                </div>
                <div className="text-[11px] text-white/50 truncate">
                  {new Date(item.createdAt).toLocaleString()}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={saveExtractOpen}
        title="保存提取结果为新配置"
        description="把本次 AI 提取的参数保存到配置列表，便于团队复用"
        onClose={() => {
          if (isSavingPreset) return;
          setSaveExtractOpen(false);
        }}
        footer={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                if (isSavingPreset) return;
                setSaveExtractOpen(false);
              }}
              disabled={isSavingPreset}
              className="flex-1 rounded-xl bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-60"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSaveExtractedPreset}
              disabled={isSavingPreset || !saveExtractName.trim()}
              className="flex-1 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSavingPreset ? '保存中...' : '保存'}
            </button>
          </div>
        }
      >
        <div>
          <label className="block text-sm font-medium text-white/80 mb-1">
            配置名称 *
          </label>
          <input
            type="text"
            value={saveExtractName}
            onChange={(e) => setSaveExtractName(e.target.value)}
            placeholder="例如：iOS 风格圆角+毛玻璃"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </Modal>
    </div>
  );
}
