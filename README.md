# 🤖 AI Business Card Scanner & Analyzer

A powerful, modern web application that leverages AI to scan, extract, and analyze business card information using computer vision, OCR, and intelligent parsing. Built with React, TypeScript, and integrated with OpenAI Vision API.

![Version](https://img.shields.io/badge/version-0.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-3178C6?logo=typescript)
![License](https://img.shields.io/badge/license-ISC-green.svg)

## ✨ Features

### 📸 Multi-Mode Scanning
- **QR Code Scanner**: Enhanced QR code detection using jsQR + goQR.me API fallback
- **Text Scanner**: AI-powered OCR for business cards using OpenAI GPT-4o-mini Vision
- **File Upload**: Batch processing of business card images
- **Camera Integration**: Real-time camera capture with preview

### 🤖 AI-Powered Analysis
- **Intelligent Text Extraction**: Extract names, titles, companies, emails, phones, websites, and addresses
- **QR Code Parsing**: Automatically parse QR codes for URLs, vCards, emails, phone numbers, and more
- **Confidence Scoring**: AI confidence ratings for extraction accuracy
- **Structured Data Output**: Clean, structured JSON output for easy integration

### 💾 Data Management
- **Supabase Integration**: Store business card data in `business_cards` table
- **MongoDB Support**: Optional MongoDB storage for company research data
- **LinkedIn Company Search**: Automatic company profile lookups
- **Data Export**: Export structured data for CRM integration

### 🎨 Modern UI/UX
- **Glassmorphism Design**: Beautiful gradient backgrounds with backdrop blur effects
- **Responsive Layout**: Works on desktop, tablet, and mobile devices
- **Real-time Status Updates**: Live feedback during processing
- **Animated Transitions**: Smooth Framer Motion animations

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.12+ (for backend)
- Supabase account (for database)
- OpenAI API key (for AI Vision)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/shivani-karnati14/projects-main.git
cd projects-main
```

2. **Install frontend dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
```env
# Supabase Configuration (MUST use VITE_ prefix for Vite)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Backend API URL (optional, defaults to localhost:8000)
VITE_API_URL=http://localhost:8000
```

4. **Set up backend (in separate terminal)**
```bash
cd ../ocr-backend  # or wherever your backend is located
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

5. **Start the development server**
```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

## 📁 Project Structure

```
projects-main/
├── src/
│   ├── components/
│   │   ├── HomePage.tsx          # Landing page with search
│   │   ├── ScanView.tsx          # Camera scanner (QR/Text)
│   │   ├── UploadView.tsx        # File upload & batch processing
│   │   ├── DatabaseView.tsx      # View stored business cards
│   │   ├── ChatView.tsx          # Chat interface
│   │   └── VoiceAssistant.tsx    # Voice interaction (future)
│   ├── services/
│   │   ├── qrDetection.ts        # Enhanced QR code detection
│   │   └── cardDetection.ts      # Business card detection
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client & database service
│   │   └── mongodb.ts            # MongoDB client (optional)
│   ├── App.tsx                   # Main application component
│   └── main.tsx                  # Application entry point
├── public/                       # Static assets
├── .env                          # Environment variables (DO NOT COMMIT)
├── package.json                  # Dependencies & scripts
├── vite.config.ts                # Vite configuration
├── tailwind.config.js            # Tailwind CSS configuration
└── tsconfig.json                 # TypeScript configuration
```

## 🛠️ Tech Stack

### Frontend
- **React 18.3.1** - UI framework
- **TypeScript 5.6.3** - Type safety
- **Vite 7.1.9** - Build tool & dev server
- **Tailwind CSS 3.4.17** - Utility-first CSS
- **Framer Motion 12.23.24** - Animations
- **Lucide React** - Icon library

### QR & OCR Libraries
- **jsQR 1.4.0** - Client-side QR detection
- **Tesseract.js 6.0.1** - OCR engine (fallback)
- **qr-scanner 1.4.2** - Enhanced QR scanning

### Backend Integration
- **Supabase** - PostgreSQL database & auth
- **OpenAI GPT-4o-mini** - AI Vision for text extraction
- **MongoDB** - Optional document storage
- **FastAPI** - Python backend API

## 📖 Usage

### Scanning a Business Card

1. **Camera Scan**
   - Click "Scan Code" in navigation
   - Choose "QR Code" or "Text Scan"
   - Position business card in camera view
   - Click "Capture & Analyze"
   - View extracted information

2. **File Upload**
   - Click "Upload Files"
   - Drag & drop or select business card images
   - Click "Upload All Files"
   - Review extracted data
   - Data automatically saved to database

### QR Code Detection

The app uses a **multi-tier QR detection strategy**:

1. **Frontend jsQR**: Fast, client-side detection
2. **goQR.me API**: Cloud-based fallback for complex QR codes
3. **Backend AI Vision**: Extract QR codes from AI analysis

Supported QR formats:
- URLs (http://, https://)
- Email addresses (mailto:)
- Phone numbers (tel:)
- vCards (contact information)
- Plain text

### Database Schema

**Supabase `business_cards` table:**
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
  other_info TEXT[],
  source TEXT CHECK (source IN ('text_scan', 'file_upload')),
  processing_method TEXT,
  confidence_score DECIMAL(3,2),
  raw_text TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🔧 Configuration

### Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Go to Settings → API
3. Copy your **Project URL** and **anon/public key**
4. Create the `business_cards` table using the schema above
5. Update `.env` with your credentials

### OpenAI API Setup

1. Get API key from https://platform.openai.com/api-keys
2. Add to backend `.env` as `OPENAI_API_KEY`
3. Ensure you have credits/billing enabled

## 🎯 API Endpoints

### Backend (FastAPI)

- `POST /ai-business-card` - Process business card with AI Vision
  - **Input**: `multipart/form-data` with `file` field
  - **Output**: Structured contact info + QR codes + confidence score

- `POST /batch-ocr` - Process multiple business cards (deprecated)
- `GET /health` - Health check endpoint

## 🧪 Testing

```bash
# Run type checking
npm run typecheck

# Run linting
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🚢 Deployment

### Frontend (Vercel/Netlify)

```bash
npm run build
# Deploy the `dist` folder
```

### Backend (Docker)

```bash
cd ocr-backend
docker build -t ai-business-card-api .
docker run -p 8000:8000 --env-file .env ai-business-card-api
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Environment Variables Reference

### Frontend `.env`
```env
VITE_SUPABASE_URL=          # Your Supabase project URL
VITE_SUPABASE_ANON_KEY=     # Your Supabase anon key
VITE_API_URL=               # Backend API URL (optional)
```

### Backend `.env`
```env
OPENAI_API_KEY=             # OpenAI API key for Vision
SUPABASE_URL=               # Supabase project URL
SUPABASE_KEY=               # Supabase service role key
MONGODB_URI=                # MongoDB connection string (optional)
GEMINI_API_KEY=             # Google Gemini API key (optional)
```

## 🐛 Troubleshooting

### QR Codes Not Detected
- Ensure good lighting and clear image
- Try adjusting camera angle
- Backend AI Vision may catch QR codes frontend misses

### Supabase Connection Errors
- Verify `VITE_` prefix is used for all frontend env vars
- Check credentials are correct
- Restart dev server after changing `.env`

### AI Vision API Errors
- Check OpenAI API key is valid
- Ensure you have available credits
- Verify backend is running on `localhost:8000`

## 📄 License

ISC License - see LICENSE file for details

## 👥 Authors

- **Shivani Karnati** - [@shivani-karnati14](https://github.com/shivani-karnati14)

## 🙏 Acknowledgments

- OpenAI for GPT-4o-mini Vision API
- Supabase for database infrastructure
- jsQR library for client-side QR detection
- Tesseract.js for OCR capabilities
- The React and TypeScript communities

## 🔗 Links

- **Repository**: https://github.com/shivani-karnati14/projects-main
- **Issues**: https://github.com/shivani-karnati14/projects-main/issues
- **Supabase**: https://supabase.com
- **OpenAI**: https://platform.openai.com

---

Made with ❤️ using React, TypeScript, and AI
