# Test Plan – UW Lost-and-Found App

## 1. Introduction
This Test Plan outlines the testing objectives, scope, environment, responsibilities, and strategy for the UW Lost-and-Found App. The purpose of this document is to ensure all major features are validated for functionality, reliability, usability, and performance.

---

## 2. Scope
This Test Plan covers:
- Functional testing of core features  
- Basic non-functional testing (usability, reliability)  
- Integration testing of connected components  
- Acceptance testing criteria  

Out of scope for Sprint 1:
- Performance benchmarking  
- Security penetration testing  
- Load/stress testing  

---

## 3. Test Objectives
- Verify all implemented features work as intended.  
- Ensure the UI behaves consistently and is intuitive.  
- Validate that essential workflows (reporting, searching, updating items) function without errors.  
- Identify and track defects early in development.

---

## 4. Features to Be Tested
- User login/authentication (if implemented in sprint)  
- Submit lost item report  
- Submit found item report  
- Search for items  
- View item details  
- Status updates (claimed, unclaimed)  
- Admin features (if available)

---

## 5. Features Not to Be Tested
- Advanced analytics or reporting  
- Multi-factor authentication  
- Push notifications  
- High-load concurrency  
- Payment-related features (none planned)  

---

## 6. Testing Strategy

### 6.1 Functional Testing
- Black-box test cases based on requirements  
- Test each user scenario end-to-end  
- Validate input handling and error messages  

### 6.2 Integration Testing
- Ensure the database, server, and UI work together  
- Check correct data flow between modules  

### 6.3 Usability Testing
- Confirm that the UI is simple and clear  
- Validate navigation structure  

### 6.4 Acceptance Testing
- Criteria will follow use cases and high-priority scenarios  
- Conducted before each release milestone  

---

## 7. Test Environment
- **Frontend:** Web interface (React or similar depending on project)  
- **Backend:** API / server  
- **Database:** SQLite or PostgreSQL (team-dependent)  
- **Hardware:** Any laptop capable of running local development environment  
- **Tools:**  
  - Browser DevTools  
  - GitLab issue tracker  
  - Manual testing primarily for Sprint 1  

---

## 8. Roles and Responsibilities
| Role | Responsibility |
|------|----------------|
| QA / Tester | Create test cases, conduct manual testing, report defects |
| Developer(s) | Fix defects, support retesting |
| Scrum Master | Monitor progress, review deliverables |
| Product Owner | Approve acceptance criteria |

---

## 9. Test Schedule (Sprint-Based)
| Week | Activity |
|------|----------|
| Week 1 | Identify testable features, write test plan |
| Week 2 | Develop initial test cases, prepare environment |
| Week 3 | Conduct functional testing, log defects |
| Week 4 | Retesting, prepare test report |

---

## 10. Test Deliverables
- Test Plan (this document)  
- Test Cases Document (Sprint 2)  
- Defect Reports  
- Test Report  

---

## 11. Risks & Mitigation Strategies
| Risk | Impact | Mitigation |
|------|--------|------------|
| Limited time during sprint | Medium | Prioritize core functionality |
| Unclear requirements | High | Communicate with team early |
| Integration issues | Medium | Begin integrations early, test incrementally |
| Inexperienced testers | Low | Pair testing, follow structured cases |

---

**End of Test Plan**
