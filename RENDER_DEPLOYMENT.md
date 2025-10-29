# Render Deployment Guide

## ✅ Fixed Issues

The deployment error was caused by:
1. **Python 3.13 incompatibility** with psycopg2-binary 2.9.9
2. **Missing runtime specification** - Render defaulted to Python 3.13

## 🛠️ Changes Made

### 1. Created `runtime.txt`
Specifies Python 3.11.10 (compatible with all dependencies)

### 2. Updated `requirements.txt`
Added gunicorn version that works with Python 3.11

### 3. Updated `app.py`
Added initialization code that runs when Gunicorn loads the app (not just `if __name__ == '__main__'`)

### 4. Created `render.yaml` (Optional)
Blueprint for automatic deployment configuration

---

## 🚀 Deploy to Render

### Option 1: Manual Deployment (Recommended for First Time)

#### Step 1: Push Latest Code to GitHub
```bash
cd "C:\Users\260004129\Desktop\Spark Week\SparkWeekTest"
git add .
git commit -m "Fix Render deployment - Python 3.11 compatibility"
git push origin main
```

#### Step 2: Create PostgreSQL Database in Render

1. Go to Render Dashboard: https://dashboard.render.com
2. Click "New +" → "PostgreSQL"
3. Fill in:
   - **Name:** quiz-db
   - **Database:** quizdb
   - **User:** quizuser
   - **Region:** Choose closest to your users
   - **Plan:** Free
4. Click "Create Database"
5. **Copy the Internal Database URL** (starts with `postgresql://`)

#### Step 3: Deploy Web Service

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Fill in:
   - **Name:** spark-quiz-app
   - **Region:** Same as database
   - **Branch:** main
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app --bind 0.0.0.0:$PORT`

#### Step 4: Add Environment Variables

In the "Environment" section, add:

1. **DATABASE_URL**
   - Value: Paste the Internal Database URL from Step 2
   - Example: `postgresql://quizuser:password@xxx.oregon-postgres.render.com/quizdb`

2. **SECRET_KEY**
   - Value: Generate a random string
   - Or use: `your-secret-key-for-production-12345`

3. **PYTHON_VERSION** (Important!)
   - Value: `3.11.10`

#### Step 5: Deploy!

1. Click "Create Web Service"
2. Render will automatically:
   - Install Python 3.11.10
   - Install dependencies
   - Start the app
   - Auto-initialize the database!

#### Step 6: Access Your App

Your app will be live at:
```
https://spark-quiz-app.onrender.com
```

---

## 🔍 Verify Deployment

Check the logs in Render dashboard for:
```
✓ Database connection successful!
✓ Database already initialized (or auto-initialized if first time)
✓ Starting Flask application...
```

---

## 🎯 Post-Deployment

### 1. Login as Admin
- URL: `https://your-app.onrender.com/admin`
- Username: `admin`
- Password: `admin123`
- **Change this password immediately!**

### 2. Add Quiz Questions
- Navigate to "Questions" tab
- Add questions for BLR, HTC, Noida

### 3. Open Quiz
- Go to "Quiz Control" tab
- Toggle quiz status for locations

### 4. Share with Participants
- URL: `https://your-app.onrender.com/`

---

## 📋 Checklist

Before deploying:
- ✅ `runtime.txt` exists (Python 3.11.10)
- ✅ `requirements.txt` includes gunicorn
- ✅ Code pushed to GitHub
- ✅ PostgreSQL database created in Render
- ✅ DATABASE_URL environment variable set
- ✅ SECRET_KEY environment variable set
- ✅ PYTHON_VERSION set to 3.11.10

After deploying:
- ✅ Check logs for successful database initialization
- ✅ Visit app URL to verify it's running
- ✅ Login as admin
- ✅ Add test questions
- ✅ Test participant flow

---

## ⚠️ Important Notes

### Free Tier Limitations
- **Render Free Plan:**
  - Spins down after 15 minutes of inactivity
  - First request after spin-down takes 30-60 seconds
  - 750 hours/month free (enough for testing)

### Database Persistence
- PostgreSQL data persists even when web service spins down
- Auto-initialization only runs once (won't reset data)

### Custom Domain (Optional)
- Go to Settings → Custom Domain
- Add your domain (e.g., quiz.yourcompany.com)

---

## 🐛 Troubleshooting

### "ImportError: undefined symbol"
- ✅ **Fixed:** runtime.txt specifies Python 3.11.10
- Ensure PYTHON_VERSION environment variable is set

### "Database connection failed"
- Check DATABASE_URL is correct (use Internal Database URL)
- Verify PostgreSQL database is running in Render

### "Application failed to start"
- Check logs in Render dashboard
- Verify all environment variables are set
- Ensure gunicorn is in requirements.txt

### 503 Service Unavailable
- App is spinning up (first request after inactivity)
- Wait 30-60 seconds and refresh

---

## 🔄 Updates & Redeployment

To update your app:

1. Make changes locally
2. Test locally: `python app.py`
3. Commit and push:
   ```bash
   git add .
   git commit -m "Your update message"
   git push origin main
   ```
4. Render auto-deploys (if auto-deploy is enabled)
5. Or manually click "Deploy" in Render dashboard

---

## 💰 Upgrade to Paid Plan (When Needed)

For production with 100+ concurrent users:
- **Render Standard Plan:** $7/month
  - No spin-down
  - Better performance
  - More memory

For database:
- **Render PostgreSQL Starter:** $7/month
  - 1GB storage
  - Better performance
  - Automatic backups

Total: ~$14/month for production-ready setup

---

## 🎉 Success!

Your quiz app should now be deployed and running on Render!

Access:
- **Participant URL:** `https://your-app.onrender.com/`
- **Admin URL:** `https://your-app.onrender.com/admin`

The auto-initialization feature ensures the database is ready on first deployment! 🚀
