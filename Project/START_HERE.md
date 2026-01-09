# 🚀 Quick Start Guide - UW Lost & Found App

## Prerequisites
- Python 3.8+ installed
- Node.js 18+ and npm installed

## Step 1: Start Backend (Terminal 1)

### Easy Way (Recommended):
```bash
cd /Users/sheehan/project_team_18/project_team_15/Project
./start_backend.sh
```

This script automatically:
- Kills any process using port 5000
- Creates virtual environment if needed
- Installs dependencies if needed
- Starts the backend server

### Manual Way:
```bash
cd /Users/sheehan/project_team_18/project_team_15/Project

# Kill any process on port 5000 (if needed)
lsof -ti:5000 | xargs kill -9

# Create virtual environment (first time only)
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Start backend server
cd src
python3 app.py
```

**Expected Output:**
```
Database initialized successfully
✅ Default staff account password reset: admin@uwaterloo.ca / admin123
   Hash verification test: True
 * Running on http://0.0.0.0:5000
```

**Keep this terminal open!**

## Step 2: Start Frontend (Terminal 2)

Open a NEW terminal window:

### Easy Way (Recommended):
```bash
cd /Users/sheehan/project_team_18/project_team_15/Project
./start_frontend.sh
```

### Manual Way:
```bash
cd /Users/sheehan/project_team_18/project_team_15/Project/frontend

# Install dependencies (first time only)
npm install

# Start frontend server
npm run dev
```

**Expected Output:**
```
  VITE v5.0.8  ready in XXX ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

**Keep this terminal open!**

## Step 3: Open Application

1. Open your browser
2. Go to: **http://localhost:3000**
3. You should see the home page

## Step 4: Test Login

1. Click "Login" in navigation
2. Use default staff account:
   - **Email:** `admin@uwaterloo.ca`
   - **Password:** `admin123`
3. Click "Login"
4. Should redirect to Staff Dashboard

## Step 5: Test Registration

1. Click "Sign Up" in navigation
2. Fill out form:
   - Name: Your Name
   - Email: `yourname@uwaterloo.ca` (must be @uwaterloo.ca)
   - Password: `test123` (min 6 characters)
   - Confirm Password: `test123`
3. Click "Sign Up"
4. Should auto-login and redirect to Student Dashboard

## Troubleshooting

### Backend won't start?
- **Use the start script:** `./start_backend.sh` (automatically handles port conflicts)
- Make sure Python 3 is installed: `python3 --version`
- If port 5000 is in use, run: `lsof -ti:5000 | xargs kill -9`
- Or disable AirPlay Receiver in System Preferences → General → AirDrop & Handoff

### Frontend won't start?
- Make sure Node.js is installed: `node --version`
- Make sure you're in `Project/frontend` directory
- Try deleting `node_modules` and running `npm install` again

### "Cannot connect to server" error?
- **Backend must be running!** Check Terminal 1
- Backend should show "Running on http://0.0.0.0:5000"
- Make sure both servers are running simultaneously

### Login not working?
- Check backend terminal for error messages
- Check browser console (F12) for errors
- Make sure you're using: `admin@uwaterloo.ca` / `admin123`
- Try restarting the backend server

### Registration not working?
- Check browser console (F12) for errors
- Make sure email ends with `@uwaterloo.ca`
- Make sure password is at least 6 characters
- Check backend terminal for error messages

## Default Accounts

**Staff:**
- Email: `admin@uwaterloo.ca`
- Password: `admin123`

**Student:**
- Register with any `@uwaterloo.ca` email

## Important Notes

- **Both servers must be running at the same time**
- Backend runs on port 5000
- Frontend runs on port 3000
- Don't close either terminal while using the app
- Press `Ctrl+C` in each terminal to stop the servers

## Need Help?

Check the browser console (F12) and backend terminal for error messages.
Most issues are resolved by:
1. Making sure both servers are running
2. Restarting both servers
3. Checking for error messages in console/terminal

