# User Manual — Lost & Found Web App

## Overview
This web application allows students and staff to:
- Sign up for an account  
- Log in  
- View a list of lost items submitted by staff  
- (Staff only) Access the staff portal to manage lost items  

This guide explains how to run the app and how to use each feature.

---

# 1. Running the Application

## 1.1 Prerequisites
You need:
- Python 3.10+  
- Node.js 18+ and npm  
- A terminal (Linux, macOS, or Windows)

---

## 1.2 Backend Setup (Flask)
1. Navigate to the project folder:
   ```bash
   cd Project
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the backend:
   ```bash
   python src/app.py
   ```
Backend runs on **http://localhost:5000**

---

## 1.3 Frontend Setup (React + Vite)
1. Go to frontend:
   ```bash
   cd Project/frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
Frontend runs on **http://localhost:3000**

---

# 2. Using the Application

## 2.1 Home Page
The home page provides:
- Navigation bar  
- Links to Login, Signup, Lost Items  

---

## 2.2 Creating an Account
1. Click **Sign Up** in the navigation bar.  
2. Enter:
   - Email  
   - Password  
3. Click **Create Account**.

If successful, you are redirected to the login page.

---

## 2.3 Logging In
1. Click **Log In**  
2. Enter your email and password  
3. Click **Login**

If login is successful, you are redirected to the Lost Items page.

---

## 2.4 Viewing Lost Items
All users can view:
- Item name  
- Description  
- Date found  

Data loads automatically from the backend.

---

## 2.5 Staff Portal (Restricted Access)
Only users flagged as staff can access:
- Add items  
- Remove items  
- Manage current lost items

If a non-staff user attempts access, a “Permission Denied” message appears.

---

# 3. Troubleshooting

| Issue | Fix |
|-------|------|
| Frontend cannot connect to backend | Ensure Flask is running on port 5000 |
| npm errors | Run `rm -rf node_modules && npm install` |
| Python import errors | Run `pip install -r requirements.txt` again |
| Blank page | Refresh Vite dev server |

---

# 4. Contact
If issues occur, contact Project Team 15 of SE101 2025.

