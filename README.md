# 🌱 GreenGrow – Global AI-Powered Agriculture Chat Assistant

> **Tagline:** Smarter Farming. Stronger Communities. A Greener World.

GreenGrow is a global AI-powered conversational web application built for farmers, agriculture students, researchers, and beginners worldwide. It allows users to ask questions regarding crops, soil health, irrigation, fertilizers, pests, and sustainable farming methods in their regional or international native language through the Google Gemini API, with built-in voice input and audio playback.

---

## 🌾 Key Features

1. **Farmer-Friendly Accessible Interface**
   - **Picture-Based Navigation:** 6 core agriculture visual categories (🌱 Crop Information, 🌾 Soil Problems, 💧 Water & Irrigation, 🌿 Fertilizer Guidance, 🐛 Plant & Pest Problems, 🌦️ Weather & Farming).
   - **1-Tap Example Questions:** Farmers can get answers with a single tap without needing to type long queries.
   - **First-Time Farmer Walkthrough:** Welcomes users, guides language selection with native scripts, captures optional farming location, and explains voice actions.

2. **Global Language System (Searchable Catalogue)**
   - Over 50+ languages supported across **Indian Regional Languages** (Kannada, Hindi, Telugu, Tamil, Marathi, Malayalam, Gujarati, Bengali, Punjabi, Odia, Assamese, Urdu, Bhojpuri, Maithili, Konkani, etc.) and **International Languages** (Spanish, French, German, Portuguese, Swahili, Arabic, Mandarin, Japanese, Indonesian, Vietnamese, etc.).
   - All languages rendered with **Native Script Display** (e.g. ಕನ್ನಡ, हिन्दी, தமிழ், తెలుగు, বাংলা, मराठी, Español, etc.).
   - BCP 47 speech codes mapped for automated speech recognition and speech synthesis.
   - Fully searchable by language name, country, or state/region.

3. **Voice Input & Voice Output (Speech)**
   - **Voice Input:** Large microphone button utilizing the browser's Web Speech API. Farmers can speak their question, review the recognized transcript, edit or send in 1 tap.
   - **Voice Output (Listen):** Integrated "Listen" button beneath AI responses to read answers aloud in the selected language voice. Includes Play, Stop, and Pause controls.
   - Graceful fallback to readable formatted text whenever browser audio capabilities or language voices are limited.

4. **Agriculture-Focused Gemini AI Integration**
   - Powered by Google's official `@google/genai` SDK on the Node.js/Express backend.
   - Strict agricultural system instruction prioritizing simple everyday language, step-by-step guidance, no fabricated weather/market statistics, and safety advisories for hazardous pesticides.
   - Politely redirects non-farming questions back to agriculture.
   - Configurable model (defaults to `gemini-2.5-flash`).

5. **Chat History & Conversation Management**
   - Auto-generated conversation titles based on the first query.
   - Delete, review, and resume past chats.
   - Copy response to clipboard with feedback indicator.
   - Regenerate response option for last assistant turn.

6. **Authentication & Hackathon Guest Mode**
   - Full Supabase Authentication support (Email & Password sign up, sign in, session persistence).
   - Instant **Guest Farmer Mode**: allows immediate demonstration and testing without requiring database or login credentials.
   - Row Level Security (RLS) policies protecting individual conversations.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React, React Router 6, Web Speech API |
| **Backend** | Node.js, Express 4, TypeScript, `@google/genai` (Official Google GenAI SDK), `cors`, `dotenv`, `express-rate-limit` |
| **Database & Auth** | Supabase PostgreSQL, Supabase Auth (`@supabase/supabase-js`), Row Level Security |
| **Deployment Ready** | Frontend: Vercel / Netlify \| Backend: Render / Railway |

---

## 📂 Project Folder Structure

```text
greengrow/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/           # ChatWindow, ChatMessage, ChatInput, TypingIndicator, MessageActions
│   │   │   ├── layout/         # Header, Sidebar, ChatLayout
│   │   │   ├── voice/          # MicrophoneButton, SpeechRecognitionStatus, ListenButton
│   │   │   ├── farmer/         # FarmerHomeScreen, AgricultureCategoryCards, CategoryQuestions, OnboardingModal
│   │   │   ├── language/       # LanguageSelectorModal, LanguageSearch, CountrySelector, RegionSelector
│   │   │   └── common/         # Button, LoadingSpinner, ErrorMessage, ConfirmDialog
│   │   ├── pages/              # ChatPage (/), LoginPage (/login), RegisterPage (/register), SettingsPage (/settings)
│   │   ├── hooks/              # useSpeechRecognition, useSpeechSynthesis, useAuth
│   │   ├── context/            # AuthContext, PreferencesContext
│   │   ├── services/           # api.ts, supabaseClient.ts
│   │   ├── data/               # languages.json, categories.ts
│   │   ├── types/              # TypeScript interface definitions
│   │   ├── App.tsx             # Route definitions
│   │   ├── main.tsx
│   │   └── index.css           # Tailwind base & utilities
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── tsconfig.json
│   ├── .env.example
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── config/             # env.ts, gemini.ts
│   │   ├── controllers/        # chatController.ts, conversationController.ts, profileController.ts
│   │   ├── middleware/         # authMiddleware.ts, rateLimiter.ts, validate.ts
│   │   ├── routes/             # chatRoutes.ts, conversationRoutes.ts, profileRoutes.ts, healthRoutes.ts
│   │   ├── services/           # geminiService.ts, supabaseService.ts
│   │   ├── data/               # languages.json
│   │   ├── utils/              # logger.ts
│   │   ├── app.ts
│   │   └── server.ts
│   ├── tsconfig.json
│   ├── .env.example
│   └── package.json
│
├── supabase/
│   └── migrations/
│       └── 20261114_init_schema.sql  # Profiles & Conversations schema with RLS
│
├── .gitignore
└── README.md
```

