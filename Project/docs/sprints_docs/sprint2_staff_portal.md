# Sprint 2, Part 3: Create Staff Portal

**Sprint:** 2, Part 3  
**Issue:** #29 - Create Staff Portal  
**Status:** ✅ Completed  
**Date:** November 2025  
**Team:** Ruhani, Sheehan, Aidan, Neng, Theni

---

## Overview

This sprint implements a staff dashboard for the UW Lost-and-Found web application that allows staff members to add lost-and-found items to the database. The dashboard provides a user-friendly interface for staff to input comprehensive item information including images, descriptions, categories, locations, and other relevant details. The dashboard is restricted to staff members only, ensuring proper access control.

---

## Objectives Completed

✅ **Create a staff-only dashboard page accessible only to authenticated staff members**
- StaffDashboardPage component created
- Authentication check on page load
- Redirects non-staff users (students) to Lost Items page
- Redirects unauthenticated users to login

✅ **Implement a form for adding new lost-and-found items with all required fields**
- Comprehensive form with all item fields
- Category dropdown with predefined options
- Location and pickup location fields
- Date/time picker for date found
- Image URL input
- Status selection

✅ **Allow staff to upload item images**
- Image URL input field in form
- Support for external image URLs
- Image display in item cards (from previous sprint)

✅ **Enable staff to input item information**
- Description (text area)
- Category (dropdown)
- Location found (text input)
- Pickup location (SLC, PAC, CIF dropdown)
- Date found (datetime picker)
- Found by desk (text input)
- Status (dropdown, defaults to 'unclaimed')

✅ **Insert new items into the items database via backend API**
- POST /api/items endpoint created
- Staff-only access control
- Database insertion with all fields
- Returns created item with ID

✅ **Ensure proper validation of all input fields**
- Frontend validation before submission
- Backend validation for all fields
- Required field checks
- Format validation (dates, pickup locations, status)
- Clear error messages

✅ **Implement role-based access control to restrict dashboard to staff only**
- Backend endpoint requires staff role (`@require_role('staff')`)
- Frontend checks staff role before rendering
- Navigation shows Staff Dashboard link only for staff
- Students redirected if they try to access

---

## Implementation Details

### Backend API Endpoint

#### POST `/api/items`

Creates a new lost-and-found item in the database. Only accessible to authenticated staff members.

**Authentication:** Required (staff role only)

**Request Body:**
```json
{
  "description": "Lost wallet with ID cards",
  "category": "cards",
  "location_found": "Library",
  "pickup_at": "SLC",
  "date_found": "2025-11-20 10:00:00",
  "image_url": "https://example.com/wallet.jpg",
  "found_by_desk": "SLC",
  "status": "unclaimed"
}
```

**Required Fields:**
- `category`: Item category (string)
- `location_found`: Where item was found (string)
- `pickup_at`: Pickup location - must be 'SLC', 'PAC', or 'CIF' (string)
- `date_found`: Date and time item was found (ISO format string)
- `found_by_desk`: Which desk received the item (string)

**Optional Fields:**
- `description`: Item description (string, nullable)
- `image_url`: URL to item image (string, nullable)
- `status`: Item status - 'unclaimed', 'claimed', or 'deleted' (defaults to 'unclaimed')

**Response (201 Created):**
```json
{
  "message": "Item created successfully",
  "item": {
    "item_id": 1,
    "description": "Lost wallet with ID cards",
    "category": "cards",
    "location_found": "Library",
    "pickup_at": "SLC",
    "date_found": "2025-11-20 10:00:00",
    "status": "unclaimed",
    "image_url": "https://example.com/wallet.jpg",
    "found_by_desk": "SLC",
    "created_by_user_id": 1
  }
}
```

**Error Responses:**
- `400`: Missing required fields or validation error
- `401`: Not authenticated
- `403`: Not staff (insufficient privileges)
- `500`: Database error

