import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiProvider {
  constructor(apiKey) {
    this.name = 'gemini';
    this.apiKey = apiKey;
    this.genAI = new GoogleGenerativeAI(apiKey);
  }
  
  /**
   * Generate text embedding using Gemini
   * @param {string} text - Text to embed
   * @returns {Promise<number[]>} - Embedding vector
   */
  async generateEmbedding(text) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'embedding-001' });
      
      const result = await model.embedContent(text);
      const embedding = result.embedding;
      
      return embedding.values;
    } catch (error) {
      console.error('Gemini embedding error:', error);
      throw {
        message: error.message || 'Gemini embedding failed',
        status: error.status || 500,
        provider: 'gemini'
      };
    }
  }
  
  /**
   * Generate chat completion using Gemini
   * @param {Array} messages - Array of message objects {role, content}
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - Generated response
   */
  async generateChatCompletion(messages, options = {}) {
    try {
      const model = this.genAI.getGenerativeModel({ 
        model: options.model || 'gemini-pro'
      });
      
      // Convert messages to Gemini format
      const history = [];
      const lastMessage = messages[messages.length - 1];
      
      for (let i = 0; i < messages.length - 1; i++) {
        const msg = messages[i];
        history.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      }
      
      const chat = model.startChat({
        history,
        generationConfig: {
          maxOutputTokens: options.maxTokens || 1000,
          temperature: options.temperature || 0.7,
        },
      });
      
      const result = await chat.sendMessage(lastMessage.content);
      const response = await result.response;
      
      return response.text();
    } catch (error) {
      console.error('Gemini chat error:', error);
      throw {
        message: error.message || 'Gemini chat failed',
        status: error.status || 500,
        provider: 'gemini'
      };
    }
  }
}

export default GeminiProvider;

