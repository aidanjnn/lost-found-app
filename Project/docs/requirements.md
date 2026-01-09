# UW Lost-and-Found App Requirements

## Overview
This document lists functional and non-functional requirements for the UW Lost-and-Found web application. It aligns with the project charter and provides a clear guide for development, testing, and deployment.

---

## Functional Requirements

### User Portal
- **FR1:** Students can browse items, filter by category, status, or location, and search by keywords.
- **FR2:** Students can view item details including photo, description, and location.
- **FR3:** Students can claim items by providing valid identification (WatCard for students, driver’s license for visitors).
- **FR4:** Students receive notifications when a potential match is added or when a claim is approved.
- **FR5:** Visitors can create an account to claim items and receive notifications.

### Management Portal
- **FR6:** Desk staff can add new items with photo, description, category, and location found.
- **FR7:** Staff can update item status (claimed/unclaimed) and record claimant ID information.
- **FR8:** Staff can define retention period for claimed items to remain visible.
- **FR9:** Staff can view audit logs showing item actions, including who claimed an item and when.
- **FR10:** Staff can respond to review requests for disputed claims.

### System Requirements
- **FR11:** Authentication via WatIAM single sign-on for students.
- **FR12:** Secure account creation and login for visitors.
- **FR13:** Store personal data and images securely with access controls.
- **FR14:** Responsive UI/UX for desktop, tablet, and mobile browsers.
- **FR15:** API endpoints for frontend-backend communication.
- **FR16:** Notification system (email alerts) for users about claim status.

---

## Non-Functional Requirements
- **NFR1:** System must handle concurrent users with minimal delay.
- **NFR2:** Database should support efficient search and retrieval of items.
- **NFR3:** Data storage and retention must comply with Canadian privacy laws and university policies.
- **NFR4:** Application must be maintainable and extensible for future enhancements.
- **NFR5:** All items must be recorded in the system within one day of arrival.
- **NFR6:** Positive usability feedback from students and desk staff.

---

## Acceptance Criteria
- All core functionalities (browsing, claiming, adding items, notifications) are working.
- Security measures prevent unauthorized access to sensitive data.
- Responsive interface works on desktop and mobile devices.
- Successful integration with SLC, PAC, and CIF desks.
- Audit logs accurately reflect all actions on items.
