import { Router } from 'express';
import { env } from '../../config/env.js';

export const aiRouter = Router();

aiRouter.post('/chat', async (req, res, next) => {
  try {
    const { contents, systemInstruction, model = 'gemini-1.5-flash', apiKey } = req.body || {};
    const activeKey = (apiKey !== undefined ? apiKey : (env.GEMINI_API_KEY || '')).trim();

    if (!activeKey) {
      return res.status(400).json({
        error: {
          code: 'MISSING_API_KEY',
          message: 'Gemini API key is not configured on server or request.',
        },
      });
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${activeKey}`;

    const payload = {
      contents: contents || [],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1024,
      },
    };

    if (systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: {
          code: 'GEMINI_API_ERROR',
          message: data.error?.message || 'Gemini API error occurred.',
        },
      });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.status(200).json({
      data: {
        reply: text,
        model,
      },
    });
  } catch (err) {
    next(err);
  }
});
