import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Avatar,
  IconButton,
  CircularProgress,
  Chip,
  Fab,
  Alert,
} from '@mui/material';
import {
  Send,
  Mic,
  MicOff,
  SmartToy,
  Person,
  Close,
  Lock,
} from '@mui/icons-material';
import apiClient from '../api/client';
import toast from 'react-hot-toast';

const ChatScreen = ({ applicationId: propApplicationId = null, onClose = null, standalone = false }) => {
  const [searchParams] = useSearchParams();
  
  // Get applicationId from URL params or props
  const applicationId = propApplicationId || searchParams.get('applicationId');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [accessError, setAccessError] = useState('');
  const messagesEndRef = useRef(null);

  // Check if standalone mode (accessed via route)
  const isStandalone = standalone || !onClose;

  // Initialize Web Speech API
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error('Speech recognition error');
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Chat mutation
  const chatMutation = useMutation({
    mutationFn: async (message) => {
      const payload = { message };
      
      // Only include conversationId if it exists (not null)
      if (conversationId) {
        payload.conversationId = conversationId;
      }
      
      // Only include applicationId if it exists
      if (applicationId) {
        payload.applicationId = applicationId;
      }
      
      const response = await apiClient.post('/chat', payload);
      return response.data;
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.response, timestamp: new Date() },
      ]);
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      // Text-to-speech
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(data.response);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    },
    onError: (error) => {
      if (error.response?.status === 403) {
        setAccessDenied(true);
        setAccessError(error.response?.data?.message || error.response?.data?.error || 'Access to AI chat is restricted');
      } else {
        toast.error(error.response?.data?.error || 'Failed to send message');
      }
    },
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    chatMutation.mutate(inputMessage);
    setInputMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleVoiceInput = () => {
    if (!recognition) {
      toast.error('Speech recognition is not supported in your browser');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  // Wrapper component based on mode
  const ChatContainer = isStandalone ? Box : Paper;
  const containerStyles = isStandalone
    ? {
        width: '100%',
        maxWidth: 800,
        mx: 'auto',
        height: 'calc(100vh - 200px)',
        display: 'flex',
        flexDirection: 'column',
      }
    : {
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: { xs: '90%', sm: 400 },
        height: { xs: '80%', sm: 600 },
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
      };

  return (
    <ChatContainer
      elevation={isStandalone ? 0 : 3}
      sx={containerStyles}
    >
      {/* Header */}
      <Paper
        elevation={isStandalone ? 1 : 0}
        sx={{
          p: 2,
          bgcolor: 'primary.main',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderRadius: isStandalone ? 1 : 0,
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <SmartToy />
          <Typography variant="h6">AI Screening Assistant</Typography>
        </Box>
        {!isStandalone && onClose && (
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        )}
      </Paper>

      {/* Messages */}
      <Paper
        elevation={isStandalone ? 1 : 0}
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          bgcolor: 'grey.50',
          borderRadius: isStandalone ? 1 : 0,
          mt: isStandalone ? 2 : 0,
        }}
      >
        {/* Access Denied Message */}
        {accessDenied && (
          <Alert severity="warning" icon={<Lock />} sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold">
              Access Restricted
            </Typography>
            <Typography variant="body2">
              {accessError}
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              The AI screening chat is only available during your scheduled interview time window.
            </Typography>
          </Alert>
        )}
        
        {!applicationId && !accessDenied && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold">
              Application Required
            </Typography>
            <Typography variant="body2">
              Please access this chat through your interview invitation link.
            </Typography>
          </Alert>
        )}
        
        {messages.length === 0 && !accessDenied && applicationId && (
          <Box textAlign="center" mt={4}>
            <SmartToy sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="body1" color="textSecondary">
              Hello! I'm your AI screening assistant.
            </Typography>
            <Typography variant="body2" color="textSecondary">
              I'll ask you some questions about your experience and qualifications.
            </Typography>
          </Box>
        )}

        {messages.map((msg, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              mb: 2,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1,
                maxWidth: '80%',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              }}
            >
              <Avatar
                sx={{
                  bgcolor: msg.role === 'user' ? 'primary.main' : 'secondary.main',
                  width: 32,
                  height: 32,
                }}
              >
                {msg.role === 'user' ? <Person sx={{ fontSize: 20 }} /> : <SmartToy sx={{ fontSize: 20 }} />}
              </Avatar>
              <Paper
                elevation={1}
                sx={{
                  p: 1.5,
                  bgcolor: msg.role === 'user' ? 'primary.light' : 'white',
                  color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
                }}
              >
                <Typography variant="body2">{msg.content}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 0.5 }}>
                  {msg.timestamp.toLocaleTimeString()}
                </Typography>
              </Paper>
            </Box>
          </Box>
        ))}

        {chatMutation.isLoading && (
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
              <SmartToy sx={{ fontSize: 20 }} />
            </Avatar>
            <Paper elevation={1} sx={{ p: 1.5 }}>
              <CircularProgress size={20} />
            </Paper>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Paper>

      {/* Input */}
      <Paper
        elevation={isStandalone ? 1 : 0}
        sx={{
          p: 2,
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
          borderRadius: isStandalone ? 1 : 0,
          mt: isStandalone ? 2 : 0,
        }}
      >
        {isListening && (
          <Chip
            label="Listening..."
            color="error"
            size="small"
            icon={<Mic />}
            sx={{ mb: 1 }}
          />
        )}
        <Box display="flex" gap={1}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder={accessDenied || !applicationId ? "Chat access restricted" : "Type your message..."}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            multiline
            maxRows={3}
            disabled={chatMutation.isLoading || accessDenied || !applicationId}
            size="small"
          />
          <IconButton
            color={isListening ? 'error' : 'default'}
            onClick={toggleVoiceInput}
            disabled={chatMutation.isLoading || accessDenied || !applicationId}
          >
            {isListening ? <MicOff /> : <Mic />}
          </IconButton>
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || chatMutation.isLoading || accessDenied || !applicationId}
          >
            <Send />
          </IconButton>
        </Box>
      </Paper>
    </ChatContainer>
  );
};

// Floating Chat Button Component
export const ChatFab = ({ applicationId }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {!open && (
        <Fab
          color="primary"
          onClick={() => setOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
          }}
        >
          <SmartToy />
        </Fab>
      )}
      {open && <ChatScreen applicationId={applicationId} onClose={() => setOpen(false)} />}
    </>
  );
};

export default ChatScreen;

