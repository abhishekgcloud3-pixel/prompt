import { NextResponse } from 'next/server';

import { openRouterService } from '@/lib/openrouter';

type OutputFormat = 'json' | 'xml';

function chooseOutputFormat(originalPrompt: string): OutputFormat {
  const lower = originalPrompt.toLowerCase();
  const lineCount = originalPrompt.split(/\r?\n/).filter(Boolean).length;

  if (lower.includes('xml') || lower.includes('<') || lower.includes('</')) {
    return 'xml';
  }

  if (lower.includes('json') || lower.includes('{') || lower.includes('"')) {
    return 'json';
  }

  if (originalPrompt.length > 350 || lineCount >= 4) {
    return 'xml';
  }

  return 'json';
}

function toCdata(value: string): string {
  return value.replaceAll(']]>', ']]]]><![CDATA[>');
}

function fallbackJson(originalPrompt: string, enhancedPrompt: string): string {
  return JSON.stringify(
    {
      original_prompt: originalPrompt,
      enhanced_prompt: enhancedPrompt,
      structure: [],
      key_improvements: []
    },
    null,
    2
  );
}

function fallbackXml(originalPrompt: string, enhancedPrompt: string): string {
  return [
    '<prompt_enhancement>',
    `  <original_prompt><![CDATA[${toCdata(originalPrompt)}]]></original_prompt>`,
    `  <enhanced_prompt><![CDATA[${toCdata(enhancedPrompt)}]]></enhanced_prompt>`,
    '  <structure></structure>',
    '  <key_improvements></key_improvements>',
    '</prompt_enhancement>'
  ].join('\n');
}

function normalizeModelOutput(
  format: OutputFormat,
  raw: string,
  originalPrompt: string
): string {
  const trimmed = raw.trim();

  if (format === 'json') {
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      const enhancedPrompt = parsed.enhanced_prompt;
      const structure = parsed.structure;
      const keyImprovements = parsed.key_improvements;

      if (
        typeof enhancedPrompt !== 'string' ||
        !Array.isArray(structure) ||
        !Array.isArray(keyImprovements)
      ) {
        return fallbackJson(originalPrompt, trimmed);
      }

      const normalized = {
        original_prompt: originalPrompt,
        enhanced_prompt: enhancedPrompt,
        structure: structure.filter((item): item is string => typeof item === 'string'),
        key_improvements: keyImprovements.filter(
          (item): item is string => typeof item === 'string'
        )
      };

      return JSON.stringify(normalized, null, 2);
    } catch {
      return fallbackJson(originalPrompt, trimmed);
    }
  }

  const looksLikeXml =
    trimmed.startsWith('<') &&
    trimmed.includes('<prompt_enhancement') &&
    trimmed.includes('<original_prompt') &&
    trimmed.includes('<enhanced_prompt') &&
    trimmed.includes('<structure') &&
    trimmed.includes('<key_improvements');

  if (looksLikeXml) {
    return trimmed;
  }

  return fallbackXml(originalPrompt, trimmed);
}

function buildSystemPrompt(format: OutputFormat): string {
  const responseSchema =
    format === 'json'
      ? `Return ONLY a single valid JSON object (no markdown, no code fences) with exactly these keys:\n\n{\n  "original_prompt": string,\n  "enhanced_prompt": string,\n  "structure": string[],\n  "key_improvements": string[]\n}\n\nRules:\n- "original_prompt" must match the user's input exactly.\n- "enhanced_prompt" must be a ready-to-use prompt with clear sections.\n- "structure" is an ordered list of the section titles you used.\n- "key_improvements" is a concise list of the most important upgrades you made.`
      : `Return ONLY a single XML document (no markdown, no code fences) with this structure:\n\n<prompt_enhancement>\n  <original_prompt><![CDATA[...]]></original_prompt>\n  <enhanced_prompt><![CDATA[...]]></enhanced_prompt>\n  <structure>\n    <item>...</item>\n  </structure>\n  <key_improvements>\n    <item>...</item>\n  </key_improvements>\n</prompt_enhancement>\n\nRules:\n- original_prompt must match the user's input exactly.\n- Put original_prompt and enhanced_prompt inside CDATA.\n- Use <item> for each structure/improvement entry.`;

  return [
    'You are an expert prompt engineer with 30+ years of experience.',
    'Your task is to enhance user prompts to be more effective, precise, and immediately usable.',
    '',
    'Enhancement goals:',
    '- Add missing context, assumptions to confirm, and clarifying questions (only if critical).',
    '- Make objectives explicit and unambiguous.',
    '- Add constraints, edge cases, and quality criteria.',
    '- Specify expected output format, tone, and level of detail.',
    '- Structure the enhanced prompt into clear sections (e.g., Objective, Context, Inputs, Requirements, Constraints, Output Format, Acceptance Criteria).',
    '',
    responseSchema
  ].join('\n');
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      prompt?: unknown;
      modelId?: unknown;
    };

    const prompt = typeof body.prompt === 'string' ? body.prompt : '';
    const modelId = typeof body.modelId === 'string' ? body.modelId : '';

    if (!prompt.trim()) {
      return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
    }

    if (!modelId.trim()) {
      return NextResponse.json(
        { error: 'Model ID is required. Please select a model.' },
        { status: 400 }
      );
    }

    const format = chooseOutputFormat(prompt);

    const completion = await openRouterService.createChatCompletion({
      model: modelId,
      messages: [
        { role: 'system', content: buildSystemPrompt(format) },
        {
          role: 'user',
          content: [
            'Enhance the following prompt:',
            '',
            prompt,
            '',
            'Remember: return ONLY the requested JSON or XML, matching the schema exactly.'
          ].join('\n')
        }
      ]
    });

    const output = normalizeModelOutput(format, completion, prompt);

    return NextResponse.json({ format, output });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to enhance prompt.';
    console.error('Error in enhance API route:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
