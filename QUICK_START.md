# ⚡ QUICK START - Quiz App

## 🎯 For First-Time Setup

### 1️⃣ Install Requirements
```powershell
pip install -r requirements.txt
```

### 2️⃣ Create `.env` File
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/quizdb
SECRET_KEY=any-random-text-here
```

### 3️⃣ Run the App
```powershell
python app.py
```

### 4️⃣ Find Your IP Address
**Look for this line in the terminal:**
```
 * Running on http://YOUR-IP-HERE:5000
```

**Example:**
```
 * Running on http://172.24.15.116:5000  ← SHARE THIS!
```

**❌ Don't share:** `127.0.0.1`  
**✅ Share this:** The IP starting with `192.168.` or `172.` or `10.`

---

## 👥 Tell Participants

**"Open your browser and go to:**
```
http://YOUR-IP-HERE:5000
```
**Example:** `http://172.24.15.116:5000`"

---

## 🛑 To Stop Server
Press `CTRL+C`

---

## 🔍 Find Your IP Manually
```powershell
ipconfig
```
Look under "Wireless LAN adapter Wi-Fi" → "IPv4 Address"

---

## ✅ Requirements
- Python 3.11+
- PostgreSQL running
- Everyone on same WiFi
- Windows Firewall allows Python

---

## 📝 One-Liner Summary

**"Install dependencies, create .env file, run python app.py, share the IP address shown in terminal (not 127.0.0.1)"**

---

That's it! 🚀
