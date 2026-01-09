# Sprint 3: Item Claiming UI (Front-End) - Issue #36

**Author:** Team 15 (Ruhani, Sheehan, Aidan, Neng, Theni)  
**Date:** November 27, 2025  
**Branch:** `sprint-3-claiming-system`  
**Status:** ✅ Complete

---

## Overview

Implemented the student-facing UI for the Item Claiming System. Students can now submit claims for lost items, view their claim history with status badges, and track their submissions through an intuitive interface. This frontend connects to the claiming backend API built in Issue #35.

---

## Features Implemented

### 1. **API Service Enhancement**

Updated `api.js` to include comprehensive claims endpoints:

**Claims API Methods:**
- `claimsAPI.createClaim(claimData)` - Submit a new claim
- `claimsAPI.getClaims(filters)` - Get claims list with optional filters
- `claimsAPI.getClaimById(claimId)` - Get detailed claim information
- `claimsAPI.updateClaimStatus(claimId, updateData)` - Update claim status (staff only)

---

### 2. **Claim Modal Component** (`ClaimModal.jsx`)

A beautiful, user-friendly modal for submitting claims:

**Features:**
- Auto-fills user information from session (name, email)
- Shows item details being claimed
- Verification text field with validation (min 10 characters)
- Optional phone number field
- Real-time validation and error messages
- Success feedback with auto-close
- Responsive design for mobile and desktop

**User Experience:**
```
1. User clicks "Claim This Item" button
2. Modal opens with item details and pre-filled user info
3. User enters verification details (proving ownership)
4. Optional: Add phone number for staff contact
5. Submit → Backend validation
6. Success message → Redirects to My Claims
```

**Validation Rules:**
- Verification text required (min 10 characters)
- Provides helpful prompts to guide users
- Clear error messages for API failures

---

### 3. **Enhanced Item Card Component** (`ItemCard.jsx`)

Updated item cards to support claim functionality:

**New Props:**
- `showClaimButton` - Controls whether claim button is displayed
- `onClaimSuccess` - Callback when claim is successfully submitted

**Claim Button:**
- Only shows for `unclaimed` items
- Only appears when `showClaimButton={true}`
- Opens `ClaimModal` on click
- Prominent styling to encourage action

**Design:**
- Blue button matching UW branding
- Hover effects for interactivity
- Responsive button sizing
- Integrates seamlessly with existing card design

---

### 4. **My Claims Page** (`MyClaimsPage.jsx`)

Comprehensive claim tracking interface for students:

**Features:**

**Filter Tabs:**
- All Claims - Shows everything
- Pending - Claims awaiting staff review
- Approved - Claims approved by staff
- Picked Up - Items already collected
- Rejected - Claims denied by staff

**Claim Card Display:**
- Claim ID for reference
- Item category and description
- Current status with color-coded badges
- Pickup location (prominent)
- Verification text submitted
- Staff notes (when available)
- Timestamps (submitted, updated)

**Status Badges:**
- ⏳ Pending Review - Yellow badge
- ✓ Approved - Green badge
- ✗ Rejected - Red badge
- 📦 Picked Up - Blue badge

**Empty State:**
- Friendly message when no claims exist
- "Browse Lost Items" button to get started

**Loading States:**
- Spinner animation while fetching
- Error messages with retry button
- Graceful handling of auth failures

---

### 5. **Navigation Enhancement** (`Navigation.jsx`)

Added "My Claims" link for students:

**Desktop Navigation:**
- Shows "My Claims" link for authenticated students
- Staff see "Staff Dashboard" instead
- Link highlights when active

**Mobile Navigation:**
- "My Claims" included in hamburger menu
- Responsive design maintained
- Smooth interactions

---

### 6. **Student Dashboard Enhancement** (`StudentDashboardPage.jsx`)

Updated to enable claim functionality:

