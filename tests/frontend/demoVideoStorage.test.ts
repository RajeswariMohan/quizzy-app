import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearDemoVideoBlob,
  loadDemoVideoBlob,
  saveDemoVideoBlob,
} from '@/utils/demoVideoStorage';
import { installFakeIndexedDB } from './helpers/fakeIndexedDb';

describe('demoVideoStorage', () => {
  beforeEach(() => {
    installFakeIndexedDB();
  });

  afterEach(async () => {
    await clearDemoVideoBlob().catch(() => undefined);
  });

  it('returns null when no video was saved', async () => {
    await clearDemoVideoBlob();
    const blob = await loadDemoVideoBlob();
    expect(blob).toBeNull();
  });

  it('saves and loads a video blob (happy path)', async () => {
    const data = new Uint8Array([1, 2, 3, 4]);
    const original = new Blob([data], { type: 'video/mp4' });
    await saveDemoVideoBlob(original);

    const loaded = await loadDemoVideoBlob();
    expect(loaded).not.toBeNull();
    expect(loaded?.type).toBe('video/mp4');
    expect(loaded?.size).toBe(original.size);
  });

  it('clears stored video (negative then happy)', async () => {
    await saveDemoVideoBlob(new Blob(['x'], { type: 'video/webm' }));
    await clearDemoVideoBlob();
    const loaded = await loadDemoVideoBlob();
    expect(loaded).toBeNull();
  });

  it('overwrites previous upload when saving again', async () => {
    await saveDemoVideoBlob(new Blob(['small'], { type: 'video/mp4' }));
    await saveDemoVideoBlob(new Blob(['much-larger-payload'], { type: 'video/mp4' }));
    const loaded = await loadDemoVideoBlob();
    expect(loaded?.size).toBeGreaterThan(5);
  });
});
