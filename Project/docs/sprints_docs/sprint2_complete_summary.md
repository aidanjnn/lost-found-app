# Sprint 2 - Complete Summary

**Team:** Ruhani, Sheehan, Aidan, Neng, Theni  
**Date Completed:** November 26, 2025  
**Branch:** `sprint-2-user-system`

---

## Overview

Sprint 2 focused on building the core user authentication system and implementing the foundational features for the UW Lost-and-Found application. This sprint established the authentication flow, user dashboards, item display, and staff portal.

---

## Issues Completed

### Issue #27: Create User Sign-Up and Login System ✅
**Objective:** Implement authentication for students and staff using @uwaterloo.ca email addresses.

**Deliverables:**
- ✅ User registration endpoint (`POST /auth/register`)
- ✅ Email validation for @uwaterloo.ca domain
- ✅ Password hashing with bcrypt
- ✅ Login endpoint (`POST /auth/login`)
- ✅ Session management with Flask-Session
- ✅ Role-based access control (student vs staff)
- ✅ Frontend login page with password visibility toggle
- ✅ Frontend registration page with validation
- ✅ Auto-login after registration
- ✅ Role-based dashboard redirection

**Technical Details:**
- Backend: Flask with SQLite3
- Password hashing: bcrypt
- Session management: Flask-Session
- Frontend: React with axios
- Email validation: Must end with @uwaterloo.ca
- Default staff account: admin@uwaterloo.ca / admin123

**Documentation:** `docs/sprint2_user_system.md`

---

### Issue #28: Create Display of Lost Items ✅
**Objective:** Display all lost items from the database on a dedicated page accessible to authenticated users.

**Deliverables:**
- ✅ Backend API endpoint (`GET /api/items`)
- ✅ Database schema for items table
- ✅ Frontend API service integration
- ✅ ItemCard component for displaying items
- ✅ LostItemsPage with item grid
- ✅ Loading states
- ✅ Empty states
- ✅ Error handling
- ✅ Authentication checks

**Technical Details:**
- Items displayed: image, description, category, location, pickup location, date found, status
- Only authenticated students and staff can view items
- Items sorted by date found (newest first)
- Responsive grid layout

**Documentation:** `docs/sprint2_display_items.md`

---

### Issue #29: Create Staff Portal ✅
**Objective:** Build a staff-only dashboard for adding lost-and-found items to the database.

**Deliverables:**
- ✅ Staff dashboard page
- ✅ Item creation form with all required fields
- ✅ Image upload functionality (file upload or URL)
- ✅ Google Drive link support
- ✅ Image preview for uploaded files
- ✅ File validation (type and size)
- ✅ Backend API endpoint (`POST /api/items`)
- ✅ Role-based access control (staff only)
- ✅ Form validation (frontend and backend)
- ✅ Success/error feedback
- ✅ Display of existing items on dashboard
- ✅ Auto-refresh after item creation

**Image Upload Features:**
- Toggle between URL/link and file upload
- Support for direct image URLs
- Support for Google Drive sharing links
- File upload with preview
- Max file size: 5MB
- Supported formats: JPG, PNG, GIF
- Base64 encoding for storage

**Technical Details:**
- Only staff users can access the dashboard
- Students are redirected to student dashboard
- Form includes: description, category, location found, pickup location, date found, found by desk
- Categories: electronics, clothing, cards, keys, bags, books, other
- Pickup locations: SLC, PAC, CIF

**Documentation:** `docs/sprint2_staff_portal.md`

---

### Issue #30: Fix All Authentication Issues + Sync FE/BE Login & Registration ✅
**Objective:** Resolve authentication bugs and ensure seamless frontend-backend integration.

**Problems Fixed:**
1. **Port Conflict (Port 5000)**
   - macOS AirPlay Receiver using port 5000
   - Solution: Changed default backend port to 5001
   - Updated Vite proxy configuration

2. **Duplicate devDependencies Warning**
   - package.json had duplicate devDependencies key
   - Solution: Removed duplicate entry

3. **403 Forbidden Errors**
   - CORS configuration issues
   - Solution: Enhanced CORS settings, updated Vite proxy

4. **Infinite Redirect Loop (Critical)**
   - API interceptor causing constant 401 errors
   - Page glitching and refreshing continuously
   - Backend receiving 100+ requests per second
   - Solution: Removed aggressive auto-redirect, made auth checks silent

