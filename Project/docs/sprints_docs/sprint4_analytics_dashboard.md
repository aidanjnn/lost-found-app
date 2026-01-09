# Sprint 4: Analytics / Stats Dashboard (Issue #41)

**Issue:** #41  
**Type:** Feature  
**Priority:** High  
**Sprint:** 4  
**Author:** Team 15 (Ruhani, Sheehan, Aidan, Neng, Theni)  
**Date:** November 29, 2025

## Overview

Implements a comprehensive Analytics Dashboard for staff/admins to view statistics, activity data, and insights about the Lost & Found system. Features interactive charts, real-time stats, and activity tracking.

## Features Implemented

### 1. Analytics Backend API
- **Endpoint:** `GET /api/analytics/dashboard`
- **Access:** Staff-only (requires authentication + role check)
- **Comprehensive Data Collection:**
  - Basic counts (items, claims, users)
  - Approval rates calculation
  - Items added per week (last 8 weeks)
  - Claims per week (last 8 weeks)
  - Claims distribution by category
  - Items distribution by category
  - Items by location
  - Recent activity feed (last 10 actions)
  - Status breakdowns (claims and items)

### 2. Analytics Dashboard Frontend
- **Staff-Only Access:** Authenticated staff only
- **Real-time Data:** Fetches live data from backend
- **Refresh Button:** Manually refresh analytics data
- **Multiple Visualizations:**
  - Line charts (Items/Claims per week)
  - Bar charts (Category/Location distribution)
  - Pie charts (Claims by category)
  - Stats cards with animated counters
  - Activity feed

### 3. Interactive Charts
- **5 Chart Views:**
  1. **Items Added Per Week** - Line chart showing item creation trends
  2. **Claims Timeline** - Line chart showing claim submission trends
  3. **Items by Category** - Bar chart with color-coded categories
  4. **Claims by Category** - Pie chart for claim distribution
  5. **Items by Location** - Horizontal bar chart for location analysis
- **Tab Navigation:** Easy switching between chart views
- **Responsive Charts:** Auto-resize based on screen size
- **Tooltips:** Hover tooltips with detailed information
- **Color-Coded:** Distinct colors for different data points

### 4. Overview Stats Cards
- **Total Items** - Count of all items (excluding deleted)
- **Total Claims** - Count of all claims
- **Total Users** - Count with student/staff breakdown
- **Approval Rate** - Percentage of approved/picked-up claims
- **Animated Entry:** Cards slide in sequentially
- **Color-Coded Borders:** Visual distinction by category

### 5. Status Breakdowns
- **Claims Breakdown:**
  - Pending claims (yellow)
  - Approved claims (green)
  - Rejected claims (red)
  - Picked up claims (blue)
- **Items Breakdown:**
  - Unclaimed items
  - Claimed/picked-up items
- **Interactive Cards:** Hover effects and animations

### 6. Recent Activity Feed
- **Last 10 Actions:**
  - Items added
  - Claims submitted
- **Timestamps:** Formatted dates and times
- **Icons:** Visual indicators for action types
- **Real-time:** Shows most recent activity first

## Files Created/Modified

### Backend Files

1. **`app.py`** (Modified)
   - Added analytics endpoint at line ~888
   - Comprehensive SQL queries for data aggregation
   - Staff-only access with role checking
   - Error handling and response formatting

### Frontend Files

2. **`AnalyticsDashboardPage.jsx`** (New)
   - Main analytics dashboard component
   - State management for data and chart selection
   - Recharts integration for all visualizations
   - Auth checks and role validation
   - Responsive layout with multiple sections

3. **`AnalyticsDashboardPage.css`** (New)
   - Beautiful, modern styling
   - Purple theme for analytics
   - Animated stat cards
   - Responsive grid layouts
   - Chart customizations
   - Activity feed styling

4. **`App.jsx`** (Modified)
   - Added import for `AnalyticsDashboardPage`
   - Added route: `/staff/analytics`

5. **`Navigation.jsx`** (Modified)
   - Added "Analytics" link for staff (desktop)
   - Added "Analytics" link for staff (mobile)

6. **`StaffDashboardPage.jsx`** (Modified)
   - Added third quick-link card for Analytics
   - Purple gradient card with chart icon
   - Link to `/staff/analytics`

7. **`StaffDashboardPage.css`** (Modified)
   - Added `.analytics-card` styling
   - Purple gradient background
   - Animated top border
   - Button color customization

8. **`api.js`** (Modified)
   - Added `analyticsAPI` export
   - `getDashboardAnalytics()` function

9. **`package.json`** (Modified)
   - Added `recharts` dependency for charting

## Backend API Details

### Endpoint: GET /api/analytics/dashboard

**Access:** Staff only (401/403 if not authenticated/authorized)

