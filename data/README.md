# Data Folder

## PostgreSQL Version - No JSON Files Needed!

This application now uses **PostgreSQL** for all data storage.

### What Happened to JSON Files?

The old JSON-based storage has been **completely replaced** by PostgreSQL database tables. 

**Old (JSON files):** ❌ Deleted
- `admin-config.json` 
- `participants_BLR.json`, `participants_HTC.json`, `participants_Noida.json`
- `questions_BLR.json`, `questions_HTC.json`, `questions_Noida.json`
- `sso_tracker.json`

**New (PostgreSQL tables):** ✅ Active
- `admin_config` - Admin credentials
- `quiz_status` - Quiz open/closed per location (BLR, HTC, Noida)
- `questions` - All questions for all locations
- `participants` - All participant data, answers, scores
- `sso_tracker` - Global SSO tracking

### Why PostgreSQL is Better:

✅ Handles 100+ concurrent users without data corruption  
✅ Proper data validation and constraints  
✅ Fast queries with database indexes  
✅ ACID compliance (no lost data)  
✅ Easy backups and exports  
✅ No GitHub commit issues  

### Managing Your Data:

**Option 1: Admin Dashboard** (Easiest)
- Login at `/admin`
- View participants, manage questions, control quiz status

**Option 2: Database Provider Web Interface**
- Railway: database.railway.app
- Supabase: app.supabase.com
- Direct SQL queries through their UI

**Option 3: Command Line**
```bash
# Connect to database
psql $DATABASE_URL

# View participants
SELECT * FROM participants ORDER BY score DESC;

# Export to CSV
\COPY participants TO 'results.csv' CSV HEADER
```

### Backup Your Quiz Data:

```bash
# Full database backup
pg_dump $DATABASE_URL > quiz_backup_$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < quiz_backup_20241029.sql
```

---

**This folder is now empty and can be ignored.** All data lives in PostgreSQL! 🎉
