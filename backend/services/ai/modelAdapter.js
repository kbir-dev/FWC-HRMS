import { config } from '../../config/index.js';
import OpenRouterProvider from './providers/openrouter.js';
import GeminiProvider from './providers/gemini.js';
import HuggingFaceProvider from './providers/huggingface.js';

class ModelAdapter {
  constructor() {
    this.primaryProvider = null;
    this.fallbackProvider = null;
    this.initializeProviders();
  }
  
  initializeProviders() {
    const providerName = config.ai.provider.toLowerCase();
    
    // Initialize primary provider based on config
    switch (providerName) {
      case 'openrouter':
        if (config.ai.openrouter.apiKey) {
          this.primaryProvider = new OpenRouterProvider(config.ai.openrouter.apiKey);
          console.log('✓ Initialized OpenRouter as primary AI provider (FREE tier)');
        }
        break;
      case 'gemini':
        if (config.ai.gemini.apiKey) {
          this.primaryProvider = new GeminiProvider(config.ai.gemini.apiKey);
          console.log('✓ Initialized Gemini as primary AI provider');
        }
        break;
      case 'huggingface':
        if (config.ai.huggingface.apiKey) {
          this.primaryProvider = new HuggingFaceProvider(config.ai.huggingface.apiKey);
          console.log('✓ Initialized HuggingFace as primary AI provider');
        }
        break;
      default:
        console.warn(`Unknown AI provider: ${providerName}`);
    }
    
    // Initialize fallback provider (prefer HuggingFace, then Gemini, then OpenRouter)
    if (providerName !== 'huggingface' && config.ai.huggingface.apiKey) {
      this.fallbackProvider = new HuggingFaceProvider(config.ai.huggingface.apiKey);
      console.log('✓ Initialized HuggingFace as fallback AI provider');
    } else if (providerName !== 'gemini' && config.ai.gemini.apiKey) {
      this.fallbackProvider = new GeminiProvider(config.ai.gemini.apiKey);
      console.log('✓ Initialized Gemini as fallback AI provider');
    } else if (providerName !== 'openrouter' && config.ai.openrouter.apiKey) {
      this.fallbackProvider = new OpenRouterProvider(config.ai.openrouter.apiKey);
      console.log('✓ Initialized OpenRouter as fallback AI provider');
    }
    
    if (!this.primaryProvider && !this.fallbackProvider) {
      console.error('⚠ No AI providers configured! Please set API keys in environment variables.');
    }
  }
  
  /**
   * Generate text embedding
   * @param {string} text - Text to embed
   * @returns {Promise<number[]>} - Embedding vector
   */
  async generateEmbedding(text) {
    try {
      if (!this.primaryProvider && !this.fallbackProvider) {
        throw new Error('No AI providers configured');
      }
      
      // Try primary provider
      if (this.primaryProvider) {
        try {
          return await this.primaryProvider.generateEmbedding(text);
        } catch (error) {
          console.warn(`Primary provider failed: ${error.message}`);
          
          // If rate limited or billing error, try fallback
          if (this.fallbackProvider && (error.status === 429 || error.status === 402)) {
            console.log('Attempting fallback provider...');
            return await this.fallbackProvider.generateEmbedding(text);
          }
          
          throw error;
        }
      }
      
      // Use fallback if no primary
      return await this.fallbackProvider.generateEmbedding(text);
      
    } catch (error) {
      console.error('All AI providers failed for embedding:', error);
      throw new Error('Failed to generate embedding');
    }
  }
  
  /**
   * Generate chat completion
   * @param {Array} messages - Array of message objects {role, content}
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - Generated response
   */
  async generateChatCompletion(messages, options = {}) {
    try {
      if (!this.primaryProvider && !this.fallbackProvider) {
        throw new Error('No AI providers configured');
      }
      
      // Try primary provider
      if (this.primaryProvider) {
        try {
          return await this.primaryProvider.generateChatCompletion(messages, options);
        } catch (error) {
          console.warn(`Primary provider failed: ${error.message}`);
          
          // If rate limited or billing error, try fallback
          if (this.fallbackProvider && (error.status === 429 || error.status === 402)) {
            console.log('Attempting fallback provider...');
            return await this.fallbackProvider.generateChatCompletion(messages, options);
          }
          
          throw error;
        }
      }
      
      // Use fallback if no primary
      return await this.fallbackProvider.generateChatCompletion(messages, options);
      
    } catch (error) {
      console.error('All AI providers failed for chat:', error);
      throw new Error('Failed to generate chat completion');
    }
  }
  
  /**
   * Check if any provider is available
   */
  isAvailable() {
    return !!(this.primaryProvider || this.fallbackProvider);
  }
  
  /**
   * Get current provider name
   */
  getCurrentProvider() {
    if (this.primaryProvider) {
      return this.primaryProvider.name;
    }
    if (this.fallbackProvider) {
      return this.fallbackProvider.name;
    }
    return 'none';
  }
}

// Export singleton instance
export default new ModelAdapter();

