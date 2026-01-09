# Domain Model – UW Lost-and-Found Web Application

## Overview
This domain model defines the core data objects and relationships for the UW Lost-and-Found system that centralizes item intake and claim management for the SLC, PAC, and CIF desks.

The system supports:
- Staff uploading found items
- Students and visitors browsing items
- Secure item claiming with ID verification
- Audit logs for accountability
- Notification system for users

This domain model aligns with the project charter's database schema and supports the goals of centralizing lost-and-found operations across multiple campus locations.

---

## Entities

### **User**
Represents a student, visitor, or staff member in the system.

**Attributes:**
- `user_id` (Primary Key) - Unique identifier for the user
- `name` (String) - User's full name
- `email` (String, Unique) - User's email address (used for login)
- `role` (Enum: student, visitor, staff) - User's role in the system
- `watcard_number` (String, Nullable) - WatCard number for students
- `driver_license` (String, Nullable) - Driver's license info for visitors
- `password_hash` (String, Nullable) - Hashed password (NULL for students using WatIAM)
- `created_at` (Timestamp) - Account creation timestamp
- `last_login` (Timestamp, Nullable) - Last login timestamp

**Notes:**
- Students authenticate via WatIAM SSO (no password stored)
- Visitors have email/password authentication
- Staff have elevated privileges for item management

---

### **Item**
Represents a lost-and-found object found at one of the campus desks.

**Attributes:**
- `item_id` (Primary Key) - Unique identifier for the item
- `description` (String, Nullable) - Text description of the item (type, colour, distinguishing marks)
- `category` (String) - Item category (e.g., electronics, clothing, cards, keys, bags)
- `location_found` (String) - Physical location where item was found
- `pickup_at` (Enum: SLC, PAC, CIF) - Desk location where item can be claimed
- `date_found` (Timestamp) - Date and time when item was found
- `status` (Enum: unclaimed, claimed, deleted) - Current status of the item
- `image_url` (String) - URL/path to item photo
- `found_by_desk` (String) - Which desk received the item
- `created_at` (Timestamp) - When item was added to system

**Notes:**
- Items are created only by staff members
- Photos are required for identification
- Items remain visible after claiming for a configurable retention period

---

### **Claim**
An event that represents a user claiming a lost item.