**Response Format:**
```json
{
  "overview": {
    "total_items": 42,
    "total_claims": 28,
    "total_users": 15,
    "total_students": 12,
    "total_staff": 3,
    "approval_rate": 75.5
  },
  "claims_breakdown": {
    "pending": 5,
    "approved": 8,
    "rejected": 3,
    "picked_up": 12
  },
  "items_breakdown": {
    "unclaimed": 18,
    "claimed": 24
  },
  "charts": {
    "items_per_week": [
      {
        "week": "2025-47",
        "count": 8,
        "week_start": "2025-11-18T00:00:00"
      }
    ],
    "claims_per_week": [...],
    "claims_per_category": [
      {
        "category": "electronics",
        "count": 12
      }
    ],
    "items_per_category": [...],
    "items_per_location": [
      {
        "location": "SLC",
        "count": 15
      }
    ]
  },
  "recent_activity": [
    {
      "action_type": "item_added",
      "entity_id": 42,
      "entity_description": "Black backpack",
      "category": "bags",
      "timestamp": "2025-11-29T14:30:00"
    },
    {
      "action_type": "claim_submitted",
      "entity_id": 15,
      "entity_description": "John Doe",
      "category": "electronics",
      "timestamp": "2025-11-29T13:45:00"
    }
  ]
}
```

### SQL Queries Used

1. **Basic Counts:**
   - `SELECT COUNT(*) FROM items WHERE status != 'deleted'`
   - `SELECT COUNT(*) FROM claims`
   - `SELECT COUNT(*) FROM users WHERE role = 'student'`
   - And more...

2. **Time-Series Data:**
   ```sql
   SELECT 
       strftime('%Y-%W', created_at) as week,
       COUNT(*) as count,
       MIN(created_at) as week_start
   FROM items
   WHERE status != 'deleted'
   AND created_at >= datetime('now', '-8 weeks')
   GROUP BY strftime('%Y-%W', created_at)
   ORDER BY week_start ASC
   ```

3. **Category Distribution:**
   ```sql
   SELECT 
       i.category,
       COUNT(DISTINCT c.claim_id) as claim_count
   FROM items i
   INNER JOIN claims c ON i.item_id = c.item_id
   WHERE i.status != 'deleted'
   GROUP BY i.category
   ORDER BY claim_count DESC
   ```

4. **Recent Activity:**
   - Combines recent items and claims
   - Sorted by timestamp (most recent first)
   - Limited to 10 entries

## Charting Library

**Recharts** (v2.x)
- React-native charting library
- Declarative API
- Responsive out of the box
- Multiple chart types
- Easy customization
- Active maintenance

**Installation:**
```bash
npm install recharts
```

## Component Architecture

```
AnalyticsDashboardPage
├── Page Header
│   ├── Title & Subtitle
│   └── Refresh Button
├── Stats Grid (4 cards)
│   ├── Total Items (blue border)
│   ├── Total Claims (green border)
│   ├── Total Users (cyan border)
│   └── Approval Rate (yellow border)
├── Charts Section
│   ├── Chart Selector (5 tabs)
│   └── Chart Container
│       ├── Items Per Week (Line Chart)
│       ├── Claims Per Week (Line Chart)
│       ├── Items by Category (Bar Chart)
│       ├── Claims by Category (Pie Chart)
│       └── Items by Location (Bar Chart)
├── Breakdowns Grid (2 cards)
│   ├── Claims Status Breakdown
│   └── Items Status Breakdown
└── Recent Activity Section
    └── Activity Feed (10 recent actions)
```

## State Management

```javascript
const [loading, setLoading] = useState(true)
const [error, setError] = useState('')
const [analyticsData, setAnalyticsData] = useState(null)
const [selectedChart, setSelectedChart] = useState('items_per_week')

// Analytics Data Structure:
// - overview
// - claims_breakdown
// - items_breakdown
// - charts
// - recent_activity
```

## Design Features

### Visual Design
- **Purple Theme:** Purple gradients for analytics/insights
- **Stat Cards:** Animated entry with color-coded borders
- **Chart Tabs:** Active state with blue gradient background
- **Responsive Charts:** Auto-adjust to container size
- **Activity Feed:** Timeline-style with icons and timestamps
- **Breakdown Cards:** Color-coded by status (green, yellow, red, blue)

### Color Palette
- **Primary (Blue):** `#003366` - Items, primary actions
- **Success (Green):** `#28a745` - Approved, claimed
- **Warning (Yellow):** `#ffc107` - Pending, approval rate
- **Info (Cyan):** `#17a2b8` - Users, picked up
- **Danger (Red):** `#dc3545` - Rejected
- **Analytics (Purple):** `#6610f2` - Analytics theme

### Animations
- **Slide In:** Stats cards slide up sequentially (0.05s delay each)
- **Fade In:** Charts fade in when switching views
- **Hover Effects:** Cards lift and scale on hover
- **Smooth Transitions:** 0.3s cubic-bezier transitions

### Accessibility
- **ARIA Attributes:** Proper labels for interactive elements
- **Keyboard Navigation:** All controls accessible via keyboard
- **Focus States:** Clear visual focus indicators
- **Screen Reader Support:** Semantic HTML structure
- **Color Contrast:** WCAG AA compliant

### Responsive Breakpoints
- **Desktop (>1200px):** Full grid layout, 4 stat cards
- **Tablet (768-1200px):** 2-column grid, compact layout
- **Mobile (<768px):** Single column, stacked charts, full-width buttons

