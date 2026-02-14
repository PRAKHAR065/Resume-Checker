/**
 * ATS Scoring Service
 * Calculates ATS scores algorithmically based on keyword matching
 */

class ATSScoringService {
  /**
   * Normalize text for comparison
   */
  normalizeText(text) {
    if (!text) return '';
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove special characters
      .replace(/\s+/g, ' ')      // Normalize whitespace
      .trim();
  }

  /**
   * Check if a keyword exists in text (with variations)
   */
  keywordExists(keyword, text) {
    const normalizedText = this.normalizeText(text);
    const normalizedKeyword = this.normalizeText(keyword);
    
    // Exact match
    if (normalizedText.includes(normalizedKeyword)) {
      return true;
    }

    // Handle common variations
    const variations = this.getKeywordVariations(normalizedKeyword);
    return variations.some(variation => normalizedText.includes(variation));
  }

  /**
   * Get keyword variations (e.g., "node.js" -> "nodejs", "node", "node js")
   */
  getKeywordVariations(keyword) {
    const variations = [keyword];
    
    // Remove dots and hyphens
    variations.push(keyword.replace(/[.-]/g, ''));
    variations.push(keyword.replace(/[.-]/g, ' '));
    
    // Split compound words
    if (keyword.includes('.')) {
      variations.push(keyword.split('.')[0]);
    }
    if (keyword.includes('-')) {
      variations.push(keyword.split('-')[0]);
    }
    
    // Remove common suffixes
    if (keyword.endsWith('.js')) {
      variations.push(keyword.replace('.js', ''));
      variations.push(keyword.replace('.js', 'js'));
    }
    
    return [...new Set(variations)];
  }

  /**
   * Extract skills from text
   */
  extractSkillsFromResume(resumeText) {
    const normalized = this.normalizeText(resumeText);
    const skills = [];
    
    // Common skill patterns
    const skillPatterns = [
      /(?:skills?|technologies?|tools?|languages?|frameworks?)[\s:]+([^]+?)(?=\n\n|\n[A-Z]|$)/i,
      /(?:proficient in|experienced with|knowledge of)[\s:]+([^]+?)(?=\n|$)/i
    ];
    
    for (const pattern of skillPatterns) {
      const match = resumeText.match(pattern);
      if (match) {
        const skillText = match[1];
        // Extract individual skills (comma, semicolon, or newline separated)
        const extracted = skillText.split(/[,;\n]/)
          .map(s => s.trim())
          .filter(s => s.length > 0);
        skills.push(...extracted);
      }
    }
    
    return skills;
  }

