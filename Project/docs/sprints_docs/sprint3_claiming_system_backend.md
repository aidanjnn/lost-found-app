# Sprint 3: Item Claiming System (Backend) - Issue #35

**Author:** Team 15 (Ruhani, Sheehan, Aidan, Neng, Theni)  
**Date:** November 27, 2025  
**Branch:** `sprint-3-claiming-system`  
**Status:** ✅ Complete

---

## Overview

Implemented the backend logic for the Item Claiming System, allowing students to submit claims for lost items and staff to process those claims. This includes database schema, API endpoints, business logic enforcement, and comprehensive testing.

---

## Features Implemented

### 1. Database Schema - Claims Table

Created a new `claims` table with the following structure:

```sql
CREATE TABLE IF NOT EXISTS claims (
    claim_id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    claimant_user_id INTEGER NOT NULL,
    claimant_name TEXT NOT NULL,
    claimant_email TEXT NOT NULL,
    claimant_phone TEXT,
    verification_text TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'picked_up')),
    staff_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_by_staff_id INTEGER,
    FOREIGN KEY (item_id) REFERENCES items(item_id),
    FOREIGN KEY (claimant_user_id) REFERENCES users(user_id),
    FOREIGN KEY (processed_by_staff_id) REFERENCES users(user_id)
)
```

**Fields:**
- `claim_id`: Unique identifier for each claim
- `item_id`: Reference to the item being claimed
- `claimant_user_id`: User ID of the person claiming the item
- `claimant_name`: Name of the claimant
- `claimant_email`: Email of the claimant
- `claimant_phone`: Optional phone number
- `verification_text`: User's description/proof of ownership
- `status`: Claim status (pending, approved, rejected, picked_up)
- `staff_notes`: Notes added by staff when processing claim
- `created_at`: When the claim was created
- `updated_at`: When the claim was last updated
- `processed_by_staff_id`: Staff member who processed the claim

---

## API Endpoints

### 1. Create Claim - `POST /api/claims`

**Authentication:** Required (students and staff)

**Request Body:**
```json
{
  "item_id": 1,
  "verification_text": "This is my black wallet with student ID inside",
  "phone": "519-555-0123"  // optional
}
```

**Response (201 Created):**
```json
{
  "message": "Claim submitted successfully",
  "claim": {
    "claim_id": 1,
    "item_id": 1,
    "claimant_name": "John Doe",
    "claimant_email": "jdoe@uwaterloo.ca",
    "claimant_phone": "519-555-0123",
    "verification_text": "This is my black wallet with student ID inside",
    "status": "pending",
    "created_at": "2025-11-27T10:00:00"
  }
}
```

**Error Responses:**
- `400`: Missing required fields (item_id or verification_text)
- `401`: Not authenticated
- `404`: Item not found
- `409`: Item already has an approved claim

**Business Logic:**
- Automatically populates claimant info from authenticated user
- Checks if item exists and is available
- Prevents claims on items with already approved/picked up claims

---

### 2. Get Claims - `GET /api/claims`

**Authentication:** Required

**Role-Based Access:**
- **Students**: Can only see their own claims
- **Staff**: Can see all claims

**Query Parameters:**
- `status`: Filter by status (pending, approved, rejected, picked_up)
- `item_id`: Filter by item ID
- `user_id`: Filter by claimant user ID (staff only)

**Example Request:**
```
GET /api/claims?status=pending
```

**Response (200 OK):**
```json
{
  "claims": [
    {
      "claim_id": 1,
      "item_id": 1,
      "claimant_user_id": 3,
      "claimant_name": "John Doe",
      "claimant_email": "jdoe@uwaterloo.ca",
      "claimant_phone": "519-555-0123",
      "verification_text": "My black wallet",
      "status": "pending",
      "staff_notes": null,
      "created_at": "2025-11-27T10:00:00",
      "updated_at": "2025-11-27T10:00:00",
      "processed_by_staff_id": null,
      "item_description": "Black wallet with student ID",
      "item_category": "cards",
      "item_pickup_location": "SLC"
    }
  ],
  "count": 1
}
```

**Error Responses:**
- `401`: Not authenticated

---

### 3. Get Claim Details - `GET /api/claims/:id`

**Authentication:** Required

**Role-Based Access:**
- **Students**: Can only view their own claims
- **Staff**: Can view any claim

