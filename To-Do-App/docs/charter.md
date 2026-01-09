# To-Do-App Project Charter

**Project Title:** Web-Accessible To-Do App (Local-First)  
**Team:** SE101 – Team Project 15 (Ruhani, Theni, Neng, Aidan, Sheehan) 
**Instructor Reviewer:** d3feng

---

## Purpose & Problem Statement
This project aims to develop a web-accessible To-Do application with persistent data storage in a MySQL database. It extends a local command-line app into a Flask-based local web app, providing per-user task management and preparing the groundwork for a future fully web-deployed version.

---

## Goals & Success Criteria
- Implement core To-Do functions with full database integration:
  - add(), update(), delete(), next(), today(), tomorrow()
- Each function updates the database and filters by userid.
- Build a simple Flask web interface to view and manage tasks locally.
- Create a test plan and testcases for all functions and endpoints.
- Use Git flow: issue → feature branch → subbranches per function → review → merge.

---

## Scope

**In Scope**
- Task table with userid field.
- Full CRUD functions and filters (today, tomorrow, next).
- Local Flask web server and simple HTML templates.
- Unit and integration tests.

**Out of Scope**
- Full authentication (beyond DB user login mapping).
- Cloud deployment.
- Android/mobile versions (handled in Project phase if chosen).

---

## Timeline & Milestones
| Milestone | Description | Target |
|------------|--------------|--------|
| 1 | Create issue and base branch `todo-app` | Day 0 |
| 2 | Implement DB schema and add() | +2 days |
| 3 | Implement all other functions and tests | +4 days |
| 4 | Flask web interface and integration tests | +7 days |
| 5 | Final merge request to d3feng | +10 days |

---

## Roles & Workflow
- Developers: Each implements one function in a subbranch.  
- Testers: Write testcases for another member’s function.  
- Reviewer: Approves or rejects MRs (assigned to d3feng).  
- Final Reviewer: d3feng for todo-app → main MR.

---

## Database Schema (Example)
```sql
CREATE TABLE IF NOT EXISTS ToDoData(
  item VARCHAR(255) NOT NULL PRIMARY KEY,
  type VARCHAR(255) NOT NULL,
  started DATETIME NOT NULL,
  due DATETIME NOT NULL,
  done DATETIME NOT NULL
)
```