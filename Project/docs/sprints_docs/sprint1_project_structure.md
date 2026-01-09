# Sprint 1, Part 2: Full-Stack Project Structure & Front-End Navigation

**Sprint:** 1, Part 2  
**Issue:** #23 - Develop Full-Stack Project Structure, Create Basic Front-End Navigation  
**Status:** ✅ Completed  
**Date:** November 2025  
**Team:** Ruhani, Sheehan, Aidan, Neng, Theni

---

## Overview

This sprint implements the foundational full-stack project structure with a React frontend and Flask backend, along with basic front-end navigation using React Router. The structure supports future development and provides a solid foundation for the UW Lost-and-Found application.

---

## Objectives Completed

✅ **Set up foundational folder architecture**
- React frontend with Vite build system
- Flask backend structure (already established)
- Organized directory structure for scalability

✅ **Create basic front-end navigation**
- React Router setup with routing between key pages
- Navigation bar component with responsive design
- Placeholder pages for all primary routes

✅ **Environment configuration**
- `.env.example` file for configuration
- `.gitignore` files for both frontend and backend
- Proper separation of development and production configs

---

## Project Structure

### Complete Directory Layout

```
Project/
├── frontend/                    # React frontend application
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── components/          # Reusable React components
│   │   │   ├── Navigation.jsx
│   │   │   └── Navigation.css
│   │   ├── pages/               # Page components
│   │   │   ├── HomePage.jsx
│   │   │   ├── HomePage.css
│   │   │   ├── LostItemsPage.jsx
│   │   │   ├── LostItemsPage.css
│   │   │   ├── LoginPage.jsx
│   │   │   ├── LoginPage.css
│   │   │   ├── SignupPage.jsx
│   │   │   └── SignupPage.css
│   │   ├── services/            # API service functions (future)
│   │   ├── utils/               # Utility functions (future)
│   │   ├── App.jsx              # Main app component
│   │   ├── App.css
│   │   ├── main.jsx             # Entry point
│   │   └── index.css            # Global styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── .gitignore
│
├── src/                         # Flask backend
│   ├── app.py                   # Main Flask application
│
├── tests/                       # Test suites
│   ├── test_auth.py
│   └── test_code.py
│
├── docs/                        # Documentation
│   ├── sprint1_authentication.md
│   ├── sprint1_project_structure.md (this file)
│   └── ... (other docs)
│
├── requirements.txt             # Python dependencies
├── .env.example                 # Environment variables template
├── .gitignore                   # Git ignore rules
└── README.md                    # Project README
```

---

## Frontend Implementation

### Technology Stack

- **Framework:** React 18.2.0
- **Build Tool:** Vite 5.0.8
- **Routing:** React Router DOM 6.20.0
- **HTTP Client:** Axios 1.6.2 (for future API calls)

### Key Components

#### 1. Navigation Component (`components/Navigation.jsx`)

- Responsive navigation bar with mobile menu
- Active route highlighting
- Links to all primary pages:
  - Home
  - Lost Items
  - Login
  - Sign Up

**Features:**
- Sticky navigation bar
- Mobile-responsive hamburger menu
- Active route indication
- Accessible design

#### 2. Page Components

**HomePage** (`pages/HomePage.jsx`)
- Landing page with hero section
- Feature overview
- Call-to-action buttons
- Responsive design

**LostItemsPage** (`pages/LostItemsPage.jsx`)
- Placeholder for lost items listing
- Filter section placeholder
- Ready for backend integration

**LoginPage** (`pages/LoginPage.jsx`)
- Login page placeholder
- Information about different login methods
- Links to signup page
- Ready for authentication form integration

**SignupPage** (`pages/SignupPage.jsx`)
- Registration page placeholder
- Visitor registration information
- Links to login page
- Ready for registration form integration

### Routing Configuration

Routes are defined in `App.jsx`:

```jsx
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/lost-items" element={<LostItemsPage />} />
  <Route path="/login" element={<LoginPage />} />
  <Route path="/signup" element={<SignupPage />} />
</Routes>
```

### Styling

- **Global Styles:** `index.css` - Base styles and resets
- **Component Styles:** Each component has its own CSS file
- **Design System:**
  - Primary Color: #003366 (UW Blue)
  - Responsive breakpoints
  - Consistent spacing and typography

---

## Backend Updates

### CORS Configuration

Added Flask-CORS to enable cross-origin requests from the frontend:

```python
from flask_cors import CORS
CORS(app, origins=['http://localhost:3000'], supports_credentials=True)
```

This allows the React frontend (running on port 3000) to communicate with the Flask backend (running on port 5000).

### API Proxy Configuration

Vite is configured to proxy API requests:

```javascript
// vite.config.js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, '')
    }
  }
}
```

This allows frontend to make requests to `/api/*` which are proxied to the backend.

---

## Environment Configuration

### `.env.example` File

Created a comprehensive environment variables template:

```env
# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=your-secret-key-here

# Database Configuration
DATABASE_URL=sqlite:///lostfound.db

# API Configuration
API_BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
```

### `.gitignore` Files

- **Root `.gitignore`:** Python, database files, environment variables
- **Frontend `.gitignore`:** Node modules, build files, IDE files

---

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- pip

### Frontend Setup

```bash
cd Project/frontend
npm install
npm run dev
```

