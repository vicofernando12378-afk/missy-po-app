import axios from 'axios';

import { getApiKeys } from '../../lib/config.js';

/**
 * Adapter for DeepSeek Chat API (compatible with OpenAI format)
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
    throw new Error('DEEPSEEK_API_KEY is not configured.');
  }

  const model = keys.DEEPSEEK_MODEL || 'deepseek-chat';

  // Build payload
  const apiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ];

  const payload = {
    model,
    messages: apiMessages,
    temperature: 0.1, // low temperature for precise tool execution and business responses
  };

  if (Array.isArray(tools) && tools.length > 0) {
    payload.tools = tools;
    payload.tool_choice = 'auto';
  }

  try {
    const response = await axios.post('https://api.deepseek.com/v1/chat/completions', payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      timeout: 30000, // 30 seconds timeout
    });

    const choice = response.data?.choices?.[0];
    const message = choice?.message;

    if (!message) {
      throw new Error('Empty response from DeepSeek API');
    }

    return {
      text: message.content || '',
      toolCalls: message.tool_calls || null,
    };
  } catch (error) {
    console.error('❌ DeepSeek API call failed:', error.response?.data || error.message);
    throw new Error(`DeepSeek API error: ${error.response?.data?.error?.message || error.message}`);
  }
}
