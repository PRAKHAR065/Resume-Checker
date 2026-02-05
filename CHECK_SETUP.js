// Setup Verification Script
// Run this with: node CHECK_SETUP.js

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Resume Optimizer Setup...\n');

let hasErrors = false;
let hasWarnings = false;

// Check 1: .env file
console.log('1. Checking .env file...');
const envPath = path.join(__dirname, 'server', '.env');
if (fs.existsSync(envPath)) {
  console.log('   ✅ .env file exists');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check required variables
  const requiredVars = ['MONGODB_URI', 'JWT_SECRET', 'GEMINI_API_KEY'];
  requiredVars.forEach(varName => {
    if (envContent.includes(`${varName}=`) && !envContent.includes(`${varName}=your_`) && !envContent.includes(`${varName}=change_`)) {
      console.log(`   ✅ ${varName} is set`);
    } else {
      console.log(`   ⚠️  ${varName} needs to be configured`);
      hasWarnings = true;
    }
  });
} else {
  console.log('   ❌ .env file NOT found');
  console.log('   📝 Create server/.env file with required variables');
  hasErrors = true;
}

// Check 2: Node modules
console.log('\n2. Checking dependencies...');
const serverNodeModules = path.join(__dirname, 'server', 'node_modules');
const clientNodeModules = path.join(__dirname, 'client', 'node_modules');

if (fs.existsSync(serverNodeModules)) {
  console.log('   ✅ Server dependencies installed');
} else {
  console.log('   ❌ Server dependencies NOT installed');
  console.log('   📝 Run: cd server && npm install');
  hasErrors = true;
}

if (fs.existsSync(clientNodeModules)) {
  console.log('   ✅ Client dependencies installed');
} else {
  console.log('   ❌ Client dependencies NOT installed');
  console.log('   📝 Run: cd client && npm install');
  hasErrors = true;
}

// Check 3: Uploads directory
console.log('\n3. Checking uploads directory...');
const uploadsDir = path.join(__dirname, 'server', 'uploads');
if (fs.existsSync(uploadsDir)) {
  console.log('   ✅ Uploads directory exists');
} else {
  console.log('   ⚠️  Uploads directory not found (will be created automatically)');
  hasWarnings = true;
}

// Check 4: Critical files
console.log('\n4. Checking critical files...');
const criticalFiles = [
  'server/server.js',
  'server/config/gemini.js',
  'client/src/App.js',
  'client/src/index.js'
];

criticalFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file} exists`);
  } else {
    console.log(`   ❌ ${file} NOT found`);
    hasErrors = true;
  }
});

// Summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ Setup incomplete. Please fix the errors above.');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  Setup mostly complete, but check warnings above.');
  console.log('📝 Make sure to configure your .env file with:');
  console.log('   - MONGODB_URI (your MongoDB connection string)');
  console.log('   - JWT_SECRET (a random secret string)');
  console.log('   - GEMINI_API_KEY (from https://makersuite.google.com/app/apikey)');
} else {
  console.log('✅ Setup looks good! You can start the app with: npm run dev');
}
console.log('='.repeat(50));