---

## 🚀 Local Installation & Running

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm

### 1. Clone & Setup Backend

```bash
cd backend
npm install
```

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `backend/.env` with your settings:
```env
PORT=5000
NODE_ENV=development

# Obtain your free Gemini API key from Google AI Studio: https://aistudio.google.com/
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

# Optional: Supabase configuration (omit to run in Demo / Guest mode)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

FRONTEND_URL=http://localhost:5173
```

Start the backend development server:
```bash
npm run dev
# Or build and run production:
npm run build
npm start
```
The backend starts at `http://localhost:5000`. Test health at: `http://localhost:5000/api/health`.

---

### 2. Setup Frontend

Open a new terminal window:

```bash
cd frontend
npm install
```

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Ensure `frontend/.env` contains:
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Start the frontend development server:
```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🗄️ Database Setup (Supabase)

If you wish to enable cloud persistence and user authentication:
1. Create a project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Paste and run the migration script located in:
   `supabase/migrations/20261114_init_schema.sql`
4. Copy your **Project URL**, **Anon Key**, and **Service Role Key** from Supabase Settings -> API into `backend/.env` and `frontend/.env`.

*Note: If Supabase is not configured, GreenGrow automatically operates in Demo / Guest mode, storing conversations locally so you can test immediately without any database setup!*

---

## 🌐 Extending the Language Catalogue

Languages are stored data-driven in `frontend/src/data/languages.json` and `backend/src/data/languages.json`.

To add a new language, append an entry following this structure:

```json
{
  "code": "te",
  "name": "Telugu",
  "nativeName": "తెలుగు",
  "country": "India",
  "region": "Andhra Pradesh & Telangana",
  "type": "regional",
  "supportStatus": "available",
  "speechCode": "te-IN",
  "popular": true
}
```

- `code`: ISO 639-1 / 639-2 language code.
- `speechCode`: BCP 47 locale tag used by browser SpeechRecognition and SpeechSynthesis.
- `supportStatus`: `"available"` (full voice and AI support) or `"limited"` (AI text supported, device voice synthesizer may vary).

---

## 🎙️ Voice Features & Limitations

- **Browser Capabilities:** Speech Recognition (`window.webkitSpeechRecognition` / `window.SpeechRecognition`) and Text-to-Speech (`window.speechSynthesis`) run directly in the browser using native capabilities without uploading user audio recordings to servers.
- **Recommended Browsers:** Google Chrome, Microsoft Edge, and modern Safari offer the best multilingual speech recognition coverage.
- **Microphone Permissions:** Microphone access is requested only when the user taps the microphone icon.
- **Text Fallback:** If a device or browser lacks speech recognition or speech output for a particular regional dialect, GreenGrow provides clear formatted text answers and text inputs.

---

## 🚢 Deployment

### Frontend (Vercel)
1. Push repository to GitHub.
2. In Vercel, import the `frontend/` directory.
3. Set Environment Variables:
   - `VITE_API_BASE_URL`: `https://your-backend-service.onrender.com/api`
   - `VITE_SUPABASE_URL`: `https://your-project.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `your_supabase_anon_key`
4. Build command: `npm run build` | Output directory: `dist`.

### Backend (Render)
1. In Render, create a new **Web Service** connected to the repository.
2. Root Directory: `backend`.
3. Build Command: `npm install && npm run build`.
4. Start Command: `npm start`.
5. Set Environment Variables:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `GEMINI_API_KEY`: `your_gemini_api_key`
   - `GEMINI_MODEL`: `gemini-2.5-flash`
   - `FRONTEND_URL`: `https://your-frontend.vercel.app`
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

---

## 🔒 Security Best Practices Implemented

- **Zero Client-Side API Keys:** The Google Gemini API key is strictly stored on the backend server in environment variables.
- **Rate Limiting:** Chat requests are rate-limited (`express-rate-limit`) to prevent API abuse.
- **Input Validation:** Incoming prompts and language codes are validated and sanitized before hitting the LLM.
- **Row Level Security (RLS):** Database policies ensure authenticated users can only view and mutate their own conversations and profiles.
- **Privacy:** Voice processing uses browser APIs locally; no microphone recordings are stored or transmitted.

---

## 📄 License

MIT License. Designed and built for farmers, agricultural students, and communities worldwide.
