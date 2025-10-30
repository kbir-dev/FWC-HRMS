import axios from 'axios';
import { config } from '../../../config/index.js';

class HuggingFaceProvider {
  constructor(apiKey) {
    this.name = 'huggingface';
    this.apiKey = apiKey;
    this.baseURL = 'https://api-inference.huggingface.co';
    this.embeddingModel = config.ai.huggingface.embeddingModel;
  }
  
  /**
   * Generate text embedding using HuggingFace Inference API
   * @param {string} text - Text to embed
   * @returns {Promise<number[]>} - Embedding vector
   */
  async generateEmbedding(text) {
    try {
      const response = await axios.post(
        `${this.baseURL}/pipeline/feature-extraction/${this.embeddingModel}`,
        { inputs: text },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 second timeout
        }
      );
      
      // HuggingFace returns different formats depending on the model
      // Usually it's either a flat array or array of arrays
      let embedding = response.data;
      
      // If it's a nested array, take the first element (sentence embedding)
      if (Array.isArray(embedding) && Array.isArray(embedding[0])) {
        embedding = embedding[0];
      }
      
      return embedding;
    } catch (error) {
      console.error('HuggingFace embedding error:', error.response?.data || error.message);
      throw {
        message: error.response?.data?.error || error.message || 'HuggingFace embedding failed',
        status: error.response?.status || 500,
        provider: 'huggingface'
      };
    }
  }
  
  /**
   * Generate chat completion using HuggingFace Inference API
   * @param {Array} messages - Array of message objects {role, content}
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - Generated response
   */
  async generateChatCompletion(messages, options = {}) {
    try {
      // Use a conversational model from HuggingFace
      const model = options.model || 'mistralai/Mistral-7B-Instruct-v0.2';
      
      // Format messages into a prompt
      let prompt = '';
      for (const msg of messages) {
        if (msg.role === 'system') {
          prompt += `${msg.content}\n\n`;
        } else if (msg.role === 'user') {
          prompt += `User: ${msg.content}\n`;
        } else if (msg.role === 'assistant') {
          prompt += `Assistant: ${msg.content}\n`;
        }
      }
      prompt += 'Assistant: ';
      
      const response = await axios.post(
        `${this.baseURL}/models/${model}`,
        {
          inputs: prompt,
          parameters: {
            max_new_tokens: options.maxTokens || 500,
            temperature: options.temperature || 0.7,
            top_p: options.topP || 0.95,
            return_full_text: false
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000 // 60 second timeout for generation
        }
      );
      
      // Extract generated text
      let generatedText = '';
      if (Array.isArray(response.data) && response.data.length > 0) {
        generatedText = response.data[0].generated_text || '';
      } else if (response.data.generated_text) {
        generatedText = response.data.generated_text;
      }
      
      return generatedText.trim();
    } catch (error) {
      console.error('HuggingFace chat error:', error.response?.data || error.message);
      throw {
        message: error.response?.data?.error || error.message || 'HuggingFace chat failed',
        status: error.response?.status || 500,
        provider: 'huggingface'
      };
    }
  }
}

export default HuggingFaceProvider;

