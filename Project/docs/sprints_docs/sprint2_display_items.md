# Sprint 2, Part 2: Create Display of Lost Items

**Sprint:** 2, Part 2  
**Issue:** #28 - Create Display of Lost Items  
**Status:** ✅ Completed  
**Date:** November 2025  
**Team:** Ruhani, Sheehan, Aidan, Neng, Theni

---

## Overview

This sprint implements the display of lost items from the database on the "Lost Items" page. The page is accessible to authenticated students and staff, displaying comprehensive item information including images, descriptions, categories, pickup locations, dates, and status. Item filtering will be implemented in a future sprint.

---

## Objectives Completed

✅ **Create backend API endpoint to retrieve lost items**
- `GET /api/items` endpoint implemented
- Returns all items with complete information
- Excludes deleted items from results

✅ **Display items on the frontend "Lost Items" page**
- LostItemsPage updated to fetch and display items
- ItemCard component created for individual item display
- Responsive grid layout for item cards

✅ **Show comprehensive item information**
- Item image (with fallback for missing images)
- Description
- Category/type
- Pickup location (SLC, PAC, CIF)
- Date found (formatted)
- Status (unclaimed/claimed) with visual badges
- Location found
- Desk information

✅ **Ensure only authenticated students and staff can access**
- Backend endpoint requires authentication (`@require_auth`)
- Frontend checks authentication before rendering
- Redirects to login if not authenticated

✅ **Implement proper error handling**
- Loading states while fetching data
- Empty state when no items exist
- Error handling for API failures
- Retry functionality on errors

---

## Implementation Details

### Database Schema

Added Items table to the database:

```sql
CREATE TABLE IF NOT EXISTS items (
    item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT,
    category TEXT NOT NULL,
    location_found TEXT NOT NULL,
    pickup_at TEXT NOT NULL CHECK(pickup_at IN ('SLC', 'PAC', 'CIF')),
    date_found TIMESTAMP NOT NULL,
    status TEXT NOT NULL DEFAULT 'unclaimed' CHECK(status IN ('unclaimed', 'claimed', 'deleted')),
    image_url TEXT,
    found_by_desk TEXT NOT NULL,
    created_by_user_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by_user_id) REFERENCES users(user_id)
)
```

**Key Fields:**
- `item_id`: Unique identifier
- `description`: Text description of the item
- `category`: Item category (electronics, clothing, cards, etc.)
- `location_found`: Physical location where item was found
- `pickup_at`: Desk location (SLC, PAC, or CIF)
- `date_found`: When the item was found
- `status`: unclaimed, claimed, or deleted
- `image_url`: URL/path to item photo
- `found_by_desk`: Which desk received the item

### Backend API Endpoint

#### GET `/api/items`

Retrieves all lost items from the database (excluding deleted items).

**Authentication:** Required (students and staff)

**Response (200):**
```json
{
  "items": [
    {
      "item_id": 1,
      "description": "Lost wallet",
      "category": "cards",
      "location_found": "Library",
      "pickup_at": "SLC",
      "date_found": "2025-11-20 10:00:00",
      "status": "unclaimed",
      "image_url": "https://example.com/wallet.jpg",
      "found_by_desk": "SLC",
      "created_at": "2025-11-20 10:00:00"
    }
  ],
  "count": 1
}
```

**Error Responses:**
- `401`: Not authenticated
- `500`: Database error

**Features:**
- Excludes deleted items (status = 'deleted')
- Orders by date_found DESC (newest first)
- Returns all item fields

### Frontend Implementation

#### API Service (`services/api.js`)

Created centralized API service using Axios:
- Base URL configuration
- Automatic credential handling (cookies for sessions)
- Error interceptors for 401 redirects
- `itemsAPI.getAllItems()` function

#### ItemCard Component (`components/ItemCard.jsx`)

Reusable component for displaying individual items:
- Item image with fallback for missing images
- Category header
- Status badge (Available/Claimed)
- Description
- Details: location found, pickup location, date found, desk
- Responsive design
- Hover effects

#### LostItemsPage Updates

**Features:**
- Authentication check on mount
- Fetches items from API on load
- Loading spinner while fetching
- Empty state when no items
- Error state with retry button
- Grid layout for item cards
- Responsive design