**Changes:**
- Passes `showClaimButton={true}` to all ItemCards
- Passes `onClaimSuccess={fetchItems}` to refresh list after claiming
- Updated helper text to mention claiming
- Seamless integration with existing dashboard

---

## User Workflows

### Workflow 1: Claiming an Item

```
1. Student logs in → Student Dashboard
2. Views lost items with "Claim This Item" buttons
3. Clicks "Claim This Item" on desired item
4. Modal opens with:
   - Item details (category, description, location)
   - Pre-filled user info (name, email)
   - Verification text field
   - Optional phone field
5. Student enters detailed description proving ownership
6. Clicks "Submit Claim"
7. Success message appears
8. Modal closes automatically
9. Can check "My Claims" to see status
```

### Workflow 2: Tracking Claims

```
1. Student clicks "My Claims" in navigation
2. Views all submitted claims with status badges
3. Can filter by status (Pending, Approved, etc.)
4. Sees detailed information for each claim:
   - Item being claimed
   - Verification text submitted
   - Staff notes (if any)
   - Current status
   - Pickup location
5. Understands next steps based on status
```

### Workflow 3: Status Changes

**Pending → Approved:**
- Badge turns green with checkmark
- Staff notes may include pickup instructions
- Pickup location clearly displayed
- Student can proceed to collect item

**Approved → Picked Up:**
- Badge turns blue with package icon
- Indicates successful completion
- Claim history preserved

**Pending → Rejected:**
- Badge turns red with X
- Staff notes explain reason
- Student understands why claim was denied

---

## Component Architecture

```
App.jsx
├── Navigation.jsx
│   └── Links to My Claims (students only)
├── StudentDashboardPage.jsx
│   └── ItemCard.jsx (showClaimButton=true)
│       └── ClaimModal.jsx
└── MyClaimsPage.jsx
    └── Claim cards with status badges
```

---

## Files Created/Modified

### New Files

1. **`frontend/src/components/ClaimModal.jsx`** (241 lines)
   - Modal component for claim submission
   - Form validation and error handling
   - Success feedback

2. **`frontend/src/components/ClaimModal.css`** (223 lines)
   - Modal styling with animations
   - Responsive design
   - Form and button styles

3. **`frontend/src/pages/MyClaimsPage.jsx`** (263 lines)
   - Claim history page
   - Filter functionality
   - Status badges and details

4. **`frontend/src/pages/MyClaimsPage.css`** (320 lines)
   - Page layout and styles
   - Filter tabs styling
   - Claim card design
   - Status badge colors

5. **`docs/sprint3_claiming_ui_frontend.md`** (THIS FILE)
   - Comprehensive documentation

### Modified Files

1. **`frontend/src/services/api.js`**
   - Added claimsAPI with 4 methods
   - Updated header comments to Sprint 3

2. **`frontend/src/components/ItemCard.jsx`**
   - Added claim button support
   - Integrated ClaimModal
   - New props: showClaimButton, onClaimSuccess

3. **`frontend/src/components/ItemCard.css`**
   - Added `.btn-claim-item` styles
   - Hover and active states

4. **`frontend/src/App.jsx`**
   - Added `/my-claims` route
   - Import MyClaimsPage

5. **`frontend/src/components/Navigation.jsx`**
   - Added "My Claims" link for students
   - Updated both desktop and mobile menus

6. **`frontend/src/pages/StudentDashboardPage.jsx`**
   - Enabled claim button on item cards
   - Updated helper text
   - Connected claim success callback

---

## Styling & Design

### Color Scheme

**UW Branding:**
- Primary Blue: `#003366` (buttons, headings)
- Secondary Blue: `#002244` (hover states)

**Status Colors:**
- Pending: Yellow (`#fff3cd` bg, `#856404` text)
- Approved: Green (`#d4edda` bg, `#155724` text)
- Rejected: Red (`#f8d7da` bg, `#721c24` text)
- Picked Up: Blue (`#cce5ff` bg, `#004085` text)

