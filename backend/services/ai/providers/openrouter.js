import axios from 'axios';

class OpenRouterProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://openrouter.ai/api/v1';
    this.model = 'meta-llama/llama-3.2-3b-instruct:free'; // Free tier model
    this.isInitialized = !!apiKey;
  }

  async generateEmbedding(text) {
    // OpenRouter doesn't provide embeddings, return null to fallback
    return null;
  }

  async generateChatCompletion(messages, options = {}) {
    if (!this.isInitialized) {
      throw new Error('OpenRouter API key not configured');
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.model,
          messages: messages,
          max_tokens: options.maxTokens || 500,
          temperature: options.temperature || 0.7,
          top_p: options.topP || 1,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': 'https://hrms-app.local', // Required by OpenRouter
            'X-Title': 'AI-Powered HRMS', // Optional, helps with ranking
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid response from OpenRouter');
      }

      return response.data.choices[0].message.content;
    } catch (error) {
      if (error.response) {
        console.error('OpenRouter API error:', error.response.data);
        throw new Error(`OpenRouter API error: ${error.response.data.error?.message || error.message}`);
      }
      throw error;
    }
  }

  async generateText(prompt, options = {}) {
    const messages = [{ role: 'user', content: prompt }];
    return this.generateChatCompletion(messages, options);
  }

  isAvailable() {
    return this.isInitialized;
  }
}

export default OpenRouterProvider;

