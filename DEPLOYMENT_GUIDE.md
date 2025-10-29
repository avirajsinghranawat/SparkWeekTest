# Quiz Application - Deployment Guide

## 🚀 Auto-Initialization Feature

The app now **automatically checks and initializes the database** on startup!

### What This Means:

✅ **No manual setup needed**
✅ **Works in any environment** (local, Railway, production)
✅ **Safe to restart** - won't reset existing data

### How It Works:

When the app starts:
1. Connects to the database
2. Checks if tables exist (queries `admin_config` table)
3. If tables don't exist → Runs `schema.sql` automatically
4. Creates all tables, default admin, and locations
5. Starts the app

If tables already exist → Continues normally

---

## 🏠 Local Development

### Setup:
```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Create .env file
DATABASE_URL=postgresql://postgres:postgress@localhost:5432/quizdb
SECRET_KEY=your-secret-key

# 3. Start the app (it will auto-initialize!)
python app.py
```

The app automatically creates all tables on first run!

---

## ☁️ Railway Deployment

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Quiz application"
git push origin main
```

### Step 2: Deploy to Railway

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository

### Step 3: Add PostgreSQL

1. Click "+ New" → "Database" → "PostgreSQL"
2. Railway auto-creates `DATABASE_URL`

### Step 4: Add Environment Variable

In Variables tab:
```
SECRET_KEY=your-production-secret-key
```

### Step 5: Deploy! 🎉

That's it! The app will:
- ✅ Connect to Railway PostgreSQL
- ✅ Auto-initialize database
- ✅ Create admin account (admin/admin123)
- ✅ Set up all 3 locations (BLR, HTC, Noida)
- ✅ Ready to use!

**No manual database setup needed!**

---

## 🔐 Default Admin Credentials

After deployment:
- **Username:** admin
- **Password:** admin123

⚠️ **Important:** Change this password in production!

---

## 📊 Database Schema

The app creates these tables automatically:
- `admin_config` - Admin users
- `quiz_status` - Quiz open/close status per location
- `questions` - Quiz questions
- `participants` - Participant data and answers
- `sso_tracker` - Global SSO tracking (prevents duplicate quizzes)

---

## 🌍 Locations

Three locations are pre-configured:
- BLR (Bangalore)
- HTC (Hyderabad Technology Center)
- Noida

---

## 🛠️ Troubleshooting

### Database Connection Issues on Corporate Laptop

If you can't connect to Railway/Neon from your laptop:
- **Cause:** Corporate firewall blocks external database ports
- **Solution:** Use local PostgreSQL for development
- **Deploy to Railway:** Production environment has no firewall restrictions

### App Won't Start

Check:
1. DATABASE_URL is set correctly in .env
2. PostgreSQL is running (for local development)
3. Database is accessible

The app will show clear error messages if setup fails.

---

## 📝 Features

### Admin Features:
- Quiz control (open/close per location)
- Question management (single, multiple, true/false, text)
- Real-time participant tracking
- Score leaderboard

### Participant Features:
- Email validation (@gevernova.com)
- SSO validation (9 digits)
- Resume incomplete quizzes
- Instant score display after submission

### Scoring:
- **Multiple Choice:** Points per correct option selected
- **Single Choice:** Full points for correct answer
- **True/False:** Full points for correct answer
- **Text Input:** Full points for exact match

---

## 🔄 Updates & Maintenance

### Updating Questions:
1. Login as admin
2. Go to "Questions" tab
3. Add/Edit/Delete questions per location

### Monitoring:
- Check "Participants" tab for real-time results
- Use "Quiz Control" to open/close quizzes
- Download participant data (future feature)

---

## 🎯 Next Steps After Deployment

1. Login as admin (admin/admin123)
2. Change admin password
3. Add quiz questions for each location
4. Open quiz for desired locations
5. Share participant URL with users
6. Monitor results in admin dashboard

---

## 💡 Tips

- Test locally before deploying to production
- Keep .env file secure (never commit to git)
- Backup database regularly in production
- Monitor Railway logs for any issues