## User Workflows

### Staff View Analytics
1. Staff logs in
2. Clicks "Analytics" in navigation OR purple card on dashboard
3. Page loads with animated stat cards
4. Charts display items per week by default
5. Staff can switch between chart views using tabs
6. Scroll down to see status breakdowns and recent activity
7. Click "Refresh" to get latest data

### Staff Analyze Trends
1. Navigate to Analytics Dashboard
2. View "Items Added Per Week" to see submission trends
3. Switch to "Claims Timeline" to see claim trends
4. Compare items vs claims over time
5. Check approval rate in overview stats
6. Review recent activity for latest actions

### Staff Identify Patterns
1. Navigate to Analytics Dashboard
2. Click "Items by Category" to see which categories are most common
3. Click "Claims by Category" to see which categories get claimed most
4. Click "Items by Location" to identify hotspot locations
5. Use insights to optimize lost & found operations

## Additional Features (Beyond Requirements)

1. **Time-Series Analysis:**
   - 8-week historical data
   - Week-over-week trends
   - Visual trend lines

2. **Multi-Dimensional Analysis:**
   - Category distribution
   - Location distribution
   - Status breakdowns
   - User statistics

3. **Activity Tracking:**
   - Real-time activity feed
   - Action type indicators
   - Timestamp display

4. **Interactive UI:**
   - Tab-based chart navigation
   - Hover tooltips
   - Refresh functionality
   - Animated transitions

5. **Comprehensive Metrics:**
   - Approval rate calculation
   - User role breakdown
   - Status distributions
   - Location analysis

## Testing Checklist

### Backend
- [x] Endpoint returns correct data format
- [x] Staff-only access enforced (403 for students)
- [x] Authentication required (401 if not logged in)
- [x] SQL queries return accurate data
- [x] Time-series data calculated correctly
- [x] Recent activity sorted by timestamp
- [x] Error handling works properly

### Frontend
- [x] Page loads analytics data correctly
- [x] Staff-only access enforced
- [x] Stat cards display correct numbers
- [x] Charts render properly
- [x] Chart switching works
- [x] Tooltips show on hover
- [x] Refresh button works
- [x] Responsive on mobile/tablet/desktop
- [x] Loading state appears on initial load
- [x] Error handling displays properly
- [x] Activity feed shows recent actions
- [x] Status breakdowns display correctly

### Integration
- [x] Navigation link works
- [x] Dashboard quick link works
- [x] API integration working
- [x] Auth checks prevent unauthorized access
- [x] No linting errors
- [x] Charts library installed
- [x] All routes working

### UI/UX
- [x] Stat cards animate on load
- [x] Charts are color-coded
- [x] Hover effects work
- [x] Responsive layout adjusts properly
- [x] Activity feed formatted correctly
- [x] Empty state shows if no data
- [x] Error state shows if API fails
- [x] Refresh updates data

## Performance Considerations

- **Efficient Queries:** Uses indexed columns and appropriate JOINs
- **Limited Time Range:** Only fetches last 8 weeks for time-series
- **Activity Limit:** Recent activity limited to 10 entries
- **Client-Side Chart Rendering:** Recharts uses canvas for performance
- **Memoization:** Can add React.memo if needed
- **Lazy Loading:** Charts only render when visible

## Security

- **Staff-Only Access:** Backend enforces role check (403 if not staff)
- **Session Validation:** Requires valid authenticated session
- **No Sensitive Data:** Only shows aggregate statistics
- **SQL Injection Prevention:** Uses parameterized queries
- **Proper Error Handling:** Doesn't leak system information

## Future Enhancements

1. **Export Analytics:** Download charts/data as PDF or CSV
2. **Date Range Selector:** Custom date ranges for analysis
3. **Comparative Analysis:** Compare current vs previous periods
4. **Predictive Analytics:** Forecast trends using ML
5. **Email Reports:** Scheduled analytics reports
6. **Custom Dashboards:** Staff can customize their view
7. **Real-time Updates:** WebSocket for live data
8. **Drill-Down:** Click charts to see detailed data
9. **Filters:** Filter by date, category, location
10. **Benchmarking:** Compare against targets/goals

## Known Issues

None at this time.

## Dependencies Added

- **recharts:** ^2.x - React charting library

## Acceptance Criteria

- ✅ Total items, total claims, approval rates displayed
- ✅ Charts (bar/line/pie using Recharts library)
- ✅ "Items added per week" graph (last 8 weeks)
- ✅ "Claims per category" graph (pie chart)
- ✅ Basic counters for activity (recent activity feed)
- ✅ Dashboard displays correct, real data connected to backend
- ✅ Additional features: Claims timeline, items by location, status breakdowns

## Conclusion

Sprint 4 Issue #41 is **complete**. The Analytics Dashboard provides staff with comprehensive insights into the Lost & Found system through interactive charts, real-time statistics, and activity tracking. The feature uses the Recharts library for beautiful, responsive visualizations and integrates seamlessly with the existing system.

**Status:** ✅ Complete, Tested, Documented, Ready for Production


