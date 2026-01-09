/**
 * Claim Modal Component
 * Sprint 3: Item Claiming UI (Front-End)
 * 
 * Modal for students to submit claims for lost items.
 * Pre-fills user information from session and allows verification text entry.
 * 
 * Author: Team 15 (Ruhani, Sheehan, Aidan, Neng, Theni)
 * Sprint: 3
 */

import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { claimsAPI, authAPI } from '../services/api'
import toast from 'react-hot-toast'
import './ClaimModal.css'

function ClaimModal({ item, isOpen, onClose, onClaimSuccess }) {
  const [formData, setFormData] = useState({
    verificationText: '',
    phone: ''
  })
  const [userInfo, setUserInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Fetch user info when modal opens and lock body scroll + scroll to top
  useEffect(() => {
    if (isOpen) {
      // Lock body scroll
      document.body.style.overflow = 'hidden'
      
      // Scroll to top of page IMMEDIATELY (not smooth - instant!)
      window.scrollTo({ top: 0, behavior: 'instant' })
      
      // Force scroll again after a tiny delay to ensure it takes
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'instant' })
      }, 10)
      
      fetchUserInfo()
      setFormData({ verificationText: '', phone: '' })
      setError('')
      setSuccess(false)
    } else {
      // Unlock body scroll
      document.body.style.overflow = 'unset'
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const fetchUserInfo = async () => {
    try {
      const data = await authAPI.getCurrentUser()
      setUserInfo(data.user)
    } catch (error) {
      console.error('Error fetching user info:', error)
      setError('Failed to load user information')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate verification text
    if (!formData.verificationText.trim()) {
      const msg = 'Please provide verification details'
      setError(msg)
      toast.error(msg)
      return
    }

    if (formData.verificationText.trim().length < 10) {
      const msg = 'Verification details must be at least 10 characters'
      setError(msg)
      toast.error(msg)
      return
    }

    setLoading(true)
    setError('')

    try {
      const claimData = {
        item_id: item.item_id,
        verification_text: formData.verificationText.trim(),
        phone: formData.phone.trim() || undefined
      }

      await claimsAPI.createClaim(claimData)
      setSuccess(true)
      
      // Success toast
      toast.success('Claim submitted successfully! 🎉', {
        duration: 3000,
      })
      
      // Wait a moment for user to see success message, then close
      setTimeout(() => {
        onClaimSuccess && onClaimSuccess()
        onClose()
      }, 1500)
      
    } catch (error) {
      console.error('Error submitting claim:', error)
      let errorMsg = ''
      
      if (error.response?.data?.error) {
        errorMsg = error.response.data.error
      } else {
        errorMsg = 'Failed to submit claim. Please try again.'
      }
      
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  // Don't render anything if modal is not open
  if (!isOpen) {
    return null
  }

  // Render modal using React Portal to ensure it's always at the root level
  const modalContent = (
    <div className="claim-modal-overlay" onClick={onClose} aria-modal="true" role="dialog">
      <div className="claim-modal-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Close Button - Top Right */}
        <button className="claim-modal-close" onClick={onClose} aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Header with Icon */}
        <div className="claim-modal-header">
          <div className="claim-icon-wrapper">
            <div className="claim-icon">🎯</div>
          </div>
          <h2 className="claim-modal-title">Claim This Item</h2>
          <p className="claim-modal-subtitle">
            Fill out the form below to claim "{item.name || item.description}"
          </p>
        </div>

        {success ? (
          <div className="claim-modal-body">
            <div className="claim-success-animation">
              <div className="success-checkmark">
                <div className="check-icon">
                  <span className="icon-line line-tip"></span>
                  <span className="icon-line line-long"></span>
                  <div className="icon-circle"></div>
                  <div className="icon-fix"></div>
                </div>
              </div>
              <h3 className="success-title">Claim Submitted Successfully!</h3>
              <p className="success-text">
                Your claim has been submitted for review. Check "My Claims" to track its status.
              </p>
            </div>
          </div>
        ) : (
          <div className="claim-modal-body">
              {/* Item Info Card */}
              <div className="claim-info-card item-details-card">
                <div className="card-header">
                  <div className="card-icon">📦</div>
                  <h3>Item Details</h3>
                </div>
                <div className="card-content">
                  {item.image_url && (
                    <div className="item-preview-image">
                      <img src={item.image_url} alt={item.name || item.description} />
                    </div>
                  )}
                  <div className="info-grid-modern">
                    <div className="info-item">
                      <span className="info-icon">🏷️</span>
                      <div className="info-details">
                        <span className="info-label">Category</span>
                        <span className="info-value">{item.category}</span>
                      </div>
                    </div>
                    {item.name && (
                      <div className="info-item">
                        <span className="info-icon">📝</span>
                        <div className="info-details">
                          <span className="info-label">Name</span>
                          <span className="info-value">{item.name}</span>
                        </div>
                      </div>
                    )}
                    <div className="info-item">
                      <span className="info-icon">📍</span>
                      <div className="info-details">
                        <span className="info-label">Found at</span>
                        <span className="info-value">{item.location_found}</span>
                      </div>
                    </div>
                    <div className="info-item">
                      <span className="info-icon">🏢</span>
                      <div className="info-details">
                        <span className="info-label">Pickup at</span>
                        <span className="info-value">{item.pickup_at}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Info Card */}
              {userInfo && (
                <div className="claim-info-card user-info-card">
                  <div className="card-header">
                    <div className="card-icon">👤</div>
                    <h3>Your Information</h3>
                  </div>
                  <div className="card-content">
                    <div className="info-grid-modern">
                      <div className="info-item">
                        <span className="info-icon">👤</span>
                        <div className="info-details">
                          <span className="info-label">Name</span>
                          <span className="info-value">{userInfo.name}</span>
                        </div>
                      </div>
                      <div className="info-item">
                        <span className="info-icon">✉️</span>
                        <div className="info-details">
                          <span className="info-label">Email</span>
                          <span className="info-value">{userInfo.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Claim Form Card */}
              <div className="claim-info-card claim-form-card">
                <div className="card-header">
                  <div className="card-icon">✍️</div>
                  <h3>Verification Required</h3>
                </div>
                <div className="card-content">
                  <form onSubmit={handleSubmit} className="claim-form-modern">
                    <div className="form-group-modern">
                      <label htmlFor="verificationText" className="form-label-modern">
                        <span className="label-icon">🔍</span>
                        <span>Verification Details <span className="required-star">*</span></span>
                      </label>
                      <div className="input-wrapper">
                        <textarea
                          id="verificationText"
                          name="verificationText"
                          value={formData.verificationText}
                          onChange={handleChange}
                          className="form-textarea-modern"
                          placeholder="Describe the item in detail to prove it's yours. Include specific details like brand, color, contents, unique features, serial numbers, etc."
                          rows="5"
                          required
                        />
                        <div className="char-counter">
                          {formData.verificationText.length} / 10 min
                        </div>
                      </div>
                      <small className="form-hint-modern">
                        💡 Tip: Include specific details that only the owner would know
                      </small>
                    </div>

                    <div className="form-group-modern">
                      <label htmlFor="phone" className="form-label-modern">
                        <span className="label-icon">📱</span>
                        <span>Phone Number <span className="optional-badge">Optional</span></span>
                      </label>
                      <div className="input-wrapper">
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="form-input-modern"
                          placeholder="519-555-0123"
                        />
                      </div>
                      <small className="form-hint-modern">
                        📞 Staff may contact you at this number if needed
                      </small>
                    </div>

                    {error && (
                      <div className="error-alert-modern">
                        <span className="error-icon">⚠️</span>
                        <span>{error}</span>
                      </div>
                    )}

                    <div className="form-actions-modern">
                      <button
                        type="button"
                        className="btn-cancel-modern"
                        onClick={onClose}
                        disabled={loading}
                      >
                        <span>Cancel</span>
                      </button>
                      <button
                        type="submit"
                        className="btn-submit-modern"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="loading-spinner"></span>
                            <span>Submitting...</span>
                          </>
                        ) : (
                          <>
                            <span>🎯</span>
                            <span>Submit Claim</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
        )}
      </div>
    </div>
  )

  // Use React Portal to render modal at root level
  return ReactDOM.createPortal(
    modalContent,
    document.body
  )
}

export default ClaimModal

