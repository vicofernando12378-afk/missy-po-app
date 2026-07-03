import { callDeepSeek } from './llmProviders/deepseek.js';

/**
 * Routes LLM completions to the requested provider.
 * Supports fallback logic.
 * 
 * @param {object} params
 * @param {string} params.systemPrompt
 * @param {Array} params.messages
 * @param {Array} params.tools - optional tools
 * @param {string} [params.provider] - 'deepseek' (default)
 * @returns {Promise<{ text: string, toolCalls: Array | null }>}
 */
export async function callLLM({ systemPrompt, messages, tools, provider = 'deepseek' }) {
  if (provider === 'deepseek') {
    try {
      return await callDeepSeek({ systemPrompt, messages, tools });
    } catch (err) {
      console.warn('⚠️ DeepSeek failed, attempting fallback or propagating error:', err.message);
      throw err;
    }
  }

  throw new Error(`Unsupported LLM provider: ${provider}`);
}
