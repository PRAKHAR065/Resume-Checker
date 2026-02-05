# Setup Guide - AI Resume Optimizer

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- Google Gemini API Key (free tier available)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. MongoDB Setup

#### Option A: Local MongoDB
1. Install MongoDB from https://www.mongodb.com/try/download/community
2. Start MongoDB service
3. MongoDB will run on `mongodb://localhost:27017` by default

#### Option B: MongoDB Atlas (Cloud)
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env` file

### 3. Google Gemini API Setup

1. Go to https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key
5. Add it to `server/.env` file

### 4. Environment Configuration

1. Copy the example environment file:
```bash
cd server
cp .env.example .env
```

2. Edit `server/.env` and update:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/resume_optimizer
JWT_SECRET=your_random_secret_key_here
GEMINI_API_KEY=your_gemini_api_key_here
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

**Important:** 
- Replace `JWT_SECRET` with a random string (use a password generator)
- Replace `GEMINI_API_KEY` with your actual API key
- Update `MONGODB_URI` if using MongoDB Atlas

### 5. Create Uploads Directory

```bash
cd server
mkdir uploads
```

### 6. Start the Application

#### Development Mode (Both servers)

From the root directory:
```bash
npm run dev
```

This will start:
- Backend server on http://localhost:5000
- Frontend React app on http://localhost:3000

#### Or Start Separately

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

### 7. Access the Application

1. Open browser to http://localhost:3000
2. Register a new account
3. Start using the application!

## Usage Flow

1. **Upload Resume**: Go to "Upload Resume" and upload your resume (PDF, DOCX, or TXT)
2. **Analyze JD**: Go to "Analyze JD" and paste a job description
3. **Optimize**: Go to "Optimize Resume", select your resume and JD, review missing keywords, select keywords to add, and optimize
4. **Download**: Download your optimized resume as PDF

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env` is correct
- For Atlas, ensure IP whitelist includes your IP

### Gemini API Error
- Verify API key is correct
- Check API quota/limits
- Ensure internet connection

### File Upload Error
- Check file size (max 5MB)
- Verify file format (PDF, DOCX, TXT only)
- Ensure `uploads` directory exists and is writable

### Port Already in Use
- Change `PORT` in `server/.env`
- Or kill the process using the port

## Production Deployment

1. Build the React app:
```bash
cd client
npm run build
```

2. Serve the build folder with Express or use a service like Vercel/Netlify for frontend

3. Deploy backend to services like:
   - Heroku
   - Railway
   - Render
   - DigitalOcean

4. Update environment variables in production environment

## Support

For issues or questions, check:
- MongoDB logs
- Server console output
- Browser console for frontend errors
