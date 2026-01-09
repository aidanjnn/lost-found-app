/**
 * Staff Claims Management Page
 * Sprint 3: Staff Claiming Management UI (Front-End)
 * 
 * Comprehensive interface for staff to review and process all claims.
 * Includes filtering by status, searching, and batch operations.
 * 
 * Author: Team 15 (Ruhani, Sheehan, Aidan, Neng, Theni)
 * Sprint: 3
 */

import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { claimsAPI, authAPI } from '../services/api'
import StaffClaimCard from '../components/StaffClaimCard'
import './StaffClaimsManagementPage.css'

function StaffClaimsManagementPage() {
  const navigate = useNavigate()
  const [claims, setClaims] = useState([])
  const [filteredClaims, setFilteredClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    checkAuthAndFetchClaims()
  }, [])

  useEffect(() => {
    filterClaims()
  }, [filter, searchQuery, claims])

  const checkAuthAndFetchClaims = async () => {
    try {
      // Check authentication and staff role
      const sessionData = await authAPI.verifySession()
      if (!sessionData.valid) {
        navigate('/login')
        return
      }

      const userData = await authAPI.getCurrentUser()
      if (userData.role !== 'staff') {
        navigate('/student/dashboard')
        return
      }

      // Fetch claims
      await fetchClaims()
    } catch (error) {
      if (error.response?.status === 401) {
        navigate('/login')
      } else {
        console.error('Error:', error)
        setError('Failed to load claims')
      }
      setLoading(false)
    }
  }

  const fetchClaims = async () => {
    try {
      setLoading(true)
      setError('')
      
      const data = await claimsAPI.getClaims()
      setClaims(data.claims || [])
    } catch (error) {
      console.error('Error fetching claims:', error)
      setError('Failed to load claims')
    } finally {
      setLoading(false)
    }
  }

  const filterClaims = () => {
    let filtered = [...claims]

    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter(claim => claim.status === filter)
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(claim => 
        (claim.item_category && claim.item_category.toLowerCase().includes(query)) ||
        (claim.item_description && claim.item_description.toLowerCase().includes(query)) ||
        (claim.claimant_name && claim.claimant_name.toLowerCase().includes(query)) ||
        (claim.claimant_email && claim.claimant_email.toLowerCase().includes(query)) ||
        (claim.claim_id && claim.claim_id.toString().includes(query))
      )
    }

    setFilteredClaims(filtered)
  }

  const getFilterCounts = () => {
    return {
      all: claims.length,
      pending: claims.filter(c => c.status === 'pending').length,
      approved: claims.filter(c => c.status === 'approved').length,
      rejected: claims.filter(c => c.status === 'rejected').length,
      picked_up: claims.filter(c => c.status === 'picked_up').length
    }
  }

  const counts = useMemo(() => getFilterCounts(), [claims])
  const successRate = useMemo(() => {
    if (claims.length === 0) return '0%'
    const completed = counts.picked_up
    return `${Math.round((completed / claims.length) * 100) || 0}%`
  }, [claims.length, counts.picked_up])

  const highlightCards = useMemo(() => [
    { label: 'Pending Review', value: counts.pending, icon: '⏳' },
    { label: 'Approved', value: counts.approved, icon: '✅' },
    { label: 'Completed', value: counts.picked_up, icon: '🏁' },
    { label: 'Success Rate', value: successRate, icon: '📈' }
  ], [counts.pending, counts.approved, counts.picked_up, successRate])

  const handleExportCSV = async () => {
    try {
      const statusFilter = filter !== 'all' ? filter : null
      const response = await claimsAPI.exportClaimsCSV(statusFilter)
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `claims_${filter}_${new Date().toISOString().split('T')[0]}.csv`)
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
    <div className="staff-claims-management-page">
      <div className="page-container">
        <div className="page-header">
          <div className="header-content">
            <h1>Claims Management</h1>
            <p className="page-subtitle">Review and process student claims for lost items</p>
          </div>
          <button onClick={handleExportCSV} className="export-btn" title="Export to CSV">
            📥 Export CSV
          </button>
        </div>

        {/* Status Highlights */}
        <div className="status-highlight-grid">
          {highlightCards.map((card) => (
            <div key={card.label} className="status-highlight-card">
              <div className="status-icon-pill">{card.icon}</div>
              <div className="status-metric">
                <span className="metric-value">{card.value}</span>
                <span className="metric-label">{card.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Controls Section */}
        <div className="controls-section">
          {/* Search Bar */}
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Search by item, claimant name, email, or claim ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

          {/* Filter Tabs */}
          <div className="filter-tabs">
            <button
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All Claims
              <span className="count-badge">{counts.all}</span>
            </button>
            <button
              className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}
            >
              Pending
              <span className="count-badge pending">{counts.pending}</span>
            </button>
            <button
              className={`filter-tab ${filter === 'approved' ? 'active' : ''}`}
              onClick={() => setFilter('approved')}
            >
              Approved
              <span className="count-badge approved">{counts.approved}</span>
            </button>
            <button
              className={`filter-tab ${filter === 'rejected' ? 'active' : ''}`}
              onClick={() => setFilter('rejected')}
            >
              Rejected
              <span className="count-badge rejected">{counts.rejected}</span>
            </button>
            <button
              className={`filter-tab ${filter === 'picked_up' ? 'active' : ''}`}
              onClick={() => setFilter('picked_up')}
            >
              Picked Up
              <span className="count-badge picked-up">{counts.picked_up}</span>
            </button>
          </div>
        </div>

        {/* Results Summary */}
        {!loading && !error && (
          <div className="results-summary">
            <span className="results-text">
              Showing <strong>{filteredClaims.length}</strong> of <strong>{claims.length}</strong> claims
            </span>
            {searchQuery && (
              <span className="search-indicator">
                Filtered by: "{searchQuery}"
              </span>
            )}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading claims...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p className="error-message">{error}</p>
            <button onClick={fetchClaims} className="btn-retry">
              Try Again
            </button>
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              {searchQuery ? '🔍' : filter === 'pending' ? '⏳' : '📋'}
            </div>
            <h2>
              {searchQuery 
                ? 'No Matching Claims Found' 
                : filter === 'all' 
                  ? 'No Claims Yet' 
                  : `No ${filter.replace('_', ' ')} Claims`
              }
            </h2>
            <p>
              {searchQuery 
                ? 'Try adjusting your search query' 
                : filter === 'pending'
                  ? 'No claims are currently awaiting review'
                  : 'There are no claims in this category'
              }
            </p>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="btn-primary"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="claims-list">
            {filteredClaims.map((claim) => (
              <StaffClaimCard
                key={claim.claim_id}
                claim={claim}
                onClaimUpdated={fetchClaims}
              />
            ))}
          </div>
        )}

        {/* Quick Stats (when not loading/error) */}
        {!loading && !error && claims.length > 0 && (
          <div className="quick-stats">
            <div className="stat-card">
              <div className="stat-number">{counts.pending}</div>
              <div className="stat-label">Pending Review</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{counts.approved}</div>
              <div className="stat-label">Approved</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{counts.picked_up}</div>
              <div className="stat-label">Completed</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{successRate}</div>
              <div className="stat-label">Success Rate</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default StaffClaimsManagementPage