**Response (200 OK):**
```json
{
  "claim": {
    "claim_id": 1,
    "item_id": 1,
    "claimant_user_id": 3,
    "claimant_name": "John Doe",
    "claimant_email": "jdoe@uwaterloo.ca",
    "claimant_phone": "519-555-0123",
    "verification_text": "My black wallet with student ID",
    "status": "approved",
    "staff_notes": "Verified ID matches",
    "created_at": "2025-11-27T10:00:00",
    "updated_at": "2025-11-27T11:00:00",
    "processed_by_staff_id": 2,
    "item": {
      "description": "Black wallet with student ID",
      "category": "cards",
      "location_found": "SLC",
      "pickup_at": "SLC",
      "date_found": "2025-11-20 10:00:00",
      "image_url": "https://example.com/image.jpg",
      "status": "unclaimed"
    }
  }
}
```

**Error Responses:**
- `401`: Not authenticated
- `403`: Not authorized to view this claim (students only)
- `404`: Claim not found

---

### 4. Update Claim Status - `PATCH /api/claims/:id`

**Authentication:** Required (staff only)

**Request Body:**
```json
{
  "status": "approved",
  "staff_notes": "Verified student ID matches"
}
```

**Valid Status Values:**
- `pending`: Initial state
- `approved`: Claim approved by staff
- `rejected`: Claim rejected by staff
- `picked_up`: Item picked up by claimant

**Response (200 OK):**
```json
{
  "message": "Claim approved successfully",
  "claim_id": 1,
  "new_status": "approved",
  "item_updated": false
}
```

**Error Responses:**
- `400`: Invalid status or invalid transition (e.g., trying to modify picked_up claim)
- `403`: Not staff (students cannot update claims)
- `404`: Claim not found
- `409`: Conflict - another claim already approved for this item

---

## Business Logic & Rules

### Status Transitions

**Valid Transitions:**
```
pending → approved
pending → rejected
approved → picked_up
approved → rejected (can reconsider)
rejected → approved (can reconsider)
picked_up → [FINAL] (cannot be changed)
```

### One Approved Claim Per Item

- Only one claim can be in `approved` or `picked_up` status for each item at a time
- If a claim is approved, other pending claims for the same item are not automatically rejected, but cannot be approved
- Staff must manually review and reject other claims if needed

### Item Status Update on Pickup

- When a claim status changes to `picked_up`, the associated item's status is automatically updated to `claimed`
- This ensures the item is no longer shown as unclaimed

### Claim Creation Rules

- Cannot create a claim for an item that already has an approved or picked_up claim
- Items with status `deleted` cannot be claimed
- User must be authenticated
- Verification text is required and cannot be empty

---

## Testing

Created comprehensive test suite in `/Project/tests/test_claims.py` with 20+ tests covering:

### Test Categories

1. **Create Claim Tests**
   - ✅ Successful claim creation
   - ✅ Missing required fields
   - ✅ Invalid item ID
   - ✅ Unauthenticated requests
   - ✅ Multiple claims for same item (while pending)

2. **Get Claims Tests**
   - ✅ Student sees only own claims
   - ✅ Staff sees all claims
   - ✅ Status filtering
   - ✅ Unauthenticated requests

3. **Get Claim Details Tests**
   - ✅ Owner can view own claim
   - ✅ Staff can view any claim
   - ✅ Student cannot view other's claims
   - ✅ Non-existent claim handling

4. **Update Claim Status Tests**
   - ✅ Approve claim
   - ✅ Reject claim
   - ✅ Mark as picked up (updates item status)
   - ✅ Only one approved claim per item
   - ✅ Cannot modify picked_up claims
   - ✅ Students cannot update status
   - ✅ Invalid status values
   - ✅ Non-existent claim handling

### Running Tests

```bash
cd Project
source venv/bin/activate
pytest tests/test_claims.py -v
```

---

## Database Integration

The claims table integrates seamlessly with existing tables:

### Foreign Key Relationships

1. **items table**: `item_id` references `items.item_id`
   - Links claim to the specific item
   - Used in JOIN queries for item details

2. **users table**: Multiple relationships
   - `claimant_user_id` → user who created the claim
   - `processed_by_staff_id` → staff who processed the claim

### Database Initialization

The claims table is created automatically when the backend starts via the `init_db()` function in `app.py`.

---

## Security & Access Control

### Authentication Required

All claim endpoints require authentication via session management.

### Role-Based Access Control (RBAC)

**Students Can:**
- Create claims for items
- View their own claims
- View details of their own claims

