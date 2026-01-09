# Sprint 4: Archived Items Page (Issue #40)

**Issue:** #40  
**Type:** Feature  
**Priority:** High  
**Sprint:** 4  
**Author:** Team 15 (Ruhani, Sheehan, Aidan, Neng, Theni)  
**Date:** November 29, 2025

## Overview

Implements a staff-only "Archived Items" page that displays all items that have been successfully picked up by their claimants. This provides staff with a complete history of resolved items and allows them to view claimant details, verification information, and pickup timestamps.

## Features Implemented

### 1. Archived Items Page
- **Staff-Only Access:** Accessible only to authenticated staff members
- **Comprehensive View:** Shows all picked-up items with full details
- **Search Functionality:** Search by item, claimant name, or email
- **Filters:**
  - Category filter (8 categories)
  - Location filter (8 locations)
  - Sort by: Most Recent, Oldest, Category, Location
- **Pagination:** 12 items per page with smart navigation
- **Stats Cards:** Display total archived items and current filtered count

### 2. Item Details Modal
- **Click to View:** Click any archived item card to see full details
- **Item Information:**
  - Category, description
  - Location found, pickup location
  - Date found, found by desk
  - Item image (if available)
- **Claimant Information:**
  - Name, email, phone
  - Verification details they provided
- **Pickup Information:**
  - Claim submitted date
  - Pickup date
  - Staff member who processed it
  - Staff notes

### 3. Navigation Integration
- **Staff Navigation:** Added "Archived Items" link to staff navigation menu
- **Desktop & Mobile:** Available in both navigation layouts
- **Staff Dashboard:** Added green "Archived Items" card with quick link

## Files Created/Modified

### New Files

1. **`ArchivedItemsPage.jsx`**
   - Main component for archived items view
   - Search, filter, sort, pagination logic
   - Details modal implementation
   - State management for filters and pagination
   - Auth checks and role validation

2. **`ArchivedItemsPage.css`**
   - Comprehensive styling for archived items page
   - Grid layout for item cards
   - Modal styling for details view
   - Responsive design (mobile/tablet/desktop)
   - Smooth animations and transitions
   - Stats cards, filter section styling

### Modified Files

3. **`App.jsx`**
   - Added import for `ArchivedItemsPage`
   - Added route: `/staff/archived`

4. **`Navigation.jsx`**
   - Added "Archived Items" link for staff (desktop)
   - Added "Archived Items" link for staff (mobile)

5. **`StaffDashboardPage.jsx`**
   - Replaced single banner with `quick-links-grid`
   - Two cards: "Manage Claims" (blue) and "Archived Items" (green)
   - Better visual hierarchy

6. **`StaffDashboardPage.css`**
   - Added `.quick-links-grid` styling
   - Two-card layout with responsive grid
   - Animated top borders (gold for claims, green for archived)
   - Hover effects and transitions

7. **`api.js`**
   - Already has `getArchivedItems()` function (added in previous commit)

## Backend Integration

### API Endpoint Used

**GET /api/items/archived**
- Staff-only endpoint
- Returns picked-up items with claim details
- Response format:

```json
{
  "archived_items": [
    {
      "item_id": 1,
      "description": "Black backpack",
      "category": "bags",
      "location_found": "SLC",
      "pickup_at": "SLC",
      "date_found": "2025-11-20T10:00:00",
      "image_url": "...",
      "found_by_desk": "SLC Desk",
      "item_created_at": "2025-11-20T10:05:00",
      "claim": {
        "claim_id": 5,
        "claimant_name": "John Doe",
        "claimant_email": "jdoe@uwaterloo.ca",
        "claimant_phone": "519-555-0123",
        "verification_text": "It's my backpack with laptop inside...",
        "status": "picked_up",
        "staff_notes": "Student showed ID, verified ownership",
        "created_at": "2025-11-21T09:00:00",
        "updated_at": "2025-11-22T14:30:00",
        "processed_by_staff_id": 1,
        "processed_by_staff_name": "Admin User"
      }
    }
  ],
  "total_count": 42
}
```

## User Workflows

### Staff View Archived Items
1. Staff logs in
2. Clicks "Archived Items" in navigation OR clicks green card on dashboard
3. Page loads showing all picked-up items
4. Staff can search, filter, and sort
5. Click any item to see full details
6. Modal shows complete item + claim + pickup information

### Staff Search for Specific Pickup
1. Navigate to Archived Items page
2. Enter search query (e.g., claimant name or email)
3. Apply category/location filters if needed
4. Results update instantly
5. Click item to verify details

### Staff Review Pickup History
1. Navigate to Archived Items
2. Sort by "Most Recent" to see latest pickups
3. View stats card showing total archived items
4. Use pagination to browse through history

## Component Architecture

