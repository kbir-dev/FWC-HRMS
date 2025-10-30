import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import modelAdapter from '../ai/modelAdapter.js';

/**
 * Extract text from PDF file
 */
export const extractTextFromPDF = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
};

/**
 * Extract text from DOCX file
 */
export const extractTextFromDOCX = async (filePath) => {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    console.error('DOCX extraction error:', error);
    throw new Error('Failed to extract text from DOCX');
  }
};

/**
 * Extract text from uploaded resume file
 */
export const extractResumeText = async (filePath) => {
  const extension = filePath.toLowerCase().split('.').pop();
  
  switch (extension) {
    case 'pdf':
      return await extractTextFromPDF(filePath);
    case 'docx':
    case 'doc':
      return await extractTextFromDOCX(filePath);
    case 'txt':
      return fs.readFileSync(filePath, 'utf-8');
    default:
      throw new Error(`Unsupported file type: ${extension}`);
  }
};

/**
 * Normalize resume text
 * - Remove excess whitespace
 * - Convert to lowercase for analysis
 */
export const normalizeText = (text) => {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();
};

/**
 * Extract structured information from resume text using regex heuristics
 */
export const extractResumeInfo = (text) => {
  const info = {
    email: null,
    phone: null,
    yearsOfExperience: null,
    skills: [],
    education: []
  };
  
  // Extract email
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (emailMatch) {
    info.email = emailMatch[0];
  }
  
  // Extract phone
  const phoneMatch = text.match(/[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}/);
  if (phoneMatch) {
    info.phone = phoneMatch[0];
  }
  
  // Estimate years of experience
  const experienceMatches = text.match(/(\d+)\+?\s*years?/gi);
  if (experienceMatches && experienceMatches.length > 0) {
    const years = experienceMatches.map(m => parseInt(m.match(/\d+/)[0]));
    info.yearsOfExperience = Math.max(...years);
  } else {
    // Try to count date ranges (e.g., 2018 - 2020)
    const dateRanges = text.match(/\b(19|20)\d{2}\s*[-–—]\s*(present|current|(19|20)\d{2})/gi);
    if (dateRanges && dateRanges.length > 0) {
      let totalYears = 0;
      dateRanges.forEach(range => {
        const parts = range.split(/[-–—]/);
        const startYear = parseInt(parts[0].trim());
        const endYear = parts[1].toLowerCase().includes('present') || parts[1].toLowerCase().includes('current')
          ? new Date().getFullYear()
          : parseInt(parts[1].trim());
        if (!isNaN(startYear) && !isNaN(endYear)) {
          totalYears += (endYear - startYear);
        }
      });
      info.yearsOfExperience = totalYears;
    }
  }
  
  // Common technical skills to look for
  const commonSkills = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby',
    'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring',
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD',
    'Git', 'REST', 'GraphQL', 'Microservices', 'Agile', 'Scrum'
  ];
  
  const textLower = text.toLowerCase();
  info.skills = commonSkills.filter(skill => 
    textLower.includes(skill.toLowerCase())
  );
  
  return info;
};

/**
 * Generate embedding for resume text
 */
export const generateResumeEmbedding = async (text) => {
  if (!modelAdapter.isAvailable()) {
    throw new Error('No AI provider available for embedding generation');
  }
  
  // Truncate text if too long (most models have token limits)
  const maxChars = 5000;
  const truncatedText = text.length > maxChars 
    ? text.substring(0, maxChars) + '...'
    : text;
  
  return await modelAdapter.generateEmbedding(truncatedText);
};

/**
 * Calculate keyword match score
 */
export const calculateKeywordMatch = (resumeText, requiredSkills = []) => {
  if (!requiredSkills || requiredSkills.length === 0) {
    return 0.5; // Neutral score if no required skills specified
  }
  
  const textLower = resumeText.toLowerCase();
  let matchCount = 0;
  
  for (const skill of requiredSkills) {
    if (textLower.includes(skill.toLowerCase())) {
      matchCount++;
    }
  }
  
  return matchCount / requiredSkills.length;
};

/**
 * Calculate experience match score
 */
export const calculateExperienceMatch = (candidateYears, requiredYears) => {
  if (!requiredYears || requiredYears === 0) {
    return 1.0; // Full score if no requirement
  }
  
  if (!candidateYears) {
    return 0.3; // Low score if experience not found
  }
  
  if (candidateYears >= requiredYears) {
    return 1.0;
  }
  
  // Partial score for partial experience
  return Math.max(0.3, candidateYears / requiredYears);
};

/**
 * Calculate overall screening score
 * Scoring rubric: 60% similarity + 20% experience + 15% keywords + 5% extras
 */
export const calculateScreeningScore = ({
  similarityScore = 0,
  experienceScore = 0,
  keywordScore = 0,
  extrasScore = 0.5
}) => {
  const score = (
    similarityScore * 0.60 +
    experienceScore * 0.20 +
    keywordScore * 0.15 +
    extrasScore * 0.05
  ) * 100;
  
  return Math.round(score * 100) / 100; // Round to 2 decimal places
};

/**
 * Generate screening details/reasoning
 */
export const generateScreeningDetails = ({
  similarityScore,
  experienceScore,
  keywordScore,
  matchedSkills = [],
  missingSkills = [],
  candidateYears,
  requiredYears
}) => {
  return {
    similarity: {
      score: similarityScore,
      weight: 0.60,
      contribution: similarityScore * 0.60,
      description: 'Semantic similarity between resume and job description'
    },
    experience: {
      score: experienceScore,
      weight: 0.20,
      contribution: experienceScore * 0.20,
      candidateYears,
      requiredYears,
      description: 'Years of experience match'
    },
    keywords: {
      score: keywordScore,
      weight: 0.15,
      contribution: keywordScore * 0.15,
      matchedSkills,
      missingSkills,
      description: 'Required skills match'
    },
    extras: {
      score: 0.5,
      weight: 0.05,
      contribution: 0.025,
      description: 'Resume formatting and completeness'
    }
  };
};