**Validation Rules:**
- `pickup_at` must be one of: 'SLC', 'PAC', 'CIF'
- `status` must be one of: 'unclaimed', 'claimed', 'deleted'
- `date_found` must be valid ISO format datetime string
- All required fields must be provided

### Frontend Implementation

#### StaffDashboardPage Component

**Location:** `frontend/src/pages/StaffDashboardPage.jsx`

**Features:**
- Authentication check on mount
- Staff role verification
- Redirects non-staff users
- Comprehensive item creation form
- Real-time form validation
- Success/error feedback
- Form reset functionality

**Form Fields:**
1. **Category** (required, dropdown)
   - Options: electronics, clothing, cards, keys, bags, books, other

2. **Description** (optional, textarea)
   - Free-form text describing the item

3. **Image URL** (optional, text input)
   - URL to an image of the item

4. **Location Found** (required, text input)
   - Where the item was found

5. **Pickup Location** (required, dropdown)
   - Options: SLC, PAC, CIF

6. **Found By Desk** (required, text input)
   - Which desk received the item

7. **Date Found** (required, datetime-local input)
   - Date and time when item was found

8. **Status** (optional, dropdown)
   - Options: unclaimed (default), claimed

**Form Validation:**
- Required fields checked before submission
- Date format validation
- Real-time error display
- Field-level error messages

**User Feedback:**
- Success message after item creation
- Error messages for validation failures
- Loading state during submission
- Form reset after successful creation

#### Navigation Updates

**Location:** `frontend/src/components/Navigation.jsx`

**Changes:**
- Added staff role check
- Shows "Staff Dashboard" link only for authenticated staff
- Link appears in both desktop and mobile navigation
- Updates when user logs in/out

**API Integration:**
- Uses `authAPI.verifySession()` to check authentication
- Uses `authAPI.getCurrentUser()` to check role
- Re-checks on route changes

### API Service Updates

**Location:** `frontend/src/services/api.js`

**Added:**
```javascript
createItem: async (itemData) => {
  const response = await api.post('/api/items', itemData)
  return response.data
}
```

---

## User Flow

### Staff User Flow

```
┌─────────┐
│  Staff  │
│  User   │
└────┬────┘
     │
     │ 1. Login as staff
     ▼
┌─────────────────┐
│  Authenticated   │
│  (Staff Role)    │
└────┬────────────┘
     │
     │ 2. Navigate to Staff Dashboard
     │    (via Navigation link)
     ▼
┌─────────────────┐
│ StaffDashboard   │
│  Page            │
└────┬────────────┘
     │
     │ 3. Check authentication & role
     ▼
┌─────────────────┐
│  Auth Check      │
│  (Staff Only)    │
└────┬────────────┘
     │
     │ 4. Render form
     ▼
┌─────────────────┐
│  Item Form       │
│  (Fill fields)   │
└────┬────────────┘
     │
     │ 5. Submit form
     ▼
┌─────────────────┐
│  Validate Form   │
│  (Frontend)      │
└────┬────────────┘
     │
     │ 6. POST /api/items
     ▼
┌─────────────────┐
│  Backend API    │
│  (Staff Check)  │
└────┬────────────┘
     │
     │ 7. Validate & Insert
     ▼
┌─────────────────┐
│   Database      │
│   (SQLite)      │
└────┬────────────┘
     │
     │ 8. Return created item
     ▼
┌─────────────────┐
│  Success Message│
│  Form Reset     │
└─────────────────┘
```

### Student User Flow (Access Denied)

```
┌─────────┐
│ Student │
│  User   │
└────┬────┘
     │
     │ 1. Try to access /staff/dashboard
     ▼
┌─────────────────┐
│ StaffDashboard   │
│  Page            │
└────┬────────────┘
     │
     │ 2. Check authentication & role
     ▼
┌─────────────────┐
│  Auth Check      │
│  (Not Staff)     │
└────┬────────────┘
     │
     │ 3. Redirect
     ▼
┌─────────────────┐
│  Lost Items Page │
│  (Access Denied) │
└─────────────────┘
```

