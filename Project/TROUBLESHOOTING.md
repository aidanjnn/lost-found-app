# Troubleshooting Guide

## Port 5000 Already in Use

If you see "Address already in use" or "Port 5000 is in use":

### Quick Fix:
```bash
# Find what's using port 5000
lsof -ti:5000

# Kill the process (replace PID with the number from above)
kill -9 <PID>

# Or kill all processes on port 5000
kill -9 $(lsof -ti:5000)
```

### macOS AirPlay Receiver
On macOS, port 5000 is often used by AirPlay Receiver. To disable it:
1. Go to **System Preferences** (or **System Settings** on newer macOS)
2. Go to **General** → **AirDrop & Handoff**
3. Turn off **AirPlay Receiver**

### Alternative: Use Different Port
If you can't free port 5000, you can change the backend port:

1. Edit `Project/src/app.py`:
   ```python
   app.run(debug=True, host='0.0.0.0', port=5001)  # Change to 5001
   ```

2. Edit `Project/frontend/vite.config.js`:
   ```javascript
   proxy: {
     '/api': {
       target: 'http://localhost:5001',  // Change to 5001
       changeOrigin: true
     },
     '/auth': {
       target: 'http://localhost:5001',  // Change to 5001
       changeOrigin: true
     }
   }
   ```

## Frontend Warnings

### Duplicate devDependencies Warning
This has been fixed. If you still see it:
1. Delete `node_modules` folder
2. Delete `package-lock.json`
3. Run `npm install` again

## Login Not Working

### Check Backend is Running
- Look at backend terminal
- Should see: "Running on http://0.0.0.0:5000"
- Should see: "✅ Default staff account password reset"

### Check Browser Console
- Press F12 to open developer tools
- Go to Console tab
- Look for error messages
- Check Network tab to see if requests are being made

### Common Issues:
1. **Backend not running** → Start backend server
2. **Port conflict** → Kill process on port 5000
3. **CORS error** → Backend CORS should allow localhost:3000
4. **Wrong credentials** → Use admin@uwaterloo.ca / admin123

## Registration Not Working

### Check:
1. Email must end with `@uwaterloo.ca`
2. Password must be at least 6 characters
3. Passwords must match
4. Backend must be running
5. Check browser console for errors

## Still Having Issues?

1. **Restart both servers:**
   - Stop backend (Ctrl+C)
   - Stop frontend (Ctrl+C)
   - Start backend again
   - Start frontend again

2. **Clear browser cache:**
   - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

3. **Check terminal output:**
   - Backend terminal should show no errors
   - Frontend terminal should show "VITE ready"

4. **Verify ports:**
   - Backend: http://localhost:5000/health (should return JSON)
   - Frontend: http://localhost:3000 (should show homepage)


