import type { ConfigState } from '../types/config';
import { STORAGE_KEYS } from './keys';
import type { ExpandedByDimension } from './schema';
import { normalizeExpandedByDimension } from './schema';
import { migrateConfigEnvelope } from './migrations';

type LoadResult<T> = {
  value: T;
  error?: string;
  migrated?: boolean;
};

function safeParseJson(raw: string): { ok: true; value: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'JSON parse error' };
  }
}

function safeStringifyJson(value: unknown): { ok: true; json: string } | { ok: false; error: string } {
  try {
    return { ok: true, json: JSON.stringify(value) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'JSON stringify error' };
  }
}

function backupKey(baseKey: string): string {
  return `${baseKey}.bak.${Date.now()}`;
}

function canUseLocalStorage(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
}

export function loadConfig(opts: { fallback: ConfigState }): LoadResult<ConfigState> {
  if (!canUseLocalStorage()) return { value: opts.fallback };

  const raw = window.localStorage.getItem(STORAGE_KEYS.config);
  if (!raw) return { value: opts.fallback };

  const parsed = safeParseJson(raw);
  if (!parsed.ok) {
    return { value: opts.fallback, error: `读取配置失败（JSON 解析错误）：${parsed.error}` };
  }

  const { envelope, migrated } = migrateConfigEnvelope(parsed.value, opts.fallback);

  if (migrated) {
    // 迁移前先备份原始值
    try {
      window.localStorage.setItem(backupKey(STORAGE_KEYS.config), raw);
    } catch {
      // ignore backup failures
    }
    // 迁移成功后写回新格式
    saveConfig(envelope.data);
  }

  return { value: envelope.data, migrated };
}

export function saveConfig(config: ConfigState): LoadResult<true> {
  if (!canUseLocalStorage()) return { value: true };
  const envelope = { version: 1 as const, updatedAt: Date.now(), data: config };
  const str = safeStringifyJson(envelope);
  if (!str.ok) return { value: true, error: `保存配置失败（JSON 序列化错误）：${str.error}` };
  try {
    window.localStorage.setItem(STORAGE_KEYS.config, str.json);
  } catch (e) {
    return {
      value: true,
      error: `保存配置失败：${e instanceof Error ? e.message : 'unknown error'}`,
    };
  }
  return { value: true };
}

export function loadExpandedByDimension(): LoadResult<ExpandedByDimension> {
  if (!canUseLocalStorage()) return { value: {} };
  const raw = window.localStorage.getItem(STORAGE_KEYS.expandedByDimension);
  if (!raw) return { value: {} };
  const parsed = safeParseJson(raw);
  if (!parsed.ok) {
    return { value: {}, error: `读取展开状态失败（JSON 解析错误）：${parsed.error}` };
  }
  return { value: normalizeExpandedByDimension(parsed.value) };
}

export function saveExpandedByDimension(state: ExpandedByDimension): LoadResult<true> {
  if (!canUseLocalStorage()) return { value: true };
  const str = safeStringifyJson(state);
  if (!str.ok) return { value: true, error: `保存展开状态失败（JSON 序列化错误）：${str.error}` };
  try {
    window.localStorage.setItem(STORAGE_KEYS.expandedByDimension, str.json);
  } catch (e) {
    return {
      value: true,
      error: `保存展开状态失败：${e instanceof Error ? e.message : 'unknown error'}`,
    };
  }
  return { value: true };
}

