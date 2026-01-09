# UW Lost-and-Found App Project Charter

## Project Overview
**Team Members:** Ruhani, Sheehan, Aidan, Neng, Theni  
**Project Sponsor:** Turnkey Desk at the Student Life Centre (SLC); Equipment Desks in the Physical Activities Complex (PAC) and Columbia Ice Fields (CIF)  
**Instructor/Reviewer:** Derek Feng / Paul Ward  
**Project Start Date:** October 2025  
**Project End Date:** December 2025  

---

## Purpose & Problem Statement
The University of Waterloo currently uses multiple channels to manage lost-and-found items. When students lose items, the items are generally taken to the SLC Turnkey Desk or the equipment desks in the PAC and CIF. Students also post on Reddit or social media in hopes of reconnecting with their possessions.  

There is no unified repository or search interface, so students must physically visit each desk or scour online forums. This fragmented process results in duplicated effort, poor visibility and low recovery rates.  

The proposed web application will centralize lost-and-found operations across the SLC, PAC and CIF by providing a single database and interface that makes it easy to record found items, view available items and securely claim them. By integrating existing desk services into one platform, we aim to improve recovery rates and create a seamless experience for students and staff.

---

## Goals & Success Criteria
- **Centralized database and log:** Maintain a comprehensive database of all items found at the SLC Turnkey Desk and the PAC/CIF equipment desks. Each entry will include a picture of the item, a description (e.g., type, colour, distinguishing marks), the location where it was found and its status (claimed or unclaimed).  
- **Two-sided application:** Provide a User portal where students and visitors can browse items, filter/search by category, status or location, view photos and claim items. Provide a Desk/Management portal where staff can register new items, capture photos, set the item’s status and update details. The management interface must also record the claimant’s identification: for students this is their WatCard (photo or number and name) and for visiting members this is their driver’s licence. Storing ID information ensures that only legitimate owners collect items and discourages fraudulent claims.  
- **Claim management and auditability:** Allow claimed items to remain visible in the app for a configurable retention period defined by management. This enables users to see if someone else has claimed their item and to lodge a request for desk staff to investigate if they believe a claim was improper. Audit logs should capture when an item was claimed, who claimed it and which desk processed the claim.  
- **Responsive and inclusive design:** Implement a web-based interface that delivers excellent UI/UX on desktop and mobile devices, recognising that photos are important for identification and many users will access the app from their phones.  
- **Robust backend foundation:** Develop a strong backend architecture and database schema that serve as the foundation of the application. The backend will expose APIs for the front-end to fetch and update item data, handle authentication and enforce business rules.  

### Success Metrics
- All found items are recorded in the system within a day of arriving at a desk.  
- Students can find and claim their items via the app without needing to visit multiple desks.  
- Positive feedback from students and desk staff on ease of use and reduction in manual tracking.  
- High match/recovery rate of lost items compared to the current manual process.  

---

## Scope

### In Scope
- Design, develop and deploy a web application accessible via modern browsers.  
- Integration with the SLC Turnkey Desk and PAC/CIF equipment desks for item intake and claim processing.  
- User authentication for students (using WatIAM single sign-on) and account creation for visitors.  
- Functionality to list all items with filters (claimed/unclaimed, category, location, date found) and search capabilities.  
- Management portal features: add new items with photo and description, update status, record claimant’s ID information (WatCard or driver’s licence), define retention period for display of claimed items.  
- Secure storage of personal data and images with proper access controls.  
- Notification system (e.g., email) to inform users when a potential match is added or when their claim has been approved.  
- Responsive UI/UX design ensuring full functionality on desktops, tablets and phones.  
- Documentation, unit/integration testing and deployment on a university-approved server.  

### Out of Scope
- Providing shipping or mailing services for lost items.  
- Integrations with third-party lost-and-found services outside the university.  
- Real-time tracking devices or hardware (e.g., RFID tags).  
- Native mobile app development (the focus is a responsive web app).  
- Handling payments or financial transactions.  

---

## Deliverables
- A centralized lost-and-found web application for the SLC, PAC and CIF with user and management interfaces.  
- Backend database schema, API endpoints and documentation.  
- Secure authentication and authorization mechanisms for students, visitors and desk staff.  
- Administrative tools for desk managers to configure retention periods and view audit logs.  
- User and technical documentation (user guides, developer docs, API reference).  
- Test plans and test results demonstrating that the app meets functional and non-functional requirements.  
- Deployment on a test server followed by production deployment approved by university IT.  