---

## Component Structure

### StaffDashboardPage Component

**Props:** None

**State:**
- `isAuthenticated`: Boolean - authentication status
- `isStaff`: Boolean - staff role status
- `loading`: Boolean - loading state
- `submitting`: Boolean - form submission state
- `success`: Boolean - success message state
- `error`: String - error message
- `formData`: Object - form field values
- `validationErrors`: Object - field-level validation errors

**Methods:**
- `checkAuth()`: Verify authentication and staff role
- `handleChange()`: Update form data and clear errors
- `validateForm()`: Validate all form fields
- `handleSubmit()`: Submit form to API

**Features:**
- Authentication check on mount
- Staff role verification
- Form validation
- Error handling
- Success feedback
- Form reset

---

## Testing

### Test Coverage

Comprehensive test suite in `tests/test_staff_portal.py` covering:

✅ **Authentication Tests**
- Endpoint requires authentication
- Unauthenticated requests return 401
- Students cannot access (403)
- Staff can access successfully

✅ **Item Creation Tests**
- Staff can create items with all fields
- Staff can create items with minimal required fields
- Created items have correct data
- Created items appear in items list

✅ **Validation Tests**
- Missing required fields return 400
- Invalid pickup location returns 400
- Invalid status returns 400
- Invalid date format returns 400
- Empty request body returns 400

✅ **Data Persistence Tests**
- Created items appear in GET /api/items
- Created items have correct user_id
- All fields are saved correctly

### Running Tests

```bash
# Run staff portal tests
pytest tests/test_staff_portal.py -v

# Run all Sprint 2 tests
pytest tests/test_auth_sprint2.py tests/test_items.py tests/test_staff_portal.py -v
```

---

## Acceptance Criteria Status

✅ **Staff members can access the dashboard when authenticated**
- Staff authentication check implemented
- Staff can access `/staff/dashboard` route
- Dashboard renders correctly for staff

✅ **Students cannot access the dashboard (redirected or shown error)**
- Frontend checks staff role
- Students redirected to Lost Items page
- Backend returns 403 for students

✅ **Staff can input all required item information via form**
- All required fields present in form
- Form accepts all item data
- Optional fields work correctly

✅ **Staff can upload item images**
- Image URL input field implemented
- URLs are accepted and stored
- Images display in item cards (from previous sprint)

✅ **Form validates all required fields before submission**
- Frontend validation before API call
- Backend validation for all fields
- Clear error messages for each field

✅ **New items are successfully inserted into the items database**
- POST endpoint creates items
- All fields saved correctly
- Items appear in database

✅ **Items created via dashboard appear on the Lost Items page**
- Created items returned by GET /api/items
- Items display in LostItemsPage
- All item data visible

✅ **Non-staff users (students) cannot access the dashboard**
- Frontend redirects students
- Backend returns 403 for students
- Navigation doesn't show link for students

✅ **API endpoint requires staff authentication**
- `@require_role('staff')` decorator applied
- 401 for unauthenticated
- 403 for non-staff

✅ **Form shows appropriate error messages for validation failures**
- Field-level error messages
- Required field errors
- Format validation errors
- Clear, user-friendly messages

✅ **Form shows success message after successful item creation**
- Success message displayed
- Message auto-dismisses after 5 seconds
- Form resets after success

---

## Deliverables Completed

✅ **Staff dashboard page accessible only to staff**
- StaffDashboardPage component created
- Authentication and role checks implemented
- Students redirected appropriately

✅ **Item creation form with all required fields**
- Comprehensive form with all fields
- Category, description, location, pickup, date, desk, status
- Image URL support

✅ **Image upload functionality**
- Image URL input field
- URL validation
- Support for external image URLs

