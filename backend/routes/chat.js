import express from 'express';
import Joi from 'joi';
import { query } from '../db/connection.js';
import { optionalAuth } from '../middleware/auth.js';
import { validateInterviewAccess, validateChatHistoryAccess } from '../middleware/interviewAccess.js';
import modelAdapter from '../services/ai/modelAdapter.js';

const router = express.Router();

// Validation schema
const chatSchema = Joi.object({
  conversationId: Joi.number().integer(),
  applicationId: Joi.number().integer(),
  message: Joi.string().required(),
  context: Joi.object()
});

// POST /api/chat - Chat endpoint for conversational screening
// Now requires active interview session during scheduled time
router.post('/', validateInterviewAccess, async (req, res) => {
  try {
    const { error, value } = chatSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    const { conversationId, applicationId, message, context } = value;
    
    // Get or create conversation
    let conversation = null;
    
    if (conversationId) {
      const convResult = await query(
        'SELECT * FROM conversations WHERE id = $1',
        [conversationId]
      );
      
      if (convResult.rows.length > 0) {
        conversation = convResult.rows[0];
      }
    }
    
    if (!conversation && applicationId) {
      // Create new conversation
      const convResult = await query(
        `INSERT INTO conversations (application_id, conversation_type, messages)
         VALUES ($1, 'screening', '[]')
         RETURNING *`,
        [applicationId]
      );
      conversation = convResult.rows[0];
    }
    
    // Build message history
    const messages = conversation ? conversation.messages : [];
    
    // Add system prompt for screening context with candidate name
    const candidateName = req.candidateName || 'candidate';
    const systemPrompt = `You are an AI recruitment assistant conducting an initial screening interview with ${candidateName}. 
Be professional, friendly, and concise. Ask relevant questions about their experience, skills, and motivations. 
Keep responses under 100 words. Focus on understanding their qualifications for the role.
This is happening during their scheduled interview time.`;
    
    const chatMessages = [
      { role: 'system', content: systemPrompt }
    ];
    
    // Add conversation history
    for (const msg of messages) {
      chatMessages.push({
        role: msg.role,
        content: msg.content
      });
    }
    
    // Add current user message
    chatMessages.push({
      role: 'user',
      content: message
    });
    
    // Generate AI response
    if (!modelAdapter.isAvailable()) {
      return res.status(503).json({ 
        error: 'AI service is currently unavailable. Please try again later.' 
      });
    }
    
    const aiResponse = await modelAdapter.generateChatCompletion(chatMessages, {
      maxTokens: 200,
      temperature: 0.7
    });
    
    // Update conversation with new messages
    if (conversation) {
      const updatedMessages = [
        ...messages,
        { role: 'user', content: message, timestamp: new Date().toISOString() },
        { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() }
      ];
      
      await query(
        'UPDATE conversations SET messages = $1 WHERE id = $2',
        [JSON.stringify(updatedMessages), conversation.id]
      );
    }
    
    res.json({
      conversationId: conversation?.id,
      response: aiResponse,
      provider: modelAdapter.getCurrentProvider()
    });
    
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// GET /api/chat/conversations/:id - Get conversation history
router.get('/conversations/:id', optionalAuth, validateChatHistoryAccess, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `SELECT 
         c.*,
         a.candidate_name,
         a.candidate_email,
         j.title as job_title
       FROM conversations c
       LEFT JOIN applications a ON a.id = c.application_id
       LEFT JOIN job_postings j ON j.id = a.job_id
       WHERE c.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    res.json({ conversation: result.rows[0] });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// POST /api/chat/voice/transcribe - Speech-to-text endpoint
router.post('/voice/transcribe', optionalAuth, async (req, res) => {
  try {
    // This is a placeholder for voice transcription
    // In production, you would integrate with services like:
    // - OpenAI Whisper API
    // - Google Cloud Speech-to-Text
    // - Web Speech API (client-side)
    
    res.status(501).json({ 
      error: 'Voice transcription not implemented',
      message: 'Please use Web Speech API on the client side or integrate a transcription service'
    });
  } catch (error) {
    console.error('Transcribe error:', error);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

// POST /api/chat/voice/synthesize - Text-to-speech endpoint
router.post('/voice/synthesize', optionalAuth, async (req, res) => {
  try {
    // This is a placeholder for voice synthesis
    // In production, you would integrate with services like:
    // - ElevenLabs API
    // - Google Cloud Text-to-Speech
    // - Web Speech Synthesis API (client-side)
    
    res.status(501).json({ 
      error: 'Voice synthesis not implemented',
      message: 'Please use Web Speech Synthesis API on the client side or integrate a TTS service'
    });
  } catch (error) {
    console.error('Synthesize error:', error);
    res.status(500).json({ error: 'Failed to synthesize speech' });
  }
});

export default router;

