/**
 * Staff Claim Card Component
 * Sprint 3: Staff Claiming Management UI (Front-End)
 * 
 * Displays a claim card with action buttons for staff to process claims.
 * Shows claimant info, item details, and allows approve/reject/pickup actions.
 * 
 * Author: Team 15 (Ruhani, Sheehan, Aidan, Neng, Theni)
 * Sprint: 3
 */

import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { claimsAPI } from '../services/api'
import './StaffClaimCard.css'

function StaffClaimCard({ claim, onClaimUpdated }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showNotesInput, setShowNotesInput] = useState(false)
  const [staffNotes, setStaffNotes] = useState(claim.staff_notes || '')
  const [error, setError] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingStatus, setPendingStatus] = useState(null)

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
        return 'status-pending'
      case 'approved':
        return 'status-approved'
      case 'rejected':
        return 'status-rejected'
      case 'picked_up':
        return 'status-picked-up'
      default:
        return 'status-unknown'
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

  const itemTitle = claim.item_name || claim.item_category || claim.item_description || (claim.item_id ? `Item #${claim.item_id}` : 'Item')

  const handleStatusUpdate = (newStatus, e) => {
    console.log('🟡 [CLAIM] Button clicked! Status:', newStatus)
    
    // Prevent any event bubbling
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    console.log('🟡 [CLAIM] Is processing:', isProcessing)
    console.log('🟡 [CLAIM] Confirm open:', confirmOpen)
    
    if (isProcessing) {
      console.warn('⚠️ [CLAIM] Already processing, ignoring click')
      return
    }
    
    if (confirmOpen) {
      console.warn('⚠️ [CLAIM] Dialog already open, ignoring click')
      return
    }
    
    console.log('🔵 [CLAIM] Setting pending status to:', newStatus)
    setPendingStatus(newStatus)
    
    console.log('🔵 [CLAIM] Opening confirm dialog')
    setConfirmOpen(true)
    
    console.log('✅ [CLAIM] Confirm dialog opened')
  }

  const handleCancelConfirm = () => {
    if (isProcessing) return
    setConfirmOpen(false)
    setPendingStatus(null)
  }

  const confirmStatusUpdate = async () => {
    console.log('🔵 [CLAIM UPDATE] Starting update for claim:', claim.claim_id)
    console.log('🔵 [CLAIM UPDATE] Pending status:', pendingStatus)
    console.log('🔵 [CLAIM UPDATE] Staff notes:', staffNotes)
    
    if (!pendingStatus) {
      console.error('❌ [CLAIM UPDATE] No pending status!')
      return
    }

    setIsProcessing(true)
    setError('')

    try {
      console.log('🔵 [CLAIM UPDATE] Calling API...')
      const result = await claimsAPI.updateClaimStatus(claim.claim_id, {
        status: pendingStatus,
        staff_notes: staffNotes.trim() || undefined
      })
      console.log('✅ [CLAIM UPDATE] API Success:', result)

      // Show success toast
      toast.success(`Claim ${pendingStatus === 'picked_up' ? 'marked as picked up' : pendingStatus} successfully!`)

      // Small delay to ensure toast is visible before refresh
      await new Promise(resolve => setTimeout(resolve, 300))

      // Call parent callback to refresh claims
      if (onClaimUpdated) {
        console.log('🔵 [CLAIM UPDATE] Calling parent refresh...')
        await onClaimUpdated()
      }
      
      setPendingStatus(null)
      console.log('✅ [CLAIM UPDATE] Complete!')
    } catch (error) {
      console.error('❌ [CLAIM UPDATE] Error:', error)
      console.error('❌ [CLAIM UPDATE] Error response:', error.response)
      const errorMsg = error.response?.data?.error || 'Failed to update claim status'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setPendingStatus(null)
      setConfirmOpen(false)
      // Ensure processing is always reset
      setTimeout(() => {
        setIsProcessing(false)
      }, 100)
    }
  }

  const getConfirmMessage = () => {
    const messages = {
      approved: 'Are you sure you want to approve this claim? The claimant will be notified that their claim has been approved.',
      rejected: 'Are you sure you want to reject this claim? The claimant will be notified that their claim has been rejected.',
      picked_up: 'Are you sure the item has been picked up? This will mark the item as claimed and close the claim.'
    }
    return messages[pendingStatus] || 'Are you sure you want to update this claim?'
  }

  const getConfirmTitle = () => {
    const titles = {
      approved: 'Approve Claim',
      rejected: 'Reject Claim',
      picked_up: 'Confirm Pickup'
    }
    return titles[pendingStatus] || 'Confirm Action'
  }

  const canApprove = claim.status === 'pending' || claim.status === 'rejected'
  const canReject = claim.status === 'pending' || claim.status === 'approved'
  const canMarkPickedUp = claim.status === 'approved'
  const isFinalized = claim.status === 'picked_up'

  return (
    <div className={`staff-claim-card ${isExpanded ? 'expanded' : ''}`}>
      {/* Card Header */}
      <div className="claim-card-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="header-left">
          <div className="id-stack">
            <div className="claim-id">Claim #{claim.claim_id}</div>
            {claim.item_id && <span className="item-id-chip">Item #{claim.item_id}</span>}
          </div>
          <span className={`status-badge ${getStatusBadgeClass(claim.status)}`}>
            <span className="status-icon">{getStatusIcon(claim.status)}</span>
            {getStatusText(claim.status)}
          </span>
        </div>
        
        <div className="header-right">
          <div className="header-info">
            <div className="item-category">{itemTitle}</div>
            <div className="claim-date">{formatDate(claim.created_at)}</div>
          </div>
          <button className="expand-button" aria-label={isExpanded ? 'Collapse' : 'Expand'}>
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="claim-card-body">
          {/* Item Information */}
          <div className="info-section">
            <h4>📦 Item Information</h4>
            <div className="info-grid">
              {itemTitle && (
                <div className="info-row">
                  <span className="label">Name:</span>
                  <span className="value">{itemTitle}</span>
                </div>
              )}
              <div className="info-row">
                <span className="label">Category:</span>
                <span className="value">{claim.item_category || 'N/A'}</span>
              </div>
              {claim.item_id && (
                <div className="info-row">
                  <span className="label">Item ID:</span>
                  <span className="value">#{claim.item_id}</span>
                </div>
              )}
              {claim.item_description && (
                <div className="info-row">
                  <span className="label">Description:</span>
                  <span className="value">{claim.item_description}</span>
                </div>
              )}
              <div className="info-row">
                <span className="label">Pickup Location:</span>
                <span className="value highlight">{claim.item_pickup_location || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Claimant Information */}
          <div className="info-section">
            <h4>👤 Claimant Information</h4>
            <div className="info-grid">
              <div className="info-row">
                <span className="label">Name:</span>
                <span className="value">{claim.claimant_name}</span>
              </div>
              <div className="info-row">
                <span className="label">Email:</span>
                <span className="value">{claim.claimant_email}</span>
              </div>
              {claim.claimant_phone && (
                <div className="info-row">
                  <span className="label">Phone:</span>
                  <span className="value">{claim.claimant_phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Verification Text */}
          <div className="info-section">
            <h4>🔍 Verification Details</h4>
            <div className="verification-box">
              {claim.verification_text}
            </div>
          </div>

          {/* Staff Notes Section */}
          <div className="info-section">
            <h4>📝 Staff Notes</h4>
            {showNotesInput || !claim.staff_notes ? (
              <div className="notes-input-section">
                <textarea
                  value={staffNotes}
                  onChange={(e) => setStaffNotes(e.target.value)}
                  placeholder="Add notes about this claim (optional)"
                  rows="3"
                  className="notes-textarea"
                  disabled={isFinalized}
                />
                {!isFinalized && (
                  <button
                    onClick={() => setShowNotesInput(false)}
                    className="btn-cancel-notes"
                    disabled={isProcessing}
                  >
                    Cancel
                  </button>
                )}
              </div>
            ) : (
              <div className="notes-display-section">
                <div className="notes-box">{claim.staff_notes}</div>
                {!isFinalized && (
                  <button
                    onClick={() => setShowNotesInput(true)}
                    className="btn-edit-notes"
                  >
                    Edit Notes
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Timestamps */}
          <div className="claim-timestamps">
            <small>Submitted: {formatDate(claim.created_at)}</small>
            {claim.updated_at !== claim.created_at && (
              <small>Last Updated: {formatDate(claim.updated_at)}</small>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          {!isFinalized && (
            <div className="action-area">
              {!confirmOpen ? (
                <div className="action-buttons">
                  {canApprove && (
                    <button
                      onClick={(e) => handleStatusUpdate('approved', e)}
                      className="btn-action btn-approve"
                      disabled={isProcessing}
                      type="button"
                    >
                      {isProcessing && pendingStatus === 'approved' ? 'Processing...' : '✓ Approve'}
                    </button>
                  )}
                  {canReject && (
                    <button
                      onClick={(e) => handleStatusUpdate('rejected', e)}
                      className="btn-action btn-reject"
                      disabled={isProcessing}
                      type="button"
                    >
                      {isProcessing && pendingStatus === 'rejected' ? 'Processing...' : '✗ Reject'}
                    </button>
                  )}
                  {canMarkPickedUp && (
                    <button
                      onClick={(e) => handleStatusUpdate('picked_up', e)}
                      className="btn-action btn-picked-up"
                      disabled={isProcessing}
                      type="button"
                    >
                      {isProcessing && pendingStatus === 'picked_up' ? 'Processing...' : '📦 Mark as Picked Up'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="action-buttons confirm-mode">
                  <div className={`inline-confirm-card confirm-${pendingStatus || 'pending'}`}>
                    <div className="confirm-copy">
                      <p className="confirm-label">{getConfirmTitle()}</p>
                      <p className="confirm-message">{getConfirmMessage()}</p>
                    </div>
                    <div className="inline-confirm-actions">
                      <button
                        className="btn-inline-confirm confirm-yes"
                        onClick={confirmStatusUpdate}
                        disabled={isProcessing}
                      >
                        {isProcessing ? 'Processing...' : 'Yes, continue'}
                      </button>
                      <button
                        className="btn-inline-confirm confirm-no"
                        onClick={handleCancelConfirm}
                        disabled={isProcessing}
                      >
                        No, go back
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {isFinalized && (
            <div className="finalized-message">
              ✅ This claim has been finalized and cannot be modified.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default StaffClaimCard

