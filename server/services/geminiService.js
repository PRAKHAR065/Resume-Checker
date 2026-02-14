const model = require('../config/gemini');
const atsScoringService = require('./atsScoringService');

class GeminiService {
  async analyzeJobDescription(jdText) {
    const prompt = `Analyze the following job description and extract key information. Return ONLY valid JSON without markdown formatting.

Job Description:
${jdText}

Extract and return JSON with this exact structure:
{
  "required": ["skill1", "skill2"],
  "requiredSkills": ["skill1", "skill2"],
  "preferred": ["skill1", "skill2"],
  "preferredSkills": ["skill1", "skill2"],
  "tools": ["tool1", "tool2"],
  "experienceLevel": "Entry" or "Mid" or "Senior",
  "keywords": ["keyword1", "keyword2"]
}

Focus on:
- Technical skills mentioned as required (add to both "required" and "requiredSkills")
- Preferred/optional skills (add to both "preferred" and "preferredSkills")
- Tools, technologies, frameworks
- Experience level indicators (junior, mid-level, senior, etc.)
- Important keywords and action verbs`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Clean the response - remove markdown code blocks if present
      let cleanedText = text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/```\n?/g, '');
      }
      
      const parsed = JSON.parse(cleanedText);
      
      // Normalize the structure to ensure both formats exist
      const normalized = {
        required: parsed.required || parsed.requiredSkills || [],
        requiredSkills: parsed.requiredSkills || parsed.required || [],
        preferred: parsed.preferred || parsed.preferredSkills || [],
        preferredSkills: parsed.preferredSkills || parsed.preferred || [],
        tools: parsed.tools || [],
        experienceLevel: parsed.experienceLevel || 'Mid',
        keywords: parsed.keywords || []
      };
      
      return normalized;
    } catch (error) {
      console.error('Error analyzing JD:', error);
      // Fallback to basic extraction
      return this.fallbackJDExtraction(jdText);
    }
  }

  async analyzeResumeMatch(resumeText, jdRequirements) {
    // Use algorithmic ATS scoring as primary method
    const algorithmicResult = atsScoringService.analyzeResume(resumeText, jdRequirements);
    
    // Optionally enhance with AI insights if API key is available
    if (process.env.GEMINI_API_KEY) {
      try {
        const prompt = `Analyze this resume and job requirements. Provide additional context-aware suggestions.

Resume:
${resumeText.substring(0, 5000)}${resumeText.length > 5000 ? '...' : ''}

Job Requirements:
${JSON.stringify(jdRequirements, null, 2)}

Return ONLY valid JSON without markdown:
{
  "aiSuggestions": ["contextual suggestion 1", "suggestion 2"],
  "missingKeywords": [
    {
      "keyword": "keyword name",
      "category": "Technical Skills" or "Soft Skills" or "Tools/Technologies" or "Certifications" or "Experience Keywords",
      "importance": 1-10,
      "suggestedSection": "Experience" or "Skills" or "Education" or "Summary"
    }
  ]
}

Focus on:
- Contextual improvements beyond keyword matching
- Soft skills and behavioral indicators
- Industry-specific terminology`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        let cleanedText = text.trim();
        if (cleanedText.startsWith('```json')) {
          cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/```\n?/g, '');
        }
        
        const aiResult = JSON.parse(cleanedText);
        
        // Merge AI suggestions with algorithmic results
        return {
          ...algorithmicResult,
          suggestions: [
            ...algorithmicResult.suggestions,
            ...(aiResult.aiSuggestions || [])
          ],
          // Use algorithmic score (more accurate)
          atsScore: algorithmicResult.atsScore
        };
      } catch (error) {
        console.error('AI enhancement failed, using algorithmic results:', error);
        // Fall back to algorithmic results
        return algorithmicResult;
      }
    }
    
    // Return algorithmic results
    return algorithmicResult;
  }

  async optimizeResume(resumeText, selectedKeywords, optimizationLevel = 'balanced') {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured. Please set it in your .env file.');
    }
    
    const levelInstructions = {
      aggressive: 'Maximize keyword density while maintaining readability',
      balanced: 'Naturally integrate keywords in contextually appropriate sections',
      conservative: 'Make minimal changes, only add keywords where they fit naturally'
    };

    const prompt = `Optimize this resume by naturally integrating these keywords: ${selectedKeywords.join(', ')}

Original Resume:
${resumeText}

Guidelines:
1. Maintain the original formatting, structure, and style
2. Add keywords contextually in relevant sections
3. Don't add false information or fabricate experience
4. Keep language professional and natural
5. Highlight achievements using the keywords where appropriate
6. Optimization level: ${levelInstructions[optimizationLevel]}

Return the optimized resume text maintaining the same structure and format as the original.`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Clean markdown formatting if present
      let cleanedText = text.trim();
      if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/```[a-z]*\n?/g, '').replace(/```\n?/g, '');
      }
      
      return cleanedText;
    } catch (error) {
      console.error('Error optimizing resume:', error);
      throw new Error('Failed to optimize resume');
    }
  }

  // Fallback methods for when AI fails
  fallbackJDExtraction(jdText) {
    const text = jdText.toLowerCase();
    const commonSkills = ['javascript', 'python', 'java', 'react', 'node', 'sql', 'aws', 'docker', 'kubernetes', 'node.js', 'express', 'mongodb', 'postgresql', 'mysql', 'redis', 'git', 'github', 'jenkins', 'kubernetes'];
    const foundSkills = commonSkills.filter(skill => text.includes(skill.toLowerCase()));
    
    // Extract more skills using patterns
    const skillPatterns = [
      /\b(node\.?js|express|react|angular|vue)\b/gi,
      /\b(python|java|javascript|typescript|go|rust|php|ruby)\b/gi,
      /\b(mongodb|postgresql|mysql|postgres|redis|elasticsearch)\b/gi,
      /\b(aws|azure|gcp|docker|kubernetes|jenkins|git|github)\b/gi,
      /\b(rest|graphql|api|microservices|serverless)\b/gi
    ];
    
    const extractedSkills = new Set(foundSkills);
    skillPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => extractedSkills.add(match.toLowerCase()));
      }
    });
    
    return {
      required: Array.from(extractedSkills),
      requiredSkills: Array.from(extractedSkills),
      preferred: [],
      preferredSkills: [],
      tools: [],
      experienceLevel: text.includes('senior') || text.includes('lead') || text.includes('5+') ? 'Senior' : text.includes('junior') || text.includes('entry') || text.includes('0-3') ? 'Entry' : 'Mid',
      keywords: []
    };
  }

  fallbackMatchAnalysis(resumeText, jdRequirements) {
    // Use algorithmic scoring as fallback
    return atsScoringService.analyzeResume(resumeText, jdRequirements);
  }
}

module.exports = new GeminiService();