**State Management:**
- `items`: Array of items from API
- `loading`: Loading state
- `error`: Error message if fetch fails
- `isAuthenticated`: Authentication status

---

## User Flow

### Authenticated User Flow

```
┌─────────┐
│  User   │
│(Student │
│or Staff)│
└────┬────┘
     │
     │ 1. Navigate to /lost-items
     ▼
┌─────────────────┐
│ LostItemsPage   │
└────┬────────────┘
     │
     │ 2. Check authentication
     ▼
┌─────────────────┐
│ Auth Check      │
│ (verify-session)│
└────┬────────────┘
     │
     │ 3a. If authenticated: Fetch items
     │ 3b. If not: Redirect to /login
     ▼
┌─────────────────┐
│ GET /api/items  │
│ (Backend)       │
└────┬────────────┘
     │
     │ 4. Query database
     ▼
┌─────────────────┐
│   Database      │
│   (SQLite)      │
└────┬────────────┘
     │
     │ 5. Return items
     ▼
┌─────────────────┐
│ Display Items   │
│ (ItemCard grid) │
└────┬────────────┘
     │
     │ 6. User views items
     ▼
┌─────────┐
│  User   │ (Viewing items)
└─────────┘
```

### Unauthenticated User Flow

```
┌─────────┐
│  User   │
└────┬────┘
     │
     │ 1. Navigate to /lost-items
     ▼
┌─────────────────┐
│ LostItemsPage   │
└────┬────────────┘
     │
     │ 2. Check authentication
     ▼
┌─────────────────┐
│ Auth Check      │
│ (verify-session)│
└────┬────────────┘
     │
     │ 3. Not authenticated
     ▼
┌─────────────────┐
│ Redirect to     │
│ /login          │
└─────────────────┘
```

---

## Component Structure

### ItemCard Component

**Props:**
- `item`: Object containing item data

**Displays:**
- Item image (or placeholder)
- Category
- Status badge
- Description
- Location found
- Pickup location
- Date found
- Desk information

**Styling:**
- Card-based layout
- Hover effects
- Responsive design
- Status color coding (green for available, red for claimed)

### LostItemsPage Component

**Features:**
- Authentication verification
- API data fetching
- Loading state management
- Empty state handling
- Error handling with retry
- Grid layout for items

**States:**
- Loading: Shows spinner
- Error: Shows error message and retry button
- Empty: Shows "No items found" message
- Success: Displays item grid

---

## API Integration

### Frontend to Backend Communication

**Request Flow:**
1. Frontend calls `itemsAPI.getAllItems()`
2. Axios sends GET request to `/api/items`
3. Vite proxy forwards to `http://localhost:5000/api/items`
4. Backend validates authentication
5. Backend queries database
6. Backend returns JSON response
7. Frontend updates state and renders items

**Error Handling:**
- 401 Unauthorized: Redirects to login
- 500 Server Error: Shows error message with retry
- Network Error: Shows error message with retry

---

## Testing

### Test Coverage

Comprehensive test suite in `tests/test_items.py` covering:

✅ **Authentication Tests**
- Endpoint requires authentication
- Unauthenticated requests return 401

✅ **Items Retrieval Tests**
- Students can retrieve items
- Staff can retrieve items
- Items have all required fields
- Items ordered by date_found DESC

✅ **Data Filtering Tests**
- Deleted items are excluded
- Only active items (unclaimed/claimed) are returned

✅ **Empty State Tests**
- Empty database returns empty array
- Count is correct

✅ **Error Handling Tests**
- Database errors handled gracefully

### Running Tests

```bash
# Run items API tests
pytest tests/test_items.py -v

# Run all Sprint 2 tests
pytest tests/test_auth_sprint2.py tests/test_items.py -v
```

---

## Acceptance Criteria Status

✅ **Students can view the Lost Items page when authenticated**
- Authentication check implemented
- Students can access page after login
- Items are displayed correctly

✅ **Staff can view the Lost Items page when authenticated**
- Staff authentication works
- Staff can access page after login
- Items are displayed correctly

✅ **All items from the database are displayed on the page**
- API endpoint returns all non-deleted items
- Frontend displays all returned items
- No items are filtered out (filtering in future sprint)

