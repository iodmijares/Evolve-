# 🌱 Evolve - AI-Powered Health Companion

> Your personal health companion powered by 100% free AI. Track nutrition, fitness, and wellness with intelligent insights.

**[🚀 Live Demo](https://evolve-bay.vercel.app/)**

## ✨ Features

- 🤖 **AI-Powered** - Meal plans, workout routines, food scanning, and journal insights
- 📊 **Track Everything** - Nutrition, workouts, weight, mood, and menstrual cycles
- 🎯 **Stay Motivated** - Achievements, challenges, and community feed
- 🎨 **Beautiful UI** - Light/dark mode, fully responsive design
- 🆓 **100% Free AI** - Zero cost for all AI features

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: Groq SDK (100% Free - llama models)
- **Charts**: Recharts

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- Free accounts: [Supabase](https://supabase.com) + [Groq](https://console.groq.com)

### 2. Clone & Install
```bash
git clone https://github.com/iodmijares/Evolve-.git
cd Evolve-
npm install
```

### 3. Environment Setup
Create `.env` file:
```env
VITE_GROQ_API_KEY=your_groq_key_here
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Get your keys:**
- Groq: https://console.groq.com/keys (instant, free)
- Supabase: Create project → Settings → API

### 4. Database Setup
4. Copy & run all SQL from `DATABASE_SCHEMA.md` 

### 5. Run
```bash
npm run dev
```
Open http://localhost:5173

### 6. Deploy (Optional)
```bash
npm run build
```
Deploy `dist/` folder to Vercel, Netlify, or any static host.
Don't forget to add environment variables in your hosting platform!

## 📖 What Can You Do?

- **Track Nutrition** - Log meals manually or scan food with AI
- **AI Meal Plans** - Get personalized weekly meal plans
- **Workout Plans** - 30-day AI-generated fitness programs
- **Cycle Tracking** - For female users, with phase-aware insights
- **Journal** - AI analyzes entries and provides wellness suggestions
- **Progress Charts** - Weight tracking with beautiful visualizations
- **Achievements** - Unlock milestones and join challenges
- **Community** - See what others are achieving

## 📁 Project Structure

```
components/     # React UI components
context/        # Global state (User, Theme)
services/       # API integrations (Groq AI, Supabase)
utils/          # Helpers (caching, validation, rate limiting)
supabase/       # Database migrations
```

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/YourFeature`
3. Commit changes: `git commit -m 'Add YourFeature'`
4. Push: `git push origin feature/YourFeature`
5. Open a Pull Request

## ❓ FAQ

**Q: Is this really free?**  
A: Yes! Groq AI is 100% free. Supabase has a generous free tier.

**Q: Can I self-host?**  
A: Absolutely! MIT licensed, deploy anywhere.

**Q: Is my data secure?**  
A: Yes! Row Level Security ensures users only access their own data.

**Q: How do I get API keys?**  
- Groq: https://console.groq.com/keys (instant)
- Supabase: Create project → Settings → API

## 📚 More Docs

- `DATABASE_INDEXES.md` - Performance SQL scripts
- `PRODUCTION_CHECKLIST.md` - Deployment guide
- `AI_IMPLEMENTATION.md` - AI architecture details

## 📜 License

MIT License - free to use, modify, and distribute.

## 🙏 Credits

Built with [Groq AI](https://groq.com) (free), [Supabase](https://supabase.com), and [React](https://reactjs.org).

---

<div align="center">
  <sub>Made by IM</sub>
</div>
