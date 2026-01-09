# Sprint 4: Data Export (CSV / PDF for Items & Claims) - Issue #45

**Issue:** #45  
**Type:** Feature  
**Priority:** High  
**Sprint:** 4  
**Author:** Team 15 (Ruhani, Sheehan, Aidan, Neng, Theni)  
**Date:** November 29, 2025

## Overview

Implements comprehensive data export functionality for staff to download items, claims, and activity log data in CSV format. All exports work locally without external dependencies using Python's built-in `csv` module.

## Features Implemented

### 1. Export Items to CSV
- **Endpoint:** `GET /api/export/items/csv`
- **Filters:** status, category
- **Staff-Only Access**
- **Audit Logging:** All exports logged

### 2. Export Claims to CSV
- **Endpoint:** `GET /api/export/claims/csv`
- **Filters:** status
- **Staff-Only Access**
- **Includes Item Details:** Category, location, pickup location

### 3. Export Activity Log to CSV
- **Endpoint:** `GET /api/export/activity-log/csv`
- **Filters:** action_type, start_date, end_date
- **Staff-Only Access**
- **Complete Audit Trail Export**

### 4. Frontend Export Buttons
- **Activity Log Page:** Export with applied filters
- **Staff Claims Management:** Export with current filter
- **Archived Items Page:** Export picked-up items
- **Automatic Download:** Browser initiates file download
- **Timestamped Filenames:** Unique filenames with date/time

## Technology Stack

### Backend
- **Python csv module:** Built-in, no external dependencies
- **StringIO:** In-memory CSV generation
- **Flask make_response:** Custom response headers
- **Response Type:** `text/csv` with attachment headers

### Frontend
- **Axios blob response:** Binary data handling
- **Blob API:** Browser-native file creation
- **URL.createObjectURL:** Temporary download URLs
- **Automatic Cleanup:** Memory management

## Backend API

### 1. Export Items to CSV

**Endpoint:** `GET /api/export/items/csv`  
**Authentication:** Required  
**Access:** Staff only (403 if not staff)

**Query Parameters:**
- `status` (optional): Filter by item status (unclaimed, claimed)
- `category` (optional): Filter by category

**Response:**
- **Content-Type:** `text/csv`
- **Content-Disposition:** `attachment; filename=lost_items_YYYYMMDD_HHMMSS.csv`
- **Status:** 200 (Success), 403 (Forbidden), 500 (Error)

**CSV Columns:**
```
Item ID, Description, Category, Location Found, Pickup Location,
Date Found, Status, Found By Desk, Created At
```

**Example:**
```
GET /api/export/items/csv?status=unclaimed&category=Electronics

Response: CSV file download
```

### 2. Export Claims to CSV

**Endpoint:** `GET /api/export/claims/csv`  
**Authentication:** Required  
**Access:** Staff only (403 if not staff)

**Query Parameters:**
- `status` (optional): Filter by claim status (pending, approved, rejected, picked_up)

**Response:**
- **Content-Type:** `text/csv`
- **Content-Disposition:** `attachment; filename=claims_YYYYMMDD_HHMMSS.csv`
- **Status:** 200 (Success), 403 (Forbidden), 500 (Error)

**CSV Columns:**
```
Claim ID, Item ID, Item Description, Category, Location Found,
Pickup Location, Claimant Name, Claimant Email, Claimant Phone,
Verification Text, Status, Staff Notes, Processed By, Submitted At, Updated At
```

**Example:**
```
GET /api/export/claims/csv?status=pending

Response: CSV file download
```

### 3. Export Activity Log to CSV

**Endpoint:** `GET /api/export/activity-log/csv`  
**Authentication:** Required  
**Access:** Staff only (403 if not staff)

**Query Parameters:**
- `action_type` (optional): Filter by action type
- `start_date` (optional): Filter from date (YYYY-MM-DD)
- `end_date` (optional): Filter to date (YYYY-MM-DD)

**Response:**
- **Content-Type:** `text/csv`
- **Content-Disposition:** `attachment; filename=activity_log_YYYYMMDD_HHMMSS.csv`
- **Status:** 200 (Success), 403 (Forbidden), 500 (Error)

**CSV Columns:**
```
Log ID, User ID, User Name, User Email, User Role,
Action Type, Entity Type, Entity ID, Details, IP Address, Created At
```

**Example:**
```
GET /api/export/activity-log/csv?action_type=item_added&start_date=2025-11-01

Response: CSV file download
```

