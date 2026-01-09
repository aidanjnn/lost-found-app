# Sprint 3: Search and Filtering UI (Frontend)

**Issue:** #39  
**Type:** Feature  
**Priority:** High  
**Sprint:** 3  
**Author:** Team 15 (Ruhani, Sheehan, Aidan, Neng, Theni)  
**Date:** November 27, 2025

## Overview

Implements a comprehensive search and filtering UI for the UW Lost-and-Found application. Students and staff can now search, filter, sort, and paginate through lost items using a beautiful and intuitive interface that integrates with the backend API (Issue #38).

## Features Implemented

### 1. Search Bar
- **Text Search:** Real-time search across item descriptions, categories, and locations
- **Clear Button:** Quickly clear the search query
- **Visual Feedback:** Search icon and clear functionality
- **Responsive:** Adapts to mobile and desktop screens

### 2. Advanced Filters Panel
- **Expandable Design:** Filters panel can be toggled on/off to save screen space
- **Active Filter Count:** Badge showing number of active filters
- **Filter Categories:**
  - **Category:** Electronics, Clothing, Cards/IDs, Keys, Bags, Books, Bottles, Other
  - **Location:** SLC, PAC, CIF, Library, DC, MC, E7, QNC
  - **Status:** Available (unclaimed), Claimed
  - **Sort:** Most Recent (default), Oldest First

### 3. Active Filters Display
- **Visual Tags:** Each active filter shown as a colored tag
- **Clear All:** Button to reset all filters at once
- **Transparency:** Users can always see what filters are applied

### 4. Pagination Controls
- **Page Navigation:** Previous/Next buttons and numbered page buttons
- **Smart Page Numbers:** Shows first, last, current, and nearby pages with ellipsis
- **Results Count:** Displays "Showing X-Y of Z items"
- **Smooth Scrolling:** Auto-scroll to top when changing pages
- **Responsive:** Adapts layout for mobile devices

### 5. Results Display
- **Item Count:** Shows total number of items found
- **Empty States:** Different messages for "no items" vs "no results matching filters"
- **Loading States:** Spinner animation while fetching data
- **Error Handling:** Retry button and clear error messages

### 6. User Experience Enhancements
- **Instant Feedback:** Filters apply immediately (resets to page 1)
- **Visual Polish:** Modern UI with shadows, transitions, and hover effects
- **Accessibility:** Proper ARIA labels and keyboard navigation
- **Mobile-First:** Fully responsive design for all screen sizes

## Files Created/Modified

### New Components

1. **`SearchFilters.jsx`**
   - Reusable search and filter component
   - Props: `onFiltersChange`, `initialFilters`
   - State: `filters`, `isExpanded`
   - Methods: `handleSearchChange`, `handleFilterChange`, `handleClearFilters`

2. **`SearchFilters.css`**
   - Comprehensive styling for search and filter UI
   - Responsive breakpoints for mobile/tablet/desktop
   - Animations and transitions for smooth UX

3. **`Pagination.jsx`**
   - Reusable pagination component
   - Props: `currentPage`, `totalPages`, `totalCount`, `pageSize`, `onPageChange`
   - Smart page number generation algorithm
   - Prev/Next navigation

4. **`Pagination.css`**
   - Clean, modern pagination styling
   - Responsive layout adaptations
   - Active page highlighting

### Updated Files

5. **`StudentDashboardPage.jsx`**
   - Integrated `SearchFilters` and `Pagination` components
   - Added state for filters, pagination data
   - Dynamic API calls based on filter changes
   - Auto-reset to page 1 when filters change

6. **`StudentDashboardPage.css`**
   - Added `results-summary` styling
   - Updated sprint header comment

7. **`LostItemsPage.jsx`**
   - Integrated same search/filter/pagination functionality
   - Consistent UX across all item listing pages

8. **`LostItemsPage.css`**
   - Added `results-summary` styling
   - Updated sprint header comment

9. **`api.js`**
   - Added `getItems(queryString)` function
   - Supports full query string for search, filter, sort, pagination
   - Maintains backward compatibility with `getAllItems()`

## API Integration

### Query Parameters Sent to Backend

The frontend builds query strings with the following parameters:

| Parameter | Description | Example |
|-----------|-------------|---------|
| `q` | Text search query | `q=backpack` |
| `category` | Filter by category | `category=electronics` |
| `location` | Filter by location | `location=SLC` |
| `status` | Filter by status | `status=unclaimed` |
| `sort_by` | Field to sort by | `sort_by=date_found` |
| `order` | Sort order | `order=desc` or `order=asc` |
| `page` | Page number | `page=1` |
| `page_size` | Items per page | `page_size=12` |

### Example API Call

```javascript
const params = new URLSearchParams()
params.append('q', 'wallet')
params.append('category', 'cards')
params.append('status', 'unclaimed')
params.append('sort_by', 'date_found')
params.append('order', 'desc')
params.append('page', 1)
params.append('page_size', 12)

const data = await itemsAPI.getItems(params.toString())
// Calls: GET /api/items?q=wallet&category=cards&status=unclaimed&sort_by=date_found&order=desc&page=1&page_size=12
```

### Backend Response Format

```json
{
  "items": [
    {
      "item_id": 1,
      "description": "Black wallet with ID",
      "category": "cards",
      "location_found": "SLC",
      "pickup_at": "SLC",
      "date_found": "2025-11-20T10:30:00",
      "status": "unclaimed",
      "image_url": null,
      "found_by_desk": "SLC Desk",
      "created_at": "2025-11-20T10:35:00"
    }
  ],
  "total_count": 42,
  "total_pages": 4,
  "current_page": 1,
  "page_size": 12
}
```

## Component Architecture

```
StudentDashboardPage / LostItemsPage
├── SearchFilters
│   ├── Search Input
│   ├── Toggle Filters Button
│   └── Filters Panel (expandable)
│       ├── Category Dropdown
│       ├── Location Dropdown
│       ├── Status Dropdown
│       ├── Sort Dropdown
│       └── Active Filters Display
├── Results Summary
├── Items Grid (ItemCard components)
└── Pagination
    ├── Results Info
    ├── Previous Button
    ├── Page Numbers
    └── Next Button
```

## State Management

### StudentDashboardPage / LostItemsPage State

```javascript
const [items, setItems] = useState([])
const [totalCount, setTotalCount] = useState(0)
const [totalPages, setTotalPages] = useState(0)
const [pageSize, setPageSize] = useState(12)
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)
const [currentPage, setCurrentPage] = useState(1)
const [filters, setFilters] = useState({
  search: '',
  category: '',
  location: '',
  status: '',
  sort: 'recent'
})
```

### SearchFilters State

```javascript
const [filters, setFilters] = useState({
  search: initialFilters.search || '',
  category: initialFilters.category || '',
  location: initialFilters.location || '',
  status: initialFilters.status || '',
  sort: initialFilters.sort || 'recent'
})
const [isExpanded, setIsExpanded] = useState(false)
```

## User Workflows

### 1. Search for an Item
1. User enters search text in the search bar
2. SearchFilters component updates `filters.search`
3. Parent component receives filter change via `onFiltersChange`
4. Page resets to 1 (useEffect hook)
5. API call with `?q=search_text`
6. Results displayed in items grid

### 2. Apply Multiple Filters
1. User clicks "Filters" button to expand filter panel
2. User selects category, location, and status
3. Active filters shown as tags below dropdowns
4. Results update automatically
5. User can clear individual filters or all at once

### 3. Navigate Pagination
1. User clicks page number or Next/Previous
2. `handlePageChange` updates `currentPage`
3. API call with new `page` parameter
4. Page scrolls smoothly to top
5. New results displayed

### 4. Clear All Filters
1. User clicks "Clear All Filters" button
2. All filter state reset to defaults
3. Search bar cleared
4. Page resets to 1
5. All items shown (no filters applied)

## Responsive Design

### Mobile (< 768px)
- Search bar and filters button stack vertically
- Full-width buttons
- Filters panel in single column
- Pagination controls stack: page numbers on top, prev/next on bottom
- Items grid switches to single column

### Tablet (768px - 1024px)
- 2-column filters grid
- 2-column items grid
- Compact pagination with limited page numbers

### Desktop (> 1024px)
- 4-column filters grid
- 3-4 column items grid (responsive to container width)
- Full pagination with all page numbers visible

## Accessibility Features

- **ARIA Labels:** All buttons have descriptive `aria-label` attributes
- **Keyboard Navigation:** All interactive elements accessible via keyboard
- **Focus States:** Clear visual focus indicators
- **Screen Reader Support:** Proper semantic HTML structure
- **Color Contrast:** Meets WCAG AA standards
- **Error Messages:** Clear and descriptive for assistive technologies

## Testing Checklist

### Search Functionality
- [x] Search by description
- [x] Search by category
- [x] Search by location
- [x] Case-insensitive search
- [x] Clear search button works
- [x] Empty search shows all items

### Filter Functionality
- [x] Category filter works
- [x] Location filter works
- [x] Status filter works
- [x] Multiple filters can be combined
- [x] Clear all filters resets to default state
- [x] Active filters display correctly

### Sort Functionality
- [x] Sort by most recent (default)
- [x] Sort by oldest first
- [x] Sort persists across page changes

### Pagination
- [x] Page numbers display correctly
- [x] Previous/Next buttons work
- [x] Can't go before page 1
- [x] Can't go beyond last page
- [x] Results count accurate
- [x] Page resets to 1 when filters change
- [x] Smooth scroll to top on page change

### UI/UX
- [x] Loading spinner shows during API calls
- [x] Error states display properly
- [x] Empty states show appropriate messages
- [x] Filter panel can be expanded/collapsed
- [x] Filter count badge updates correctly
- [x] Responsive on mobile, tablet, desktop
- [x] Animations smooth and performant

## Performance Considerations

- **Debouncing:** Search input can be debounced in future iterations
- **Memoization:** Consider memoizing filter components
- **Lazy Loading:** Items could be lazy-loaded as user scrolls
- **Caching:** API responses could be cached client-side
- **Indexes:** Backend has database indexes for fast queries

## Future Enhancements

1. **Save Searches:** Allow users to save frequently used filter combinations
2. **URL Query Params:** Store filters in URL for shareable links
3. **Advanced Search:** Date range filters, multi-select categories
4. **Search Suggestions:** Auto-complete suggestions as user types
5. **Recently Searched:** Show recent search queries
6. **Export Results:** Download filtered results as CSV/PDF
7. **Sort by Multiple Fields:** Secondary sort options
8. **View Toggle:** Grid view vs. List view

## Known Issues

None at this time.

## Acceptance Criteria

- ✅ Search bar allows text search across items
- ✅ Dropdown filters for category, location, and status work correctly
- ✅ Sort options (recent/oldest) function properly
- ✅ Results count displays accurate number of items
- ✅ Loading and empty states handled gracefully
- ✅ Pagination controls allow navigation through pages
- ✅ Filters reset to page 1 when changed
- ✅ UI is responsive and accessible
- ✅ Integration with backend API (Issue #38) is seamless

## Conclusion

Sprint 3 Issue #39 is **complete**. The search and filtering UI provides a polished, user-friendly experience for browsing lost items. The feature integrates seamlessly with the backend API, handles all edge cases, and provides a solid foundation for future enhancements.

**Status:** ✅ Complete and Ready for Review

