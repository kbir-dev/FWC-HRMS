# Applicant Management System - User Guide

## Overview
This guide explains how the applicant tracking and resume screening system works, including how to update applicant status, how resume screening happens, and how HR can filter candidates.

---

## 1. ✅ FIXED: Updating Applicant Status

### Issue
Previously, there was no UI to update the status of applications even though the backend API existed.

### Solution ✨
Added a complete status update interface in the Application Details page.

### How to Update Status

1. **Navigate to Applications**
   - Go to `/applications` in the app
   - Click "View Details" on any application

2. **Update Status Button**
   - In the Application Details page, look for the "Application Status" card on the right side
   - Click the "Update Status" button

3. **Select New Status**
   - A dialog will appear with the following status options:
     - **Received** - Application just submitted
     - **Screening** - Currently being screened
     - **Screened** - AI screening completed
     - **Shortlisted** - Candidate passed screening
     - **Interview** - Scheduled for interview
     - **Rejected** - Application rejected
     - **Offer** - Offer extended
     - **Hired** - Candidate hired

4. **Rejection Handling**
   - If you select "Rejected", a text field will appear
   - You **must** provide a rejection reason
   - This reason will be saved and displayed in the application details

5. **Save Changes**
   - Click "Update" to save the new status
   - You'll see a success notification
   - The status will be immediately reflected in the UI

### Who Can Update Status?
Only users with the following roles can update application status:
- **Admin**
- **HR**
- **Recruiter**

(Enforced by the backend middleware in `routes/applications.js` line 375)

---

## 2. 📄 Resume Screening System - How It Works

### Complete Workflow

#### Step 1: Candidate Applies for a Job
**Where to Apply:**
1. Go to the Jobs page (`/jobs`)
2. Click on a job to view details (`/jobs/:id`)
3. Click "Apply" button
4. Fill out the application form at `/jobs/:id/apply`

**Application Form Fields:**
- Full Name (required)
- Email (required)
- Phone
- Years of Experience
- Current Company
- Current Position
- Cover Letter
- **Resume Upload** (required) - PDF, DOC, DOCX, or TXT (max 5MB)

#### Step 2: Resume Upload
**Technical Details:**
- Upload location: `backend/uploads/resumes/`
- Accepted formats: `.pdf`, `.doc`, `.docx`, `.txt`
- File size limit: 5MB
- Files are saved with a unique name: `resume-{timestamp}-{random}.{extension}`

**Code Reference:**
- Frontend: `frontend/src/pages/JobApplication.jsx`
- Backend endpoint: `POST /api/jobs/:jobId/apply`
- Backend handler: `backend/routes/applications.js` (line 76)

#### Step 3: Automatic AI Screening (Background Job)

Once a resume is uploaded, the system automatically:

1. **Creates Application Record**
   - Saves application to database with status `'received'`
   - Stores resume file path

2. **Queues Screening Job**
   - Uses BullMQ (Redis-based job queue)
   - Job type: `'screen-resume'`
   - Configured with 3 retry attempts
   - Location: `backend/routes/applications.js` (line 152-160)

3. **Background Worker Processes Resume**
   - Worker: `backend/workers/screeningWorker.js`
   - Processing steps:
     
     a. **Extract Text from Resume** (10% progress)
        - PDF → uses `pdf-parse` library
        - DOCX → uses `mammoth` library
        - TXT → direct file read
        - Normalizes whitespace and formatting
     
     b. **Extract Structured Information** (20% progress)
        - Email address
        - Phone number
        - Years of experience (from dates or explicit mentions)
        - Skills (matches against common tech skills)
     
     c. **Generate Resume Embedding** (40% progress)
        - Converts resume text to vector representation
        - Uses AI model (Gemini or HuggingFace)
        - Vector dimension: 768
        - Stored in PostgreSQL with pgvector extension
     
     d. **Generate Job Description Embedding** (50% progress)
        - If not already generated for the job
        - Same vector format as resume
     
     e. **Calculate Semantic Similarity** (60% progress)
        - Compares resume vector vs job description vector
        - Uses cosine similarity
        - Range: 0.0 to 1.0
     
     f. **Calculate Keyword Match** (70% progress)
        - Checks how many required skills are in resume
        - Score = (matched skills / total required skills)
     
     g. **Calculate Experience Match** (80% progress)
        - Compares candidate years vs job requirements
        - Experience levels:
          - Entry: 0 years
          - Mid: 3 years
          - Senior: 5 years
          - Lead: 8 years
     
     h. **Calculate Overall Score** (90% progress)
        - **60%** Semantic Similarity (AI matching)
        - **20%** Experience Match
        - **15%** Keyword/Skills Match
        - **5%** Resume quality/formatting
        - Final score: 0-100
     
     i. **Auto-assign Status Based on Score** (100% progress)
        - Score ≥ 70 → `'shortlisted'`
        - Score ≥ 50 → `'screened'`
        - Score < 50 → `'rejected'`

