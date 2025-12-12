'use client';

import { useMemo, useState } from 'react';
import type { OpenRouterModel } from '@/lib/types';

type OutputFormat = 'json' | 'xml';

interface PromptEnhancerProps {
  selectedModel: OpenRouterModel;
}

export default function PromptEnhancer({ selectedModel }: PromptEnhancerProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<string | null>(null);
  const [format, setFormat] = useState<OutputFormat | null>(null);

  const canEnhance = useMemo(() => {
    return prompt.trim().length > 0 && !loading;
  }, [prompt, loading]);

  async function enhance() {
    if (!prompt.trim()) {
      setError('Please enter a prompt to enhance.');
      return;
    }

    setLoading(true);
    setError(null);
    setOutput(null);
    setFormat(null);

    try {
      const res = await fetch('/api/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, modelId: selectedModel.id })
      });

      const data = (await res.json()) as
        | { format: OutputFormat; output: string }
        | { error: string };

      if (!res.ok) {
        const message = 'error' in data ? data.error : 'Enhancement failed.';
        throw new Error(message);
      }

      if ('error' in data) {
        throw new Error(data.error);
      }

      setFormat(data.format);
      setOutput(data.output);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
    } catch {
      setError('Could not copy to clipboard.');
    }
  }

  return (
    <div className="enhancer">
      <div className="form">
        <label className="label" htmlFor="prompt-input">
          Your prompt
        </label>
        <textarea
          id="prompt-input"
          className="input textarea"
          rows={8}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what you want the model to do..."
        />

        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="actions">
          <button
            className="button primary"
            type="button"
            onClick={enhance}
            disabled={!canEnhance}
          >
            {loading ? 'Enhancing…' : 'Enhance Prompt'}
          </button>

          {output ? (
            <button className="button secondary" type="button" onClick={copyToClipboard}>
              Copy Output
            </button>
          ) : null}
        </div>
      </div>

      {output ? (
        <div className="outputPanel" aria-label="Enhanced prompt output">
          <div className="outputHeader">
            <div>
              <div className="outputTitle">Enhanced Output</div>
              <div className="outputMeta">Format: {format?.toUpperCase()}</div>
            </div>
          </div>
          <pre className="outputCode">{output}</pre>
        </div>
      ) : null}
    </div>
  );
}
