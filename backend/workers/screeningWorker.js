import { Worker } from 'bullmq';
import { config } from '../config/index.js';
import { query } from '../db/connection.js';
import {
  extractResumeText,
  normalizeText,
  extractResumeInfo,
  generateResumeEmbedding,
  calculateKeywordMatch,
  calculateExperienceMatch,
  calculateScreeningScore,
  generateScreeningDetails
} from '../services/screening/resumeProcessor.js';

// Parse Redis URL for BullMQ connection
const redisUrl = new URL(config.redis.url);
const redisConnection = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port) || 6379
};

// Create screening worker
const screeningWorker = new Worker(
  'resume-screening',
  async (job) => {
    console.log(`Processing job ${job.id}: ${job.name}`);
    
    try {
      const { applicationId } = job.data;
      
      // Get application and job details
      const appResult = await query(
        `SELECT 
          a.id, a.job_id, a.resume_file_path, a.resume_text, a.years_of_experience,
          j.title, j.description, j.requirements, j.jd_embedding, j.required_skills, j.experience_level
         FROM applications a
         JOIN job_postings j ON j.id = a.job_id
         WHERE a.id = $1`,
        [applicationId]
      );
      
      if (appResult.rows.length === 0) {
        throw new Error(`Application ${applicationId} not found`);
      }
      
      const application = appResult.rows[0];
      let resumeText = application.resume_text;
      
      // Step 1: Extract text from file if not already extracted
      if (!resumeText && application.resume_file_path) {
        await job.updateProgress(10);
        resumeText = await extractResumeText(application.resume_file_path);
        resumeText = normalizeText(resumeText);
        
        // Save extracted text
        await query(
          'UPDATE applications SET resume_text = $1 WHERE id = $2',
          [resumeText, applicationId]
        );
      }
      
      if (!resumeText) {
        throw new Error('No resume text available');
      }
      
      // Step 2: Extract structured info from resume
      await job.updateProgress(20);
      const resumeInfo = extractResumeInfo(resumeText);
      
      // Update years of experience if found
      if (resumeInfo.yearsOfExperience && !application.years_of_experience) {
        await query(
          'UPDATE applications SET years_of_experience = $1 WHERE id = $2',
          [resumeInfo.yearsOfExperience, applicationId]
        );
      }
      
      // Step 3: Generate resume embedding
      await job.updateProgress(40);
      const resumeEmbedding = await generateResumeEmbedding(resumeText);
      
      // Convert embedding array to pgvector format string
      const embeddingStr = `[${resumeEmbedding.join(',')}]`;
      
      // Save embedding
      await query(
        'UPDATE applications SET resume_embedding = $1 WHERE id = $2',
        [embeddingStr, applicationId]
      );
      
      // Step 4: Generate job description embedding if not exists
      await job.updateProgress(50);
      let jdEmbedding = application.jd_embedding;
      
      if (!jdEmbedding) {
        const jdText = `${application.title}\n${application.description}\n${application.requirements}`;
        const jdEmbeddingArray = await generateResumeEmbedding(jdText);
        const jdEmbeddingStr = `[${jdEmbeddingArray.join(',')}]`;
        
        await query(
          'UPDATE job_postings SET jd_embedding = $1 WHERE id = $2',
          [jdEmbeddingStr, application.job_id]
        );
        
        jdEmbedding = jdEmbeddingStr;
      }
      
      // Step 5: Calculate semantic similarity using cosine distance
      await job.updateProgress(60);
      const similarityResult = await query(
        `SELECT 1 - (resume_embedding <=> $1::vector) as similarity
         FROM applications
         WHERE id = $2`,
        [jdEmbedding, applicationId]
      );
      
      const similarityScore = similarityResult.rows[0]?.similarity || 0;
      
      // Step 6: Calculate keyword match
      await job.updateProgress(70);
      const requiredSkills = application.required_skills || [];
      const keywordScore = calculateKeywordMatch(resumeText, requiredSkills);
      
      // Identify matched and missing skills
      const matchedSkills = [];
      const missingSkills = [];
      const textLower = resumeText.toLowerCase();
      
      for (const skill of requiredSkills) {
        if (textLower.includes(skill.toLowerCase())) {
          matchedSkills.push(skill);
        } else {
          missingSkills.push(skill);
        }
      }
      
      // Step 7: Calculate experience match
      await job.updateProgress(80);
      const experienceLevelMap = {
        'entry': 0,
        'mid': 3,
        'senior': 5,
        'lead': 8
      };
      const requiredYears = experienceLevelMap[application.experience_level] || 0;
      const candidateYears = resumeInfo.yearsOfExperience || application.years_of_experience || 0;
      const experienceScore = calculateExperienceMatch(candidateYears, requiredYears);
      
      // Step 8: Calculate overall score
      await job.updateProgress(90);
      const overallScore = calculateScreeningScore({
        similarityScore,
        experienceScore,
        keywordScore,
        extrasScore: 0.5
      });
      
      // Generate detailed screening report
      const screeningDetails = generateScreeningDetails({
        similarityScore,
        experienceScore,
        keywordScore,
        matchedSkills,
        missingSkills,
        candidateYears,
        requiredYears
      });
      
      // Step 9: Save screening results
      await query(
        `UPDATE applications 
         SET screening_score = $1, 
             screening_details = $2,
             status = CASE 
               WHEN $1 >= 70 THEN 'shortlisted'
               WHEN $1 >= 50 THEN 'screened'
               ELSE 'rejected'
             END,
             screened_at = NOW()
         WHERE id = $3`,
        [overallScore, JSON.stringify(screeningDetails), applicationId]
      );
      
      await job.updateProgress(100);
      
      console.log(`✓ Application ${applicationId} screened with score: ${overallScore}`);
      
      return {
        applicationId,
        score: overallScore,
        status: overallScore >= 70 ? 'shortlisted' : (overallScore >= 50 ? 'screened' : 'rejected')
      };
      
    } catch (error) {
      console.error(`Screening job ${job.id} failed:`, error);
      
      // Mark application as failed
      await query(
        `UPDATE applications 
         SET status = 'screening_failed',
             screening_details = $1
         WHERE id = $2`,
        [JSON.stringify({ error: error.message }), job.data.applicationId]
      );
      
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 5, // Process 5 jobs concurrently
    limiter: {
      max: 10,
      duration: 60000 // Max 10 jobs per minute (to respect API rate limits)
    }
  }
);

screeningWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

screeningWorker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed with error:`, err);
});

screeningWorker.on('error', (err) => {
  console.error('Worker error:', err);
});

console.log('✓ Resume screening worker started');

export default screeningWorker;

