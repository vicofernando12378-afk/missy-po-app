import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPost = vi.fn();
vi.mock('axios', () => ({
  default: {
    post: (...args) => mockPost(...args),
  },
}));

import { callLLM } from '../llmRouter';

describe('llmRouter & DeepSeek Adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DEEPSEEK_API_KEY = 'test-key';
  });

  it('calls DeepSeek API and parses response text correctly', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        choices: [{
          message: { content: 'Hola, ¿en qué puedo ayudarte?' },
        }],
      },
    });

    const result = await callLLM({
      systemPrompt: 'System prompt text',
      messages: [{ role: 'user', content: 'Hola' }],
      provider: 'deepseek',
    });

    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(result.text).toBe('Hola, ¿en qué puedo ayudarte?');
    expect(result.toolCalls).toBeNull();
  });

  it('handles tool calls returned by DeepSeek API', async () => {
    const mockToolCalls = [{
      id: 'call-1',
      type: 'function',
      function: { name: 'buscarProducto', arguments: '{"query":"comida"}' },
    }];

    mockPost.mockResolvedValueOnce({
      data: {
        choices: [{
          message: { content: '', tool_calls: mockToolCalls },
        }],
      },
    });

    const result = await callLLM({
      systemPrompt: 'System',
      messages: [{ role: 'user', content: 'busca comida' }],
      tools: [{ type: 'function' }],
      provider: 'deepseek',
    });

    expect(result.toolCalls).toEqual(mockToolCalls);
  });
});