**UI Elements:**
- Background: `#f5f7fa` (light gray)
- Cards: White with shadow
- Borders: `#eee` (light gray)

### Responsive Breakpoints

**Desktop (> 768px):**
- Full navigation bar
- Multi-column item grid
- Modal max-width: 600px

**Mobile (≤ 768px):**
- Hamburger menu
- Single column layout
- Full-width buttons
- Adjusted padding and spacing

---

## API Integration

### Creating a Claim

```javascript
const claimData = {
  item_id: 1,
  verification_text: "Detailed description of item",
  phone: "519-555-0123" // optional
}

const response = await claimsAPI.createClaim(claimData)
// Returns: { message, claim }
```

### Getting Claims

```javascript
// All claims
const allClaims = await claimsAPI.getClaims()

// Filtered by status
const pendingClaims = await claimsAPI.getClaims({ status: 'pending' })

// Returns: { claims: [...], count: N }
```

### Error Handling

All API calls include try-catch with:
- Network error handling
- 401 redirect to login
- User-friendly error messages
- Retry capabilities

---

## Testing the Frontend

### Prerequisites

1. Backend running on port 5001
2. Frontend running on port 3000
3. Test account: `student@uwaterloo.ca` / `student123`

### Test Scenarios

**1. Submit a Claim:**
```
1. Login as student
2. Go to Student Dashboard
3. Find an unclaimed item
4. Click "Claim This Item"
5. Fill verification text (min 10 chars)
6. Submit
7. Verify success message appears
8. Check "My Claims" to see new claim
```

**2. View Claim History:**
```
1. Login as student
2. Click "My Claims" in navigation
3. Should see list of claims
4. Try different filter tabs
5. Verify status badges show correctly
6. Check timestamps are formatted properly
```

**3. Claim Validation:**
```
1. Try submitting without verification text → Error
2. Try verification text < 10 chars → Error
3. Try claiming already claimed item → Error message
4. Verify error messages are clear
```

**4. Responsive Design:**
```
1. Test on desktop (full width)
2. Test on tablet (768px)
3. Test on mobile (375px)
4. Verify navigation hamburger works
5. Verify modals are scrollable on small screens
```

---

## Edge Cases Handled

1. **Item Already Claimed:**
   - Backend returns 409 error
   - Modal shows clear error message
   - User can close and try another item

2. **Network Failure:**
   - Error message displayed
   - Retry button available
   - No data loss from form

3. **Session Expiration:**
   - Detected on API call
   - Automatic redirect to login
   - Preserves intended action

4. **Empty States:**
   - No claims yet: Friendly message with action button
   - No matching filter: Clear feedback
   - No items: Dashboard shows empty state

5. **Long Content:**
   - Verification text: Text area with scrolling
   - Item descriptions: Truncation if needed
   - Modal: Scrollable on small screens

---

## Accessibility Features

1. **Keyboard Navigation:**
   - Modal closes on Escape key
   - Tab order is logical
   - Buttons are keyboard accessible

2. **ARIA Labels:**
   - Close button has aria-label
   - Form fields have proper labels
   - Status badges are semantic

3. **Visual Feedback:**
   - Hover states on interactive elements
   - Focus states on form inputs
   - Loading spinners for async operations

4. **Color Contrast:**
   - Status badges meet WCAG standards
   - Text is readable on all backgrounds
   - Buttons have sufficient contrast

---

## Performance Optimizations

1. **Conditional Rendering:**
   - Claim button only renders when needed
   - Modal only mounts when open

2. **API Efficiency:**
   - Filters applied on backend
   - Minimal data transferred
   - Caching headers respected

3. **Image Handling:**
   - Lazy loading (browser native)
   - Error fallbacks
   - Placeholder when missing

4. **State Management:**
   - Minimal re-renders
   - useEffect dependencies optimized
   - Form state isolated in modal

