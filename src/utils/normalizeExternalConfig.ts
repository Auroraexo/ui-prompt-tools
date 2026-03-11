import type { ConfigState } from '../types/config';
import { isConfigState, normalizeConfigState } from '../storage/schema';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

/**
 * 将基于 AI 提取结果保存的预设（normalized 结构：radius/spacing/colors/...）
 * 转换为 ConfigState 结构。
 */
export function convertExtractedPresetToConfig(raw: unknown): ConfigState {
  const out: Record<string, Array<Record<string, unknown>>> = {};
  if (!isPlainObject(raw)) return {} as ConfigState;

  const radius = isPlainObject(raw.radius) ? (raw.radius as Record<string, unknown>) : null;
  const spacing = isPlainObject(raw.spacing) ? (raw.spacing as Record<string, unknown>) : null;
  const colors = isPlainObject(raw.colors) ? (raw.colors as Record<string, unknown>) : null;
  const shadows = isPlainObject(raw.shadows) ? (raw.shadows as Record<string, unknown>) : null;
  const glass = isPlainObject(raw.glass_effect) ? (raw.glass_effect as Record<string, unknown>) : null;
  const typo = isPlainObject(raw.typography) ? (raw.typography as Record<string, unknown>) : null;
  const anim = isPlainObject(raw.animations) ? (raw.animations as Record<string, unknown>) : null;

  const get = (obj: Record<string, unknown> | null, key: string): string | undefined => {
    const v = obj ? obj[key] : undefined;
    return typeof v === 'string' ? v : undefined;
  };

  if (radius) {
    out['圆角 (Radius)'] = [
      {
        componentName: 'Card',
        cssClass: get(radius, '卡片圆角') || 'rounded-2xl',
        promptFragment: `使用 ${get(radius, '卡片圆角') || 'rounded-2xl'} 作为卡片圆角`,
        dimension: '圆角 (Radius)',
      },
      {
        componentName: 'Button',
        cssClass: get(radius, '按钮圆角') || 'rounded-3xl',
        promptFragment: `使用 ${get(radius, '按钮圆角') || 'rounded-3xl'} 作为按钮圆角`,
        dimension: '圆角 (Radius)',
      },
      {
        componentName: 'Input',
        cssClass: get(radius, '输入框圆角') || 'rounded-xl',
        promptFragment: `使用 ${get(radius, '输入框圆角') || 'rounded-xl'} 作为输入框圆角`,
        dimension: '圆角 (Radius)',
      },
    ];
  }

  if (spacing) {
    out['容器 & 布局'] = [
      {
        componentName: 'Container',
        cssClass: get(spacing, '容器内边距') || 'p-8',
        promptFragment: `使用 ${get(spacing, '容器内边距') || 'p-8'} 作为容器内边距`,
        dimension: '容器 & 布局',
      },
      {
        componentName: 'Grid',
        cssClass: get(spacing, '元素间距') || 'gap-6',
        promptFragment: `使用 ${get(spacing, '元素间距') || 'gap-6'} 控制元素间距`,
        dimension: '容器 & 布局',
      },
    ];
  }

  if (colors) {
    out['色彩 (Color)'] = [
      {
        componentName: 'Primary',
        cssClass: `bg-${get(colors, '主色') || 'indigo-500'} text-white`,
        promptFragment: `主色使用 bg-${get(colors, '主色') || 'indigo-500'} text-white`,
        dimension: '色彩 (Color)',
      },
      {
        componentName: 'Background',
        cssClass: `bg-${get(colors, '背景色') || 'zinc-950'}`,
        promptFragment: `背景使用 bg-${get(colors, '背景色') || 'zinc-950'}`,
        dimension: '色彩 (Color)',
      },
    ];

    const caption = get(colors, '文字透明度');
    if (caption) {
      out['色彩 (Color)'].push({
        componentName: 'Caption',
        cssClass: caption,
        promptFragment: `说明文字使用 ${caption}`,
        dimension: '色彩 (Color)',
      });
    }
  }

  if (shadows) {
    out['阴影 (Shadow)'] = [];
    const card = get(shadows, '卡片阴影');
    if (card) {
      out['阴影 (Shadow)'].push({
        componentName: 'CardShadow',
        cssClass: card,
        promptFragment: `使用 ${card} 实现卡片阴影`,
        dimension: '阴影 (Shadow)',
      });
    }
    const btn = get(shadows, '按钮阴影');
    if (btn) {
      out['阴影 (Shadow)'].push({
        componentName: 'ButtonShadow',
        cssClass: btn,
        promptFragment: `使用 ${btn} 实现按钮阴影`,
        dimension: '阴影 (Shadow)',
      });
    }
  }

  const glassVal = get(glass, '毛玻璃');
  if (glassVal) {
    out['背景 (Glass)'] = [
      {
        componentName: 'GlassCard',
        cssClass: glassVal,
        promptFragment: `使用 ${glassVal} 实现毛玻璃效果`,
        dimension: '背景 (Glass)',
      },
    ];
  }

  if (typo) {
    out['字体 (Typo)'] = [];
    const heading = get(typo, '标题');
    if (heading) {
      out['字体 (Typo)'].push({
        componentName: 'Heading',
        cssClass: heading,
        promptFragment: `标题使用 ${heading}`,
        dimension: '字体 (Typo)',
      });
    }
    const body = get(typo, '正文');
    if (body) {
      out['字体 (Typo)'].push({
        componentName: 'Body',
        cssClass: body,
        promptFragment: `正文使用 ${body}`,
        dimension: '字体 (Typo)',
      });
    }
  }

  if (anim) {
    out['交互 (Motion)'] = [];
    const hover = get(anim, '悬停');
    if (hover) {
      out['交互 (Motion)'].push({
        componentName: 'HoverScale',
        cssClass: hover,
        promptFragment: `悬停时使用 ${hover}`,
        dimension: '交互 (Motion)',
      });
    }
    const active = get(anim, '点击');
    if (active) {
      out['交互 (Motion)'].push({
        componentName: 'ClickScale',
        cssClass: active,
        promptFragment: `点击时使用 ${active}`,
        dimension: '交互 (Motion)',
      });
    }
  }

  return out as unknown as ConfigState;
}

