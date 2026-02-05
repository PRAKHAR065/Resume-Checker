const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

class FileParser {
  async parsePDF(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return {
        text: data.text,
        pages: data.numpages
      };
    } catch (error) {
      throw new Error(`Error parsing PDF: ${error.message}`);
    }
  }

  async parseDOCX(filePath) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return {
        text: result.value,
        pages: 1
      };
    } catch (error) {
      throw new Error(`Error parsing DOCX: ${error.message}`);
    }
  }

  async parseTXT(filePath) {
    try {
      const text = fs.readFileSync(filePath, 'utf-8');
      return {
        text: text,
        pages: 1
      };
    } catch (error) {
      throw new Error(`Error parsing TXT: ${error.message}`);
    }
  }

  async parseFile(filePath, fileType) {
    const normalizedType = fileType.toLowerCase();
    
    switch (normalizedType) {
      case 'pdf':
        return await this.parsePDF(filePath);
      case 'docx':
        return await this.parseDOCX(filePath);
      case 'txt':
        return await this.parseTXT(filePath);
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  parseResumeSections(text) {
    // Basic parsing - can be enhanced with AI
    const sections = {
      experience: [],
      skills: [],
      education: [],
      summary: '',
      contact: {
        email: '',
        phone: '',
        location: ''
      }
    };

    // Extract email
    const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    if (emailMatch) sections.contact.email = emailMatch[0];

    // Extract phone
    const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch) sections.contact.phone = phoneMatch[0];

    // Try to identify sections
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    let currentSection = '';
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      
      if (line.includes('experience') || line.includes('work history') || line.includes('employment')) {
        currentSection = 'experience';
      } else if (line.includes('education') || line.includes('academic')) {
        currentSection = 'education';
      } else if (line.includes('skill')) {
        currentSection = 'skills';
      } else if (line.includes('summary') || line.includes('objective') || line.includes('profile')) {
        currentSection = 'summary';
      }
    }

    return sections;
  }
}

module.exports = new FileParser();
