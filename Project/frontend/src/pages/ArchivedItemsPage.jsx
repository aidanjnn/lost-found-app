/**
 * Archived Items Page Component
 * Sprint 4: Issue #40 - Archived Items Page (Staff View of Picked-Up Items)
 * 
 * Displays all items that have been picked up by their claimants.
 * Staff can view pickup history, claimant details, and search/filter archived items.
 * 
 * Author: Team 15 (Ruhani, Sheehan, Aidan, Neng, Theni)
 * Sprint: 4
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { itemsAPI, authAPI } from '../services/api'
import './ArchivedItemsPage.css'

function ArchivedItemsPage() {
  const navigate = useNavigate()
  const [archivedItems, setArchivedItems] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Filters and search
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [sortBy, setSortBy] = useState('recent') // recent, oldest, category, location
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12
  
  // Selected item for details modal
  const [selectedItem, setSelectedItem] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Check auth and fetch on mount
  useEffect(() => {
    checkAuthAndFetchItems()
  }, [])

  const checkAuthAndFetchItems = async () => {
    try {
      // Check authentication
      const sessionData = await authAPI.verifySession()
      if (!sessionData.valid) {
        navigate('/login')
        return
      }

      // Check if user is staff
      const userData = await authAPI.getCurrentUser()
      if (userData.role !== 'staff') {
        navigate('/student/dashboard')
        return
      }

      // Fetch archived items
      await fetchArchivedItems()
    } catch (error) {
      console.error('Auth check failed:', error)
      navigate('/login')
    }
  }

  const fetchArchivedItems = async () => {
    try {
      setLoading(true)
      setError('')
      
      const data = await itemsAPI.getArchivedItems()
      setArchivedItems(data.archived_items || [])
      setFilteredItems(data.archived_items || [])
    } catch (err) {
      console.error('Error fetching archived items:', err)
      if (err.response?.status === 401) {
        navigate('/login')
      } else if (err.response?.status === 403) {
        setError('Access denied. Staff access required.')
      } else {
        setError('Failed to load archived items. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Filter and sort items whenever filters change
  useEffect(() => {
    let filtered = [...archivedItems]

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item =>
        item.name?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.location_found?.toLowerCase().includes(query) ||
        item.claim?.claimant_name?.toLowerCase().includes(query) ||
        item.claim?.claimant_email?.toLowerCase().includes(query)
      )
    }

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(item =>
        item.category?.toLowerCase() === categoryFilter.toLowerCase()
      )
    }

    // Apply location filter
    if (locationFilter) {
      filtered = filtered.filter(item =>
        item.location_found?.toLowerCase().includes(locationFilter.toLowerCase())
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.claim.updated_at) - new Date(a.claim.updated_at)
        case 'oldest':
          return new Date(a.claim.updated_at) - new Date(b.claim.updated_at)
        case 'category':
          return (a.category || '').localeCompare(b.category || '')
        case 'location':
          return (a.location_found || '').localeCompare(b.location_found || '')
        default:
          return 0
      }
    })

    setFilteredItems(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [searchQuery, categoryFilter, locationFilter, sortBy, archivedItems])

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = filteredItems.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setCategoryFilter('')
    setLocationFilter('')
    setSortBy('recent')
  }

  const hasDistinctDescription = (description, name) => {
    if (!description) return false
    if (!name) return true
    return description.trim().toLowerCase() !== name.trim().toLowerCase()
  }

  const openDetailsModal = (item) => {
    setSelectedItem(item)
    setIsModalOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const closeDetailsModal = () => {
    setIsModalOpen(false)
    setSelectedItem(null)
    document.body.style.overflow = 'unset'
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  const handleExportCSV = async () => {
    try {
      const response = await itemsAPI.exportItemsCSV('claimed')
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `archived_items_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exporting CSV:', err)
      alert('Failed to export CSV. Please try again.')
    }
  }

  return (
    <div className="archived-items-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-title-row">
            <div>
              <h1>📦 Archived Items</h1>
              <p className="page-subtitle">
                View all items that have been successfully picked up by their claimants
              </p>
            </div>
            <button onClick={handleExportCSV} className="export-btn" title="Export to CSV">
              📥 Export CSV
            </button>
          </div>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-icon">📦</span>
            <span className="stat-number">{archivedItems.length}</span>
            <span className="stat-label">Total Archived</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">👀</span>
            <span className="stat-number">{filteredItems.length}</span>
            <span className="stat-label">Showing</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="filters-section">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by item, claimant name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button
              className="clear-search"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="filter-controls">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Categories</option>
            <option value="electronics">Electronics</option>
            <option value="clothing">Clothing</option>
            <option value="cards">Cards/IDs</option>
            <option value="keys">Keys</option>
            <option value="bags">Bags</option>
            <option value="books">Books</option>
            <option value="bottles">Bottles</option>
            <option value="other">Other</option>
          </select>

          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Locations</option>
            <option value="SLC">SLC</option>
            <option value="PAC">PAC</option>
            <option value="CIF">CIF</option>
            <option value="Library">Library</option>
            <option value="DC">DC</option>
            <option value="MC">MC</option>
            <option value="E7">E7</option>
            <option value="QNC">QNC</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
            <option value="category">By Category</option>
            <option value="location">By Location</option>
          </select>

          {(searchQuery || categoryFilter || locationFilter || sortBy !== 'recent') && (
            <button className="clear-filters-btn" onClick={handleClearFilters}>
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && archivedItems.length === 0 && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading archived items...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-state">
          <p className="error-message">{error}</p>
          <button onClick={fetchArchivedItems} className="retry-button">
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredItems.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h2>
            {archivedItems.length === 0
              ? 'No Archived Items Yet'
              : 'No Items Match Your Filters'}
          </h2>
          <p>
            {archivedItems.length === 0
              ? 'Archived items will appear here once claims are marked as picked up.'
              : 'Try adjusting your search or filter criteria.'}
          </p>
        </div>
      )}

      {/* Archived Items Grid */}
      {!loading && !error && currentItems.length > 0 && (
        <>
          <div className="archived-items-grid">
            {currentItems.map((item) => (
              <div
                key={item.item_id}
                className="archived-item-card"
                onClick={() => openDetailsModal(item)}
              >
                {item.image_url && (
                  <div className="item-image-container">
                    <img
                      src={item.image_url}
                      alt={item.name || item.description || 'Archived item'}
                      className="item-image"
                    />
                  </div>
                )}
                
                <div className="item-content">
                  <div className="item-header">
                    <span className="item-category">{item.category}</span>
                    <span className="pickup-badge">✓ Picked Up</span>
                  </div>

                  {item.name && <h3 className="item-name">{item.name}</h3>}

                  {hasDistinctDescription(item.description, item.name) && (
                    <p className="item-description">{item.description}</p>
                  )}

                  <div className="item-details">
                    <div className="detail-row">
                      <span className="detail-label">Found at:</span>
                      <span className="detail-value">{item.location_found}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Claimed by:</span>
                      <span className="detail-value">{item.claim.claimant_name}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Picked up:</span>
                      <span className="detail-value">{formatDate(item.claim.updated_at)}</span>
                    </div>
                  </div>

                  <button className="view-details-btn">
                    View Full Details →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ← Previous
              </button>

              <div className="page-numbers">
                {[...Array(totalPages)].map((_, index) => {
                  const page = index + 1
                  // Show first, last, current, and nearby pages
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        className={`page-number ${currentPage === page ? 'active' : ''}`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    )
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="page-ellipsis">...</span>
                  }
                  return null
                })}
              </div>

              <button
                className="page-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Details Modal */}
      {isModalOpen && selectedItem && (
        <div className="modal-overlay" onClick={closeDetailsModal}>
          <div className="archived-modal-wrapper" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h2>Archived Item Details</h2>
                <button className="modal-close" onClick={closeDetailsModal}>×</button>
              </div>

            <div className="modal-body">
              <div className="modal-hero-layout">
                <div className="modal-media">
                  {selectedItem.image_url ? (
                    <img
                      src={selectedItem.image_url}
                      alt={selectedItem.name || selectedItem.description || 'Archived item'}
                    />
                  ) : (
                    <div className="modal-media-placeholder">
                      <span>📦</span>
                      <p>No item photo</p>
                    </div>
                  )}
                </div>

                <div className="modal-hero-details">
                  {selectedItem.name && (
                    <div className="modal-item-name-block">
                      <span className="modal-item-label">Item Name</span>
                      <h3>{selectedItem.name}</h3>
                    </div>
                  )}

                  <div className="modal-summary">
                    {selectedItem.item_id && (
                      <div className="summary-pill">
                        <span className="summary-label">Item ID</span>
                        <span className="summary-value">#{selectedItem.item_id}</span>
                      </div>
                    )}
                    {selectedItem.claim?.claim_id && (
                      <div className="summary-pill">
                        <span className="summary-label">Claim ID</span>
                        <span className="summary-value">#{selectedItem.claim.claim_id}</span>
                      </div>
                    )}
                    {selectedItem.claim?.claimant_name && (
                      <div className="summary-pill accent">
                        <span className="summary-label">Claimant</span>
                        <span className="summary-value">{selectedItem.claim.claimant_name}</span>
                      </div>
                    )}
                  </div>

                  <div className="modal-quick-facts">
                    <div className="fact-chip">
                      <span>Category</span>
                      <strong>{selectedItem.category || 'N/A'}</strong>
                    </div>
                    <div className="fact-chip">
                      <span>Found At</span>
                      <strong>{selectedItem.location_found || 'N/A'}</strong>
                    </div>
                    <div className="fact-chip">
                      <span>Pickup Location</span>
                      <strong>{selectedItem.pickup_at || 'N/A'}</strong>
                    </div>
                    {selectedItem.claim?.updated_at && (
                      <div className="fact-chip">
                        <span>Picked Up</span>
                        <strong>{formatDate(selectedItem.claim.updated_at)}</strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-details-stack">
                <div className="details-section">
                  <h3>Item Information</h3>
                  <div className="detail-grid">
                    {selectedItem.name && (
                      <div className="detail-item">
                        <strong>Name:</strong>
                        <span>{selectedItem.name}</span>
                      </div>
                    )}
                    <div className="detail-item">
                      <strong>Category:</strong>
                      <span>{selectedItem.category}</span>
                    </div>
                    {hasDistinctDescription(selectedItem.description, selectedItem.name) && (
                      <div className="detail-item">
                        <strong>Description:</strong>
                        <span>{selectedItem.description || 'N/A'}</span>
                      </div>
                    )}
                    <div className="detail-item">
                      <strong>Found at:</strong>
                      <span>{selectedItem.location_found}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Pickup Location:</strong>
                      <span>{selectedItem.pickup_at}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Date Found:</strong>
                      <span>{formatDate(selectedItem.date_found)}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Found by Desk:</strong>
                      <span>{selectedItem.found_by_desk}</span>
                    </div>
                  </div>
                </div>

                <div className="details-section">
                  <h3>Claimant Information</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <strong>Name:</strong>
                      <span>{selectedItem.claim.claimant_name}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Email:</strong>
                      <span>{selectedItem.claim.claimant_email}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Phone:</strong>
                      <span>{selectedItem.claim.claimant_phone || 'Not provided'}</span>
                    </div>
                    <div className="detail-item full-width">
                      <strong>Verification Details:</strong>
                      <p className="verification-text">{selectedItem.claim.verification_text}</p>
                    </div>
                  </div>
                </div>

                <div className="details-section">
                  <h3>Pickup Information</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <strong>Claim Submitted:</strong>
                      <span>{formatDate(selectedItem.claim.created_at)}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Picked Up:</strong>
                      <span>{formatDate(selectedItem.claim.updated_at)}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Processed By:</strong>
                      <span>{selectedItem.claim.processed_by_staff_name || 'N/A'}</span>
                    </div>
                    {selectedItem.claim.staff_notes && (
                      <div className="detail-item full-width">
                        <strong>Staff Notes:</strong>
                        <p className="staff-notes">{selectedItem.claim.staff_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

              <div className="modal-footer">
                <button className="close-modal-btn" onClick={closeDetailsModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ArchivedItemsPage