## Backend Implementation

### CSV Generation Process

```python
from io import StringIO
import csv
from flask import make_response

# 1. Query database with filters
cursor.execute(query, params)
items = cursor.fetchall()

# 2. Create CSV in memory
output = StringIO()
writer = csv.writer(output)

# 3. Write header row
writer.writerow(['Item ID', 'Description', ...])

# 4. Write data rows
for item in items:
    writer.writerow([item['item_id'], item['description'], ...])

# 5. Get CSV data
csv_data = output.getvalue()
output.close()

# 6. Create response with headers
response = make_response(csv_data)
response.headers['Content-Type'] = 'text/csv'
response.headers['Content-Disposition'] = 'attachment; filename=export.csv'

# 7. Log activity
log_activity('data_export', details=f'Exported {len(items)} items')

return response
```

### Activity Logging

All exports are logged in the activity log:
- **Action Type:** `data_export`
- **Details:** Number of records exported and type
- **User:** Current staff user (auto-detected)
- **IP Address:** Request IP (auto-captured)

**Example Log Entry:**
```
Action: Data Export
User: admin@uwaterloo.ca (Staff)
Details: Exported 45 items to CSV
IP: 192.168.1.1
Time: 2025-11-29 15:30:00
```

## Frontend Implementation

### Activity Log Page Export

**Location:** `ActivityLogPage.jsx`  
**Button Position:** Top-right of page header

**Features:**
- Applies current filters to export
- Shows success via file download
- Handles errors gracefully

**Implementation:**
```javascript
const handleExportCSV = async () => {
  try {
    const params = new URLSearchParams()
    if (filters.action_type) params.append('action_type', filters.action_type)
    if (filters.start_date) params.append('start_date', filters.start_date)
    if (filters.end_date) params.append('end_date', filters.end_date)
    
    const response = await api.get(`/api/export/activity-log/csv?${params.toString()}`, {
      responseType: 'blob'
    })
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `activity_log_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Error exporting CSV:', err)
    alert('Failed to export CSV. Please try again.')
  }
}
```

### Staff Claims Management Export

**Location:** `StaffClaimsManagementPage.jsx`  
**Button Position:** Top-right of page header

**Features:**
- Exports claims with current filter (all/pending/approved/rejected/picked_up)
- Filename includes filter status
- One-click download

**Example:**
- User filters to "pending" claims
- Clicks "Export CSV"
- Downloads `claims_pending_2025-11-29.csv`

### Archived Items Export

**Location:** `ArchivedItemsPage.jsx`  
**Button Position:** Top-right of page header

**Features:**
- Exports only archived (claimed) items
- Includes claim details
- Timestamped filename

### API Integration

**Added to `api.js`:**

```javascript
// Items API
exportItemsCSV: async (status = null, category = null) => {
  const params = new URLSearchParams()
  if (status) params.append('status', status)
  if (category) params.append('category', category)
  
  const response = await api.get(`/api/export/items/csv?${params.toString()}`, {
    responseType: 'blob'
  })
  return response
}

