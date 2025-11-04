# 🚀 Quiz App - Setup Guide for First Time Users

## 📋 What You Need Before Starting

- ✅ Windows PC
- ✅ Python 3.11+ installed
- ✅ PostgreSQL installed and running
- ✅ WiFi network (all participants must be on same network)

---

## ⚡ Quick Setup (5 Minutes)

### Step 1: Get the Project Files
```powershell
# Download or clone the project
# Open PowerShell in the SparkWeekTest folder
cd "path\to\SparkWeekTest"
```

---

### Step 2: Install Dependencies

**For corporate networks with proxy:**
```powershell
# Set proxy first
$env:http_proxy="http://PITC-Zscaler-Americas-Cincinnati3PR.proxy.corporate.ge.com:80"
$env:https_proxy="http://PITC-Zscaler-Americas-Cincinnati3PR.proxy.corporate.ge.com:80"
```

**Then install:**
```powershell
pip install -r requirements.txt
```

**What this installs:**
- Flask (web framework)
- PostgreSQL driver
- Waitress (production server for 100+ users)
- CORS support
- Other utilities

---

### Step 3: Create `.env` File

Create a file named `.env` in the project folder with:

```env
DATABASE_URL=postgresql://postgres:YourPasswordHere@localhost:5432/quizdb
SECRET_KEY=your-secret-key-here
```

**Replace:**
- `YourPasswordHere` with your PostgreSQL password
- `your-secret-key-here` with any random string

**Example:**
```env
DATABASE_URL=postgresql://postgres:admin123@localhost:5432/quizdb
SECRET_KEY=my-super-secret-key-12345
```

---

### Step 4: Run the App
```powershell
python app.py
```

**Note:** The app automatically:
- Creates database tables if they don't exist
- Sets up admin account (username: `admin`, password: `admin123`)
- Initializes quiz status for all locations
- No manual database setup required!

---

## 🎯 What You'll See

When you run `python app.py`, the terminal will show:

```
✓ Database connection successful!
✓ Database already initialized

============================================================
🚀 QUIZ APPLICATION - OPTIMIZED FOR 100+ USERS
============================================================
✓ Using Waitress production server
✓ Capacity: 100-150 concurrent users
✓ Threads: 16
✓ Connection pool: 100 database connections
============================================================
📡 ACCESS LINKS:
   Local:   http://127.0.0.1:5000
   Network: http://10.124.23.32:5000        ← SHARE THIS!

   👥 SHARE THIS WITH USERS:
   → http://10.124.23.32:5000
============================================================

Press CTRL+C to stop
```

**The app automatically displays the network link to share!**

---

## 📱 Share the Link

**Look for the "SHARE THIS WITH USERS" section in the terminal output.**

Copy the network URL shown (example: `http://10.124.23.32:5000`)

**❌ DON'T share:** `http://127.0.0.1:5000` (this only works on your computer)

**✅ DO share:** The network IP address shown in the terminal

---

## 👥 For Participants

Tell everyone on your WiFi network to:

1. Open their browser (Chrome, Firefox, Safari, etc.)
2. Type the URL: `http://YOUR-IP:5000`
3. Start the quiz!

**Example:** If your IP is `172.24.15.116`, tell them to go to:
```
http://172.24.15.116:5000
```

---

## 🔧 Troubleshooting

### "Can't find PostgreSQL database"
**Solution:** Make sure PostgreSQL is running
```powershell
# Check if PostgreSQL is running (Windows Services)
Get-Service -Name postgresql*
```

---

### "Connection refused" or "Can't access the app"

**Solution 1: Windows Firewall (Most Common Issue)**

**Office WiFi:** Usually works automatically (Domain network)

**Home WiFi:** May need firewall rule

Run PowerShell **as Administrator**:
```powershell
New-NetFirewallRule -DisplayName "Python Flask App" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow -Profile Public,Private
```

**Solution 2:** Make sure you're on the same WiFi
- Both you and participants must be on the same network
- Check with `ipconfig` - all devices should have similar IPs

---

### "Module not found" errors
**Solution:** Install dependencies again
```powershell
pip install -r requirements.txt
```

---

### Can't find the IP address?
**Solution:** Run this command to see your IP:
```powershell
ipconfig
```

Look for "Wireless LAN adapter Wi-Fi" section:
```
Wireless LAN adapter Wi-Fi:
   IPv4 Address. . . . . . . . . . . : 172.24.15.116  ← THIS ONE!
```

---

## 🛑 To Stop the Server

Press `CTRL+C` in the terminal

---

## 📊 Features

✅ **Auto-initializes database** on first run  
✅ **Handles 100-150 concurrent users** (production-grade server)  
✅ **Email validation** (@gevernova.com)  
✅ **SSO validation** (9 digits)  
✅ **Real-time scoring**  
✅ **Admin dashboard**  
✅ **100 database connections** for high concurrency  
✅ **16 worker threads** for optimal performance  
✅ **Automatic network IP detection** (shows link to share)

---

## 💡 Pro Tips

1. **Keep the terminal window open** - closing it stops the server
2. **Don't close your laptop** - it will disconnect everyone
3. **Stay on the same WiFi** - switching networks changes your IP
4. **Network link is shown automatically** - just copy and share it!

---

## 🎯 Performance

**The app automatically uses the best server available:**

- ✅ **With Waitress installed** (recommended): 100-150 concurrent users
- ✅ **Without Waitress**: Falls back to Flask server (50-80 users)

**One command for everything:**
```powershell
python app.py
```

The app detects and uses the optimal configuration automatically!

---

## 📞 Need Help?

Common issues:
- **Database not found:** Check your `.env` file
- **Can't connect:** Check Windows Firewall
- **Wrong IP:** Use `ipconfig` to find correct IP
- **Port already in use:** Another app is using port 5000

---

## ✅ Checklist Before Starting

- [ ] Python installed
- [ ] PostgreSQL running
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] `.env` file created with correct database credentials
- [ ] Firewall allows Python
- [ ] Connected to WiFi

---

**You're ready to run the quiz! 🎉**

```powershell
python app.py
```

Then share your IP address with everyone!