**Deliverables:**
- ✅ Backend runs on port 5001 (no conflicts)
- ✅ Frontend properly connects via Vite proxy
- ✅ CORS configured correctly
- ✅ Login/Signup pages redirect if already authenticated
- ✅ Navigation updates based on auth status
- ✅ Silent auth checks (no infinite loops)
- ✅ Password visibility toggle
- ✅ Proper error handling
- ✅ Detailed error messages

**Tools Created:**
- `start_backend.sh` - Automated backend startup script
- `start_frontend.sh` - Automated frontend startup script
- `START_HERE.md` - Complete setup guide
- `TROUBLESHOOTING.md` - Common issues and solutions

**Documentation:** `docs/sprint2_auth_fixes.md`

---

### Issue #31: Role-Based Dashboard Foundation & Basic Staff/User Routing ✅
**Objective:** Implement separate dashboards for staff and students with proper routing.

**Deliverables:**
- ✅ Staff dashboard (`/staff/dashboard`)
- ✅ Student dashboard (`/student/dashboard`)
- ✅ Role-based redirection after login
- ✅ Role-based redirection after registration
- ✅ Navigation shows appropriate dashboard link
- ✅ Logout functionality
- ✅ Session persistence
- ✅ Auth verification on protected pages

**Staff Dashboard Features:**
- Add new lost items
- View all items in database
- Item count display
- Item creation form
- Success/error feedback

**Student Dashboard Features:**
- View all lost items
- Browse items grid
- Filter placeholder (for future sprints)
- Item count display
- Empty state handling

**Technical Details:**
- Staff redirected to `/staff/dashboard` after login
- Students redirected to `/student/dashboard` after login
- Navigation shows "Staff Dashboard" or "Student Dashboard" based on role
- Logout redirects to login page
- Pages check auth status on mount

