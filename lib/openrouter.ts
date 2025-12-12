import { OpenRouterResponse, OpenRouterModel } from './types';

const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models';
const OPENROUTER_CHAT_COMPLETIONS_URL =
  'https://openrouter.ai/api/v1/chat/completions';

type OpenRouterChatRole = 'system' | 'user' | 'assistant';

export interface OpenRouterChatMessage {
  role: OpenRouterChatRole;
  content: string;
}

interface OpenRouterChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
}

export class OpenRouterService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
  }

  private getAuthHeaders() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.OPENROUTER_REFERRER || 'http://localhost:3000',
      'X-Title': 'Prompt Enhancement App'
    };
  }

  async getModels(): Promise<OpenRouterModel[]> {
    if (!this.apiKey) {
      console.warn('OPENROUTER_API_KEY is not set');
    }

    const response = await fetch(OPENROUTER_MODELS_URL, {
      headers: this.getAuthHeaders(),
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      throw new Error(
        `OpenRouter API error: ${response.status} ${response.statusText}`
      );
    }

    const data: OpenRouterResponse = await response.json();
    return data.data;
  }

  async getFreeModels(): Promise<OpenRouterModel[]> {
    const models = await this.getModels();

    return models.filter((model) => {
      const promptPrice = parseFloat(model.pricing.prompt);
      const completionPrice = parseFloat(model.pricing.completion);

      return promptPrice === 0 && completionPrice === 0;
    });
  }

  async createChatCompletion(options: {
    model: string;
    messages: OpenRouterChatMessage[];
    temperature?: number;
    maxTokens?: number;
  }): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY is not set');
    }

    const response = await fetch(OPENROUTER_CHAT_COMPLETIONS_URL, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        model: options.model,
        messages: options.messages,
        temperature: options.temperature ?? 0.4,
        max_tokens: options.maxTokens ?? 1200,
        stream: false
      }),
      cache: 'no-store'
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(
        `OpenRouter API error: ${response.status} ${response.statusText}${text ? ` - ${text}` : ''}`
      );
    }

    const data: OpenRouterChatCompletionResponse = await response.json();
    if (data.error?.message) {
      throw new Error(data.error.message);
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('OpenRouter returned an empty completion');
    }

    return content;
  }
}

export const openRouterService = new OpenRouterService();