**Students Cannot:**
- Update claim status
- View other students' claims

**Staff Can:**
- Create claims for items
- View all claims
- View details of any claim
- Update claim status (approve/reject/pickup)
- Add staff notes to claims

---

## Example Workflow

### Scenario: Student Claims a Lost Item

1. **Student submits claim:**
   ```bash
   POST /api/claims
   {
     "item_id": 1,
     "verification_text": "Black wallet with my student ID #12345678",
     "phone": "519-555-0123"
   }
   ```
   - Status: `pending`

2. **Staff reviews claim:**
   ```bash
   GET /api/claims?status=pending
   ```
   - Staff sees all pending claims

3. **Staff gets claim details:**
   ```bash
   GET /api/claims/1
   ```
   - Reviews verification text and item details

4. **Staff approves claim:**
   ```bash
   PATCH /api/claims/1
   {
     "status": "approved",
     "staff_notes": "Verified student ID matches"
   }
   ```
   - Status: `approved`

5. **Student picks up item, staff marks as picked up:**
   ```bash
   PATCH /api/claims/1
   {
     "status": "picked_up"
   }
   ```
   - Status: `picked_up`
   - Item status: `claimed`

---

## Files Modified

1. **`/Project/src/app.py`**
   - Added claims table to `init_db()`
   - Added 4 new API endpoints for claims
   - Updated API version to 3.0.0
   - Updated root endpoint documentation

2. **`/Project/tests/test_claims.py`** (NEW)
   - Comprehensive test suite with 20+ tests
   - Tests all endpoints and business logic

3. **`/Project/docs/sprint3_claiming_system_backend.md`** (NEW)
   - This documentation file

---

## API Version Update

- **Previous Version:** 2.0.0 (Sprint 2)
- **New Version:** 3.0.0 (Sprint 3)
- **Sprint Label:** Sprint 3

---

## Next Steps (Future Sprints)

1. **Issue #36:** Create Item Claiming UI (Front-End)
   - Student interface to submit claims
   - View claim status

2. **Issue #37:** Staff Claiming Management UI (Front-End)
   - Staff dashboard to review claims
   - Approve/reject/pickup interface

3. **Enhancements:**
   - Email notifications for claim status updates
   - Claim deadline/expiration
   - Image upload for verification
   - Claim history tracking

---

## Testing the Backend

### 1. Start the Backend

```bash
cd Project/src
python3 app.py
```

Backend runs on `http://localhost:5001`

### 2. Test with curl

**Login:**
```bash
curl -X POST http://localhost:5001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@uwaterloo.ca","password":"student123"}' \
  -c cookies.txt
```

**Create Claim:**
```bash
curl -X POST http://localhost:5001/api/claims \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"item_id":1,"verification_text":"This is my wallet with ID inside"}'
```

**Get Claims:**
```bash
curl -X GET http://localhost:5001/api/claims \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

**Update Claim (as staff):**
```bash
# Login as staff first
curl -X POST http://localhost:5001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@uwaterloo.ca","password":"admin123"}' \
  -c cookies.txt

curl -X PATCH http://localhost:5001/api/claims/1 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"status":"approved","staff_notes":"Verified"}'
```

---

## Acceptance Criteria

✅ **Can create claims** - Students and staff can submit claims for items  
✅ **View claims** - List claims with filters by status, item, and user  
✅ **Update status** - Staff can approve, reject, and mark claims as picked up  
✅ **Enforce rules** - Only one approved claim per item, valid status transitions  
✅ **Role-based access** - Students see only their claims, staff see all  
✅ **Item status update** - Item status changes to 'claimed' on pickup  
✅ **Comprehensive tests** - 20+ tests covering all scenarios  
✅ **Documentation** - Complete API documentation and testing guide

---

## Issue Status

**Issue #35: Create Item Claiming System (Backend)** - ✅ **COMPLETE**

All tasks completed:
- ✅ Added claims table with all required fields
- ✅ Implemented claim creation endpoint
- ✅ Implemented GET /claims with filters
- ✅ Implemented GET /claims/:id for details
- ✅ Implemented PATCH /claims/:id for status updates
- ✅ Enforced valid status transitions
- ✅ Enforced one approved claim per item rule
- ✅ Item status update on pickup
- ✅ Comprehensive testing
- ✅ Complete documentation

---

**Ready for merge and continuation to Sprint 3 Issue #36 (Frontend)**

