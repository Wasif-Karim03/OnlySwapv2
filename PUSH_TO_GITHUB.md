# 🚀 Push OnlySwap to Private GitHub Repo

**Step-by-step guide to create a clean, private GitHub repository with only your OnlySwap code**

---

## ⚠️ Important: What Will Be Excluded

These files will **NOT** be pushed to GitHub (they're in `.gitignore`):
- ✅ `.env` files (contains secrets like JWT_SECRET, MongoDB URI)
- ✅ `node_modules/` (dependencies, can be reinstalled)
- ✅ `backend/uploads/` (user-uploaded images)
- ✅ `logs/` (log files)
- ✅ `.expo/` (Expo cache)
- ✅ `.DS_Store` (macOS system files)

**This is correct!** You don't want secrets or large files in GitHub.

---

## Step 1: Clean Up Current Git Setup

**First, let's make sure we're only tracking OnlySwap files:**

```bash
cd "/Users/wasifkarim/Desktop/Lot Detector/OnlySwap"

# Check what's currently tracked (should only show OnlySwap files)
git status
```

**If you see files from other projects, we'll fix that in Step 2.**

---

## Step 2: Create New Private GitHub Repository

1. **Go to GitHub:** https://github.com/new
2. **Repository name:** `OnlySwap` (or `onlyswap-app`, whatever you prefer)
3. **Description:** "Campus marketplace app for university students"
4. **Visibility:** ✅ **Select "Private"** (this is important!)
5. **DO NOT** check "Initialize with README" (we already have files)
6. **DO NOT** add .gitignore or license (we already have them)
7. **Click "Create repository"**

**After creating, GitHub will show you setup instructions. Don't follow them yet - we'll do it differently.**

---

## Step 3: Remove Old Remote (If Needed)

**If you want to disconnect from the old repo:**

```bash
cd "/Users/wasifkarim/Desktop/Lot Detector/OnlySwap"

# Check current remote
git remote -v

# Remove old remote (if you want a fresh start)
git remote remove origin
```

**OR if you want to keep the old repo and just add a new one:**

```bash
# Add new remote with different name
git remote add onlyswap https://github.com/YOUR_USERNAME/OnlySwap.git
```

---

## Step 4: Add New Remote and Push

**Replace `YOUR_USERNAME` with your GitHub username:**

```bash
cd "/Users/wasifkarim/Desktop/Lot Detector/OnlySwap"

# Add your new private repo as remote
git remote add origin https://github.com/YOUR_USERNAME/OnlySwap.git

# Or if you already have an origin, set it to the new one:
git remote set-url origin https://github.com/YOUR_USERNAME/OnlySwap.git

# Verify it's set correctly
git remote -v
```

**Now push your code:**

```bash
# Make sure all OnlySwap files are staged
git add .

# Check what will be committed (make sure no .env files!)
git status

# Commit everything
git commit -m "Initial commit: OnlySwap app ready for production"

# Push to your new private repo
git push -u origin main
```

**If you get an error about the branch name:**
```bash
# If your branch is called 'master' instead of 'main':
git branch -M main
git push -u origin main
```

---

## Step 5: Verify What Was Pushed

1. **Go to your GitHub repo:** `https://github.com/YOUR_USERNAME/OnlySwap`
2. **Check that:**
   - ✅ All your code files are there
   - ✅ `.env` files are **NOT** there (good!)
   - ✅ `node_modules/` is **NOT** there (good!)
   - ✅ Repository is marked as **Private**

---

## Step 6: Double-Check Security

**Verify sensitive files are NOT in GitHub:**

```bash
# Check if .env is tracked (should return nothing)
git ls-files | grep .env

# Check if backend/uploads has sensitive files
git ls-files | grep backend/uploads
```

**If `.env` shows up, remove it:**
```bash
# Remove from git (but keep local file)
git rm --cached backend/.env
git commit -m "Remove .env from repository"
git push
```

---

## Step 7: Set Up for Railway Deployment

**Now that your code is on GitHub, Railway can access it:**

1. Go to https://railway.app
2. **New Project → Deploy from GitHub repo**
3. **Select your OnlySwap repository** (should be private, only you can see it)
4. Railway will ask for settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

---

## 🔒 Security Checklist

Before pushing, make sure:

- [ ] `.env` file is in `.gitignore` ✅
- [ ] `backend/.env` is in `.gitignore` ✅
- [ ] `logs/` directory is in `.gitignore` ✅
- [ ] `node_modules/` is in `.gitignore` ✅
- [ ] Repository is set to **Private** on GitHub ✅
- [ ] No API keys or secrets are hardcoded in source files ✅

---

## 🆘 Troubleshooting

**"Repository not found" error:**
- Make sure you're logged into GitHub in your browser
- Check the repository URL is correct
- Verify the repo exists and is accessible

**"Permission denied" error:**
- You may need to authenticate. GitHub will prompt you
- Or use a Personal Access Token instead of password

**"Files from other projects showing up":**
- The git repo might be initialized in a parent directory
- We can create a fresh git repo just for OnlySwap if needed

**"Want to push but keep old repo too":**
- Use a different remote name: `git remote add onlyswap https://...`
- Then push with: `git push -u onlyswap main`

---

## ✅ Next Steps After Pushing

Once your code is on GitHub:

1. ✅ **Deploy to Railway** (Step 2 of README_RELEASE.md)
2. ✅ **Set up MongoDB Atlas** (Section A.2)
3. ✅ **Configure environment variables** in Railway
4. ✅ **Test production backend**

---

**Ready? Start with Step 1 above!**
