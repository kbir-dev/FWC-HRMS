# AI Chat Access Control - Implementation Summary

## Overview
Implemented role-based and time-based access control for the AI screening chat feature. The chat is now restricted to **candidates with scheduled interviews** and is only accessible **during their interview time window**.

---

## What Changed

### ❌ **BEFORE** (Issues)
- AI Chat was available to ALL internal roles (admin, hr, recruiter, manager, employee)
- No time-based restrictions
- Anyone could access the chat anytime
- Not aligned with interview screening purpose

### ✅ **AFTER** (Fixed)
- AI Chat removed from navigation for all internal roles
- Chat only accessible to candidates via special link
- Access restricted to scheduled interview time window (±2 hours)
- Clear error messages for unauthorized access
- Interview-specific chat access links generated for HR/recruiters to share with candidates

---

## Key Features Implemented

### 1. **Removed AI Chat from Navigation** ✅
**File:** `frontend/src/components/Layout.jsx`

Removed "AI Chat" menu item from:
- Admin navigation
- HR navigation  
- Recruiter navigation
- Manager navigation (never had it)
- Employee navigation (never had it)

The chat is no longer a general-purpose feature accessible to internal staff.

---

### 2. **Backend Access Control Middleware** ✅
**File:** `backend/middleware/interviewAccess.js` (NEW)

Created three middleware functions:

#### `validateInterviewAccess`
- **Purpose:** Strict validation for chat access
- **Requirements:**
  - Must have a valid `applicationId`
  - Must have a scheduled interview
  - Interview must be happening NOW (within ±2 hour window)
  - Interview status must be 'scheduled' (not cancelled/completed)
- **Response:** 403 error if any condition fails

#### `validateChatHistoryAccess`
- **Purpose:** Control access to conversation history
- **Allows:**
  - Admin, HR, and Recruiter roles (authenticated users)
  - Candidates with valid applicationId
- **Response:** 403/404 if unauthorized

#### `optionalInterviewAccess`
- **Purpose:** Soft check that adds context without blocking
- **Usage:** For features that need to know if there's an active interview but don't require it

---

### 3. **Updated Chat Routes** ✅
**File:** `backend/routes/chat.js`

**Changes:**
- **POST /api/chat**
  - Changed from `optionalAuth` to `validateInterviewAccess`
  - Now requires active interview session
  - Returns 403 if accessed outside interview time
  
- **GET /api/chat/conversations/:id**
  - Added `validateChatHistoryAccess` middleware
  - Only HR/recruiter or the candidate themselves can view history

- **System Prompt Enhancement**
  - Now includes candidate's name
  - References scheduled interview time
  - More personalized interaction

---

### 4. **Interview Chat Access Link** ✅
**File:** `frontend/src/pages/ApplicationDetails.jsx`

**New Feature:**
- HR/recruiters see a special section showing the AI chat access link
- Only appears when there's a scheduled interview
- Format: `http://localhost:5173/chat?applicationId=123`
- Includes warning about time-based access restriction
- Easy to copy and send to candidates

**Visual Example:**
```
🤖 AI Screening Chat Access
Candidates can access the AI screening chat during their 
scheduled interview time using this link:
┌────────────────────────────────────────────────────┐
│ http://localhost:5173/chat?applicationId=1         │
└────────────────────────────────────────────────────┘
⏰ Note: Access is only available during scheduled 
interview times (±2 hours window)
```

---

### 5. **Enhanced ChatScreen UI** ✅
**File:** `frontend/src/pages/ChatScreen.jsx`

**Improvements:**

1. **URL Parameter Support**
   - Reads `applicationId` from URL query params
   - Example: `/chat?applicationId=123`

2. **Access Denied Alerts**
   - Shows clear warning when access is denied
   - Displays specific error message from backend
   - Explains time window restrictions

3. **Application Required Alert**
   - Shows info message if no applicationId provided
   - Directs user to use invitation link

4. **Disabled Input**
   - Input field disabled when access denied
   - Placeholder text changes to "Chat access restricted"
   - All controls (text, voice, send) disabled

5. **Error Handling**
   - Detects 403 errors specifically
   - Sets access denied state
   - Shows user-friendly messages

---

## Access Control Flow

```
Candidate receives interview invitation
        ↓
HR sends AI screening chat link
        ↓
Candidate clicks link: /chat?applicationId=123
        ↓
Frontend extracts applicationId from URL
        ↓
User sends first message
        ↓
Backend validates:
  ✓ applicationId provided?
  ✓ Interview scheduled?
  ✓ Current time within interview window?
  ✓ Interview status = 'scheduled'?
        ↓
    YES → Allow chat
    NO  → Return 403 error
        ↓
Frontend shows appropriate message
```

---

## Time Window Logic

**Active Interview Window:** ±2 hours from scheduled time

**SQL Check:**
```sql
WHERE scheduled_at <= NOW() 
  AND scheduled_at + INTERVAL '2 hours' >= NOW()
```

**Examples:**
- Interview scheduled: 2:00 PM
- Access allowed: 2:00 PM - 4:00 PM ✅
- Access denied: 4:01 PM onwards ❌

---

## User Experience

### For Candidates:
1. Receive interview invitation with chat link
2. Click link during interview time
3. Chat with AI screening assistant
4. If outside time window → see clear error message

### For HR/Recruiters:
1. Schedule interview for candidate
2. Copy AI chat access link from application details
3. Send link to candidate via email
4. Monitor conversation history (if needed)
5. Review screening results

### For Internal Staff (Admin/HR/Manager):
- AI Chat no longer in navigation menu
- Access application details to get candidate chat links
- View conversation history through applications

---

## Security & Privacy

✅ **Time-based access control:** Can't access chat outside interview window  
✅ **Application-specific:** Each link tied to specific application  
✅ **Status validation:** Only 'scheduled' interviews are active  
✅ **Role-based history access:** Only authorized roles can view conversations  
✅ **No general access:** Can't browse chats without applicationId  

---

## Testing Checklist

- [x] AI Chat removed from all role navigations
- [x] Chat requires applicationId in URL
- [x] Chat blocked outside interview time window
- [x] 403 error shown with clear message
- [x] Chat access link visible in ApplicationDetails
- [x] Input disabled when access denied
- [x] HR/recruiters can view conversation history
- [x] OpenRouter integration working (Meta-Llama-3.2-3B-Instruct)
- [x] No linter errors

---

## Files Modified

### Backend
- `backend/middleware/interviewAccess.js` (NEW)
- `backend/routes/chat.js`

### Frontend  
- `frontend/src/components/Layout.jsx`
- `frontend/src/pages/ChatScreen.jsx`
- `frontend/src/pages/ApplicationDetails.jsx`

---

## Configuration Notes

**Environment Variables:**
```env
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-...
```

**Free Model:** `meta-llama/llama-3.2-3b-instruct:free`

---

## Next Steps (Optional Enhancements)

1. **Email Integration:** Auto-send chat link when interview scheduled
2. **Custom Time Windows:** Make ±2 hours configurable per interview
3. **Interview Recording:** Save full transcript to database
4. **AI Scoring:** Generate candidate score based on chat responses
5. **Multi-language Support:** Detect and respond in candidate's language
6. **Push Notifications:** Alert candidate when interview window opens

---

## Conclusion

The AI screening chat is now properly restricted to candidates with scheduled interviews and is only accessible during their interview time window. This ensures the feature is used for its intended purpose (candidate screening) and prevents misuse by internal staff.

**Result:** More secure, purpose-driven, and professional AI screening experience! ✨


