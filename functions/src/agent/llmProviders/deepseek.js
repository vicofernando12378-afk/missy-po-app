import axios from 'axios';

import { getApiKeys } from '../../lib/config.js';

/**
 * Adapter for LLM Chat API via TokenHub (OpenAI-compatible format)
 *
 * @param {object} params
 * @param {string} params.systemPrompt
 * @param {Array} params.messages
 * @param {Array} params.tools - optional array of tools
 * @returns {Promise<{ text: string, toolCalls: Array | null }>}
 */
export async function callDeepSeek({ systemPrompt, messages, tools }) {
  const keys = await getApiKeys();
  const apiKey = keys.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY (TokenHub) is not configured.');
  }

  const model = keys.DEEPSEEK_MODEL || 'deepseek-v4-flash';

  // Build payload
  const apiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ];

  const payload = {
    model,
    messages: apiMessages,
    temperature: 0.1,
  };

  // Thinking mode disabled — causes excessive latency (60s+) on simple chat

  if (Array.isArray(tools) && tools.length > 0) {
    payload.tools = tools;
    payload.tool_choice = 'auto';
  }

  try {
    const response = await axios.post('https://tokenhub.link/v1/chat/completions', payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      timeout: 30000,
    });

    const choice = response.data?.choices?.[0];
    const message = choice?.message;

    if (!message) {
      throw new Error('Empty response from LLM API');
    }

    return {
      text: message.content || '',
      toolCalls: message.tool_calls || null,
    };
  } catch (error) {
    console.error('❌ LLM API call failed:', error.response?.data || error.message);
    throw new Error(`LLM API error: ${error.response?.data?.error?.message || error.message}`);
  }
}
