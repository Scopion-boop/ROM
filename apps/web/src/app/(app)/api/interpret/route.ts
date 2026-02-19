/**
 * POST /api/interpret
 *
 * Accepts enriched ROM measurements, builds a prompt, sends it to the
 * configured LLM (OpenAI or Anthropic), and returns interpretation +
 * recommended clinical tests.
 *
 * Request body: { measurements: EnrichedMeasurement[] }
 * Response: { interpretation: string, recommendations: [...] }
 */

import { NextResponse } from 'next/server';
import { interpret } from '@/lib/interpretation/llm-client';
import { buildUserPrompt } from '@/lib/interpretation/prompt-builder';
import { getRecommendedTests } from '@/lib/interpretation/clinical-tests';
import type { EnrichedMeasurement } from '@/lib/rom-utils';

function buildLocalTestRecommendations(measurements: EnrichedMeasurement[]) {
    const byJoint = new Map<string, string[]>();
    for (const m of measurements) {
        if (m.status === 'normal' || m.status === 'unknown') continue;
        if (!byJoint.has(m.joint)) byJoint.set(m.joint, []);
        byJoint.get(m.joint)!.push(m.movement);
    }

    const results: { joint: string; tests: ReturnType<typeof getRecommendedTests> }[] = [];
    for (const [joint, movements] of byJoint) {
        const tests = getRecommendedTests(joint, movements);
        if (tests.length > 0) results.push({ joint, tests });
    }
    return results;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const measurements: EnrichedMeasurement[] = body.measurements;

        if (!Array.isArray(measurements) || measurements.length === 0) {
            return NextResponse.json(
                { error: 'measurements array is required and must be non-empty' },
                { status: 400 },
            );
        }

        const userPrompt = buildUserPrompt(measurements);
        const llmResult = await interpret(userPrompt);
        const clinicalTests = buildLocalTestRecommendations(measurements);

        return NextResponse.json({
            interpretation: llmResult.interpretation,
            recommendations: llmResult.recommendations,
            clinicalTests,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[/api/interpret]', message);

        if (message.includes('API key')) {
            return NextResponse.json(
                { error: 'LLM API key not configured. Add OPENAI_API_KEY or ANTHROPIC_API_KEY to .env.local' },
                { status: 503 },
            );
        }

        return NextResponse.json({ error: message }, { status: 500 });
    }
}
