# 🎓 Maxsas-AI-Livekit: Intern Quick Start Guide

Welcome to **Maxsas Realty AI**! This guide will help you set up and run the project in ~15 minutes.

---

## 📋 What is This Project?

**Maxsas-AI-Livekit** is a full-stack SaaS application that uses **AI voice agents** to automatically call real estate leads and qualify them. 

**Key features:**
- 📱 Frontend: Mobile app (built with Expo/React Native)
- 🔙 Backend: REST API (Node.js/Express)
- 🗣️ Voice Engine: LiveKit + Python AI Agent (handles calls)
- 💾 Database: SQLite

---

## ⚡ Quick Prerequisites

Before starting, make sure you have:

```
✅ Node.js v20+ (https://nodejs.org/)
✅ npm (comes with Node.js)
✅ Git (for version control)
✅ VS Code (or your favorite editor)
```

**Check installed versions:**
```bash
node --version    # Should be v20+
npm --version     # Should be v10+
```

---

## 🚀 Get Started in 5 Steps

### Step 1: Clone and Install Dependencies

```bash
# Clone the repo (if not already done)
git clone <repo-url>
cd Maxsas-AI-Livekit

# Install frontend dependencies
npm install
```

### Step 2: Set Up Environment Variables

Copy the example environment files and fill them with actual values:

```bash
# For frontend
cp .env.example .env

# For backend
cp backend/.env.example backend/.env
```

**Don't have values yet?** That's OK! Ask your mentor for the values or use dev defaults for local testing.

### Step 3: Start the Frontend

In **Terminal 1**, run:

```bash
npx expo start
```

You'll see a menu like:
```
› Press 'w' for web
› Press 'a' for Android
› Press 'i' for iOS
```

For development, press **`w`** to open in browser → http://localhost:8081

### Step 4: Start the Backend (in a new terminal)

In **Terminal 2**, run:

```bash
cd backend
npm install      # Install backend dependencies (first time only)
npm run dev      # Start the backend server
```

Backend will start on **http://localhost:4000**

You should see:
```
✅ Server running on port 4000
```

### Step 5: Test the Setup

- Frontend should be running at **http://localhost:8081**
- Backend should be running at **http://localhost:4000**
- Try accessing the home page and logging in

**Success!** 🎉 Both frontend and backend are running.

---

## 📁 Project Structure

```
Maxsas-AI-Livekit/
├── README.md                   # Main project overview
├── package.json               # Frontend dependencies
├── .env.example              # Example environment variables
├── app/                      # 📱 FRONTEND CODE (Expo/React Native)
│   ├── (public)/            # Public routes (login, signup)
│   ├── (protected)/         # Protected routes (need login)
│   │   ├── lexus/           # Main workspace
│   │   └── enterprise/      # Enterprise workspace
│   └── _layout.tsx          # Main app layout
├── backend/                  # 🔙 BACKEND CODE (Node.js/Express)
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── repositories/    # Database access
│   │   └── index.ts         # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── dev.db          # Local SQLite database
│   ├── .env.example         # Backend environment variables
│   └── package.json         # Backend dependencies
├── components/              # 🎨 Reusable UI components
├── hooks/                   # React hooks for shared logic
├── context/                 # Global state management
├── lib/                     # Utility functions
├── docs/                    # 📚 Documentation
│   ├── SETUP.md             # Detailed setup instructions
│   ├── ARCHITECTURE.md      # System architecture
│   ├── DIRECTORY.md         # Directory descriptions
│   └── ...                  # Other docs
└── scripts/                 # Build and utility scripts
```

---

## 🔌 Common Commands

### Frontend Commands
```bash
# Start dev server
npx expo start

# Build for production
npm run build

# Lint code
npm run lint

# Run tests
npm test
```

### Backend Commands
```bash
cd backend

# Start dev server
npm run dev

# Check database with Prisma
npx prisma studio

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

---

## 🐛 Troubleshooting

### Problem: "npm: command not found"
**Solution:** Install Node.js from https://nodejs.org/ (includes npm)

### Problem: "Port 4000 already in use"
**Solution:** Either:
- Kill the process: `npx kill-port 4000`
- Or use a different port in `backend/src/index.ts`

### Problem: "Cannot find .env file"
**Solution:** Make sure you created `.env` and `backend/.env` from the `.example` files:
```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

### Problem: Database errors after starting backend
**Solution:** Run migrations:
```bash
cd backend
npx prisma migrate dev
```

### Problem: Frontend won't connect to backend
**Solution:** Check that both servers are running:
```bash
# Terminal 1: Frontend
npx expo start

# Terminal 2: Backend
cd backend && npm run dev

# Make sure backend is on port 4000
```

---

## 📚 Learn More

Once you're up and running, dive deeper:

1. **Setup Details** → [docs/SETUP.md](docs/SETUP.md)
2. **Architecture** → [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
3. **Directory Guide** → [docs/DIRECTORY.md](docs/DIRECTORY.md)
4. **Implementation Status** → [docs/IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md)

---

## 🎯 First Tasks for New Interns

Once setup is complete, try these to get familiar with the codebase:

### Task 1: Explore the Frontend
- Open `app/index.tsx` → This is the home page
- Try changing some text/colors and see it update live
- Navigate to different screens using the UI

### Task 2: Understand the Backend
- Open `backend/src/index.ts` → This is the server entry point
- Open `backend/src/routes/` → These handle different API endpoints
- Try hitting an endpoint using VS Code's REST Client or Postman

### Task 3: Check the Database
```bash
cd backend
npx prisma studio
```
This opens a visual database browser where you can:
- See all database tables
- View and edit records
- Understand the data structure

### Task 4: Read Key Documentation
- Start with [README.md](README.md) for a quick overview
- Then read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) to understand how components connect

---

## 💬 Need Help?

- **Stuck?** → Check [Troubleshooting](#-troubleshooting) section above
- **Documentation** → Read files in [docs/](docs/)
- **Questions?** → Ask your mentor!

---

## ✅ Setup Checklist

- [ ] Node.js v20+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Project cloned and dependencies installed (`npm install`)
- [ ] `.env` and `backend/.env` created from `.example` files
- [ ] Frontend running (`npx expo start` → press 'w')
- [ ] Backend running (`cd backend && npm run dev`)
- [ ] Can access frontend at http://localhost:8081
- [ ] Can access backend at http://localhost:4000
- [ ] Read [README.md](README.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

## 🚢 Next Steps After Setup

1. **Understand the code structure** → Browse [docs/DIRECTORY.md](docs/DIRECTORY.md)
2. **Learn the tech stack** → Check [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
3. **Pick a small feature** → Ask your mentor for a beginner-friendly task
4. **Make your first commit!** 🎉

---

## 📞 Tech Stack at a Glance

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | **Expo / React Native** | Mobile & web app UI |
| Frontend State | **React Context** | Global state management |
| Backend API | **Node.js / Express** | REST API server |
| Database | **SQLite + Prisma** | Data storage & ORM |
| Voice Engine | **LiveKit** | Real-time voice calls |
| AI LLM | **Groq** | AI decision making |
| Speech-to-Text | **Sarvam** | Hindi voice recognition |
| Text-to-Speech | **Cartesia** | Hindi voice synthesis |
| Payments | **Razorpay** | Payment processing |
| Real-time Updates | **Server-Sent Events** | Live call status updates |

---

**Welcome aboard! Happy coding! 🚀**

*Last updated: May 2026*
