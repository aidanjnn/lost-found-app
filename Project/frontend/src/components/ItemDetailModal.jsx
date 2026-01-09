/**
 * Item Detail Modal Component
 * Sprint 4: Enhanced Item Viewing
 * 
 * Beautiful full-screen modal to view all item details
 * Shows ID, name, description, category, location, dates, status, image
 * 
 * Author: Team 15
 * Sprint: 4
 */

import React from 'react'
import './ItemDetailModal.css'

function ItemDetailModal({ item, isOpen, onClose, onClaim, showClaimButton = false }) {
  const [showScrollIndicator, setShowScrollIndicator] = React.useState(false)
  const overlayRef = React.useRef(null)
  const detailsRef = React.useRef(null)

  // Auto-scroll to top when modal opens
  React.useEffect(() => {
    if (isOpen) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      document.body.style.overflow = 'hidden' // Prevent background scroll
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Check if content is scrollable and show indicator - for INNER scrollbar
  React.useEffect(() => {
    if (isOpen && detailsRef.current) {
      const checkScroll = () => {
        const details = detailsRef.current
        if (details) {
          const hasScroll = details.scrollHeight > details.clientHeight
          const isAtBottom = details.scrollHeight - details.scrollTop <= details.clientHeight + 50
          const shouldShow = hasScroll && !isAtBottom
          
          console.log('🔍 Inner Scroll Check:', {
            hasScroll,
            isAtBottom,
            shouldShow,
            scrollHeight: details.scrollHeight,
            clientHeight: details.clientHeight,
            scrollTop: details.scrollTop
          })
          
          setShowScrollIndicator(shouldShow)
        }
      }
      
      // Check immediately and after a delay for DOM to settle
      setTimeout(checkScroll, 100)
      setTimeout(checkScroll, 500)
      
      const details = detailsRef.current
      if (details) {
        details.addEventListener('scroll', checkScroll)
        window.addEventListener('resize', checkScroll)
      }
      
      return () => {
        if (details) {
          details.removeEventListener('scroll', checkScroll)
        }
        window.removeEventListener('resize', checkScroll)
      }
    }
  }, [isOpen])

  if (!isOpen || !item) return null

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return dateString
    }
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleClaimClick = () => {
    if (onClaim) {
      onClaim(item)
    }
    onClose()
  }

  return (
    <div className="item-detail-overlay" onClick={handleOverlayClick} ref={overlayRef}>
      <div className="item-detail-modal">
        
        {/* Scroll Indicator - Animated Arrow */}
        {showScrollIndicator && (
          <div className="scroll-indicator">
            <div className="scroll-arrow">↓</div>
            <span className="scroll-text">Scroll for more</span>
          </div>
        )}
        {/* Close Button */}
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="modal-content">
          {/* Left Side - Image */}
          <div className="modal-image-section">
            {item.image_url ? (
              <img src={item.image_url} alt={item.name || item.description} className="modal-item-image" />
            ) : (
              <div className="modal-no-image">
                <span className="no-image-icon">📦</span>
                <p>No Image Available</p>
              </div>
            )}
          </div>

          {/* Right Side - Details */}
          <div className="modal-details-section" ref={detailsRef}>
            {/* Header */}
            <div className="modal-header">
              <div className="modal-title-row">
                <h2 className="modal-item-name">{item.name || 'Unnamed Item'}</h2>
                <span className={`modal-status-badge ${item.status}`}>
                  {item.status === 'unclaimed' ? '✓ Available' : '✗ Claimed'}
                </span>
              </div>
              <p className="modal-item-id">Item ID: #{item.item_id}</p>
            </div>

            {/* Details Grid */}
            <div className="modal-details-grid">
              <div className="detail-card">
                <div className="detail-icon">🏷️</div>
                <div className="detail-content">
                  <label>Category</label>
                  <span>{item.category}</span>
                </div>
              </div>

              <div className="detail-card">
                <div className="detail-icon">📍</div>
                <div className="detail-content">
                  <label>Location Found</label>
                  <span>{item.location_found || item.found_by_desk}</span>
                </div>
              </div>

              <div className="detail-card">
                <div className="detail-icon">📅</div>
                <div className="detail-content">
                  <label>Date Found</label>
                  <span>{formatDate(item.date_found)}</span>
                </div>
              </div>

              <div className="detail-card">
                <div className="detail-icon">📦</div>
                <div className="detail-content">
                  <label>Pickup Location</label>
                  <span>{item.pickup_at || 'Not specified'}</span>
                </div>
              </div>
            </div>

            {/* Description Section */}
            {item.description && (
              <div className="modal-description-section">
                <h3>Description</h3>
                <p className="modal-description-text">{item.description}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="modal-actions">
              {showClaimButton && item.status === 'unclaimed' && (
                <button className="modal-claim-btn" onClick={handleClaimClick}>
                  🎯 Claim This Item
                </button>
              )}
              <button className="modal-close-btn-secondary" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ItemDetailModal