// Claims API
exportClaimsCSV: async (status = null) => {
  const params = new URLSearchParams()
  if (status) params.append('status', status)
  
  const response = await api.get(`/api/export/claims/csv?${params.toString()}`, {
    responseType: 'blob'
  })
  return response
}
```

## User Workflows

### Export Activity Log
1. Staff logs in
2. Navigates to "Activity Log"
3. (Optional) Applies filters:
   - Action type: "Item Added"
   - Date range: Nov 1-29, 2025
4. Clicks "📥 Export CSV" button (top-right)
5. Browser downloads `activity_log_2025-11-29.csv`
6. Can open in Excel, Google Sheets, or any spreadsheet app
7. Export logged in activity log

### Export Claims
1. Staff logs in
2. Navigates to "Manage Claims"
3. Filters to "Pending" claims
4. Clicks "📥 Export CSV" button
5. Browser downloads `claims_pending_2025-11-29.csv`
6. Contains all pending claims with full details
7. Export logged in activity log

### Export Archived Items
1. Staff logs in
2. Navigates to "Archived Items"
3. Clicks "📥 Export CSV" button
4. Browser downloads `archived_items_2025-11-29.csv`
5. Contains all picked-up items with claimant info
6. Export logged in activity log

## CSV File Examples

### Items CSV
```csv
Item ID,Description,Category,Location Found,Pickup Location,Date Found,Status,Found By Desk,Created At
1,Black leather wallet,Wallet,SLC,SLC,2025-11-15 10:30:00,unclaimed,Front Desk,2025-11-15 10:45:00
2,iPhone 13 Pro,Electronics,MC,PAC,2025-11-16 14:20:00,claimed,Security,2025-11-16 14:30:00
3,Blue backpack,Backpack,DC,CIF,2025-11-18 09:15:00,unclaimed,Lost & Found,2025-11-18 09:20:00
```

### Claims CSV
```csv
Claim ID,Item ID,Item Description,Category,Location Found,Pickup Location,Claimant Name,Claimant Email,Claimant Phone,Verification Text,Status,Staff Notes,Processed By,Submitted At,Updated At
1,2,iPhone 13 Pro,Electronics,MC,PAC,John Doe,jdoe@uwaterloo.ca,519-555-0123,Has distinctive crack on screen,picked_up,Verified with photo,Admin User,2025-11-17 10:00:00,2025-11-18 15:30:00
2,1,Black leather wallet,Wallet,SLC,SLC,Jane Smith,jsmith@uwaterloo.ca,,Contains student ID card,approved,Pending pickup,Admin User,2025-11-16 11:00:00,2025-11-17 09:15:00
```

### Activity Log CSV
```csv
Log ID,User ID,User Name,User Email,User Role,Action Type,Entity Type,Entity ID,Details,IP Address,Created At
1,1,Admin User,admin@uwaterloo.ca,staff,item_added,item,3,Added backpack item,192.168.1.1,2025-11-18 09:20:00
2,1,Admin User,admin@uwaterloo.ca,staff,claim_approved,claim,2,Approved claim for wallet,192.168.1.1,2025-11-17 09:15:00
3,2,Student User,student@uwaterloo.ca,student,claim_created,claim,1,Created claim for iPhone,192.168.1.5,2025-11-17 10:00:00
```

## Button Styling

All export buttons have consistent styling:

```css
.export-btn {
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
  white-space: nowrap;
}

