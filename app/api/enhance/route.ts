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

function fallbackJson(enhancedPrompt: string): string {
  return JSON.stringify(
    {
      enhanced_prompt: enhancedPrompt
    },
    null,
    2
  );
}

function fallbackXml(enhancedPrompt: string): string {
  return `<enhanced_prompt><![CDATA[${toCdata(enhancedPrompt)}]]></enhanced_prompt>`;
}

function normalizeModelOutput(
  format: OutputFormat,
  raw: string
): string {
  const trimmed = raw.trim();

  if (format === 'json') {
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      const enhancedPrompt = parsed.enhanced_prompt;

      if (typeof enhancedPrompt !== 'string') {
        return fallbackJson(trimmed);
      }

      const normalized = {
        enhanced_prompt: enhancedPrompt
      };

      return JSON.stringify(normalized, null, 2);
    } catch {
      return fallbackJson(trimmed);
    }
  }

  const looksLikeXml =
    trimmed.startsWith('<') &&
    trimmed.includes('<enhanced_prompt');

  if (looksLikeXml) {
    return trimmed;
  }

  return fallbackXml(trimmed);
}

function buildSystemPrompt(format: OutputFormat): string {
  const responseSchema =
    format === 'json'
      ? `Return ONLY a single valid JSON object (no markdown, no code fences) with exactly this structure:\n\n{\n  "enhanced_prompt": string\n}\n\nRule:\n- "enhanced_prompt" must be a comprehensive, ready-to-use video generation prompt with clear video-specific sections.`
      : `Return ONLY a single XML document (no markdown, no code fences) with this structure:\n\n<enhanced_prompt>\n  <!-- comprehensive video generation prompt here -->\n</enhanced_prompt>\n\nRule:\n- Put the enhanced prompt inside CDATA.`;

  return [
    'You are an expert video generation prompt engineer with 30+ years of experience in filmmaking and visual storytelling.',
    'Your task is to enhance user prompts into comprehensive, professional video generation prompts ready for use with platforms like RunwayML, Midjourney, Pika Labs, or similar video generation tools.',
    '',
    'Video Enhancement Guidelines:',
    '',
    '[Scene Setup]',
    '- Describe the setting, environment, and visual atmosphere in detail',
    '- Include cinematography specifics (wide shot, close-up, medium shot, etc.)',
    '- Specify visual style (realistic, animated, cinematic, documentary style, etc.)',
    '',
    '[Camera Work]',
    '- Detail camera movements (pan left/right, tilt up/down, zoom in/out, tracking shots, dolly moves)',
    '- Specify camera angles (eye level, low angle, high angle, bird\'s eye, worm\'s eye)',
    '- Include camera techniques (handheld, steady, gimbal, drone shots)',
    '',
    '[Lighting & Color]',
    '- Specify lighting conditions (golden hour, blue hour, natural light, studio lighting, neon, dramatic shadows)',
    '- Include color grading hints (warm tones, cool tones, high contrast, desaturated, vibrant)',
    '- Detail mood and atmosphere through lighting',
    '',
    '[Duration & Pacing]',
    '- Suggest optimal timing for scenes (slow motion, real time, time-lapse)',
    '- Include pacing instructions (quick cuts, long takes, gradual build-up)',
    '- Specify transitions between scenes if applicable',
    '',
    '[Characters & Movement]',
    '- Describe character actions, expressions, and interactions',
    '- Include specific gestures, facial expressions, and body language',
    '- Detail any special effects or character animations',
    '',
    '[Audio & Sound Design]',
    '- Suggest background music style or genre',
    '- Include ambient sounds, dialogue requirements, or sound effects',
    '- Specify audio mood and intensity',
    '',
    '[Visual Effects & Styling]',
    '- Include particle effects, environmental effects, or special visual elements',
    '- Specify visual filters, effects, or post-processing hints',
    '- Detail any unique visual aesthetics or artistic styles',
    '',
    '[Output Quality & Technical]',
    '- Suggest resolution and aspect ratio preferences',
    '- Include quality expectations (cinematic quality, broadcast quality, etc.)',
    '- Specify render style preferences when relevant',
    '',
    'Example Structure:',
    '[Scene Setup] → [Camera Work] → [Lighting] → [Duration] → [Audio] → [Effects] → [Output Quality]',
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

    const output = normalizeModelOutput(format, completion);

    return NextResponse.json({ format, output });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to enhance prompt.';
    console.error('Error in enhance API route:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