The frontend will start on `http://localhost:3000`

### Backend Setup

```bash
cd Project
pip install -r requirements.txt
cd src
python app.py
```

The backend will start on `http://localhost:5000`

### Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update values in `.env` as needed

---

## Build and Production

### Frontend Build

```bash
cd frontend
npm run build
```

This creates an optimized production build in `frontend/dist/`

### Preview Production Build

```bash
npm run preview
```

---

## Acceptance Criteria Status

### Project Structure

✅ **Project runs and builds successfully with zero errors**
- Frontend builds without errors
- Backend runs without errors
- All dependencies properly configured

✅ **Folder/file layout aligns with the deliverables specification**
- Clear separation of frontend and backend
- Organized component and page structure
- Proper configuration files in place

✅ **Environment variables are correctly configured for local development**
- `.env.example` file provided
- Clear documentation for configuration
- Development defaults set

### Front-End Navigation

✅ **Routing functions correctly across all primary pages**
- React Router configured
- All routes working: Home, Lost Items, Login, Signup
- Navigation between pages functional

✅ **Each page includes placeholder content**
- HomePage: Hero section and features
- LostItemsPage: Placeholder for items listing
- LoginPage: Login information and placeholders
- SignupPage: Registration information and placeholders

✅ **Navigation UI is visible, accessible, and fully functional**
- Navigation bar visible on all pages
- Responsive mobile menu
- Active route highlighting
- Accessible design with proper ARIA labels

---

## Testing

### Manual Testing Checklist

- [x] Frontend builds successfully
- [x] Backend runs successfully
- [x] Navigation bar appears on all pages
- [x] All routes navigate correctly
- [x] Mobile menu works on small screens
- [x] Active route highlighting works
- [x] Pages display placeholder content
- [x] No console errors
- [x] CORS configured correctly

### Browser Compatibility

Tested and working on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

---

## Future Enhancements

### Immediate Next Steps (Sprint 2+)

1. **Connect Frontend to Backend**
   - Implement login form with API integration
   - Implement registration form
   - Add API service layer

2. **Lost Items Functionality**
   - Connect to backend API
   - Implement item listing
   - Add filtering and search

3. **Authentication Integration**
   - Connect login page to `/auth/login`
   - Connect signup page to `/auth/register`
   - Implement session management
   - Add protected routes

4. **Enhanced UI/UX**
   - Loading states
   - Error handling
   - Form validation
   - Toast notifications

---

## File Structure Details

### Frontend Files Created

```
frontend/
├── package.json              # Dependencies and scripts
├── vite.config.js            # Vite configuration
├── index.html                # HTML entry point
├── .gitignore                # Frontend gitignore
└── src/
    ├── main.jsx              # React entry point
    ├── App.jsx               # Main app component
    ├── App.css               # App styles
    ├── index.css             # Global styles
    ├── components/
    │   ├── Navigation.jsx    # Navigation component
    │   └── Navigation.css    # Navigation styles
    └── pages/
        ├── HomePage.jsx      # Home page
        ├── HomePage.css
        ├── LostItemsPage.jsx # Lost items page
        ├── LostItemsPage.css
        ├── LoginPage.jsx     # Login page
        ├── LoginPage.css
        ├── SignupPage.jsx    # Signup page
        └── SignupPage.css
```

### Backend Files Updated

```
src/
└── app.py                    # Added CORS support

requirements.txt              # Added flask-cors

.env.example                 # New environment template
.gitignore                   # Updated ignore rules
```

---

## Development Workflow

### Running Development Servers

**Terminal 1 - Backend:**
```bash
cd Project/src
python app.py
```

**Terminal 2 - Frontend:**
```bash
cd Project/frontend
npm run dev
```

### Making Changes

1. **Frontend Changes:** Edit files in `frontend/src/`, Vite hot-reloads automatically
2. **Backend Changes:** Edit files in `src/`, restart Flask server
3. **Styling:** Edit CSS files, changes reflect immediately

---

## Troubleshooting

### Common Issues

**Frontend won't start:**
- Check Node.js version: `node --version` (should be 18+)
- Delete `node_modules` and run `npm install` again
- Check for port conflicts (port 3000)

**Backend won't start:**
- Check Python version: `python --version` (should be 3.8+)
- Install dependencies: `pip install -r requirements.txt`
- Check for port conflicts (port 5000)

**CORS errors:**
- Ensure backend CORS is configured correctly
- Check that frontend URL matches CORS origins
- Verify both servers are running

**Routing not working:**
- Ensure React Router is properly imported
- Check that all routes are defined in `App.jsx`
- Verify BrowserRouter wraps the App component

---

## Conclusion

Sprint 1, Part 2 successfully establishes the full-stack project structure with a React frontend and Flask backend. The basic navigation system is fully functional with routing between all primary pages. The structure is scalable and ready for future development.

**Status:** ✅ **COMPLETE**

All acceptance criteria have been met:
- ✅ Project runs and builds successfully
- ✅ Folder/file layout aligns with specification
- ✅ Environment variables configured
- ✅ Routing functions correctly
- ✅ Pages include placeholder content
- ✅ Navigation UI is visible, accessible, and functional

---

*Document created: November 2025*  
*Last updated: November 2025*  
*Team 15: Ruhani, Sheehan, Aidan, Neng, Theni*