.export-btn:hover {
  background: linear-gradient(135deg, #20c997 0%, #17a2b8 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
}
```

**Visual Appearance:**
- 📥 Icon + "Export CSV" text
- Green gradient background
- Smooth hover animation (lift + color change)
- Positioned top-right of page headers

## Security & Access Control

### Authentication
- All export endpoints require active session
- Invalid/expired sessions return 401 Unauthorized
- Redirects to login page

### Authorization
- All endpoints are staff-only
- Students receive 403 Forbidden
- Role checked before data retrieval

### Data Privacy
- Exports respect database access controls
- No sensitive password data exported
- IP addresses included for audit purposes
- Filters applied before data retrieval

### Audit Trail
- Every export logged automatically
- Logs include:
  - Who exported (user ID, name, email)
  - What was exported (type and count)
  - When (timestamp)
  - Where (IP address)

## File Management

### Filename Format
- **Pattern:** `{type}_{filter}_{YYYYMMDD_HHMMSS}.csv`
- **Examples:**
  - `activity_log_2025-11-29.csv`
  - `claims_pending_2025-11-29.csv`
  - `lost_items_2025-11-29.csv`
  - `archived_items_2025-11-29.csv`

### Browser Download
- Content-Disposition header triggers download
- No page navigation
- Automatic cleanup of temporary URLs
- Works in all modern browsers

### File Size Considerations
- All data loaded in memory (small datasets)
- Suitable for hundreds to low thousands of records
- For larger datasets, consider chunked exports (future enhancement)

## Testing

### Test Export Items
1. Login as staff (`admin@uwaterloo.ca` / `admin123`)
2. Go to Activity Log page (or any page with export)
3. Click "📥 Export CSV" button
4. Verify file downloads with correct filename
5. Open CSV in Excel/Sheets
6. Verify data is correct and properly formatted
7. Check activity log for export entry

### Test with Filters
1. Go to Staff Claims Management
2. Filter to "Pending" claims
3. Click "📥 Export CSV"
4. Verify CSV contains only pending claims
5. Change filter to "Approved"
6. Export again
7. Verify CSV now contains only approved claims

### Test Error Handling
1. Clear browser cookies (logout)
2. Try to access export endpoint directly:
   ```
   GET http://localhost:5001/api/export/items/csv
   ```
3. Should redirect to login or show 401 error
4. Login as student
5. Try to export
6. Should show 403 Forbidden error

## Browser Compatibility

### Tested Browsers
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Required APIs
- Blob API (universally supported)
- URL.createObjectURL (IE11+)
- Axios blob responseType (all modern browsers)

## Known Limitations

1. **Memory Limitation:**
   - All data loaded in memory at once
   - Suitable for datasets up to ~10,000 records
   - Larger datasets may cause performance issues

2. **Format:**
   - CSV only (no PDF in current implementation)
   - UTF-8 encoding (may have issues with special characters in Excel on Windows)

3. **Filters:**
   - Basic filters only
   - No advanced query builder
   - Cannot combine multiple statuses

## Future Enhancements

### PDF Export
- Use reportlab or WeasyPrint for Python-based PDF generation
- Or use frontend library like jsPDF for client-side generation
- Include charts and formatted tables
- Company branding and headers

### Advanced Features
1. **Excel Format (.xlsx):**
   - Use openpyxl library
   - Formatted cells with colors
   - Multiple sheets (items, claims, summary)

2. **Scheduled Exports:**
   - Daily/weekly automated reports
   - Email delivery
   - Stored on server

3. **Custom Column Selection:**
   - User chooses which columns to include
   - Save export templates
   - Reusable configurations

4. **Data Aggregation:**
   - Summary statistics
   - Grouped by category/status
   - Pivot table format

5. **Chunked Exports:**
   - Stream large datasets
   - Prevent memory issues
   - Progress indicator

### PDF Implementation (Future)

**Option 1: Backend (Python)**
```python
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, Paragraph
from reportlab.lib.styles import getSampleStyleSheet

@app.route('/api/export/items/pdf', methods=['GET'])
@require_auth
@require_role('staff')
def export_items_pdf():
    # Generate PDF using reportlab
    # Return with Content-Type: application/pdf
    pass
```

**Option 2: Frontend (JavaScript)**
```javascript
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const exportPDF = () => {
  const doc = new jsPDF()
  doc.autoTable({
    head: [['Item ID', 'Description', 'Category', ...]],
    body: items.map(item => [item.id, item.description, ...])
  })
  doc.save('items.pdf')
}
```

## Files Created/Modified

### Backend Files

1. **`app.py`** (Modified)
   - Added imports: `csv`, `StringIO`, `make_response`
   - Added `GET /api/export/items/csv` endpoint
   - Added `GET /api/export/claims/csv` endpoint
   - Added `GET /api/export/activity-log/csv` endpoint
   - Updated activity_log CHECK constraint (added 'data_export')

### Frontend Files

2. **`api.js`** (Modified)
   - Added `itemsAPI.exportItemsCSV()` function
   - Added `itemsAPI.deleteItem()` function
   - Added `claimsAPI.exportClaimsCSV()` function

3. **`ActivityLogPage.jsx`** (Modified)
   - Added `handleExportCSV()` function
   - Added export button to header
   - Updated header layout

4. **`ActivityLogPage.css`** (Modified)
   - Updated page-header for flex layout
   - Added export-btn styling

5. **`ArchivedItemsPage.jsx`** (Modified)
   - Added `handleExportCSV()` function
   - Added export button to header
   - Updated header layout

6. **`ArchivedItemsPage.css`** (Modified)
   - Added header-title-row layout
   - Added export-btn styling

7. **`StaffClaimsManagementPage.jsx`** (Modified)
   - Added `handleExportCSV()` function
   - Added export button to header
   - Updated header layout

8. **`StaffClaimsManagementPage.css`** (Modified)
   - Updated page-header for flex layout
   - Added header-content wrapper
   - Added export-btn styling

### Documentation Files

9. **`sprint4_data_export.md`** (New)
   - Comprehensive feature documentation

## Acceptance Criteria

- ✅ Backend endpoints for CSV export (items, claims, activity log)
- ✅ Staff-only access with authentication
- ✅ Buttons in staff portal for download
- ✅ Correct formatting (proper CSV with headers)
- ✅ CSV downloads work and contain correct data
- ✅ Works locally (no external dependencies)
- ✅ Activity logging for all exports
- ✅ Filter support (status, category, dates)
- ✅ Timestamped filenames
- ✅ Error handling
- ⏳ PDF export (future enhancement)

## Conclusion

Sprint 4 Issue #45 is **COMPLETE** with full CSV export functionality for items, claims, and activity logs. All exports are staff-only, properly formatted, include audit logging, and work seamlessly with browser download APIs. The system uses Python's built-in csv module requiring no external dependencies.

**Status:** ✅ Feature Complete (CSV Export)  
**PDF Export:** Future Enhancement