---

## Assumptions
- All found items are turned in to the SLC Turnkey Desk or PAC/CIF equipment desks before being logged.  
- Staff at each desk will consistently enter found items into the system with accurate descriptions and photos.  
- Students and visitors will provide valid identification when claiming items (WatCard or driver’s licence).  
- Sufficient network and server infrastructure is available through the university to host the application.  
- Students have access to smartphones or computers with internet connectivity.  

---

## Constraints
- The project must be completed within the timeframe of the SE 101 course with limited development resources.  
- Data privacy and security must comply with university policies and Canadian privacy legislation.  
- Coordination is required across multiple stakeholders (SLC, Athletics, University IT, Student Union).  
- The solution must be easily maintainable and extensible for future features (e.g., AI-powered matching).  

---

## Risks
- Low adoption by students or staff due to awareness or resistance to change.  
- Misuse of the system by users trying to claim items that do not belong to them.  
- Inconsistent data entry quality (e.g., missing or blurry photos, poor descriptions) reducing matching effectiveness.  
- Technical issues or downtime impacting availability.  
- Privacy concerns regarding storage of personal ID information.  
- Scope creep if additional departments request integration mid-project.  

---

## Roles & Workflow
- **Project Manager / Team Lead:** Oversees project timeline, coordinates tasks, liaises with sponsor and stakeholders.  
- **Backend Developer(s):** Design and implement database schema, API endpoints, authentication and claim logic.  
- **Frontend Developer(s):** Develop responsive web interfaces for user and management portals; integrate with backend.  
- **UI/UX Designer:** Define user flows, wireframes and ensure accessibility and usability across devices.  
- **Quality Assurance:** Create and execute test plans; perform user acceptance testing with students and desk staff.  
- **Client/Stakeholder Representatives:** Provide requirements, feedback and approve deliverables.  
- **Security/Privacy Advisor:** Ensure the system meets privacy and security requirements for storing ID images and personal data.  

---

## Database Schema (Example)

| Table | Key Fields | Description |
|--------|-------------|-------------|
| **Users** | user_id (PK), name, email, role (student, visitor, staff), watcard_number (nullable), driver_license (nullable) | Stores login information for students, visitors and desk staff. Only necessary fields are captured; sensitive ID images are stored securely in a separate storage service. |
| **Items** | item_id (PK), description, category, location_found, date_found, status (unclaimed/claimed), image_url, found_by_desk | Records details about each found item, including photo and where it was deposited (SLC, PAC or CIF). |
| **Claims** | claim_id (PK), item_id (FK), claimer_user_id (FK), claim_date, claimer_id_type (WatCard/Driver’s Licence), claimer_id_value, image_proof_url, review_requested (boolean) | Tracks claims made on items, records claimant’s identification details and links to the corresponding item and user. The review_requested flag allows a user to request an investigation if they believe a claim was incorrect. |
| **AuditLogs** | log_id (PK), item_id (FK), action (added, updated, claimed), user_id (FK), timestamp, notes | Keeps a history of actions taken on each item for transparency and accountability. |
| **Notifications** | notification_id (PK), user_id (FK), message, sent_at, read (boolean) | Stores messages sent to users about potential matches or claim status updates. |

---

## Project Timeline (High-Level)

| Phase | Duration | Key Activities |
|--------|-----------|----------------|
| **Week 1 – Planning & Design** | 1 week | Gather requirements from SLC and Athletics; define use cases; create UI/UX mockups; design database schema and architecture; develop project plan. |
| **Week 2 – Development** | 1 week | Implement backend database and API; build user and management portals; integrate authentication; ensure responsive design. |
| **Week 3 – Integration & Testing** | 1 week | Conduct integration and usability testing with students and desk staff; fix bugs; refine UI/UX; verify security and privacy compliance. |
| **Week 4 – Deployment & Handover** | 1 week | Deploy the application to a production environment; train desk staff on usage; finalize documentation and user manuals; gather feedback and plan for future enhancements. |

---

## Project Approval
- **Project Sponsor:** SLC Turnkey Desk Manager and PAC/CIF Equipment Desk Manager – approve application functionality and compatibility (satisfied with how the requirements are met)  
- **Instructor/Reviewer:** Professor Paul Ward and TA Derek Feng – reviews deliverables and provides academic oversight.  
- **Team Lead:** Responsible for delivering the project on time and to specification.  
- **Stakeholders:** Student Union representatives, University IT and students/visitors using the service.  
