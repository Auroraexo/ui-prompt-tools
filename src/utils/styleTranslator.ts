import type { ConfigState } from '../types/config';

// ===================== Tailwind → CSS 值映射表 =====================

const radiusMap: Record<string, string> = {
  'rounded-none': '0',
  'rounded-sm': '0.125rem',
  'rounded': '0.25rem',
  'rounded-md': '0.375rem',
  'rounded-lg': '0.5rem',
  'rounded-xl': '0.75rem',
  'rounded-2xl': '1rem',
  'rounded-3xl': '1.5rem',
  'rounded-full': '9999px',
};

const spacingMap: Record<string, string> = {
  '0': '0', '0.5': '0.125rem', '1': '0.25rem', '1.5': '0.375rem',
  '2': '0.5rem', '2.5': '0.625rem', '3': '0.75rem', '3.5': '0.875rem',
  '4': '1rem', '5': '1.25rem', '6': '1.5rem', '7': '1.75rem',
  '8': '2rem', '9': '2.25rem', '10': '2.5rem', '11': '2.75rem',
  '12': '3rem', '14': '3.5rem', '16': '4rem', '20': '5rem',
  '24': '6rem', '28': '7rem', '32': '8rem', '36': '9rem',
  '40': '10rem', '44': '11rem', '48': '12rem', '52': '13rem',
  '56': '14rem', '60': '15rem', '64': '16rem', '72': '18rem',
  '80': '20rem', '96': '24rem',
};

const colorMap: Record<string, string> = {
  'white': '#ffffff', 'black': '#000000', 'transparent': 'transparent',
  'slate-50': '#f8fafc', 'slate-100': '#f1f5f9', 'slate-200': '#e2e8f0',
  'slate-300': '#cbd5e1', 'slate-400': '#94a3b8', 'slate-500': '#64748b',
  'slate-600': '#475569', 'slate-700': '#334155', 'slate-800': '#1e293b',
  'slate-900': '#0f172a', 'slate-950': '#020617',
  'zinc-50': '#fafafa', 'zinc-100': '#f4f4f5', 'zinc-200': '#e4e4e7',
  'zinc-300': '#d4d4d8', 'zinc-400': '#a1a1aa', 'zinc-500': '#71717a',
  'zinc-600': '#52525b', 'zinc-700': '#3f3f46', 'zinc-800': '#27272a',
  'zinc-900': '#18181b', 'zinc-950': '#09090b',
  'red-400': '#f87171', 'red-500': '#ef4444', 'red-600': '#dc2626',
  'orange-400': '#fb923c', 'orange-500': '#f97316',
  'amber-400': '#fbbf24', 'amber-500': '#f59e0b',
  'yellow-400': '#facc15', 'yellow-500': '#eab308',
  'green-400': '#4ade80', 'green-500': '#22c55e', 'green-600': '#16a34a',
  'emerald-400': '#34d399', 'emerald-500': '#10b981', 'emerald-600': '#059669',
  'teal-400': '#2dd4bf', 'teal-500': '#14b8a6',
  'cyan-400': '#22d3ee', 'cyan-500': '#06b6d4',
  'sky-400': '#38bdf8', 'sky-500': '#0ea5e9',
  'blue-400': '#60a5fa', 'blue-500': '#3b82f6', 'blue-600': '#2563eb',
  'indigo-400': '#818cf8', 'indigo-500': '#6366f1', 'indigo-600': '#4f46e5',
  'violet-400': '#a78bfa', 'violet-500': '#8b5cf6',
  'purple-400': '#c084fc', 'purple-500': '#a855f7',
  'fuchsia-400': '#e879f9', 'fuchsia-500': '#d946ef',
  'pink-400': '#f472b6', 'pink-500': '#ec4899',
  'rose-400': '#fb7185', 'rose-500': '#f43f5e',
};

const fontSizeMap: Record<string, string> = {
  'text-xs': '0.75rem', 'text-sm': '0.875rem', 'text-base': '1rem',
  'text-lg': '1.125rem', 'text-xl': '1.25rem', 'text-2xl': '1.5rem',
  'text-3xl': '1.875rem', 'text-4xl': '2.25rem', 'text-5xl': '3rem',
  'text-6xl': '3.75rem', 'text-7xl': '4.5rem', 'text-8xl': '6rem',
  'text-9xl': '8rem',
};

const fontWeightMap: Record<string, string> = {
  'font-thin': '100', 'font-extralight': '200', 'font-light': '300',
  'font-normal': '400', 'font-medium': '500', 'font-semibold': '600',
  'font-bold': '700', 'font-extrabold': '800', 'font-black': '900',
};

