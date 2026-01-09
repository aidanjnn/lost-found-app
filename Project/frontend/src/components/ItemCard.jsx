/**
 * Item Card Component
 * Sprint 3: Item Claiming UI (Front-End)
 * 
 * Displays a single lost item in a card format.
 * Shows image, description, category, location, date, and status.
 * Includes "Claim Item" button for unclaimed items.
 * 
 * Author: Team 15 (Ruhani, Sheehan, Aidan, Neng, Theni)
 * Sprint: 3
 */

import React, { useState } from 'react'
import ClaimModal from './ClaimModal'
import './ItemCard.css'

function ItemCard({ item, showClaimButton = false, onClaimSuccess, onViewDetails }) {
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false)

  const handleOpenModal = () => {
    setIsClaimModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsClaimModalOpen(false)
  }

  const handleClaimSuccess = () => {
    setIsClaimModalOpen(false)
    if (onClaimSuccess) {
      onClaimSuccess()
    }
  }

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(item)
    }
  }
  // Format date for display
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

  // Get status badge class
  const getStatusClass = (status) => {
    switch (status) {
      case 'claimed':
        return 'status-claimed'
      case 'unclaimed':
        return 'status-unclaimed'
      default:
        return 'status-unknown'
    }
  }

  // Get status display text
  const getStatusText = (status) => {
    switch (status) {
      case 'claimed':
        return 'Claimed'
      case 'unclaimed':
        return 'Available'
      default:
        return status
    }
  }

  return (
    <div className="item-card">
      {item.image_url && (
        <div className="item-image-container">
          <img 
            src={item.image_url} 
            alt={item.description || 'Lost item'} 
            className="item-image"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
          <div className="item-image-placeholder" style={{ display: 'none' }}>
            <span>No Image</span>
          </div>
        </div>
      )}
      
      <div className="item-content">
        <div className="item-header">
          <div className="item-title-section">
            <h3 className="item-name">{item.name || 'Unnamed Item'}</h3>
            <span className="item-id">ID: #{item.item_id}</span>
          </div>
          <span className={`status-badge ${getStatusClass(item.status)}`}>
            {getStatusText(item.status)}
          </span>
        </div>
        
        <div className="item-quick-info">
          <span className="quick-info-item">
            <span className="info-icon">🏷️</span>
            {item.category}
          </span>
          <span className="quick-info-item">
            <span className="info-icon">📍</span>
            {item.location_found || 'Unknown'}
          </span>
          <span className="quick-info-item">
            <span className="info-icon">📦</span>
            {item.pickup_at || 'N/A'}
          </span>
        </div>

        {/* Action buttons */}
        <div className="item-card-actions">
          <button 
            className="btn-view-details"
            onClick={handleViewDetails}
            title="View full details"
          >
            👁️ View Details
          </button>
          
          {/* Claim button - only show for unclaimed items and when enabled */}
          {showClaimButton && item.status === 'unclaimed' && (
            <button 
              className="btn-claim-item"
              onClick={handleOpenModal}
            >
              🎯 Claim Item
            </button>
          )}
        </div>
      </div>

      {/* Claim Modal - Only render when open */}
      {isClaimModalOpen && (
        <ClaimModal
          item={item}
          isOpen={isClaimModalOpen}
          onClose={handleCloseModal}
          onClaimSuccess={handleClaimSuccess}
        />
      )}
    </div>
  )
}

export default ItemCard