---

## Future Enhancements (Not in Sprint 3)

1. **Image Upload in Claims:**
   - Allow students to upload photos as proof
   - Store in backend or cloud storage

2. **Real-Time Updates:**
   - WebSocket notifications for status changes
   - Push notifications when claim approved

3. **Claim History Search:**
   - Search by item category or description
   - Date range filters

4. **Bulk Actions:**
   - Mark multiple as reviewed
   - Export claim history

5. **Analytics:**
   - Track claim success rates
   - Popular item categories
   - Average processing time

---

## Code Quality

✅ **No linter errors**  
✅ **Consistent naming conventions**  
✅ **Proper component structure**  
✅ **Comprehensive error handling**  
✅ **Responsive design implemented**  
✅ **Accessibility considerations**  
✅ **Clear comments and documentation**  

---

## Statistics

```
Components Created: 2 (ClaimModal, MyClaimsPage)
Components Modified: 3 (ItemCard, Navigation, StudentDashboardPage)
Files Modified: 6
New Lines of Code: ~1,600
CSS Lines: ~550
Documentation: This file (500+ lines)
```

---

## Acceptance Criteria ✅ All Met

✅ **Add "Claim Item" button on item cards** - Button shows for unclaimed items  
✅ **Claim form with required fields** - Modal with name, email, verification text  
✅ **Submit form → call backend API** - Integrated with claimsAPI.createClaim()  
✅ **Create "My Claims" page** - Full page with filters and status badges  
✅ **Redirect or confirm after successful claim** - Success message shown  
✅ **Students can submit claims** - Working end-to-end  
✅ **View claim history** - My Claims page with all details  

---

## Integration with Backend (Issue #35)

This frontend seamlessly integrates with the backend API:

**POST /api/claims** - ✅ ClaimModal uses this  
**GET /api/claims** - ✅ MyClaimsPage uses this  
**GET /api/claims/:id** - ✅ Ready for future detail view  
**PATCH /api/claims/:id** - ✅ Reserved for staff UI (Issue #37)

All backend business rules are respected:
- Only one approved claim per item
- Proper status transitions
- Role-based access control

---

## Next Steps

With Issue #36 complete, the next step is:

**Issue #37: Staff Claiming Management UI (Front-End)**
- Staff dashboard to review pending claims
- Approve/reject/pickup interface
- View claimant verification details
- Add staff notes
- Batch processing capabilities

---

## Related Issues

- **Issue #35:** Create Item Claiming System (Backend) - ✅ Complete
- **Issue #36:** Create Item Claiming UI (Front-End) - ✅ Complete (THIS)
- **Issue #37:** Staff Claiming Management UI - ⏳ Next
- **Issue #38:** Item Searching & Filtering (Backend) - 📋 Future
- **Issue #39:** Search and Filtering UI - 📋 Future

---

## Screenshots & UI Flow (Descriptions)

### 1. Student Dashboard with Claim Buttons
- Grid of lost items
- Each unclaimed item shows blue "Claim This Item" button
- Claimed items show red "Claimed" badge without button

### 2. Claim Modal
- Clean, centered modal with white background
- Item information section at top
- User information pre-filled
- Large textarea for verification
- Optional phone input
- Blue submit button

### 3. Success State
- Green checkmark icon
- "Claim Submitted Successfully!" message
- Instruction to check My Claims
- Auto-closes after 1.5 seconds

### 4. My Claims Page
- Filter tabs at top (All, Pending, Approved, etc.)
- List of claim cards
- Each card shows item info, status badge, and timestamps
- Color-coded badges for easy status recognition

### 5. Navigation with My Claims
- "My Claims" link appears for students
- Highlighted when on claims page
- Mobile: In hamburger menu

---

**Issue #36 Status: ✅ COMPLETE**

All tasks completed, tested, documented, and ready for merge into sprint-3-claiming-system branch.