```
ArchivedItemsPage
├── Page Header
│   ├── Title & Subtitle
│   └── Stats Cards (Total Archived, Showing)
├── Filters Section
│   ├── Search Bar
│   └── Filter Controls (Category, Location, Sort, Clear)
├── Archived Items Grid
│   └── Archived Item Cards (12 per page)
│       ├── Image (optional)
│       ├── Category Badge
│       ├── Pickup Badge
│       ├── Description
│       ├── Item Details (Found at, Claimed by, Picked up)
│       └── View Details Button
├── Pagination Controls
│   ├── Previous/Next Buttons
│   └── Page Numbers
└── Details Modal (conditionally rendered)
    ├── Modal Header (Title, Close Button)
    ├── Modal Body
    │   ├── Item Image
    │   ├── Item Information Section
    │   ├── Claimant Information Section
    │   └── Pickup Information Section
    └── Modal Footer (Close Button)
```

## State Management

```javascript
const [archivedItems, setArchivedItems] = useState([])       // All archived items from API
const [filteredItems, setFilteredItems] = useState([])       // After search/filter applied
const [loading, setLoading] = useState(true)
const [error, setError] = useState('')

// Filters
const [searchQuery, setSearchQuery] = useState('')
const [categoryFilter, setCategoryFilter] = useState('')
const [locationFilter, setLocationFilter] = useState('')
const [sortBy, setSortBy] = useState('recent')

// Pagination
const [currentPage, setCurrentPage] = useState(1)
const itemsPerPage = 12

// Modal
const [selectedItem, setSelectedItem] = useState(null)
const [isModalOpen, setIsModalOpen] = useState(false)
```

## Design Features

### Visual Design
- **Green Theme:** Green gradient for archived/completed items
- **Stats Cards:** Blue gradient cards showing counts
- **Card Grid:** Responsive grid (3-4 columns desktop, 1 column mobile)
- **Staggered Animations:** Cards fade in sequentially
- **Smooth Transitions:** All interactions have 0.3s transitions

### Accessibility
- **ARIA Attributes:** Modal has `aria-modal="true"` and `role="dialog"`
- **Keyboard Navigation:** All interactive elements accessible via keyboard
- **Focus Management:** Clear focus states
- **Screen Reader Support:** Semantic HTML structure

### Responsive Breakpoints
- **Desktop (>1024px):** Multi-column grid, all features visible
- **Tablet (768-1024px):** 2-column grid, compact layout
- **Mobile (<768px):** Single column, stacked filters, full-width buttons

## User Experience Enhancements

1. **Search as You Type:** Results filter instantly
2. **Visual Feedback:** Hover effects, animations, transitions
3. **Clear Filters:** One-click reset of all filters
4. **Loading States:** Only show spinner on initial load
5. **Empty States:** Different messages for no items vs. no filtered results
6. **Modal Details:** Full information in overlay modal
7. **Body Scroll Lock:** Page doesn't scroll when modal open
8. **Stats Visibility:** Always see total archived count

## Testing Checklist

### Functionality
- [x] Page loads archived items correctly
- [x] Staff-only access enforced
- [x] Search works across all fields
- [x] Category filter works
- [x] Location filter works
- [x] Sort options work (recent, oldest, category, location)
- [x] Pagination works correctly
- [x] Clear filters resets all filters
- [x] Details modal opens on card click
- [x] Modal shows all information
- [x] Modal closes properly

### UI/UX
- [x] Stats cards display correct counts
- [x] Cards animate in smoothly
- [x] Hover effects work
- [x] Responsive on mobile/tablet/desktop
- [x] Loading state appears only on initial load
- [x] Empty state shows appropriate message
- [x] Error handling works
- [x] Modal scrolls if content is long

### Integration
- [x] Navigation link works
- [x] Dashboard quick link works
- [x] API integration working
- [x] Auth checks prevent unauthorized access
- [x] No linting errors

## Performance Considerations

- **Client-Side Filtering:** Fast, no server round-trips
- **Pagination:** Reduces DOM elements, better performance
- **CSS Animations:** GPU-accelerated, smooth 60fps
- **Lazy Modal:** Only mounts when open
- **Memoization:** Can add useCallback/useMemo if needed

## Security

- **Staff-Only Access:** Backend enforces role check (403 if not staff)
- **Session Validation:** Requires valid authenticated session
- **No Sensitive Data Exposure:** Only shows what staff should see
- **Proper Error Handling:** Doesn't leak system information

## Future Enhancements

1. **Export Archived Items:** Download as CSV/PDF
2. **Date Range Filter:** Filter by pickup date range
3. **Restore Items:** Unarchive items if needed
4. **Statistics:** Charts showing pickup trends over time
5. **Bulk Actions:** Archive multiple items at once
6. **Notes Editing:** Edit staff notes on archived items
7. **Email Claimants:** Send follow-up emails from archive

## Known Issues

None at this time.

## Acceptance Criteria

- ✅ New "Archived" tab in staff portal (navigation + dashboard card)
- ✅ Fetches archived/picked-up items from backend
- ✅ Sort and filter by date, category, location
- ✅ Accessible only to staff (403 for students)
- ✅ Includes pagination (12 items per page)
- ✅ Page loads archived items correctly
- ✅ Allows proper staff filtering

## Conclusion

Sprint 4 Issue #40 is **complete**. The Archived Items page provides staff with a comprehensive view of all picked-up items, complete search and filtering capabilities, and detailed claimant information. The feature integrates seamlessly with the existing system and provides valuable historical data tracking.

**Status:** ✅ Complete and Ready for Testing


