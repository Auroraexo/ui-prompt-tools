import type { ConfigState } from '../types/config';
import { isConfigState, normalizeConfigState } from './schema';

export const STORAGE_VERSION = 1 as const;
export type StorageVersion = typeof STORAGE_VERSION;

export type ConfigEnvelopeV1 = {
  version: 1;
  updatedAt: number;
  data: ConfigState;
};

type UnknownEnvelope = {
  version?: unknown;
  updatedAt?: unknown;
  data?: unknown;
};

export type MigrationResult = {
  envelope: ConfigEnvelopeV1;
  migrated: boolean;
};

function now(): number {
  return Date.now();
}

function isV1Envelope(value: unknown): value is ConfigEnvelopeV1 {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const v = value as UnknownEnvelope;
  return v.version === 1 && typeof v.updatedAt === 'number' && !!v.data;
}

/**
 * 接受两种输入形态并升级到 v1：
 * - v0：直接 ConfigState（历史存储）
 * - v1：{ version, updatedAt, data }
 */
export function migrateConfigEnvelope(
  raw: unknown,
  fallback: ConfigState
): MigrationResult {
  // v1
  if (isV1Envelope(raw)) {
    return {
      envelope: {
        version: 1,
        updatedAt: raw.updatedAt,
        data: normalizeConfigState(raw.data, fallback),
      },
      migrated: false,
    };
  }

  // v0: 直接 ConfigState
  if (isConfigState(raw)) {
    return {
      envelope: {
        version: 1,
        updatedAt: now(),
        data: normalizeConfigState(raw, fallback),
      },
      migrated: true,
    };
  }

  // 其他：回退
  return {
    envelope: { version: 1, updatedAt: now(), data: fallback },
    migrated: false,
  };
}

