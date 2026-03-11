import { defaultConfig } from '../src/data/defaultConfig.ts';
import { migrateConfigEnvelope } from '../src/storage/migrations.ts';
import { normalizeConfigState, normalizeExpandedByDimension } from '../src/storage/schema.ts';

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`Assertion failed: ${msg}`);
}

function run(): void {
  // v0 -> v1 migration: raw ConfigState
  const v0 = {
    '圆角 (Radius)': [
      { componentName: 'Card', cssClass: 'rounded-2xl', promptFragment: 'x', dimension: '圆角 (Radius)' },
    ],
  };
  const m0 = migrateConfigEnvelope(v0, defaultConfig);
  assert(m0.migrated === true, 'v0 should be migrated');
  assert(m0.envelope.version === 1, 'envelope version should be 1');
  assert(m0.envelope.data['圆角 (Radius)']?.length === 1, 'migrated data should keep dimension items');

  // v1: keep updatedAt and normalize
  const v1 = { version: 1 as const, updatedAt: 123, data: v0 };
  const m1 = migrateConfigEnvelope(v1, defaultConfig);
  assert(m1.migrated === false, 'v1 should not be migrated');
  assert(m1.envelope.updatedAt === 123, 'updatedAt should be preserved');

  // dirty config: not object -> fallback
  const n1 = normalizeConfigState('oops', defaultConfig);
  assert(Object.keys(n1).length === Object.keys(defaultConfig).length, 'invalid config should fallback');

  // expanded state normalization
  const e1 = normalizeExpandedByDimension({ a: true, b: 'no', c: false });
  assert(e1.a === true && e1.c === false && !('b' in e1), 'expandedByDimension should keep only booleans');

  // empty object config -> fallback
  const n2 = normalizeConfigState({}, defaultConfig);
  assert(Object.keys(n2).length === Object.keys(defaultConfig).length, 'empty config should fallback');

  console.log('storage-selftest OK');
}

run();