const blurMap: Record<string, string> = {
  'backdrop-blur-none': '0', 'backdrop-blur-sm': '4px', 'backdrop-blur': '8px',
  'backdrop-blur-md': '12px', 'backdrop-blur-lg': '16px', 'backdrop-blur-xl': '24px',
  'backdrop-blur-2xl': '40px', 'backdrop-blur-3xl': '64px',
};

// ===================== 单个 Tailwind 类 → CSS 属性 =====================

function parseSingleClass(cls: string): string {
  const c = cls.trim();
  if (!c) return '';

  // border-radius
  if (radiusMap[c]) return `border-radius: ${radiusMap[c]}`;

  // padding
  const pMatch = c.match(/^p([xytblr]?)-(\[.+\]|[\d.]+)$/);
  if (pMatch) {
    const dir = pMatch[1];
    const rawVal = pMatch[2];
    const val = rawVal.startsWith('[') ? rawVal.slice(1, -1) : (spacingMap[rawVal] || `${rawVal}`);
    const propMap: Record<string, string> = {
      '': 'padding', 'x': 'padding-inline', 'y': 'padding-block',
      't': 'padding-top', 'b': 'padding-bottom', 'l': 'padding-left', 'r': 'padding-right',
    };
    return `${propMap[dir] || 'padding'}: ${val}`;
  }

  // margin
  const mMatch = c.match(/^m([xytblr]?)-(\[.+\]|[\d.]+)$/);
  if (mMatch) {
    const dir = mMatch[1];
    const rawVal = mMatch[2];
    const val = rawVal.startsWith('[') ? rawVal.slice(1, -1) : (spacingMap[rawVal] || `${rawVal}`);
    const propMap: Record<string, string> = {
      '': 'margin', 'x': 'margin-inline', 'y': 'margin-block',
      't': 'margin-top', 'b': 'margin-bottom', 'l': 'margin-left', 'r': 'margin-right',
    };
    return `${propMap[dir] || 'margin'}: ${val}`;
  }

  // gap
  const gapMatch = c.match(/^gap-(\[.+\]|[\d.]+)$/);
  if (gapMatch) {
    const rawVal = gapMatch[1];
    const val = rawVal.startsWith('[') ? rawVal.slice(1, -1) : (spacingMap[rawVal] || `${rawVal}`);
    return `gap: ${val}`;
  }

  // space-y / space-x (approximation)
  const spaceMatch = c.match(/^space-([xy])-(\[.+\]|[\d.]+)$/);
  if (spaceMatch) {
    const rawVal = spaceMatch[2];
    const val = rawVal.startsWith('[') ? rawVal.slice(1, -1) : (spacingMap[rawVal] || `${rawVal}`);
    return `/* ${c} */ gap: ${val}`;
  }

  // background color: bg-{color} or bg-{color}/{opacity}
  const bgMatch = c.match(/^bg-(.+?)(?:\/(\d+))?$/);
  if (bgMatch && !c.startsWith('bg-gradient') && !c.startsWith('bg-clip')) {
    const colorKey = bgMatch[1];
    const opacity = bgMatch[2];
    if (colorMap[colorKey]) {
      if (opacity) {
        return `background-color: ${hexToRgba(colorMap[colorKey], parseInt(opacity) / 100)}`;
      }
      return `background-color: ${colorMap[colorKey]}`;
    }
    // arbitrary value
    if (colorKey.startsWith('[')) {
      return `background-color: ${colorKey.slice(1, -1)}`;
    }
  }

  // text color: text-{color}/{opacity}
  const textColorMatch = c.match(/^text-((?:white|black|slate|zinc|red|orange|amber|yellow|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-\d+)?)(?:\/(\d+))?$/);
  if (textColorMatch) {
    const colorKey = textColorMatch[1];
    const opacity = textColorMatch[2];
    if (colorMap[colorKey]) {
      if (opacity) {
        return `color: ${hexToRgba(colorMap[colorKey], parseInt(opacity) / 100)}`;
      }
      return `color: ${colorMap[colorKey]}`;
    }
  }

  // text size
  if (fontSizeMap[c]) return `font-size: ${fontSizeMap[c]}`;

  // font weight
  if (fontWeightMap[c]) return `font-weight: ${fontWeightMap[c]}`;

  // tracking (letter-spacing)
  const trackingMap: Record<string, string> = {
    'tracking-tighter': '-0.05em', 'tracking-tight': '-0.025em', 'tracking-normal': '0em',
    'tracking-wide': '0.025em', 'tracking-wider': '0.05em', 'tracking-widest': '0.1em',
  };
  if (trackingMap[c]) return `letter-spacing: ${trackingMap[c]}`;

  // leading (line-height)
  const leadingMap: Record<string, string> = {
    'leading-none': '1', 'leading-tight': '1.25', 'leading-snug': '1.375',
    'leading-normal': '1.5', 'leading-relaxed': '1.625', 'leading-loose': '2',
  };
  if (leadingMap[c]) return `line-height: ${leadingMap[c]}`;

  // backdrop-blur
  if (blurMap[c]) return `backdrop-filter: blur(${blurMap[c]})`;

  // shadow (custom and standard)
  const shadowMatch = c.match(/^shadow-\[(.+)\]$/);
  if (shadowMatch) return `box-shadow: ${shadowMatch[1].replace(/_/g, ' ')}`;
  const stdShadowMap: Record<string, string> = {
    'shadow-sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    'shadow': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    'shadow-md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    'shadow-lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    'shadow-xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    'shadow-2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    'shadow-none': 'none',
  };
  if (stdShadowMap[c]) return `box-shadow: ${stdShadowMap[c]}`;

  // transition
  if (c === 'transition-all') return 'transition-property: all';
  if (c === 'transition-transform') return 'transition-property: transform';
  if (c === 'transition-colors') return 'transition-property: color, background-color, border-color';
  const durationMatch = c.match(/^duration-(\d+)$/);
  if (durationMatch) return `transition-duration: ${durationMatch[1]}ms`;
  if (c === 'ease-in-out') return 'transition-timing-function: ease-in-out';
  if (c === 'ease-in') return 'transition-timing-function: ease-in';
  if (c === 'ease-out') return 'transition-timing-function: ease-out';

  // transform scale (hover/active)
  const scaleMatch = c.match(/^(?:hover:|active:)?scale-\[?([\d.]+)\]?$/);
  if (scaleMatch) return `transform: scale(${scaleMatch[1]})`;
  if (c === 'hover:scale-105' || c === 'hover:scale-[1.02]') return `/* hover */ transform: scale(1.02)`;
  if (c === 'active:scale-95') return `/* active */ transform: scale(0.95)`;

  // max-width
  const maxWMap: Record<string, string> = {
    'max-w-xs': '20rem', 'max-w-sm': '24rem', 'max-w-md': '28rem',
    'max-w-lg': '32rem', 'max-w-xl': '36rem', 'max-w-2xl': '42rem',
    'max-w-3xl': '48rem', 'max-w-4xl': '56rem', 'max-w-5xl': '64rem',
    'max-w-6xl': '72rem', 'max-w-7xl': '80rem', 'max-w-full': '100%',
  };
  if (maxWMap[c]) return `max-width: ${maxWMap[c]}`;

  // mx-auto
  if (c === 'mx-auto') return 'margin-inline: auto';

  // border
  const borderMatch = c.match(/^border(?:-(.+?))?(?:\/(\d+))?$/);
  if (borderMatch && !c.includes('radius') && !c.includes('collapse')) {
    if (!borderMatch[1]) return 'border-width: 1px';
    if (colorMap[borderMatch[1]]) {
      const opacity = borderMatch[2];
      if (opacity) return `border-color: ${hexToRgba(colorMap[borderMatch[1]], parseInt(opacity) / 100)}`;
      return `border-color: ${colorMap[borderMatch[1]]}`;
    }
  }

  // flex / grid
  if (c === 'flex') return 'display: flex';
  if (c === 'grid') return 'display: grid';
  if (c === 'flex-col') return 'flex-direction: column';
  if (c === 'items-center') return 'align-items: center';
  if (c === 'justify-center') return 'justify-content: center';

  // grid-cols
  const gridColsMatch = c.match(/^grid-cols-(\d+)$/);
  if (gridColsMatch) return `grid-template-columns: repeat(${gridColsMatch[1]}, minmax(0, 1fr))`;

  // fallback: 返回注释形式的原始类名
  return `/* ${c} */`;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ===================== 导出格式生成器 =====================

/**
 * 将 ConfigState 转换为 CSS Variables 格式
 */
export function configToCSSVariables(config: ConfigState): string {
  const lines: string[] = [':root {'];

  Object.keys(config).forEach((dimension) => {
    const items = config[dimension];
    if (!items || items.length === 0) return;

    lines.push(`  /* ${dimension} */`);
    items.forEach((item) => {
      const varName = `--${toKebabCase(dimension)}-${toKebabCase(item.componentName)}`;
      lines.push(`  ${varName}: ${item.cssClass};`);

      // 尝试解析出具体 CSS 值
      const classes = item.cssClass.split(/\s+/).filter(Boolean);
      classes.forEach((cls) => {
        const parsed = parseSingleClass(cls);
        if (parsed && !parsed.startsWith('/*')) {
          const [prop, val] = parsed.split(/:\s*/);
          if (prop && val) {
            const subVarName = `${varName}-${toKebabCase(prop.trim())}`;
            lines.push(`  ${subVarName}: ${val.replace(';', '').trim()};`);
          }
        }
      });
    });
    lines.push('');
  });

  lines.push('}');
  return lines.join('\n');
}

/**
 * 将 ConfigState 转换为 JSON Theme 格式
 */
export function configToJSONTheme(config: ConfigState): string {
  const theme: Record<string, Record<string, unknown>> = {};

  Object.keys(config).forEach((dimension) => {
    const items = config[dimension];
    if (!items || items.length === 0) return;

    const dimKey = toKebabCase(dimension);
    theme[dimKey] = {};

    items.forEach((item) => {
      const compKey = toKebabCase(item.componentName);
      const parsed: Record<string, string> = {};
      const classes = item.cssClass.split(/\s+/).filter(Boolean);

      classes.forEach((cls) => {
        const result = parseSingleClass(cls);
        if (result && !result.startsWith('/*')) {
          const [prop, val] = result.split(/:\s*/);
          if (prop && val) {
            parsed[prop.trim()] = val.replace(';', '').trim();
          }
        }
      });

      theme[dimKey][compKey] = {
        tailwind: item.cssClass,
        css: Object.keys(parsed).length > 0 ? parsed : undefined,
        prompt: item.promptFragment,
      };
    });
  });

  return JSON.stringify(theme, null, 2);
}

/**
 * 将 ConfigState 转换为 Python Dict 格式
 */
export function configToPythonDict(config: ConfigState): string {
  const lines: string[] = ['THEME = {'];

  Object.keys(config).forEach((dimension) => {
    const items = config[dimension];
    if (!items || items.length === 0) return;

    const dimKey = toSnakeCase(dimension);
    lines.push(`    # ${dimension}`);
    lines.push(`    "${dimKey}": {`);

    items.forEach((item) => {
      const compKey = toSnakeCase(item.componentName);
      lines.push(`        "${compKey}": {`);
      lines.push(`            "tailwind": "${escapeStr(item.cssClass)}",`);
      lines.push(`            "prompt": "${escapeStr(item.promptFragment)}",`);

      // 解析 CSS 值
      const classes = item.cssClass.split(/\s+/).filter(Boolean);
      const cssProps: string[] = [];
      classes.forEach((cls) => {
        const result = parseSingleClass(cls);
        if (result && !result.startsWith('/*')) {
          cssProps.push(`                "${result.split(':')[0].trim()}": "${result.split(':').slice(1).join(':').trim().replace(';', '')}"`);
        }
      });
      if (cssProps.length > 0) {
        lines.push(`            "css": {`);
        lines.push(cssProps.join(',\n'));
        lines.push(`            },`);
      }
      lines.push(`        },`);
    });

    lines.push(`    },`);
  });

  lines.push('}');
  return lines.join('\n');
}

/**
 * 将 ConfigState 转换为 Raw CSS 格式
 */
export function configToRawCSS(config: ConfigState): string {
  const lines: string[] = ['/* UI Theme - Auto Generated */\n'];

  Object.keys(config).forEach((dimension) => {
    const items = config[dimension];
    if (!items || items.length === 0) return;

    lines.push(`/* ====== ${dimension} ====== */`);

    items.forEach((item) => {
      const selector = `.${toKebabCase(item.componentName)}`;
      const classes = item.cssClass.split(/\s+/).filter(Boolean);
      const props: string[] = [];

      // 分离 hover/active 状态
      const normalClasses: string[] = [];
      const hoverClasses: string[] = [];
      const activeClasses: string[] = [];

      classes.forEach((cls) => {
        if (cls.startsWith('hover:')) {
          hoverClasses.push(cls.replace('hover:', ''));
        } else if (cls.startsWith('active:')) {
          activeClasses.push(cls.replace('active:', ''));
        } else if (!cls.startsWith('md:') && !cls.startsWith('lg:') && !cls.startsWith('xl:')) {
          normalClasses.push(cls);
        }
      });

      normalClasses.forEach((cls) => {
        const result = parseSingleClass(cls);
        if (result && !result.startsWith('/*')) {
          props.push(`  ${result};`);
        }
      });

      if (props.length > 0) {
        lines.push(`${selector} {`);
        lines.push(`  /* ${item.promptFragment} */`);
        props.forEach((p) => lines.push(p));
        lines.push('}\n');
      }

      // hover
      if (hoverClasses.length > 0) {
        const hoverProps: string[] = [];
        hoverClasses.forEach((cls) => {
          const result = parseSingleClass(cls);
          if (result) {
            const clean = result.replace(/\/\* hover \*\/ ?/, '').replace(/\/\* .+ \*\/ ?/, '');
            if (clean) hoverProps.push(`  ${clean};`);
          }
        });
        if (hoverProps.length > 0) {
          lines.push(`${selector}:hover {`);
          hoverProps.forEach((p) => lines.push(p));
          lines.push('}\n');
        }
      }

      // active
      if (activeClasses.length > 0) {
        const activeProps: string[] = [];
        activeClasses.forEach((cls) => {
          const result = parseSingleClass(cls);
          if (result) {
            const clean = result.replace(/\/\* active \*\/ ?/, '').replace(/\/\* .+ \*\/ ?/, '');
            if (clean) activeProps.push(`  ${clean};`);
          }
        });
        if (activeProps.length > 0) {
          lines.push(`${selector}:active {`);
          activeProps.forEach((p) => lines.push(p));
          lines.push('}\n');
        }
      }
    });

    lines.push('');
  });

  return lines.join('\n');
}

/**
 * 生成 Tailwind Config (tailwind.config.js) 格式
 */
export function configToTailwindConfig(config: ConfigState): string {
  const theme: Record<string, Record<string, string>> = {};

  Object.keys(config).forEach((dimension) => {
    const items = config[dimension];
    if (!items || items.length === 0) return;

    items.forEach((item) => {
      const classes = item.cssClass.split(/\s+/).filter(Boolean);
      classes.forEach((cls) => {
        // 提取自定义值
        const customMatch = cls.match(/^(\w+)-\[(.+)\]$/);
        if (customMatch) {
          const category = customMatch[1];
          if (!theme[category]) theme[category] = {};
          theme[category][toKebabCase(item.componentName)] = customMatch[2].replace(/_/g, ' ');
        }
      });
    });
  });

  return `/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: ${JSON.stringify(theme, null, 6).replace(/"([^"]+)":/g, '$1:').replace(/"/g, "'")},
  },
}`;
}

// ===================== 工具函数 =====================

function toKebabCase(str: string): string {
  return str
    .replace(/[（(]/g, '-')
    .replace(/[）)]/g, '')
    .replace(/[&\s]+/g, '-')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function toSnakeCase(str: string): string {
  return toKebabCase(str).replace(/-/g, '_');
}

function escapeStr(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export type TranslateFormat = 'tailwind' | 'css-variables' | 'json-theme' | 'python-dict' | 'raw-css' | 'tailwind-config';

export function translateConfig(config: ConfigState, format: TranslateFormat): string {
  switch (format) {
    case 'css-variables':
      return configToCSSVariables(config);
    case 'json-theme':
      return configToJSONTheme(config);
    case 'python-dict':
      return configToPythonDict(config);
    case 'raw-css':
      return configToRawCSS(config);
    case 'tailwind-config':
      return configToTailwindConfig(config);
    case 'tailwind':
    default:
      return generateTailwindOutput(config);
  }
}

function generateTailwindOutput(config: ConfigState): string {
  const lines: string[] = [];
  Object.keys(config).forEach((dimension) => {
    const items = config[dimension];
    if (!items || items.length === 0) return;
    lines.push(`/* ${dimension} */`);
    items.forEach((item) => {
      lines.push(`// ${item.componentName}: ${item.cssClass}`);
    });
    lines.push('');
  });
  return lines.join('\n');
}

export function getFormatFileExtension(format: TranslateFormat): string {
  switch (format) {
    case 'css-variables': return 'css';
    case 'json-theme': return 'json';
    case 'python-dict': return 'py';
    case 'raw-css': return 'css';
    case 'tailwind-config': return 'js';
    case 'tailwind': return 'txt';
    default: return 'txt';
  }
}

export function getFormatFileName(format: TranslateFormat): string {
  switch (format) {
    case 'css-variables': return 'theme-variables.css';
    case 'json-theme': return 'theme.json';
    case 'python-dict': return 'theme.py';
    case 'raw-css': return 'theme.css';
    case 'tailwind-config': return 'tailwind.config.js';
    case 'tailwind': return 'tailwind-classes.txt';
    default: return 'theme.txt';
  }
}
