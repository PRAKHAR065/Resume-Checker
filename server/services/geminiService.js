const model = require('../config/gemini');

class GeminiService {
  async analyzeJobDescription(jdText) {
    const prompt = `Analyze the following job description and extract key information. Return ONLY valid JSON without markdown formatting.

Job Description:
${jdText}

Extract and return JSON with this exact structure:
{
  "requiredSkills": ["skill1", "skill2"],
  "preferredSkills": ["skill1", "skill2"],
  "tools": ["tool1", "tool2"],
  "experienceLevel": "Entry" or "Mid" or "Senior",
  "keywords": ["keyword1", "keyword2"]
}

Focus on:
- Technical skills mentioned as required
- Preferred/optional skills
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
      return parsed;
    } catch (error) {
      console.error('Error analyzing JD:', error);
      // Fallback to basic extraction
      return this.fallbackJDExtraction(jdText);
    }
  }

  async analyzeResumeMatch(resumeText, jdRequirements) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured. Please set it in your .env file.');
    }
    
    const prompt = `Compare this resume with the job description requirements and provide analysis.

Resume:
${resumeText}

Job Requirements:
${JSON.stringify(jdRequirements, null, 2)}

Analyze and return ONLY valid JSON without markdown formatting:
{
  "missingKeywords": [
    {
      "keyword": "keyword name",
      "category": "Technical Skills" or "Soft Skills" or "Tools/Technologies" or "Certifications" or "Experience Keywords",
      "importance": 1-10,
      "suggestedSection": "Experience" or "Skills" or "Education" or "Summary"
    }
  ],
  "atsScore": 0-100,
  "suggestions": ["suggestion1", "suggestion2"]
}

Calculate ATS score based on:
- Keyword match percentage
- Required skills presence
- Experience relevance
- Overall alignment`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      let cleanedText = text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/```\n?/g, '');
      }
      
      const parsed = JSON.parse(cleanedText);
      return parsed;
    } catch (error) {
      console.error('Error analyzing resume match:', error);
      return this.fallbackMatchAnalysis(resumeText, jdRequirements);
    }
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
    const commonSkills = ['javascript', 'python', 'java', 'react', 'node', 'sql', 'aws', 'docker', 'kubernetes'];
    const foundSkills = commonSkills.filter(skill => text.includes(skill));
    
    return {
      requiredSkills: foundSkills,
      preferredSkills: [],
      tools: [],
      experienceLevel: text.includes('senior') ? 'Senior' : text.includes('junior') || text.includes('entry') ? 'Entry' : 'Mid',
      keywords: []
    };
  }

  fallbackMatchAnalysis(resumeText, jdRequirements) {
    const resumeLower = resumeText.toLowerCase();
    const required = jdRequirements.requiredSkills || [];
    const missing = required.filter(skill => !resumeLower.includes(skill.toLowerCase()));
    
    return {
      missingKeywords: missing.map(keyword => ({
        keyword,
        category: 'Technical Skills',
        importance: 8,
        suggestedSection: 'Skills'
      })),
      atsScore: Math.max(0, 100 - (missing.length * 10)),
      suggestions: [`Add ${missing.length} missing required skills`]
    };
  }
}

module.exports = new GeminiService();
