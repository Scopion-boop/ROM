/**
 * llm-client.ts — Server-side LLM wrapper for clinical interpretation.
 *
 * Supports OpenAI (gpt-4o) and Anthropic Claude. Selection is based on
 * which API key is present in the environment. Falls back gracefully.
 *
 * This file runs SERVER-SIDE ONLY (used from API routes).
 */

import { MSK_SYSTEM_PROMPT } from './system-prompt';

export interface InterpretationResult {
    interpretation: string;
    recommendations: {
        name: string;
        purpose: string;
        rationale: string;
        priority: 'high' | 'medium' | 'low';
    }[];
}

// ─── OpenAI ────────────────────────────────────────────────────────

async function callOpenAI(userPrompt: string): Promise<InterpretationResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY not set');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: process.env.OPENAI_MODEL ?? 'gpt-4o',
            messages: [
                { role: 'system', content: MSK_SYSTEM_PROMPT },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.3,
            max_tokens: 2000,
            response_format: { type: 'json_object' },
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenAI API error ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty response from OpenAI');

    return JSON.parse(content) as InterpretationResult;
}

// ─── Anthropic Claude ──────────────────────────────────────────────

async function callAnthropic(userPrompt: string): Promise<InterpretationResult> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514',
            system: MSK_SYSTEM_PROMPT,
            messages: [{ role: 'user', content: userPrompt }],
            temperature: 0.3,
            max_tokens: 2000,
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Anthropic API error ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;
    if (!content) throw new Error('Empty response from Anthropic');

    // Claude may wrap in markdown code block — strip it
    const jsonStr = content.replace(/^```json\s*/u, '').replace(/\s*```$/u, '').trim();
    return JSON.parse(jsonStr) as InterpretationResult;
}

// ─── Unified entry point ───────────────────────────────────────────

export type LLMProvider = 'openai' | 'anthropic';

function detectProvider(): LLMProvider {
    if (process.env.OPENAI_API_KEY) return 'openai';
    if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
    throw new Error('No LLM API key configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY in .env.local');
}

export async function interpret(userPrompt: string, provider?: LLMProvider): Promise<InterpretationResult> {
    const selected = provider ?? detectProvider();

    switch (selected) {
        case 'openai': return callOpenAI(userPrompt);
        case 'anthropic': return callAnthropic(userPrompt);
        default: throw new Error(`Unknown LLM provider: ${selected}`);
    }
}
