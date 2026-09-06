import { test, expect, request } from '@playwright/test';
import { API_URL, readState, authHeaders } from './helpers';

test.describe('YouTube Channel Search', () => {
  test('search for channels', async () => {
    const state = readState();
    const ctx = await request.newContext({ baseURL: API_URL });
    const res = await ctx.get('/api/youtube/channels?query=breaking+points', {
      headers: authHeaders(state.token)
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body) || body.items || body.channels || body.results).toBeTruthy();
    await ctx.dispose();
  });
});

// BCD-144: account linking, subscription-based channel picker, subscription feed.
// The global-setup test user is freshly registered per run and never has a linked
// Google account, so these exercise the "not linked" / unauthenticated paths only —
// the real OAuth exchange (serverAuthCode -> tokens) needs a real Google consent
// screen and is covered by on-device manual QA instead (see
// ionic-yt-airecaps/docs/testing/BCD-144-test-plan.md).
test.describe('YouTube Account Linking', () => {
  test('link-status reports not linked for a fresh account', async () => {
    const state = readState();
    const ctx = await request.newContext({ baseURL: API_URL });
    const res = await ctx.get('/api/youtube/link-status', {
      headers: authHeaders(state.token)
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ linked: false });
    await ctx.dispose();
  });

  test('subscriptions returns 400 when no account is linked', async () => {
    const state = readState();
    const ctx = await request.newContext({ baseURL: API_URL });
    const res = await ctx.get('/api/youtube/subscriptions', {
      headers: authHeaders(state.token)
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('No linked YouTube account');
    await ctx.dispose();
  });

  test('subscription-feed returns 400 when no account is linked', async () => {
    const state = readState();
    const ctx = await request.newContext({ baseURL: API_URL });
    const res = await ctx.get('/api/youtube/subscription-feed', {
      headers: authHeaders(state.token)
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('No linked YouTube account');
    await ctx.dispose();
  });

  test('unlink returns 404 when there is nothing to unlink', async () => {
    const state = readState();
    const ctx = await request.newContext({ baseURL: API_URL });
    const res = await ctx.delete('/api/youtube/link-account', {
      headers: authHeaders(state.token)
    });
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.error).toContain('No linked YouTube account');
    await ctx.dispose();
  });

  test('all linking endpoints require auth', async () => {
    const ctx = await request.newContext({ baseURL: API_URL });

    const linkStatus = await ctx.get('/api/youtube/link-status');
    expect(linkStatus.status()).toBe(401);

    const subscriptions = await ctx.get('/api/youtube/subscriptions');
    expect(subscriptions.status()).toBe(401);

    const feed = await ctx.get('/api/youtube/subscription-feed');
    expect(feed.status()).toBe(401);

    const unlink = await ctx.delete('/api/youtube/link-account');
    expect(unlink.status()).toBe(401);

    const link = await ctx.post('/api/youtube/link-account', { data: {} });
    expect(link.status()).toBe(401);

    await ctx.dispose();
  });
});