4. **Results Saved to Database**
   - `screening_score`: Overall score (0-100)
   - `screening_details`: JSON with breakdown
   - `status`: Auto-assigned based on score
   - `screened_at`: Timestamp
   - `resume_embedding`: Vector for semantic search

### Viewing Screening Results

**For HR/Recruiters:**
1. Go to Applications list (`/applications`)
2. Click "View Details" on any application
3. View the "AI Screening Report" section showing:
   - Overall score with color coding
   - Similarity score breakdown
   - Experience match details
   - Keyword/skills match
   - Matched skills vs missing skills

**API Endpoint:**
- `GET /api/applications/screening/:applicationId/report`
- Returns detailed screening breakdown
- Location: `backend/routes/applications.js` (line 316)

---

## 3. 🔍 HR Filtering - Viewing Only Selected Resumes

### Available Filters

The Applications page (`/applications`) provides multiple filters:

#### 1. **Search Filter**
- Search by:
  - Candidate name
  - Candidate email
  - Job title
- Real-time filtering

#### 2. **Status Filter**
- Filter by application status:
  - All Statuses (default)
  - Received
  - Screening
  - Screened
  - **Shortlisted** ← Most relevant for HR
  - Interview
  - Offer
  - Hired
  - Rejected

#### 3. **AI Score Filter**
- Filter by minimum AI screening score:
  - All Scores (default)
  - 90% and above
  - 80% and above
  - 70% and above ← Recommended for "selected" candidates
  - 60% and above
  - 50% and above

#### 4. **Sorting**
- Click column headers to sort by:
  - Candidate name
  - Job title
  - Applied date
  - **AI Score** (highest to lowest)

### How to View Only Selected/Best Candidates

**Method 1: By Status**
1. Go to Applications page
2. Set Status filter to "Shortlisted"
3. This shows all candidates with score ≥ 70

**Method 2: By AI Score**
1. Go to Applications page
2. Set "Min AI Score" to "70% and above"
3. This shows all high-scoring candidates

**Method 3: Combined Filters**
1. Set Status to "Shortlisted"
2. Set Min AI Score to "80% and above"
3. Search for specific keywords
4. This gives you the absolute best candidates

### Backend API for Filtering

**Endpoint:** `GET /api/applications`

**Query Parameters:**
- `status` - Filter by status (e.g., "shortlisted")
- `minScore` - Filter by minimum screening score (e.g., 70)
- `jobId` - Filter by specific job posting
- `page` - Pagination page number
- `limit` - Results per page

**Example API Call:**
```javascript
GET /api/applications?status=shortlisted&minScore=70&page=1&limit=20
```

**Code Reference:**
- Frontend: `frontend/src/pages/Applications.jsx` (line 54-106)
- Backend: `backend/routes/applications.js` (line 211-282)

---

## 4. System Architecture Summary

### Data Flow Diagram

```
Candidate Applies
     ↓
Resume Uploaded → backend/uploads/resumes/
     ↓
Application Created in DB (status: 'received')
     ↓
BullMQ Job Queued → Redis
     ↓
Screening Worker Picks Up Job
     ↓
Extract Text from Resume
     ↓
Generate AI Embeddings (Resume + Job Description)
     ↓
Calculate Scores (Similarity + Keywords + Experience)
     ↓
Save Results & Auto-assign Status
     ↓
HR Views Results & Can Update Status Manually
```

