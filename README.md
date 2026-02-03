# uw lost & found

a centralized lost-and-found web application for the university of waterloo, designed to help students and staff efficiently manage and recover lost items across campus.



## about![UW Lost _ Found _ University of Waterloo](https://github.com/user-attachments/assets/0b479582-dd84-47e9-ad89-a4ed353c2d8d)


the uw lost & found app provides a unified platform to streamline the management of lost items at the university of waterloo. it connects the slc turnkey desk, pac, and cif equipment desks with students and visitors, making it easier to report, search, and claim lost belongings.

### key features

- **centralized database**: all lost items from slc, pac, and cif in one searchable platform
- **user portal**: browse items, filter by category/location/status, and submit claims
- **staff dashboard**: register new items, manage claims, view analytics, and export data
- **claim management**: secure claiming process with id verification and audit logging
- **email notifications**: automatic notifications for item matches and claim updates
- **responsive design**: full functionality on desktop, tablet, and mobile devices

## tech stack

| layer | technology |
|-------|------------|
| **frontend** | react + vite |
| **backend** | python flask |
| **database** | sqlite |
| **styling** | css |

## getting started

### prerequisites

- python 3.8+
- node.js 18+ and npm

### backend setup

1. navigate to the project directory:
   ```bash
   cd Project
   ```

2. **option a: easy setup (recommended)**
   ```bash
   ./start_backend.sh
   ```
   this script automatically handles virtual environment setup, dependencies, and port conflicts.

3. **option b: manual setup**
   ```bash
   # create virtual environment
   python3 -m venv venv
   
   # activate virtual environment
   source venv/bin/activate
   
   # install dependencies
   pip install -r requirements.txt
   
   # start the backend server
   cd src
   python3 app.py
   ```

4. **expected output:**
   ```
   database initialized successfully
   ✅ default staff account password reset: admin@uwaterloo.ca / admin123
   * running on http://0.0.0.0:5001
   ```

> **note:** keep this terminal open. the backend must be running for the app to work.

### frontend setup

open a **new terminal window**:

1. navigate to the frontend directory:
   ```bash
   cd Project/frontend
   ```

2. **option a: easy setup (recommended)**
   ```bash
   cd Project
   ./start_frontend.sh
   ```

3. **option b: manual setup**
   ```bash
   # install dependencies
   npm install
   
   # start the development server
   npm run dev
   ```

4. **expected output:**
   ```
   vite v5.0.8 ready in xxx ms
   
   ➜  local:   http://localhost:3000/
   ```

> **note:** keep this terminal open. both servers must be running simultaneously.

### access the application

1. open your browser and go to **http://localhost:3000**
2. you should see the uw lost & found homepage

## default accounts

| role | email | password |
|------|-------|----------|
| **staff** | `admin@uwaterloo.ca` | `admin123` |
| **student** | register with any `@uwaterloo.ca` email | |

## troubleshooting

### backend issues

| problem | solution |
|---------|----------|
| port 5000 in use | run `lsof -ti:5000 \| xargs kill -9` or disable airplay receiver |
| python not found | ensure python 3.8+ is installed: `python3 --version` |
| dependencies fail | try `pip install --upgrade pip` then reinstall |

### frontend issues

| problem | solution |
|---------|----------|
| npm install fails | delete `node_modules` and `package-lock.json`, then run `npm install` again |
| port 3000 in use | either free the port or update `vite.config.js` |
| node not found | ensure node.js 18+ is installed: `node --version` |

### connection issues

| problem | solution |
|---------|----------|
| "cannot connect to server" | ensure backend is running and shows "running on http://0.0.0.0:5001" |
| login not working | check backend terminal for errors, try restarting the server |
| registration fails | verify email ends with `@uwaterloo.ca` and password is 6+ characters |

## project structure

```
Project/
├── src/                    # backend source code
│   └── app.py              # flask application entry point
├── frontend/               # frontend react application
│   ├── src/                # react source code
│   ├── public/             # static assets
│   └── package.json        # frontend dependencies
├── docs/                   # documentation
├── tests/                  # test files
├── start_backend.sh        # backend startup script
├── start_frontend.sh       # frontend startup script
└── requirements.txt        # python dependencies
```

## team

**team members:** ruhani, sheehan, aidan, neng, theni

**course:** se 101 - university of waterloo

## license

this project was developed as part of the se 101 course at the university of waterloo.
