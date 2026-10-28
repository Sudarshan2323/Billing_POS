import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';

describe('Server API Endpoints', () => {
  const app = createApp();

  it('GET /health returns 200 with status ok and timestamp', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('GET /api/v1/health returns 200 with version v1', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('status', 'ok');
    expect(res.body.data).toHaveProperty('version', 'v1');
  });

  it('GET non-existent route returns 404 with structured error envelope', async () => {
    const res = await request(app).get('/unknown-test-route');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
  });

  it('attaches x-request-id header', async () => {
    const res = await request(app).get('/health');
    expect(res.headers).toHaveProperty('x-request-id');
  });

  it('POST /api/v1/ai/chat returns 400 when API key is missing', async () => {
    const res = await request(app)
      .post('/api/v1/ai/chat')
      .send({ apiKey: '', contents: [{ role: 'user', parts: [{ text: 'Hello' }] }] });
    expect(res.status).toBe(400);
    expect(res.body.error).toHaveProperty('code', 'MISSING_API_KEY');
  });
});