### Database Schema

**applications table** (key fields):
- `id` - Primary key
- `job_id` - Foreign key to job_postings
- `candidate_name`, `candidate_email`, `candidate_phone`
- `resume_file_path` - Path to uploaded file
- `resume_text` - Extracted text content
- `resume_embedding` - Vector(768) for semantic search
- `screening_score` - Overall score (0-100)
- `screening_details` - JSON with breakdown
- `status` - Application status
- `rejection_reason` - If rejected
- `screened_at` - When screening completed

### File Locations

**Frontend:**
- Application List: `frontend/src/pages/Applications.jsx`
- Application Details: `frontend/src/pages/ApplicationDetails.jsx` ← **Updated with status change UI**
- Job Application Form: `frontend/src/pages/JobApplication.jsx`
- API Client: `frontend/src/api/jobs.js`

**Backend:**
- Routes: `backend/routes/applications.js`
- Resume Processing: `backend/services/screening/resumeProcessor.js`
- Background Worker: `backend/workers/screeningWorker.js`
- AI Model Adapter: `backend/services/ai/modelAdapter.js`

**Storage:**
- Resume Files: `backend/uploads/resumes/`

---

## 5. Testing the System

### Test Scenario 1: Apply for a Job

1. Start the backend: `cd backend && npm run dev`
2. Start the frontend: `cd frontend && npm run dev`
3. Navigate to Jobs page
4. Click on a job
5. Click "Apply"
6. Fill form and upload a resume (use a sample PDF resume)
7. Submit
8. Check console logs - you should see:
   ```
   ✓ Application {id} created, screening job queued
   ```

### Test Scenario 2: Watch Screening Process

1. After applying, check backend console
2. You should see:
   ```
   Processing job {id}: screen-resume
   ✓ Application {id} screened with score: {score}
   ```
3. Go to Applications page
4. The new application should appear with an AI score

### Test Scenario 3: Update Status

1. Go to Applications page
2. Click "View Details" on an application
3. Click "Update Status" button
4. Select "Interview"
5. Click "Update"
6. Status should change immediately

### Test Scenario 4: Filter Candidates

1. Go to Applications page
2. Set "Min AI Score" to "70% and above"
3. Set Status to "Shortlisted"
4. Only high-quality candidates appear

---

## 6. Troubleshooting

### Issue: Resume not being screened
**Check:**
1. Is Redis running? (`docker-compose up -d` or check Redis connection)
2. Is the screening worker running? (Should auto-start with backend)
3. Check backend console for errors
4. Verify AI provider is configured (Gemini API key in .env)

### Issue: Cannot update status
**Check:**
1. Are you logged in as admin/hr/recruiter role?
2. Check browser console for errors
3. Verify backend API is running

### Issue: Resume file not uploading
**Check:**
1. File size < 5MB
2. File type is PDF, DOC, DOCX, or TXT
3. `backend/uploads/resumes/` directory exists and is writable

---

## 7. Summary of Changes Made

### What Was Fixed ✅

1. **Added Status Update UI**
   - Edit button on Application Details page
   - Modal dialog for status selection
   - Rejection reason field for rejected candidates
   - Real-time updates with React Query

2. **Documented Resume Screening Flow**
   - Complete workflow explained
   - Where to upload resumes (JobApplication form)
   - How AI screening works
   - Score calculation breakdown

3. **Explained HR Filtering**
   - Status filter (use "Shortlisted")
   - AI Score filter (use "70% and above")
   - Combined filtering for best results

### What Was Already Working ✅

- Resume upload system
- AI-powered screening
- Background job processing
- Score calculation
- Status and score filtering in UI

---

## Need Help?

- **Backend API Documentation**: Check `openapi.yaml` in project root
- **Database Schema**: See `backend/db/schema.sql`
- **AI Configuration**: See `backend/services/ai/modelAdapter.js`
- **Environment Setup**: See `backend/env.example.txt`

