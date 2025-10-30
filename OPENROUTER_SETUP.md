# 🚀 OpenRouter Setup Guide (FREE AI!)

## Why OpenRouter?

✅ **100% FREE** tier with Meta-Llama-3.1-8B-Instruct  
✅ **Fast responses** (faster than Gemini free tier)  
✅ **No credit card required**  
✅ **Easy setup** (takes 2 minutes)

---

## Step 1: Get Your FREE API Key

1. Go to: **https://openrouter.ai/keys**
2. Sign in with Google/GitHub (no credit card needed!)
3. Click **"Create Key"**
4. Copy your API key (starts with `sk-or-v1-...`)

**That's it!** No billing setup required!

---

## Step 2: Add API Key to Your Project

### Option A: Update .env file (Recommended)

1. Open `backend/.env` file (create it if it doesn't exist)
2. Add these lines:

```env
# Set OpenRouter as the primary AI provider
AI_PROVIDER=openrouter

# Your OpenRouter API key (FREE!)
OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
```

### Option B: Copy from env.example.txt

```bash
cd backend
cp env.example.txt .env
```

Then edit `.env` and update the `OPENROUTER_API_KEY` line with your actual key.

---

## Step 3: Restart Backend

The backend will auto-restart (nodemon is watching), or restart manually:

```bash
# Ctrl+C to stop if running
cd backend
npm run dev
```

You should see:
```
✓ Initialized OpenRouter as primary AI provider (FREE tier)
```

---

## Step 4: Test It!

1. Go to your HRMS app
2. Click on the **Chat** feature
3. Send a message like "Hello"
4. You should get a response from OpenRouter instantly! ⚡

---

## What Model Does It Use?

**Model**: Meta-Llama-3.1-8B-Instruct (FREE tier)

**Features**:
- 8 billion parameters
- Fast responses
- Good for chat, screening, and text generation
- Completely FREE!

If you want to use other models, you can upgrade to paid tier later.

---

## Troubleshooting

### "OpenRouter API error"

**Check**:
1. API key is correct (starts with `sk-or-v1-`)
2. No extra spaces in the `.env` file
3. Backend restarted after adding the key

### "No AI providers configured"

**Check**:
1. `.env` file exists in `backend/` directory
2. `AI_PROVIDER=openrouter` is set
3. `OPENROUTER_API_KEY` is set

### Still using Gemini?

**Check**:
1. Make sure `AI_PROVIDER=openrouter` (not `gemini`)
2. Restart backend completely

---

## Features That Use AI

With OpenRouter configured, these features will work:

✅ **AI Chat** - Chat with the AI assistant  
✅ **Resume Screening** - AI scores resumes automatically  
✅ **Conversational Screening** - AI interviews candidates  

All features use the **FREE** Meta-Llama-3.1-8B-Instruct model!

---

## Alternative: HuggingFace (Also FREE!)

If you prefer HuggingFace instead:

1. Get API key: https://huggingface.co/settings/tokens
2. Update `.env`:
   ```env
   AI_PROVIDER=huggingface
   HUGGINGFACE_API_KEY=hf_your_actual_key_here
   ```

Both are free! Choose whichever you prefer.

---

## Summary

1. **Get key**: https://openrouter.ai/keys (FREE, no credit card!)
2. **Add to .env**: `OPENROUTER_API_KEY=sk-or-v1-...`
3. **Set provider**: `AI_PROVIDER=openrouter`
4. **Restart backend**
5. **Test chat** - Done! 🎉

---

**Setup Time**: ~2 minutes  
**Cost**: $0.00 (FREE forever!)  
**Speed**: Very fast ⚡

Enjoy your FREE AI-powered HRMS! 🚀

