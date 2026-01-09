/**
 * My Claims Page
 * Sprint 3: Item Claiming UI (Front-End)
 * 
 * Shows the student's claim history with status badges.
 * Allows students to track their submitted claims.
 * 
 * Author: Team 15 (Ruhani, Sheehan, Aidan, Neng, Theni)
 * Sprint: 3
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { claimsAPI, authAPI } from '../services/api'
import './MyClaimsPage.css'

function MyClaimsPage() {
  const navigate = useNavigate()
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    checkAuthAndFetchClaims()
  }, [filter])

  const checkAuthAndFetchClaims = async () => {
    try {
      // Check authentication
      await authAPI.verifySession()
      
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
      
      const filters = filter === 'all' ? {} : { status: filter }
      const data = await claimsAPI.getClaims(filters)
      
      setClaims(data.claims || [])
    } catch (error) {
      console.error('Error fetching claims:', error)
      setError('Failed to load claims')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Date unknown'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return dateString
    }
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'claim-status-pending'
      case 'approved':
        return 'claim-status-approved'
      case 'rejected':
        return 'claim-status-rejected'
      case 'picked_up':
        return 'claim-status-picked-up'
      default:
        return 'claim-status-unknown'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending Review'
      case 'approved':
        return 'Approved'
      case 'rejected':
        return 'Rejected'
      case 'picked_up':
        return 'Picked Up'
      default:
        return status
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return '⏳'
      case 'approved':
        return '✓'
      case 'rejected':
        return '✗'
      case 'picked_up':
        return '📦'
      default:
        return '•'
    }
  }

  return (
    <div className="my-claims-page">
      <div className="page-container">
        <div className="page-header">
          <h1>My Claims</h1>
          <p className="page-subtitle">Track your submitted claims and their status</p>
        </div>

        {/* Filter Tabs */}
        <div className="claims-filters">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Claims
          </button>
          <button
            className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button
            className={`filter-tab ${filter === 'approved' ? 'active' : ''}`}
            onClick={() => setFilter('approved')}
          >
            Approved
          </button>
          <button
            className={`filter-tab ${filter === 'picked_up' ? 'active' : ''}`}
            onClick={() => setFilter('picked_up')}
          >
            Picked Up
          </button>
          <button
            className={`filter-tab ${filter === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilter('rejected')}
          >
            Rejected
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading your claims...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p className="error-message">{error}</p>
            <button onClick={fetchClaims} className="btn-retry">
              Try Again
            </button>
          </div>
        ) : claims.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h2>No Claims Yet</h2>
            <p>You haven't submitted any claims yet.</p>
            <button 
              onClick={() => navigate('/student/dashboard')}
              className="btn-primary"
            >
              Browse Lost Items
            </button>
          </div>
        ) : (
          <div className="claims-list">
            {claims.map((claim) => (
              <div key={claim.claim_id} className="claim-card">
                {/* Item Image */}
                {claim.item_image_url && (
                  <div className="claim-item-image">
                    <img src={claim.item_image_url} alt={claim.item_description || 'Item'} />
                  </div>
                )}
                
                <div className="claim-content">
                  <div className="claim-header">
                    <div className="claim-title-section">
                      <h3 className="claim-item-category">
                        {claim.item_category || 'Item'}
                      </h3>
                      <span className={`claim-status-badge ${getStatusBadgeClass(claim.status)}`}>
                        <span className="status-icon">{getStatusIcon(claim.status)}</span>
                        {getStatusText(claim.status)}
                      </span>
                    </div>
                    <div className="claim-ids">
                      <div className="claim-id">Claim ID: #{claim.claim_id}</div>
                      {claim.item_id && <div className="item-id">Item ID: #{claim.item_id}</div>}
                    </div>
                  </div>

                  <div className="claim-body">
                  {claim.item_description && (
                    <div className="claim-detail">
                      <span className="detail-label">Item Description:</span>
                      <span className="detail-value">{claim.item_description}</span>
                    </div>
                  )}
                  
                  <div className="claim-detail">
                    <span className="detail-label">Pickup Location:</span>
                    <span className="detail-value pickup-location">
                      {claim.item_pickup_location || 'N/A'}
                    </span>
                  </div>

                  <div className="claim-detail">
                    <span className="detail-label">Your Verification:</span>
                    <p className="verification-text">{claim.verification_text}</p>
                  </div>

                  {claim.staff_notes && (
                    <div className="claim-detail staff-notes-section">
                      <span className="detail-label">Staff Notes:</span>
                      <p className="staff-notes">{claim.staff_notes}</p>
                    </div>
                  )}

                  <div className="claim-timestamps">
                    <small>
                      Submitted: {formatDate(claim.created_at)}
                    </small>
                    {claim.updated_at !== claim.created_at && (
                      <small>
                        Updated: {formatDate(claim.updated_at)}
                      </small>
                    )}
                  </div>
                </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyClaimsPage

