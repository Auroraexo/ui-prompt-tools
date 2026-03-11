import { useState, useMemo } from 'react';
import type { ConfigState } from '../types/config';

type SandboxPreviewProps = {
  config: ConfigState;
};

export default function SandboxPreview({ config }: SandboxPreviewProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [previewMode, setPreviewMode] = useState<'card' | 'dashboard' | 'form'>('card');

  // 从 config 中提取各维度的 CSS 类名
  const styles = useMemo(() => {
    const get = (dimension: string, component: string): string => {
      const items = config[dimension];
      if (!items) return '';
      const found = items.find(
        (item) => item.componentName.toLowerCase() === component.toLowerCase()
      );
      return found ? found.cssClass : '';
    };

    return {
      // 容器 & 布局
      containerPadding: get('容器 & 布局', 'Container') || 'p-8',
      gridGap: get('容器 & 布局', 'Grid') || 'gap-6',
      maxWidth: get('容器 & 布局', 'MaxWidth') || 'max-w-7xl mx-auto',
      // 圆角
      cardRadius: get('圆角 (Radius)', 'Card') || 'rounded-2xl',
      buttonRadius: get('圆角 (Radius)', 'Button') || 'rounded-3xl',
      inputRadius: get('圆角 (Radius)', 'Input') || 'rounded-xl',
      badgeRadius: get('圆角 (Radius)', 'Badge') || 'rounded-full',
      // 背景
      glassCard: get('背景 (Glass)', 'GlassCard') || 'bg-white/5 backdrop-blur-xl',
      glassPanel: get('背景 (Glass)', 'GlassPanel') || 'bg-white/10 backdrop-blur-2xl border border-white/10',
      glassButton: get('背景 (Glass)', 'GlassButton') || 'bg-white/5 backdrop-blur-md hover:bg-white/10',
      // 阴影
      cardShadow: get('阴影 (Shadow)', 'CardShadow') || 'shadow-[0_20px_50px_rgba(0,0,0,0.3)]',
      buttonShadow: get('阴影 (Shadow)', 'ButtonShadow') || 'shadow-[0_10px_30px_rgba(99,102,241,0.3)]',
      // 字体
      heading: get('字体 (Typo)', 'Heading') || 'text-3xl font-semibold tracking-tight',
      body: get('字体 (Typo)', 'Body') || 'text-base leading-relaxed',
      caption: get('字体 (Typo)', 'Caption') || 'text-sm text-white/60',
      label: get('字体 (Typo)', 'Label') || 'text-sm font-medium tracking-wide',
      // 交互
      hoverScale: get('交互 (Motion)', 'HoverScale') || 'hover:scale-[1.02] transition-transform duration-300',
      clickScale: get('交互 (Motion)', 'ClickScale') || 'active:scale-95 transition-transform duration-150',
      smoothTransition: get('交互 (Motion)', 'SmoothTransition') || 'transition-all duration-300 ease-in-out',
      // 色彩
      primary: get('色彩 (Color)', 'Primary') || 'bg-indigo-500 text-white',
      primaryHover: get('色彩 (Color)', 'PrimaryHover') || 'hover:bg-indigo-600',
      accent: get('色彩 (Color)', 'Accent') || 'text-indigo-400',
      background: get('色彩 (Color)', 'Background') || 'bg-zinc-950',
    };
  }, [config]);

  const iframeSrcDoc = useMemo(() => {
    const cardPreviewHTML = `
    <div class="${styles.glassCard} ${styles.cardRadius} ${styles.containerPadding} ${styles.cardShadow} ${styles.hoverScale} ${styles.smoothTransition}">
      <h2 class="${styles.heading} text-white mb-3">卡片标题预览</h2>
      <p class="${styles.body} text-white/80 mb-4">
        这是正文内容的预览效果。使用当前配置的排版参数渲染，包括字号、行高和字重。
      </p>
      <p class="${styles.caption} mb-6">辅助说明文字 — ${new Date().toLocaleDateString()}</p>
      
      <div class="flex ${styles.gridGap} items-center flex-wrap">
        <button class="${styles.primary} ${styles.primaryHover} ${styles.buttonRadius} ${styles.clickScale} ${styles.buttonShadow} px-6 py-2.5 font-medium ${styles.smoothTransition}">
          主要按钮
        </button>
        <button class="${styles.glassButton} ${styles.buttonRadius} ${styles.clickScale} px-6 py-2.5 text-white font-medium border border-white/10 ${styles.smoothTransition}">
          次要按钮
        </button>
        <span class="${styles.badgeRadius} ${styles.primary} px-3 py-1 text-xs font-medium">标签</span>
      </div>
      
      <div class="mt-6 space-y-3">
        <label class="${styles.label} text-white/80 block">输入框预览</label>
        <input 
          class="${styles.inputRadius} ${styles.glassCard} border border-white/10 px-4 py-2.5 text-white w-full placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${styles.smoothTransition}"
          placeholder="请输入内容..."
        />
      </div>
    </div>
  `;

    const dashboardPreviewHTML = `
    <div class="grid grid-cols-2 ${styles.gridGap}">
      <div class="${styles.glassCard} ${styles.cardRadius} p-5 ${styles.cardShadow} ${styles.hoverScale} ${styles.smoothTransition}">
        <p class="${styles.caption} mb-1">总用户数</p>
        <h3 class="${styles.heading} text-white" style="font-size: 2rem;">12,847</h3>
        <p class="text-emerald-400 text-sm mt-2">↑ 12.5%</p>
      </div>
      <div class="${styles.glassCard} ${styles.cardRadius} p-5 ${styles.cardShadow} ${styles.hoverScale} ${styles.smoothTransition}">
        <p class="${styles.caption} mb-1">活跃率</p>
        <h3 class="${styles.heading} text-white" style="font-size: 2rem;">87.3%</h3>
        <p class="${styles.accent} text-sm mt-2">↑ 3.2%</p>
      </div>
      <div class="col-span-2 ${styles.glassPanel} ${styles.cardRadius} p-5 ${styles.cardShadow}">
        <h3 class="${styles.heading} text-white mb-4" style="font-size: 1.25rem;">最近活动</h3>
        <div class="space-y-3">
          <div class="flex items-center justify-between py-2 border-b border-white/5">
            <span class="${styles.body} text-white/80">新增注册</span>
            <span class="${styles.badgeRadius} bg-emerald-500/20 text-emerald-400 px-2 py-0.5 text-xs">+128</span>
          </div>
          <div class="flex items-center justify-between py-2 border-b border-white/5">
            <span class="${styles.body} text-white/80">订单完成</span>
            <span class="${styles.badgeRadius} ${styles.primary} px-2 py-0.5 text-xs">+56</span>
          </div>
          <div class="flex items-center justify-between py-2">
            <span class="${styles.body} text-white/80">收入增长</span>
            <span class="${styles.badgeRadius} bg-amber-500/20 text-amber-400 px-2 py-0.5 text-xs">¥8,420</span>
          </div>
        </div>
      </div>
    </div>
  `;

    const formPreviewHTML = `
    <div class="${styles.glassPanel} ${styles.cardRadius} ${styles.containerPadding} ${styles.cardShadow}">
      <h2 class="${styles.heading} text-white mb-2">创建新项目</h2>
      <p class="${styles.caption} mb-6">填写以下表单来创建一个新的项目配置</p>
      
      <div class="space-y-4">
        <div>
          <label class="${styles.label} text-white/80 block mb-1.5">项目名称</label>
          <input 
            class="${styles.inputRadius} ${styles.glassCard} border border-white/10 px-4 py-2.5 text-white w-full placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${styles.smoothTransition}"
            placeholder="输入项目名称..."
            value="我的新项目"
          />
        </div>
        
        <div>
          <label class="${styles.label} text-white/80 block mb-1.5">项目描述</label>
          <textarea 
            class="${styles.inputRadius} ${styles.glassCard} border border-white/10 px-4 py-2.5 text-white w-full placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${styles.smoothTransition} resize-none"
            rows="3"
            placeholder="描述你的项目..."
          >基于现代审美标准的 UI 配置方案</textarea>
        </div>
        
        <div>
          <label class="${styles.label} text-white/80 block mb-1.5">风格偏好</label>
          <div class="flex flex-wrap ${styles.gridGap}">
            <label class="${styles.glassCard} ${styles.cardRadius} px-4 py-2 cursor-pointer ${styles.hoverScale} ${styles.smoothTransition} border-2 border-indigo-500">
              <span class="text-white text-sm">✨ 极简主义</span>
            </label>
            <label class="${styles.glassCard} ${styles.cardRadius} px-4 py-2 cursor-pointer ${styles.hoverScale} ${styles.smoothTransition} border border-white/10">
              <span class="text-white/70 text-sm">🎨 新拟态</span>
            </label>
            <label class="${styles.glassCard} ${styles.cardRadius} px-4 py-2 cursor-pointer ${styles.hoverScale} ${styles.smoothTransition} border border-white/10">
              <span class="text-white/70 text-sm">🌊 毛玻璃</span>
            </label>
          </div>
        </div>
        
        <div class="flex ${styles.gridGap} pt-4">
          <button class="${styles.primary} ${styles.primaryHover} ${styles.buttonRadius} ${styles.clickScale} ${styles.buttonShadow} px-8 py-2.5 font-medium ${styles.smoothTransition} flex-1">
            创建项目
          </button>
          <button class="${styles.glassButton} ${styles.buttonRadius} ${styles.clickScale} px-8 py-2.5 text-white/70 font-medium border border-white/10 ${styles.smoothTransition}">
            取消
          </button>
        </div>
      </div>
    </div>
  `;

    const previewHTMLMap: Record<string, string> = {
      card: cardPreviewHTML,
      dashboard: dashboardPreviewHTML,
      form: formPreviewHTML,
    };

    const contentHTML = previewHTMLMap[previewMode] || cardPreviewHTML;

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      margin: 0;
      padding: 24px;
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    /* 隐藏滚动条 */
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 999px; }
  </style>
</head>
<body class="${styles.background} text-white">
  ${contentHTML}
</body>
</html>`;
  }, [config, previewMode, styles]);

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
            👁️ 实时沙盒预览
          </h2>
          <p className="text-sm text-white/60 text-left">
            在独立沙盒中实时预览配置效果，确认美感后再发给 Cursor
          </p>
        </div>
        <span className="text-white/60 text-lg transition-transform duration-200" style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(90deg)' }}>▶</span>
      </div>

      {!collapsed && (
        <>
          {/* 预览模式选择 */}
          <div className="flex gap-2">
            {[
              { key: 'card', label: '🃏 卡片', desc: '通用卡片组件' },
              { key: 'dashboard', label: '📊 仪表盘', desc: '数据面板' },
              { key: 'form', label: '📝 表单', desc: '表单页面' },
            ].map((mode) => (
              <button
                key={mode.key}
                type="button"
                onClick={() => setPreviewMode(mode.key as 'card' | 'dashboard' | 'form')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                  previewMode === mode.key
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
                title={mode.desc}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {/* 沙盒预览 iframe */}
          <div className="rounded-xl overflow-hidden border border-white/10 bg-zinc-900">
            <iframe
              srcDoc={iframeSrcDoc}
              title="UI 沙盒预览"
              className="w-full border-0"
              style={{ height: '420px' }}
              sandbox="allow-scripts"
            />
          </div>

          <p className="text-xs text-white/40 text-center">
            ⚡ 沙盒使用 Tailwind CDN 实时渲染，修改左侧配置后自动更新
          </p>
        </>
      )}
    </div>
  );
}
