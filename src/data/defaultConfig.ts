import type { ConfigState } from '../types/config';

export const defaultConfig: ConfigState = {
  '容器 & 布局': [
    {
      componentName: 'Container',
      cssClass: 'p-8',
      promptFragment: '使用 p-8 作为容器内边距，提供充足的留白空间',
      dimension: '容器 & 布局',
    },
    {
      componentName: 'Grid',
      cssClass: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
      promptFragment: '使用响应式网格布局，移动端单列，平板双列，桌面三列，间距 gap-6',
      dimension: '容器 & 布局',
    },
    {
      componentName: 'Flex',
      cssClass: 'flex flex-col items-center justify-center',
      promptFragment: '使用 flex 布局，垂直排列，居中对齐',
      dimension: '容器 & 布局',
    },
    {
      componentName: 'MaxWidth',
      cssClass: 'max-w-7xl mx-auto',
      promptFragment: '使用 max-w-7xl 限制最大宽度，并水平居中',
      dimension: '容器 & 布局',
    },
  ],
  '圆角 (Radius)': [
    {
      componentName: 'Card',
      cssClass: 'rounded-2xl',
      promptFragment: '使用 rounded-2xl 作为卡片圆角，提供柔和的视觉体验',
      dimension: '圆角 (Radius)',
    },
    {
      componentName: 'Button',
      cssClass: 'rounded-3xl',
      promptFragment: '使用 rounded-3xl 作为按钮圆角，更加圆润现代',
      dimension: '圆角 (Radius)',
    },
    {
      componentName: 'Input',
      cssClass: 'rounded-xl',
      promptFragment: '使用 rounded-xl 作为输入框圆角，保持一致性',
      dimension: '圆角 (Radius)',
    },
    {
      componentName: 'Badge',
      cssClass: 'rounded-full',
      promptFragment: '使用 rounded-full 作为徽章圆角，完全圆形',
      dimension: '圆角 (Radius)',
    },
  ],
  '背景 (Glass)': [
    {
      componentName: 'GlassCard',
      cssClass: 'bg-white/5 backdrop-blur-xl',
      promptFragment: '使用 bg-white/5 和 backdrop-blur-xl 实现毛玻璃效果，背景半透明并模糊',
      dimension: '背景 (Glass)',
    },
    {
      componentName: 'GlassPanel',
      cssClass: 'bg-white/10 backdrop-blur-2xl border border-white/10',
      promptFragment: '使用 bg-white/10 backdrop-blur-2xl 和 border border-white/10 实现高级毛玻璃面板',
      dimension: '背景 (Glass)',
    },
    {
      componentName: 'GlassButton',
      cssClass: 'bg-white/5 backdrop-blur-md hover:bg-white/10',
      promptFragment: '使用 bg-white/5 backdrop-blur-md，悬停时变为 bg-white/10',
      dimension: '背景 (Glass)',
    },
  ],
  '阴影 (Shadow)': [
    {
      componentName: 'CardShadow',
      cssClass: 'shadow-[0_20px_50px_rgba(0,0,0,0.3)]',
      promptFragment: '使用 shadow-[0_20px_50px_rgba(0,0,0,0.3)] 实现深度软阴影效果',
      dimension: '阴影 (Shadow)',
    },
    {
      componentName: 'ButtonShadow',
      cssClass: 'shadow-[0_10px_30px_rgba(99,102,241,0.3)]',
      promptFragment: '使用 shadow-[0_10px_30px_rgba(99,102,241,0.3)] 实现带颜色的按钮阴影',
      dimension: '阴影 (Shadow)',
    },
    {
      componentName: 'HoverShadow',
      cssClass: 'shadow-[0_25px_60px_rgba(0,0,0,0.4)]',
      promptFragment: '悬停时使用 shadow-[0_25px_60px_rgba(0,0,0,0.4)] 增强阴影深度',
      dimension: '阴影 (Shadow)',
    },
  ],
  '字体 (Typo)': [
    {
      componentName: 'Heading',
      cssClass: 'text-3xl font-semibold tracking-tight',
      promptFragment: '标题使用 text-3xl font-semibold tracking-tight，字重适中，字距紧凑',
      dimension: '字体 (Typo)',
    },
    {
      componentName: 'Body',
      cssClass: 'text-base leading-relaxed',
      promptFragment: '正文使用 text-base leading-relaxed，行高宽松易读',
      dimension: '字体 (Typo)',
    },
    {
      componentName: 'Caption',
      cssClass: 'text-sm text-white/60',
      promptFragment: '说明文字使用 text-sm text-white/60，较小字号，60% 透明度',
      dimension: '字体 (Typo)',
    },
    {
      componentName: 'Label',
      cssClass: 'text-sm font-medium tracking-wide',
      promptFragment: '标签使用 text-sm font-medium tracking-wide，中等字重，字距较宽',
      dimension: '字体 (Typo)',
    },
  ],
  '交互 (Motion)': [
    {
      componentName: 'HoverScale',
      cssClass: 'hover:scale-[1.02] transition-transform duration-300',
      promptFragment: '悬停时使用 hover:scale-[1.02] transition-transform duration-300 实现轻微放大效果',
      dimension: '交互 (Motion)',
    },
    {
      componentName: 'ClickScale',
      cssClass: 'active:scale-95 transition-transform duration-150',
      promptFragment: '点击时使用 active:scale-95 transition-transform duration-150 实现按下效果',
      dimension: '交互 (Motion)',
    },
    {
      componentName: 'SmoothTransition',
      cssClass: 'transition-all duration-300 ease-in-out',
      promptFragment: '使用 transition-all duration-300 ease-in-out 实现平滑过渡动画',
      dimension: '交互 (Motion)',
    },
  ],
  '色彩 (Color)': [
    {
      componentName: 'Primary',
      cssClass: 'bg-indigo-500 text-white',
      promptFragment: '主色使用 bg-indigo-500 text-white，靛蓝色背景配白色文字',
      dimension: '色彩 (Color)',
    },
    {
      componentName: 'PrimaryHover',
      cssClass: 'hover:bg-indigo-600',
      promptFragment: '主色悬停使用 hover:bg-indigo-600，稍深的靛蓝色',
      dimension: '色彩 (Color)',
    },
    {
      componentName: 'Accent',
      cssClass: 'text-indigo-400',
      promptFragment: '强调色使用 text-indigo-400，较亮的靛蓝色文字',
      dimension: '色彩 (Color)',
    },
    {
      componentName: 'Background',
      cssClass: 'bg-zinc-950',
      promptFragment: '背景使用 bg-zinc-950，深色背景',
      dimension: '色彩 (Color)',
    },
  ],
};