  /**
   * Calculate ATS score based on keyword matching
   */
  calculateATSScore(resumeText, jdRequirements) {
    const resumeLower = this.normalizeText(resumeText);
    const scores = {
      requiredSkills: { matched: 0, total: 0, weight: 0.40 },
      preferredSkills: { matched: 0, total: 0, weight: 0.25 },
      tools: { matched: 0, total: 0, weight: 0.20 },
      keywords: { matched: 0, total: 0, weight: 0.10 },
      experienceLevel: { matched: false, weight: 0.05 }
    };

    // Check required skills
    const requiredSkills = jdRequirements.required || jdRequirements.requiredSkills || [];
    scores.requiredSkills.total = requiredSkills.length;
    requiredSkills.forEach(skill => {
      if (this.keywordExists(skill, resumeText)) {
        scores.requiredSkills.matched++;
      }
    });

    // Check preferred skills
    const preferredSkills = jdRequirements.preferred || jdRequirements.preferredSkills || [];
    scores.preferredSkills.total = preferredSkills.length;
    preferredSkills.forEach(skill => {
      if (this.keywordExists(skill, resumeText)) {
        scores.preferredSkills.matched++;
      }
    });

    // Check tools
    const tools = jdRequirements.tools || [];
    scores.tools.total = tools.length;
    tools.forEach(tool => {
      if (this.keywordExists(tool, resumeText)) {
        scores.tools.matched++;
      }
    });

    // Check keywords
    const keywords = jdRequirements.keywords || [];
    scores.keywords.total = keywords.length;
    keywords.forEach(keyword => {
      if (this.keywordExists(keyword, resumeText)) {
        scores.keywords.matched++;
      }
    });

    // Check experience level
    const jdExperienceLevel = (jdRequirements.experienceLevel || 'Mid').toLowerCase();
    const resumeExperience = this.extractExperienceLevel(resumeText);
    scores.experienceLevel.matched = this.experienceLevelMatches(jdExperienceLevel, resumeExperience);

    // Calculate weighted score
    let totalScore = 0;
    
    // Required skills (40% weight)
    if (scores.requiredSkills.total > 0) {
      const requiredScore = (scores.requiredSkills.matched / scores.requiredSkills.total) * 100;
      totalScore += requiredScore * scores.requiredSkills.weight;
    } else {
      totalScore += 100 * scores.requiredSkills.weight; // If no required skills, give full points
    }

    // Preferred skills (25% weight)
    if (scores.preferredSkills.total > 0) {
      const preferredScore = (scores.preferredSkills.matched / scores.preferredSkills.total) * 100;
      totalScore += preferredScore * scores.preferredSkills.weight;
    } else {
      totalScore += 100 * scores.preferredSkills.weight;
    }

    // Tools (20% weight)
    if (scores.tools.total > 0) {
      const toolsScore = (scores.tools.matched / scores.tools.total) * 100;
      totalScore += toolsScore * scores.tools.weight;
    } else {
      totalScore += 100 * scores.tools.weight;
    }

    // Keywords (10% weight)
    if (scores.keywords.total > 0) {
      const keywordsScore = (scores.keywords.matched / scores.keywords.total) * 100;
      totalScore += keywordsScore * scores.keywords.weight;
    } else {
      totalScore += 100 * scores.keywords.weight;
    }

    // Experience level (5% weight)
    totalScore += (scores.experienceLevel.matched ? 100 : 0) * scores.experienceLevel.weight;

    // Round to nearest integer
    const finalScore = Math.round(Math.min(100, Math.max(0, totalScore)));

    return {
      atsScore: finalScore,
      breakdown: scores,
      matchDetails: {
        requiredSkills: {
          matched: scores.requiredSkills.matched,
          total: scores.requiredSkills.total,
          percentage: scores.requiredSkills.total > 0 
            ? Math.round((scores.requiredSkills.matched / scores.requiredSkills.total) * 100) 
            : 100
        },
        preferredSkills: {
          matched: scores.preferredSkills.matched,
          total: scores.preferredSkills.total,
          percentage: scores.preferredSkills.total > 0 
            ? Math.round((scores.preferredSkills.matched / scores.preferredSkills.total) * 100) 
            : 100
        },
        tools: {
          matched: scores.tools.matched,
          total: scores.tools.total,
          percentage: scores.tools.total > 0 
            ? Math.round((scores.tools.matched / scores.tools.total) * 100) 
            : 100
        },
        keywords: {
          matched: scores.keywords.matched,
          total: scores.keywords.total,
          percentage: scores.keywords.total > 0 
            ? Math.round((scores.keywords.matched / scores.keywords.total) * 100) 
            : 100
        }
      }
    };
  }

  /**
   * Extract experience level from resume
   */
  extractExperienceLevel(resumeText) {
    const text = this.normalizeText(resumeText);
    
    if (text.includes('senior') || text.includes('lead') || text.includes('principal') || 
        text.includes('architect') || text.includes('5+') || text.includes('6+') || 
        text.includes('7+') || text.includes('8+') || text.includes('9+') || text.includes('10+')) {
      return 'senior';
    }
    
    if (text.includes('junior') || text.includes('entry') || text.includes('intern') || 
        text.includes('fresher') || text.includes('0-1') || text.includes('0-2') || 
        text.includes('1 year') || text.includes('1+')) {
      return 'entry';
    }
    
    return 'mid';
  }

  /**
   * Check if experience levels match
   */
  experienceLevelMatches(jdLevel, resumeLevel) {
    const levels = { entry: 1, mid: 2, senior: 3 };
    const jdNum = levels[jdLevel] || 2;
    const resumeNum = levels[resumeLevel] || 2;
    
    // Resume level should be >= JD level (or close)
    return resumeNum >= jdNum - 1;
  }

  /**
   * Find missing keywords
   */
  findMissingKeywords(resumeText, jdRequirements) {
    const missingKeywords = [];
    
    // Check required skills
    const requiredSkills = jdRequirements.required || jdRequirements.requiredSkills || [];
    requiredSkills.forEach(skill => {
      if (!this.keywordExists(skill, resumeText)) {
        missingKeywords.push({
          keyword: skill,
          category: 'Technical Skills',
          importance: 10,
          suggestedSection: 'Skills'
        });
      }
    });

    // Check preferred skills
    const preferredSkills = jdRequirements.preferred || jdRequirements.preferredSkills || [];
    preferredSkills.forEach(skill => {
      if (!this.keywordExists(skill, resumeText)) {
        missingKeywords.push({
          keyword: skill,
          category: 'Technical Skills',
          importance: 7,
          suggestedSection: 'Skills'
        });
      }
    });

    // Check tools
    const tools = jdRequirements.tools || [];
    tools.forEach(tool => {
      if (!this.keywordExists(tool, resumeText)) {
        missingKeywords.push({
          keyword: tool,
          category: 'Tools/Technologies',
          importance: 8,
          suggestedSection: 'Skills'
        });
      }
    });

    // Check important keywords (only high-frequency ones)
    const keywords = jdRequirements.keywords || [];
    const importantKeywords = keywords.slice(0, 10); // Top 10 keywords
    importantKeywords.forEach(keyword => {
      if (!this.keywordExists(keyword, resumeText)) {
        missingKeywords.push({
          keyword: keyword,
          category: 'Experience Keywords',
          importance: 5,
          suggestedSection: 'Experience'
        });
      }
    });

    // Sort by importance
    missingKeywords.sort((a, b) => b.importance - a.importance);

    return missingKeywords;
  }

