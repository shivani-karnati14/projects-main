# 🤖 Tekisho - AI Business Card Scanner & Contact Manager

A powerful, modern web application that leverages AI to scan, extract, and analyze business card information using computer vision, OCR, and intelligent parsing. Features advanced QR code detection, voice assistant integration, and automated meeting scheduling.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-3178C6?logo=typescript)
![License](https://img.shields.io/badge/license-ISC-green.svg)

## ✨ Features

### 📸 Multi-Mode Scanning
- **QR Code Scanner**: Enhanced detection using jsQR + goQR.me API + OpenAI Vision (3-tier fallback)
- **Text Scanner**: AI-powered OCR for business cards using OpenAI GPT-4o-mini Vision
- **NFC Reader**: Near-field communication card reading (UI ready)
- **File Upload**: Batch processing with drag-and-drop support
- **Camera Integration**: Real-time webcam capture with live preview

### 🃏 Card Scanner App
- **Dedicated Card Scanner**: Streamlined workflow for business card processing
- **Real-time Processing**: Live status updates from backend
- **Meeting Scheduler**: Integrated calendar scheduling with extracted contact info
- **Transaction Tracking**: Unique transaction IDs for each scan
- **Confidence Scoring**: AI-powered confidence ratings for extraction accuracy

### 🤖 AI-Powered Analysis
- **GPT-4o-mini Vision**: Advanced text extraction from images
- **Structured Data Extraction**: Names, titles, companies, emails, phones, websites, addresses
- **QR Code Parsing**: Automatic detection and parsing of URLs, vCards, emails, phone numbers
- **LinkedIn Enrichment**: Automatic company and profile lookups via Python enrichment service
- **Multi-tier Detection**: Fallback strategies ensure maximum QR code detection rate

### 💾 Data Management
- **Supabase Integration**: PostgreSQL database for business card storage
- **MongoDB Support**: Optional document storage for research data
- **Real-time Sync**: Automatic database updates after processing
- **Transaction History**: Track all card scans with timestamps
- **Export Ready**: Structured JSON output for CRM integration

### 🎨 Modern UI/UX
- **Glassmorphism Design**: Beautiful gradient backgrounds with backdrop blur
- **Framer Motion Animations**: Smooth transitions and micro-interactions
- **Responsive Layout**: Mobile-first design that works on all devices
- **Toast Notifications**: Real-time feedback for user actions
- **Dark Mode**: Modern slate-900 color scheme with accent colors
- **Voice Assistant**: Interactive voice command interface (in development)

### 🗣️ Voice Integration
- **Voice Assistant Modal**: Floating assistant with avatar
- **Speech Recognition**: Browser-based voice input
- **Interactive Responses**: Natural language understanding
- **Visual Feedback**: Animated avatar and status indicators

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** and npm/yarn
- **Python 3.12+** (for backend services)
- **Supabase account** (for database)
- **OpenAI API key** (for AI Vision)
- **Modern browser** (Chrome/Edge recommended for camera features)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/shivani-karnati14/Syndy-AIAgent-UI_POC.git
cd Syndy-AIAgent-UI_POC
```

2. **Install frontend dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
# Supabase Configuration (MUST use VITE_ prefix)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Backend API URL
VITE_API_URL=http://localhost:8000
```

4. **Set up backend services**

**Main OCR Backend:**
```bash
cd ../ocr-backend  # Your main backend location
pip install -r requirements.txt

# Create backend .env
cat > .env << EOF
OPENAI_API_KEY=your-openai-api-key-here
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-service-role-key-here
MONGODB_URI=mongodb://localhost:27017  # optional
EOF

# Run backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Enrichment Service (LinkedIn/Company lookup):**
```bash
cd src/enrich_service
python -m venv env
source env/bin/activate  # Windows: env\Scripts\activate
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium

# Run enrichment service
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

5. **Start the development server**
```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

## 📁 Project Structure

```
Syndy-AIAgent-UI_POC/
├── src/
│   ├── components/
│   │   ├── screens/
│   │   │   ├── LandingScreen.tsx      # Card scanner landing page
│   │   │   ├── CardCaptureScreen.tsx  # Image capture interface
│   │   │   ├── ProcessingScreen.tsx   # Loading & status
│   │   │   ├── ResultScreen.tsx       # Display extracted data
│   │   │   └── MeetingConfirmationScreen.tsx
│   │   ├── features/
│   │   │   └── MeetingSchedulerModal.tsx  # Calendar integration
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── Toast.tsx
│   │   ├── HomePage.tsx               # Main landing with search
│   │   ├── ScanView.tsx               # Camera scanner (QR/Text/NFC)
│   │   ├── UploadView.tsx             # File upload & batch processing
│   │   ├── DatabaseView.tsx           # Browse stored contacts
│   │   ├── ChatView.tsx               # Chat interface
│   │   ├── CardScannerApp.tsx         # Dedicated card scanner flow
│   │   ├── VoiceAssistant.tsx         # Voice interaction modal
│   │   ├── RobotAvatar.tsx            # Animated mascot
│   │   └── Navbar.tsx                 # Navigation sidebar
│   ├── services/
│   │   ├── qrDetection.ts             # Multi-tier QR detection
│   │   ├── cardDetection.ts           # Business card detection
│   │   └── api.ts                     # API client (CardScannerAPI)
│   ├── lib/
│   │   ├── supabase.ts                # Supabase client + DatabaseService
│   │   └── mongodb.ts                 # MongoDB client (optional)
│   ├── types/
│   │   └── cardScanner.ts             # TypeScript interfaces
│   ├── enrich_service/
│   │   ├── main.py                    # FastAPI enrichment service
│   │   ├── requirements.txt
│   │   ├── Dockerfile
│   │   └── README.md
│   ├── images/                        # Static assets (avatar.png, etc.)
│   ├── App.tsx                        # Main application component
│   ├── main.tsx                       # Application entry point
│   ├── index.css                      # Global styles + Tailwind
│   └── vite-env.d.ts                  # TypeScript declarations
├── public/                            # Static public assets
├── .env                               # Environment variables (DO NOT COMMIT)
├── .gitignore
├── package.json                       # Dependencies & scripts
├── vite.config.ts                     # Vite configuration
├── tailwind.config.js                 # Tailwind CSS config
├── tsconfig.json                      # TypeScript config
├── tsconfig.app.json
├── tsconfig.node.json
├── eslint.config.js                   # ESLint configuration
├── postcss.config.js
└── README.md
```

## 🛠️ Tech Stack

### Frontend
- **React 18.3.1** - Modern UI framework with hooks
- **TypeScript 5.6.3** - Type-safe development
- **Vite 7.1.9** - Lightning-fast build tool
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **Framer Motion 12.23.24** - Production-ready animations
- **Lucide React** - Beautiful icon library

### QR & OCR Libraries
- **jsQR 1.4.0** - Client-side QR code detection
- **goQR.me API** - Cloud-based QR fallback
- **Tesseract.js 6.0.1** - OCR engine (legacy support)
- **qr-scanner 1.4.2** - Enhanced scanning capabilities

### Backend & APIs
- **OpenAI GPT-4o-mini** - Vision API for text extraction
- **Supabase** - PostgreSQL database + real-time subscriptions
- **FastAPI** - Python backend for OCR processing
- **Playwright** - Headless browser for LinkedIn scraping
- **MongoDB** - Optional document storage

### Development Tools
- **ESLint 9.17.0** - Code linting
- **PostCSS** - CSS processing
- **TypeScript ESLint** - TypeScript linting

## 📖 Usage

### 🎯 Card Scanner Flow

1. **Navigate to Card Scanner**
   - Click "Card Scanner" in the navigation sidebar
   - OR click "Start Scanning" from landing screen

2. **Capture Business Card**
   - Use camera to take photo of business card
   - OR upload from file system
   - Review captured image

3. **AI Processing**
   - Backend processes image with OpenAI Vision API
   - Real-time status updates via transaction ID
   - Extracts: name, title, company, email, phone, address

4. **View Results**
   - Review extracted contact information
   - See confidence score (0-100%)
   - Option to schedule meeting immediately

5. **Schedule Meeting (Optional)**
   - Click "Schedule Meeting" button
   - System updates meeting request status in database
   - Receive confirmation

### 📸 Camera Scanning

1. **Access Scanner**
   - Click "Scanner" in navigation
   - Choose scan mode: QR Code, NFC, or Text Scan

2. **QR Code Mode**
   - Point camera at QR code
   - Click "Capture & Analyze"
   - Uses 3-tier detection:
     - Tier 1: Client-side jsQR
     - Tier 2: goQR.me API
     - Tier 3: OpenAI Vision API
   - Parses URLs, emails, phones, vCards automatically

3. **Text Scan Mode**
   - Capture business card or document
   - AI Vision extracts all text
   - Structures data into contact fields
   - Detects embedded QR codes
   - Saves to database automatically

### 📤 File Upload

1. **Navigate to Upload Files**
2. **Select Files**
   - Drag & drop images (JPEG, PNG, GIF, WebP)
   - OR click to browse files
   - Max 10MB per file
3. **Process Files**
   - Click "Upload All Files"
   - Real-time progress indicators
   - Each file processed independently
4. **View Results**
   - Click "View Results" on any completed file
   - See extracted text + QR codes
   - Review structured contact information

### 🗣️ Voice Assistant

1. **Activate Assistant**
   - Click microphone button on home page
   - OR press designated hotkey (future)
2. **Speak Command**
   - "Find contact John Doe"
   - "Schedule meeting with [name]"
   - "Show recent scans"
3. **View Response**
   - Assistant processes natural language
   - Displays relevant results
   - Provides voice feedback

### 💾 Database Management

1. **View Contacts**
   - Navigate to "Analysis" → "Database"
   - Browse all stored business cards
2. **Search & Filter**
   - Use search bar for quick lookup
   - Filter by company, date, etc.
3. **Export Data**
   - Select contacts
   - Export to CSV/JSON (future feature)

## 🔧 Database Schema

### Supabase `business_cards` Table

```sql
CREATE TABLE business_cards (
  id SERIAL PRIMARY KEY,
  name TEXT,
  title TEXT,
  company TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  raw_text TEXT,
  confidence DECIMAL(3,2),
  engine_used TEXT DEFAULT 'ai_vision',
  qr_codes TEXT[],
  qr_count INTEGER DEFAULT 0,
  extracted_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Supabase `linkedin_companies` Table

```sql
CREATE TABLE linkedin_companies (
  id SERIAL PRIMARY KEY,
  company_name TEXT NOT NULL,
  website TEXT,
  industry TEXT,
  company_size TEXT,
  hq_location TEXT,
  company_type TEXT,
  linkedin_url TEXT,
  scraped_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Card Scanner Tables

```sql
-- User info from card scans
CREATE TABLE user_info (
  transaction_id TEXT PRIMARY KEY,
  email TEXT,
  name TEXT,
  phone TEXT,
  company TEXT,
  is_meeting_requested BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Meeting requests
CREATE TABLE meeting_requests (
  id SERIAL PRIMARY KEY,
  transaction_id TEXT REFERENCES user_info(transaction_id),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🎯 API Endpoints

### Main Backend (FastAPI)

**Base URL**: `http://localhost:8000`

#### `POST /ai-business-card`
Process business card with AI Vision

**Input**: `multipart/form-data`
```typescript
{
  file: File  // Image file (JPEG, PNG, etc.)
}
```

**Output**:
```typescript
{
  success: boolean
  method: "ai_vision"
  raw_analysis: string
  formatted_output: string
  structured_data: {
    name?: string
    title?: string
    company?: string
    email?: string
    phone?: string
    website?: string
    address?: string
  }
  confidence: number  // 0.0 - 1.0
  qr_codes?: Array<{
    data: string
    method: string
    parsed?: {
      content_type: string
      details: object
    }
  }>
  qr_count: number
  saved_to_database: boolean
}
```

#### `POST /upload-card`
Upload card for card scanner flow

**Returns**: `{ transactionID: string }`

#### `GET /api/processing-status/:transactionID`
Check processing status

**Returns**:
```typescript
{
  processing_status: 'pending' | 'processing' | 'completed' | 'failed'
  llm_response?: {
    extracted_data: object
    confidence_score: number
  }
}
```

#### `GET /api/getUserInfo/:transactionID`
Fetch extracted user info

**Returns**: `UserInfo` object

#### `POST /api/request-meeting`
Request meeting with contact

**Input**:
```typescript
{
  transactionID: string
}
```

### Enrichment Service (FastAPI)

**Base URL**: `http://localhost:8001`

#### `POST /enrich`
Enrich contact with LinkedIn/company data

**Input**:
```typescript
{
  name: string
  company?: string
  email?: string
  raw_text?: string
}
```

**Output**:
```typescript
{
  company_search_results: Array<{
    title: string
    url: string
    snippet: string
  }>
  company_info: {
    url: string
    title: string
    description: string
    emails: string[]
  }
  linkedin_candidates: Array<{
    title: string
    url: string
    snippet: string
  }>
  linkedin_profiles: Array<{
    name: string
    title: string
    company: string
    location: string
  }>
  meta: {
    elapsed_seconds: number
    linkedin_profiles_found: number
  }
}
```

#### `POST /test-linkedin`
Test LinkedIn search functionality

## 🔧 Configuration

### Supabase Setup

1. Create project at [supabase.com](https://supabase.com)
2. Go to Settings → API
3. Copy **Project URL** and **anon/public key**
4. Run SQL schema from above in SQL Editor
5. Update `.env` with credentials
6. Enable Row Level Security (RLS) policies as needed

### OpenAI API Setup

1. Get API key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Add to backend `.env` as `OPENAI_API_KEY`
3. Ensure billing is enabled
4. Recommended model: `gpt-4o-mini` (cost-effective with vision)

### Playwright Setup (for enrichment service)

```bash
cd src/enrich_service
pip install playwright
playwright install chromium
```

## 🧪 Testing

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Build production
npm run build

# Preview production build
npm run preview

# Test backend
cd ../ocr-backend
pytest  # if tests exist
```

## 🚢 Deployment

### Frontend (Vercel/Netlify)

```bash
# Build
npm run build

# Deploy dist/ folder
# Set environment variables in hosting dashboard:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
# - VITE_API_URL (your deployed backend URL)
```

### Backend (Docker)

**Main Backend:**
```bash
cd ../ocr-backend
docker build -t ai-business-card-api .
docker run -p 8000:8000 --env-file .env ai-business-card-api
```

**Enrichment Service:**
```bash
cd src/enrich_service
docker build -t enrich-service .
docker run -p 8001:8000 --env-file .env enrich-service
```

### Environment Variables for Production

**Frontend:**
- `VITE_SUPABASE_URL`: Production Supabase URL
- `VITE_SUPABASE_ANON_KEY`: Production anon key
- `VITE_API_URL`: Production backend URL (https://your-api.com)

**Backend:**
- `OPENAI_API_KEY`: Production OpenAI key
- `SUPABASE_URL`: Production Supabase URL
- `SUPABASE_KEY`: Service role key (keep secure!)
- `ALLOWED_ORIGINS`: Frontend domains (CORS)

## 🤝 Contributing

Contributions welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

**Development Guidelines:**
- Follow TypeScript strict mode
- Use Tailwind CSS for styling
- Write descriptive commit messages
- Add comments for complex logic
- Update README for new features

## 📝 Environment Variables Reference

### Frontend `.env`
```env
# Supabase (MUST use VITE_ prefix for Vite)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Backend API
VITE_API_URL=http://localhost:8000  # or production URL
```

### Backend `.env` (main)
```env
# OpenAI
OPENAI_API_KEY=sk-...

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key

# Optional
MONGODB_URI=mongodb://localhost:27017
GEMINI_API_KEY=your-gemini-key  # alternative AI provider
```

### Enrichment Service `.env`
```env
# Optional: Add API keys for enhanced enrichment
PROXYCURL_API_KEY=your-proxycurl-key  # LinkedIn data
CLEARBIT_API_KEY=your-clearbit-key     # Company data
```

## 🐛 Troubleshooting

### QR Codes Not Detected
- ✅ Ensure good lighting and clear focus
- ✅ Try adjusting camera angle (45° works best)
- ✅ Backend AI Vision fallback will catch most codes
- ✅ Check browser console for detection logs

### Supabase Connection Errors
- ✅ Verify `VITE_` prefix on all frontend env vars
- ✅ Check credentials match Supabase dashboard
- ✅ Restart dev server after changing `.env`
- ✅ Ensure tables exist (run SQL schema)

### AI Vision API Errors
- ✅ Verify OpenAI API key is valid
- ✅ Check available credits/billing
- ✅ Ensure backend is running on `localhost:8000`
- ✅ Check backend logs for detailed error messages

### Camera Not Working
- ✅ Grant camera permissions in browser
- ✅ Use HTTPS in production (required for camera API)
- ✅ Test in Chrome/Edge (best compatibility)
- ✅ Check browser console for getUserMedia errors

### Build Errors
- ✅ Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- ✅ Clear Vite cache: `rm -rf node_modules/.vite`
- ✅ Ensure Node.js version is 18+
- ✅ Check for TypeScript errors: `npm run typecheck`

## 📊 Performance Tips

- Use image compression before upload (max 2MB recommended)
- Batch upload limit: 10 files at once
- QR detection timeout: 30 seconds
- AI Vision timeout: 60 seconds
- Database operations use connection pooling

## 🔐 Security Notes

- Never commit `.env` files
- Use service role key only in backend
- Implement RLS policies in Supabase
- Validate file types on upload
- Sanitize user inputs before database insertion
- Use HTTPS in production

## 📄 License

ISC License - see [LICENSE](LICENSE) file for details

## 👥 Authors

- **Krishna** - Lead Developer
- **Shivani Karnati** - [@shivani-karnati14](https://github.com/shivani-karnati14)

## 🙏 Acknowledgments

- OpenAI for GPT-4o-mini Vision API
- Supabase for database infrastructure
- jsQR library for client-side QR detection
- goQR.me API for fallback QR detection
- Tesseract.js for OCR capabilities
- Playwright for web scraping
- The React and TypeScript communities

## 🔗 Links

- **Repository**: https://github.com/shivani-karnati14/Syndy-AIAgent-UI_POC
- **Issues**: https://github.com/shivani-karnati14/Syndy-AIAgent-UI_POC/issues
- **Supabase**: https://supabase.com
- **OpenAI**: https://platform.openai.com
- **Vite**: https://vitejs.dev
- **Tailwind CSS**: https://tailwindcss.com

---

Made with ❤️ using React, TypeScript, AI, and lots of coffee ☕

**Current Version**: 1.0.0  
**Last Updated**: 2024  
**Status**: Active Development 🚀