✅ **Each item shows: image, description, category, pickup location, date found, status**
- ItemCard component displays all required fields
- Image with fallback for missing images
- All information formatted and displayed clearly

✅ **Page shows loading state while fetching items**
- Loading spinner displayed during API call
- Loading state prevents premature rendering

✅ **Page shows appropriate message when no items exist**
- Empty state component with icon and message
- User-friendly "No Lost Items Found" message

✅ **Unauthenticated users cannot access the page**
- Backend endpoint requires authentication
- Frontend redirects to login if not authenticated
- 401 errors handled properly

✅ **API endpoint returns items in a structured format**
- JSON response with items array and count
- All item fields included
- Consistent data structure

✅ **Frontend handles API errors gracefully**
- Error state displayed on failure
- Retry button allows user to try again
- Clear error messages

---

## Deliverables Completed

✅ **Backend API endpoint for retrieving lost items**
- `GET /api/items` endpoint implemented
- Authentication required
- Returns structured JSON response

✅ **Frontend component displaying items in a user-friendly format**
- ItemCard component created
- LostItemsPage updated
- Responsive grid layout

✅ **Item cards/list showing all required information**
- Image, description, category displayed
- Pickup location, date found, status shown
- All fields from database included

✅ **Loading and empty states**
- Loading spinner during fetch
- Empty state with message
- Error state with retry

✅ **Error handling for API failures**
- Try-catch blocks in frontend
- Error messages displayed
- Retry functionality

✅ **Authentication check for page access**
- Backend `@require_auth` decorator
- Frontend authentication verification
- Redirect to login if not authenticated

✅ **Documentation for the items API endpoint**
- This comprehensive documentation
- API endpoint documentation
- Component documentation
- Testing instructions

---

## File Changes

### Modified Files

- `Project/src/app.py`
  - Added Items table to database schema
  - Added `GET /api/items` endpoint
  - Updated root endpoint documentation

- `Project/frontend/src/pages/LostItemsPage.jsx`
  - Updated to fetch and display items
  - Added authentication check
  - Added loading, empty, and error states

- `Project/frontend/src/pages/LostItemsPage.css`
  - Updated styles for item grid
  - Added loading, error, and empty state styles

### New Files

- `Project/frontend/src/services/api.js` - API service layer
- `Project/frontend/src/components/ItemCard.jsx` - Item display component
- `Project/frontend/src/components/ItemCard.css` - Item card styles
- `Project/tests/test_items.py` - Test suite for items endpoint
- `Project/docs/sprint2_display_items.md` - This documentation

---

## Usage Examples

### Backend: Adding Test Items

```python
# In Python shell or script
import sqlite3
from datetime import datetime

conn = sqlite3.connect('lostfound.db')
cursor = conn.cursor()

cursor.execute('''
    INSERT INTO items (description, category, location_found, pickup_at, date_found, status, found_by_desk)
    VALUES (?, ?, ?, ?, ?, ?, ?)
''', ('Lost wallet', 'cards', 'Library', 'SLC', datetime.now().isoformat(), 'unclaimed', 'SLC'))

conn.commit()
conn.close()
```

### Frontend: Using the API

```javascript
import { itemsAPI } from '../services/api'

// Fetch items
const data = await itemsAPI.getAllItems()
console.log(data.items) // Array of items
console.log(data.count) // Number of items
```

---

## Future Enhancements (Next Sprints)

1. **Item Filtering:** Filter by category, status, location, date
2. **Search Functionality:** Search items by description
3. **Pagination:** Handle large numbers of items
4. **Item Details Page:** Click item to see full details
5. **Claim Functionality:** Allow users to claim items
6. **Image Upload:** Allow staff to upload item images

---

## Conclusion

Sprint 2, Part 2 successfully implements the display of lost items on the frontend with full backend API support. All objectives have been met, all acceptance criteria satisfied, and comprehensive documentation provided. The system is ready for users to browse lost items and for future enhancements like filtering and claiming.

**Status:** ✅ **COMPLETE**

---

*Document created: November 2025*  
*Last updated: November 2025*  
*Team 15: Ruhani, Sheehan, Aidan, Neng, Theni*

