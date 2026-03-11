import type { ConfigState, UIConfig } from '../types/config';

export type ExpandedByDimension = Record<string, boolean>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function normalizeString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function normalizeUIConfig(raw: unknown, dimension: string): UIConfig | null {
  if (!isPlainObject(raw)) return null;
  const componentName = normalizeString(raw.componentName).trim();
  const cssClass = normalizeString(raw.cssClass).trim();
  const promptFragment = normalizeString(raw.promptFragment).trim();

  if (!componentName && !cssClass && !promptFragment) return null;

  return {
    componentName,
    cssClass,
    promptFragment,
    dimension: normalizeString(raw.dimension, dimension) || dimension,
  };
}

export function isConfigState(value: unknown): value is ConfigState {
  if (!isPlainObject(value)) return false;
  const keys = Object.keys(value);
  if (keys.length === 0) return false;
  return keys.some((k) => Array.isArray((value as Record<string, unknown>)[k]));
}

export function normalizeConfigState(value: unknown, fallback: ConfigState): ConfigState {
  if (!isPlainObject(value)) return fallback;
  const out: ConfigState = {};

  for (const dimension of Object.keys(value)) {
    const rawItems = (value as Record<string, unknown>)[dimension];
    if (!Array.isArray(rawItems)) continue;

    const items: UIConfig[] = [];
    for (const rawItem of rawItems) {
      const normalized = normalizeUIConfig(rawItem, dimension);
      if (normalized) items.push(normalized);
    }

    if (items.length > 0) out[dimension] = items;
  }

  return Object.keys(out).length > 0 ? out : fallback;
}

export function normalizeExpandedByDimension(value: unknown): ExpandedByDimension {
  if (!isPlainObject(value)) return {};
  const out: ExpandedByDimension = {};
  for (const [k, v] of Object.entries(value)) {
    if (typeof v === 'boolean') out[k] = v;
  }
  return out;
}

