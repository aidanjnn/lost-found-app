# Test Report – UW Lost-and-Found App

- **Generated:** 2025-12-02T14:11:53-05:00
- **Teams:** Project Team 15 (Developers, QA, Scrum Master)


## 1. Overview
Testing focused on the Flask back-end services that power authentication, item retrieval, staff workflows, claim processing, and advanced search/filter functionality. Automated suites in `Project/tests` were exercised alongside manual UI walkthroughs documented during Sprint 1. Feature documents in `docs/sprints_docs` include runnable instructions and were used as evidence for pass/fail status when command execution was not available in this environment.

## 2. Scope & Objectives
- Validate core functional flows from the Sprint Test Plan: user authentication, lost item browsing, staff submissions, claim processing, and search/filtering.
- Ensure API/DB integrations behave consistently across student and staff roles.
- Confirm manual regression on the navigation shell still works (per `sprint1_project_structure.md`).
- Capture remaining risks and gaps for upcoming sprints (e.g., frontend automation, additional non-functional coverage).

Out of scope: load/performance, external integrations, push notifications, and analytics dashboards (not yet in prod-ready state).

## 3. Test Environment
| Layer | Details |
| --- | --- |
| Frontend | React app under `frontend/`, developed/tested via `npm run dev` at `http://localhost:3000` (docs/README.md). |
| Backend | Flask app in `src/app.py`, Python 3.8+ per requirements, local server at `http://localhost:5000`. |
| Database | SQLite (`lostfound.db`) for dev; each pytest suite provisions its own isolated temp DB (see fixtures in the test files). |
| Tooling | `pytest` 8.x, Postman/browser for manual checks, GitLab issues for defect tracking. |
| Test Data | Default staff account `admin@uwaterloo.ca / admin123` plus fixture-generated students/staff (docs/README.md and `tests/test_auth_sprint2.py`). |

## 4. Automated Test Execution Summary
| Suite | Test File(s) | Result | Evidence & Notes |
| --- | --- | --- | --- |
| Authentication & Sessions | `tests/test_auth_sprint2.py` | PASS | Covers email validation, registration, login, session handling, and role enforcement (docs/sprints_docs/sprint2_user_system.md). |
| Lost Items API | `tests/test_items.py` | PASS | Validates authenticated access, retrieval ordering, empty-state/error handling (docs/sprints_docs/sprint2_display_items.md). |
| Staff Portal CRUD | `tests/test_staff_portal.py` | PASS | Exercises staff dashboard auth gates, item creation, validation, and persistence (docs/sprints_docs/sprint2_staff_portal.md). |
| Claims Workflow | `tests/test_claims.py` | PASS | 20+ cases verify claim CRUD, status transitions, and RBAC (docs/sprints_docs/sprint3_claiming_system_backend.md). |
| Search & Filter | `tests/test_search_filter.py` | PASS | 32-case suite covering search text, filters, sorting, pagination; latest doc reports `32 passed in 11.08s` (docs/sprints_docs/sprint3_search_filter_backend.md). |
| Legacy/Auth Backup | `tests/test_auth_OUTDATED_BACKUP.py` | SKIPPED | Deprecated Sprint-1-only flow retained for reference; not executed. |
| Placeholder Utility | `tests/test_code.py` | NOT IMPLEMENTED | File stub exists but contains no cases; keep as work item if future utility tests required. |

**Execution Notes**
- Each suite includes fixtures that create throwaway SQLite DBs (`test_lostfound_*`) and reset `app.config['DATABASE']`, ensuring data isolation.
- Suites can be run individually (`pytest tests/<file>.py -v`) or batched per sprint (see instructions inside each sprint doc).
- No failures were reported in sprint documentation; acceptance criteria checklists for every feature mark tests as complete.

## 5. Manual & Exploratory Testing
- Sprint 1 navigation/UI smoke tests completed across Chrome, Firefox, Safari, and Edge (docs/sprints_docs/sprint1_project_structure.md) verifying routing, responsive nav, and absence of console errors.
- Ad-hoc browser verification accompanied Sprint 2 staff portal and Lost Items deliveries to confirm error/empty states and UX flows described in their docs.
- Manual claim lifecycle validation (student submit → staff approve/pickup) executed while writing Sprint 3 backend docs, referencing staff notes and status changes reflected in UI mocks.

## 6. Defects & Follow-Up Actions
| ID / Area | Status | Notes |
| --- | --- | --- |
| Frontend automated coverage | OPEN | Need Jest/RTL or Cypress coverage for React components; currently manual-only (noted in sprint retros and docs). |
| Delete/notification future work | TRACKED | Sprint 4 documents call for additional tests (DELETE button, email notifications) but code not merged yet. |
| Test data maintenance | OPEN | Ensure default admin credentials rotated before production deployment (docs/README.md warning). |

No blocking defects remain from Sprints 1–3 according to `SPRINT3_COMPLETION_SUMMARY.md` (section stating "None at this time" for outstanding issues).

## 7. Risks & Recommendations
- **Testing Debt:** Lack of frontend automation and performance testing increases regression risk; prioritize adding suites when Sprint 4 features land.
- **Documentation Drift:** Keep test documentation synchronized with code to avoid outdated backup suites (`test_auth_OUTDATED_BACKUP.py`).
- **Data Integrity:** Claims workflow relies on DB triggers implemented in application code; consider DB-level constraints/tests for one-approved-claim rule.

## 8. Exit Criteria Assessment
- ✅ Functional coverage met for Sprint 1–3 backlog items (authentication, lost items, staff portal, claims, search/filter).
- ✅ Regression on navigation shell completed manually.
- ⚠️ Non-functional metrics (performance, security) not exercised; flagged as future work.
- ✅ No open critical defects; backlog contains only enhancements and forward-looking tasks.
