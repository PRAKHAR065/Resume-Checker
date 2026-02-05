# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies
```bash
npm run install-all
```

### 2. Set Up Environment Variables

Create `server/.env` file:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/resume_optimizer
JWT_SECRET=change_this_to_random_string
GEMINI_API_KEY=your_gemini_api_key_here
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

**Get Gemini API Key:**
1. Visit https://makersuite.google.com/app/apikey
2. Sign in with Google
3. Click "Create API Key"
4. Copy and paste in `.env` file

### 3. Start MongoDB

**Windows:**
- Install MongoDB from https://www.mongodb.com/try/download/community
- MongoDB service should start automatically

**Mac/Linux:**
```bash
mongod
```

**Or use MongoDB Atlas (Cloud):**
- Sign up at https://www.mongodb.com/cloud/atlas
- Create free cluster
- Get connection string
- Update `MONGODB_URI` in `.env`

### 4. Run the Application

```bash
npm run dev
```

This starts:
- ✅ Backend: http://localhost:5000
- ✅ Frontend: http://localhost:3000

### 5. Open Browser

Navigate to: **http://localhost:3000**

1. Register a new account
2. Upload your resume
3. Analyze a job description
4. Optimize your resume!

## 📋 Features Checklist

- ✅ User authentication (Register/Login)
- ✅ Resume upload (PDF, DOCX, TXT)
- ✅ Job description analysis
- ✅ AI-powered resume matching
- ✅ Keyword extraction and selection
- ✅ Resume optimization
- ✅ ATS score tracking
- ✅ Download optimized resume

## 🎯 Usage Example

1. **Upload Resume**: Go to "Upload Resume" → Drag & drop your resume
2. **Analyze JD**: Go to "Analyze JD" → Paste job description → Click "Analyze"
3. **Optimize**: Go to "Optimize Resume" → Select resume & JD → Review missing keywords → Select keywords → Click "Optimize"
4. **Download**: Click "Download PDF" to get your optimized resume

## ⚠️ Troubleshooting

**MongoDB not connecting?**
- Check if MongoDB is running
- Verify `MONGODB_URI` in `.env`

**Gemini API error?**
- Verify API key is correct
- Check API quota

**Port already in use?**
- Change `PORT` in `server/.env`
- Or kill process using port 5000/3000

## 📚 Need More Help?

See `SETUP.md` for detailed setup instructions.