/**
 * 将视觉反向工程接口返回的 params（中文维度键）
 * 转换为 Partial<ConfigState> 结构，便于批量回填。
 */
export function convertAIParamsToPartialConfig(params: unknown): Partial<ConfigState> {
  const config: Partial<ConfigState> = {};
  if (!isPlainObject(params)) return config;
  const p = params as Record<string, unknown>;

  const dim = (k: string) => (isPlainObject(p[k]) ? (p[k] as Record<string, unknown>) : null);
  const get = (obj: Record<string, unknown> | null, key: string): string | undefined => {
    const v = obj ? obj[key] : undefined;
    return typeof v === 'string' ? v : undefined;
  };

  const radius = dim('圆角');
  if (radius) {
    config['圆角 (Radius)'] = [
      {
        componentName: 'Card',
        cssClass: get(radius, '卡片圆角') || 'rounded-2xl',
        promptFragment: `使用 ${get(radius, '卡片圆角') || 'rounded-2xl'} 作为卡片圆角`,
        dimension: '圆角 (Radius)',
      },
      {
        componentName: 'Button',
        cssClass: get(radius, '按钮圆角') || 'rounded-3xl',
        promptFragment: `使用 ${get(radius, '按钮圆角') || 'rounded-3xl'} 作为按钮圆角`,
        dimension: '圆角 (Radius)',
      },
      {
        componentName: 'Input',
        cssClass: get(radius, '输入框圆角') || 'rounded-xl',
        promptFragment: `使用 ${get(radius, '输入框圆角') || 'rounded-xl'} 作为输入框圆角`,
        dimension: '圆角 (Radius)',
      },
    ];
  }

  const spacing = dim('间距');
  if (spacing) {
    config['容器 & 布局'] = [
      {
        componentName: 'Container',
        cssClass: get(spacing, '容器内边距') || 'p-8',
        promptFragment: `使用 ${get(spacing, '容器内边距') || 'p-8'} 作为容器内边距`,
        dimension: '容器 & 布局',
      },
      {
        componentName: 'Grid',
        cssClass: get(spacing, '元素间距') || 'gap-6',
        promptFragment: `使用 ${get(spacing, '元素间距') || 'gap-6'} 控制元素间距`,
        dimension: '容器 & 布局',
      },
    ];
  }

  const colors = dim('配色');
  if (colors) {
    config['色彩 (Color)'] = [
      {
        componentName: 'Primary',
        cssClass: `bg-${get(colors, '主色') || 'indigo-500'} text-white`,
        promptFragment: `主色使用 bg-${get(colors, '主色') || 'indigo-500'} text-white`,
        dimension: '色彩 (Color)',
      },
      {
        componentName: 'Background',
        cssClass: `bg-${get(colors, '背景色') || 'zinc-950'}`,
        promptFragment: `背景使用 bg-${get(colors, '背景色') || 'zinc-950'}`,
        dimension: '色彩 (Color)',
      },
    ];
    const caption = get(colors, '文字透明度');
    if (caption) {
      config['色彩 (Color)'].push({
        componentName: 'Caption',
        cssClass: caption,
        promptFragment: `说明文字使用 ${caption}`,
        dimension: '色彩 (Color)',
      });
    }
  }

  const shadows = dim('阴影');
  if (shadows) {
    config['阴影 (Shadow)'] = [];
    const card = get(shadows, '卡片阴影');
    if (card) {
      config['阴影 (Shadow)'].push({
        componentName: 'CardShadow',
        cssClass: card,
        promptFragment: `使用 ${card} 实现卡片阴影`,
        dimension: '阴影 (Shadow)',
      });
    }
    const btn = get(shadows, '按钮阴影');
    if (btn) {
      config['阴影 (Shadow)'].push({
        componentName: 'ButtonShadow',
        cssClass: btn,
        promptFragment: `使用 ${btn} 实现按钮阴影`,
        dimension: '阴影 (Shadow)',
      });
    }
  }

  const glassFx = dim('背景效果');
  const glassVal = get(glassFx, '毛玻璃');
  if (glassVal) {
    config['背景 (Glass)'] = [
      {
        componentName: 'GlassCard',
        cssClass: glassVal,
        promptFragment: `使用 ${glassVal} 实现毛玻璃效果`,
        dimension: '背景 (Glass)',
      },
    ];
  }

  const typo = dim('字体');
  if (typo) {
    config['字体 (Typo)'] = [];
    const heading = get(typo, '标题');
    if (heading) {
      config['字体 (Typo)'].push({
        componentName: 'Heading',
        cssClass: heading,
        promptFragment: `标题使用 ${heading}`,
        dimension: '字体 (Typo)',
      });
    }
    const body = get(typo, '正文');
    if (body) {
      config['字体 (Typo)'].push({
        componentName: 'Body',
        cssClass: body,
        promptFragment: `正文使用 ${body}`,
        dimension: '字体 (Typo)',
      });
    }
  }

  const motion = dim('交互动画');
  if (motion) {
    config['交互 (Motion)'] = [];
    const hover = get(motion, '悬停');
    if (hover) {
      config['交互 (Motion)'].push({
        componentName: 'HoverScale',
        cssClass: hover,
        promptFragment: `悬停时使用 ${hover}`,
        dimension: '交互 (Motion)',
      });
    }
    const active = get(motion, '点击');
    if (active) {
      config['交互 (Motion)'].push({
        componentName: 'ClickScale',
        cssClass: active,
        promptFragment: `点击时使用 ${active}`,
        dimension: '交互 (Motion)',
      });
    }
  }

  return config;
}

export function coercePresetConfigData(rawConfig: unknown, fallback: ConfigState): ConfigState {
  if (isConfigState(rawConfig)) {
    return normalizeConfigState(rawConfig, fallback);
  }

  const converted = convertExtractedPresetToConfig(rawConfig);
  return normalizeConfigState(converted, fallback);
}