  /**
   * Generate suggestions based on analysis
   */
  generateSuggestions(resumeText, jdRequirements, scoreResult) {
    const suggestions = [];
    const breakdown = scoreResult.breakdown;

    // Required skills suggestions
    if (breakdown.requiredSkills.total > 0) {
      const missingRequired = breakdown.requiredSkills.total - breakdown.requiredSkills.matched;
      if (missingRequired > 0) {
        suggestions.push(
          `Add ${missingRequired} missing required skill${missingRequired > 1 ? 's' : ''} to your Skills section. This is critical for ATS matching.`
        );
      }
    }

    // Preferred skills suggestions
    if (breakdown.preferredSkills.total > 0) {
      const missingPreferred = breakdown.preferredSkills.total - breakdown.preferredSkills.matched;
      if (missingPreferred > 0) {
        suggestions.push(
          `Consider adding ${missingPreferred} preferred skill${missingPreferred > 1 ? 's' : ''} to strengthen your profile.`
        );
      }
    }

    // Tools suggestions
    if (breakdown.tools.total > 0) {
      const missingTools = breakdown.tools.total - breakdown.tools.matched;
      if (missingTools > 0) {
        suggestions.push(
          `Add ${missingTools} missing tool${missingTools > 1 ? 's' : ''} or technology${missingTools > 1 ? 'ies' : ''} to your Skills section.`
        );
      }
    }

    // Experience level suggestions
    if (!scoreResult.breakdown.experienceLevel.matched) {
      const jdLevel = (jdRequirements.experienceLevel || 'Mid').toLowerCase();
      suggestions.push(
        `Highlight your experience level more clearly. The job requires ${jdLevel}-level experience.`
      );
    }

    // General suggestions
    if (scoreResult.atsScore < 50) {
      suggestions.push('Your resume has significant gaps. Focus on adding required skills and relevant experience.');
    } else if (scoreResult.atsScore < 70) {
      suggestions.push('Your resume is decent but can be improved. Add missing keywords and highlight relevant experience.');
    } else if (scoreResult.atsScore < 85) {
      suggestions.push('Good match! Consider adding a few more preferred skills to maximize your chances.');
    }

    // Keyword density suggestion
    const keywordCount = this.countKeywordsInResume(resumeText, jdRequirements);
    if (keywordCount < 10) {
      suggestions.push('Increase keyword density by naturally incorporating job-relevant terms throughout your resume.');
    }

    return suggestions;
  }

  /**
   * Count how many JD keywords appear in resume
   */
  countKeywordsInResume(resumeText, jdRequirements) {
    const allKeywords = [
      ...(jdRequirements.required || jdRequirements.requiredSkills || []),
      ...(jdRequirements.preferred || jdRequirements.preferredSkills || []),
      ...(jdRequirements.tools || []),
      ...(jdRequirements.keywords || [])
    ];
    
    let count = 0;
    allKeywords.forEach(keyword => {
      if (this.keywordExists(keyword, resumeText)) {
        count++;
      }
    });
    
    return count;
  }

  /**
   * Complete ATS analysis
   */
  analyzeResume(resumeText, jdRequirements) {
    // Calculate ATS score
    const scoreResult = this.calculateATSScore(resumeText, jdRequirements);
    
    // Find missing keywords
    const missingKeywords = this.findMissingKeywords(resumeText, jdRequirements);
    
    // Generate suggestions
    const suggestions = this.generateSuggestions(resumeText, jdRequirements, scoreResult);
    
    // Calculate match percentage
    const totalKeywords = [
      ...(jdRequirements.required || jdRequirements.requiredSkills || []),
      ...(jdRequirements.preferred || jdRequirements.preferredSkills || []),
      ...(jdRequirements.tools || []),
      ...(jdRequirements.keywords || [])
    ].length;
    
    const matchedKeywords = totalKeywords - missingKeywords.length;
    const matchPercentage = totalKeywords > 0 
      ? Math.round((matchedKeywords / totalKeywords) * 100) 
      : 0;

    return {
      atsScore: scoreResult.atsScore,
      matchPercentage,
      missingKeywords,
      suggestions,
      breakdown: scoreResult.breakdown,
      matchDetails: scoreResult.matchDetails
    };
  }
}

module.exports = new ATSScoringService();