**Documentation:** `docs/sprint2_auth_fixes.md`

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student', 'staff')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Items Table
```sql
CREATE TABLE items (
    item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT,
    category TEXT NOT NULL,
    location_found TEXT NOT NULL,
    pickup_at TEXT NOT NULL CHECK(pickup_at IN ('SLC', 'PAC', 'CIF')),
    date_found TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL CHECK(status IN ('unclaimed', 'claimed', 'deleted')),
    image_url TEXT,
    found_by_desk TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Sessions Table
```sql
CREATE TABLE sessions (
    session_id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
)
```

---

## API Endpoints

### Authentication
- `POST /auth/register` - Create new user account
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user
- `GET /auth/verify-session` - Verify session validity
- `GET /auth/me` - Get current user info

### Items
- `GET /api/items` - Get all items (authenticated users only)
- `POST /api/items` - Create new item (staff only)

### Health
- `GET /health` - Backend health check
- `GET /` - API info

---

## Frontend Routes

- `/` - Home page
- `/login` - Login page
- `/signup` - Registration page
- `/staff/dashboard` - Staff dashboard (staff only)
- `/student/dashboard` - Student dashboard (students only)
- `/lost-items` - Browse lost items (authenticated users)

---

## Technical Stack

### Backend
- **Framework:** Flask 3.1.2
- **Database:** SQLite3
- **Session Management:** Flask-Session 0.8.0
- **Password Hashing:** bcrypt 4.2.0
- **CORS:** Flask-CORS 4.0.1
- **Environment:** python-dotenv 1.2.1
- **Testing:** pytest 8.4.2

### Frontend
- **Framework:** React 18.2.0
- **Build Tool:** Vite 5.0.8
- **Routing:** React Router 6.20.0
- **HTTP Client:** Axios 1.6.2
- **Styling:** Custom CSS

---

## Default Accounts

**Staff Account:**
- Email: `admin@uwaterloo.ca`
- Password: `admin123`
- Role: `staff`
- Note: Password is reset on every backend startup

**Student Accounts:**
- Created via registration
- Must use `@uwaterloo.ca` email
- Default role: `student`

---

## Setup Instructions

### Quick Start (Recommended)

**Terminal 1 - Backend:**
```bash
cd /Users/sheehan/project_team_18/project_team_15/Project
./start_backend.sh
```

**Terminal 2 - Frontend:**
```bash
cd /Users/sheehan/project_team_18/project_team_15/Project
./start_frontend.sh
```

### Manual Setup

**Backend:**
```bash
cd Project
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd src
python3 app.py
```

**Frontend:**
```bash
cd Project/frontend
npm install
npm run dev
```

---

## Testing

### Manual Testing Checklist

**Authentication:**
- ✅ Register new student account
- ✅ Login with student account
- ✅ Login with staff account
- ✅ Logout
- ✅ Invalid email format rejected
- ✅ Duplicate email rejected
- ✅ Invalid credentials rejected
- ✅ Session persists across page reloads
- ✅ Role-based redirection works

**Staff Dashboard:**
- ✅ Staff can access staff dashboard
- ✅ Students redirected to student dashboard
- ✅ Can add item with URL
- ✅ Can add item with file upload
- ✅ Image preview works
- ✅ Form validation works
- ✅ Items display after creation
- ✅ Success message shown
- ✅ Form resets after submission

**Student Dashboard:**
- ✅ Students can access student dashboard
- ✅ Staff can access student dashboard
- ✅ Items display in grid
- ✅ Empty state shows when no items
- ✅ Loading state displays
- ✅ Item cards show all information

**Navigation:**
- ✅ Navigation shows appropriate dashboard link
- ✅ Login/Signup hidden when authenticated
- ✅ Logout button visible when authenticated
- ✅ Logout redirects to login
- ✅ Mobile menu works

---

## Known Issues / Future Improvements

### Sprint 3 Candidates:
1. Item filtering and search
2. Item claiming system
3. Notification system
4. Image optimization (compress before storage)
5. Cloud storage for images (AWS S3 / Google Cloud Storage)
6. Email notifications
7. Admin panel for user management
8. Item expiry system
9. Audit log for item changes
10. Multi-image support per item

### Technical Debt:
- Consider moving image storage to cloud service
- Add image compression before storage
- Implement pagination for items list
- Add rate limiting to prevent abuse
- Add CAPTCHA to registration
- Implement password reset flow
- Add two-factor authentication
- Add API request logging
- Add automated tests for critical paths

---

## Challenges & Solutions

### Challenge 1: Port 5000 Conflict
**Problem:** macOS AirPlay Receiver constantly using port 5000  
**Solution:** Changed default backend port to 5001, updated all references

### Challenge 2: Infinite Redirect Loop
**Problem:** API interceptor causing constant auth checks and 401 errors  
**Solution:** Removed aggressive auto-redirect, made auth checks silent

### Challenge 3: CORS Issues
**Problem:** Frontend couldn't communicate with backend due to CORS  
**Solution:** Enhanced CORS configuration, used Vite proxy

### Challenge 4: Image Storage
**Problem:** Need to support both URL and file upload for images  
**Solution:** Implemented toggle between URL and file upload, use base64 for uploaded images

### Challenge 5: Session Management
**Problem:** Sessions not persisting across page reloads  
**Solution:** Used Flask-Session with proper cookie configuration, enabled credentials in axios

---

## Git History

**Key Commits:**
- `8728ec0` - Change default port to 5001 to avoid AirPlay Receiver conflict
- `50ea948` - Fix infinite redirect loop causing 401 errors
- `fd7a614` - Fix 403 error: Improve CORS and Vite proxy configuration
- `7be4e0a` - Fix duplicate devDependencies in package.json
- `a2e9b2f` - Fix API connection: Use relative URLs and improve CORS
- `376a6c5` - Add image upload and URL options to Staff Dashboard
- [Full history available in git log]

**Branch:** `sprint-2-user-system`  
**Merge Target:** `issue-#16-final-project`

---

## Team Contributions

All team members contributed to Sprint 2 completion:
- Backend authentication system
- Frontend login/registration pages
- Staff dashboard with item creation
- Student dashboard with item display
- Bug fixes and testing
- Documentation

---

## Next Steps

1. Create merge request from `sprint-2-user-system` to `issue-#16-final-project`
2. Review and test all features
3. Merge to main project branch
4. Plan Sprint 3 features
5. Prioritize item filtering and claiming system

---

## Documentation Files

- `docs/sprint2_user_system.md` - User authentication system
- `docs/sprint2_display_items.md` - Lost items display
- `docs/sprint2_staff_portal.md` - Staff portal
- `docs/sprint2_auth_fixes.md` - Authentication fixes
- `docs/sprint1_2_foundation_complete.md` - Sprint 1 & 2 overview
- `START_HERE.md` - Quick start guide
- `TROUBLESHOOTING.md` - Common issues and solutions

---

## Conclusion

Sprint 2 successfully delivered a working authentication system, user dashboards, and the foundational features for the UW Lost-and-Found application. The app is now ready for further feature development in Sprint 3.

**Status:** ✅ Complete  
**All Issues:** Resolved  
**Ready for Merge:** Yes