✅ **Backend API endpoint for creating items (POST /api/items)**
- Endpoint created with staff-only access
- Full validation
- Database insertion
- Returns created item

✅ **Form validation (frontend and backend)**
- Frontend validation before submission
- Backend validation for all fields
- Required field checks
- Format validation

✅ **Error handling and user feedback**
- Success messages
- Error messages
- Loading states
- Field-level validation errors

✅ **Role-based access control (staff only)**
- Backend `@require_role('staff')` decorator
- Frontend staff role check
- Navigation link only for staff
- Students redirected

✅ **Documentation for staff portal and item creation API**
- This comprehensive documentation
- API endpoint documentation
- Component documentation
- Testing instructions

---

## File Changes

### Modified Files

- `Project/src/app.py`
  - Added `POST /api/items` endpoint
  - Added staff-only access control
  - Added comprehensive validation
  - Updated root endpoint documentation

- `Project/frontend/src/services/api.js`
  - Added `createItem()` function

- `Project/frontend/src/App.jsx`
  - Added `/staff/dashboard` route
  - Imported StaffDashboardPage component

- `Project/frontend/src/components/Navigation.jsx`
  - Added staff role check
  - Added Staff Dashboard link (staff only)
  - Updated to check role on route changes

### New Files

- `Project/frontend/src/pages/StaffDashboardPage.jsx` - Staff dashboard component
- `Project/frontend/src/pages/StaffDashboardPage.css` - Staff dashboard styles
- `Project/tests/test_staff_portal.py` - Test suite for staff portal
- `Project/docs/sprint2_staff_portal.md` - This documentation

---

## Usage Examples

### Backend: Creating an Item via API

```python
import requests

# Login as staff
login_response = requests.post('http://localhost:5000/auth/login', json={
    'email': 'staff@uwaterloo.ca',
    'password': 'password123'
}, cookies=login_response.cookies)

# Create item
item_data = {
    'category': 'electronics',
    'description': 'Lost laptop charger',
    'location_found': 'Library',
    'pickup_at': 'SLC',
    'date_found': '2025-11-20 10:00:00',
    'found_by_desk': 'SLC',
    'image_url': 'https://example.com/charger.jpg'
}

response = requests.post('http://localhost:5000/api/items',
                        json=item_data,
                        cookies=login_response.cookies)
print(response.json())
```

### Frontend: Using the API Service

```javascript
import { itemsAPI } from '../services/api'

// Create item
const itemData = {
  category: 'electronics',
  description: 'Lost laptop charger',
  location_found: 'Library',
  pickup_at: 'SLC',
  date_found: new Date().toISOString().replace('T', ' ').substring(0, 19),
  found_by_desk: 'SLC',
  image_url: 'https://example.com/charger.jpg'
}

try {
  const result = await itemsAPI.createItem(itemData)
  console.log('Item created:', result.item)
} catch (error) {
  console.error('Error creating item:', error)
}
```

---

## Future Enhancements (Next Sprints)

1. **File Upload:** Direct image file upload instead of URL input
2. **Image Storage:** Store images on server or cloud storage
3. **Bulk Import:** Allow staff to import multiple items at once
4. **Item Editing:** Allow staff to edit existing items
5. **Item Deletion:** Soft delete items (mark as deleted)
6. **Item Search:** Search items in dashboard
7. **Item Statistics:** Dashboard showing item statistics
8. **Image Preview:** Preview image before submission

---

## Conclusion

Sprint 2, Part 3 successfully implements the staff portal with a comprehensive dashboard for adding lost-and-found items. All objectives have been met, all acceptance criteria satisfied, and comprehensive documentation provided. The system is ready for staff to add items to the database, which will then appear on the Lost Items page for students and staff to view.

**Status:** ✅ **COMPLETE**

---

*Document created: November 2025*  
*Last updated: November 2025*  
*Team 15: Ruhani, Sheehan, Aidan, Neng, Theni*