**Attributes:**
- `claim_id` (Primary Key) - Unique identifier for the claim
- `item_id` (Foreign Key → Item) - The item being claimed
- `claimer_user_id` (Foreign Key → User) - The user making the claim
- `claim_date` (Timestamp) - When the claim was made
- `claim_location` (Enum: SLC, PAC, CIF) - Desk location processing the claim
- `claimer_id_type` (Enum: WatCard, Driver's Licence) - Type of ID provided
- `claimer_id_value` (String) - ID number or reference
- `image_proof_url` (String, Nullable) - Photo of ID provided
- `review_requested` (Boolean) - Flag if user requests review of claim

**Notes:**
- Each item can be claimed at most once
- ID verification is required for all claims
- Review requests allow dispute resolution

---

### **AuditLog**
Tracks all actions taken on items for accountability and transparency.

**Attributes:**
- `log_id` (Primary Key) - Unique identifier for the log entry
- `item_id` (Foreign Key → Item) - The item the action was performed on
- `action` (Enum: added, updated, claimed) - Type of action performed
- `user_id` (Foreign Key → User) - User who performed the action
- `timestamp` (Timestamp) - When the action occurred
- `notes` (String, Nullable) - Additional details about the action

**Notes:**
- All item modifications are logged
- Enables tracking of who claimed items and when
- Supports audit requirements from project charter

---

### **Notification**
Stores messages sent to users about potential matches or claim status updates.

**Attributes:**
- `notification_id` (Primary Key) - Unique identifier for the notification
- `user_id` (Foreign Key → User) - User receiving the notification
- `message` (String) - Notification message content
- `sent_at` (Timestamp) - When notification was sent
- `read` (Boolean) - Whether user has read the notification

**Notes:**
- Notifications alert users to potential item matches
- Notifications inform users when claims are approved
- Supports email notification system mentioned in charter

---

## Relationships and Cardinality

### User → Item
**Cardinality: 1 Staff → Many Items (0..*)**

- Students and visitors do **not** create items
- Only staff members can create Item entries
- One staff member can create many items
- Relationship type: One-to-Many (1:N)

---

### User → Claim
**Cardinality: 1 User → Many Claims (0..*)**

- One user can make multiple claims (for different items)
- Each claim belongs to exactly one user
- Relationship type: One-to-Many (1:N)

---

### Item → Claim
**Cardinality: 1 Item → 0 or 1 Claim**

- One item can be claimed at most once (0 or 1)
- After claiming, item remains visible for retention period
- Relationship type: One-to-Zero-or-One (1:0..1)

---

### Item → AuditLog
**Cardinality: 1 Item → Many AuditLogs (1..*)**

- Every item has at least one audit log (when created)
- Multiple actions on an item create multiple log entries
- Relationship type: One-to-Many (1:N)

---

### User → Notification
**Cardinality: 1 User → Many Notifications (0..*)**

- One user can receive multiple notifications
- Each notification belongs to exactly one user
- Relationship type: One-to-Many (1:N)

---

## Text-Based UML Class Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                           User                               │
├─────────────────────────────────────────────────────────────┤
│ + user_id: PK                                                │
│ + name: String                                               │
│ + email: String (Unique)                                     │
│ + role: Enum (student, visitor, staff)                      │
│ + watcard_number: String (Nullable)                          │
│ + driver_license: String (Nullable)                          │
│ + password_hash: String (Nullable)                           │
│ + created_at: Timestamp                                      │
│ + last_login: Timestamp (Nullable)                           │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         │                    │                    │
         │ 1                  │ 1                  │ 1
         │                    │                    │
         │                    │                    │
         ▼ *                  ▼ *                  ▼ *
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│      Item       │  │      Claim      │  │  Notification   │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ + item_id: PK   │  │ + claim_id: PK  │  │ + notification_  │
│ + description   │  │ + item_id: FK    │  │   id: PK        │
│ + category      │  │ + claimer_user_ │  │ + user_id: FK   │
│ + location_     │  │   id: FK        │  │ + message       │
│   found         │  │ + claim_date    │  │ + sent_at       │
│ + pickup_at     │  │ + claim_location│  │ + read: Boolean │
│ + date_found    │  │ + claimer_id_   │  │                 │
│ + status        │  │   type          │  │                 │
│ + image_url     │  │ + claimer_id_   │  │                 │
│ + found_by_desk │  │   value         │  │                 │
│ + created_at    │  │ + image_proof_  │  │                 │
└─────────────────┘  │   url           │  │                 │
         │            │ + review_       │  │                 │
         │ 1          │   requested     │  │                 │
         │            └─────────────────┘  │                 │
         │                    │            └─────────────────┘
         │                    │
         │                    │ 0..1
         │                    │
         ▼ *                  ▼
┌─────────────────┐  ┌─────────────────┐
│   AuditLog      │  │                 │
├─────────────────┤  │                 │
│ + log_id: PK    │  │                 │
│ + item_id: FK   │  │                 │
│ + action        │  │                 │
│ + user_id: FK   │  │                 │
│ + timestamp     │  │                 │
│ + notes         │  │                 │
└─────────────────┘  └─────────────────┘

Legend:
- PK = Primary Key
- FK = Foreign Key
- * = Many (0..* or 1..*)
- 1 = One
- 0..1 = Zero or One
```

---

## Connection to Project Charter

This domain model directly supports the goals and requirements outlined in the project charter:

### 1. Centralized Database and Log
The **Item** entity centralizes all found items from SLC, PAC, and CIF desks. The **AuditLog** entity maintains a comprehensive history of all actions, supporting the charter's requirement for a "centralized database and log."

### 2. Two-Sided Application
- **User** entity supports three roles (student, visitor, staff) enabling both user and management portals
- **Item** entity includes all required fields (picture via `image_url`, description, location, status) as specified in the charter
- **Claim** entity records claimant identification (WatCard or driver's licence) as required

### 3. Claim Management and Auditability
- **Claim** entity tracks who claimed items and when, with ID verification fields
- **AuditLog** entity captures all actions for transparency and accountability
- **Item** status field supports retention period functionality (claimed items remain visible)

### 4. Notification System
- **Notification** entity supports the email notification system mentioned in the charter
- Enables alerts when potential matches are added or claims are approved

### 5. Database Schema Alignment
This domain model aligns with the database schema example provided in the project charter (Section "Database Schema (Example)"), including:
- Users table with roles (student, visitor, staff)
- Items table with all specified fields
- Claims table with ID verification fields
- AuditLogs table for tracking actions
- Notifications table for user alerts

### 6. Security and Privacy
- **User** entity separates sensitive ID information (stored securely)
- **Claim** entity includes ID verification without storing full images in main table
- Supports the charter's requirement for "secure storage of personal data and images"

---

## Summary

This domain model provides a complete representation of the UW Lost-and-Found system's data structure, supporting all functional requirements from the project charter. The five core entities (User, Item, Claim, AuditLog, Notification) work together to enable:

- Centralized item management across multiple campus locations
- Secure claim processing with ID verification
- Complete audit trail for accountability
- User notifications for engagement
- Role-based access control (students, visitors, staff)

The relationships and cardinalities ensure data integrity while supporting the business logic required by the project charter's goals and success criteria.

