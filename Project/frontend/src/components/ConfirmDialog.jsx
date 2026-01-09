/**
 * Confirm Dialog Component - COMPLETE REWRITE
 * Simple, bulletproof delete confirmation modal
 */

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import './ConfirmDialog.css'

function ConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Delete',
  message = 'Are you sure you want to delete this item?',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  type = 'danger'
}) {
  console.log('[ConfirmDialog] Render - isOpen:', isOpen)

  const [overlayInteractive, setOverlayInteractive] = useState(false)

  // Lock body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      console.log('[ConfirmDialog] Locking body scroll')
      document.body.style.overflow = 'hidden'
      setOverlayInteractive(false)
      const timer = setTimeout(() => {
        setOverlayInteractive(true)
      }, 200)
      return () => {
        clearTimeout(timer)
        document.body.style.overflow = ''
      }
    } else {
      console.log('[ConfirmDialog] Unlocking body scroll')
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) {
    console.log('[ConfirmDialog] Not open, returning null')
    return null
  }

  const handleConfirm = (e) => {
    console.log('[ConfirmDialog] Confirm button clicked')
    e.preventDefault()
    e.stopPropagation()
    if (onConfirm) {
      console.log('[ConfirmDialog] Calling onConfirm callback')
      onConfirm()
    } else {
      console.error('[ConfirmDialog] No onConfirm callback provided!')
    }
  }

  const handleCancel = (e) => {
    console.log('[ConfirmDialog] Cancel button clicked')
    e.preventDefault()
    e.stopPropagation()
    if (onClose) {
      console.log('[ConfirmDialog] Calling onClose callback')
      onClose()
    } else {
      console.error('[ConfirmDialog] No onClose callback provided!')
    }
  }

  const handleOverlayClick = (e) => {
    console.log('[ConfirmDialog] Overlay clicked')
    // Prevent immediate accidental dismissal by ignoring overlay clicks entirely.
    e.preventDefault()
    e.stopPropagation()
    if (!overlayInteractive) {
      console.log('[ConfirmDialog] Overlay click ignored (debounce)')
    }
  }

  const handleDialogClick = (e) => {
    console.log('[ConfirmDialog] Dialog box clicked')
    e.stopPropagation()
  }

  console.log('[ConfirmDialog] Rendering dialog with portal')

  const dialogContent = (
    <div 
      className="confirm-dialog-overlay" 
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '10vh 1rem 6vh',
        overflowY: 'auto'
      }}
    >
      <div 
        className="confirm-dialog-box"
        onClick={handleDialogClick}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '0',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          boxShadow: '0 25px 80px rgba(0,0,0,0.45)',
          zIndex: 1000000,
          position: 'relative',
          animation: 'slideInCenter 0.28s ease-out',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '28px 32px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: type === 'danger' ? '#fef2f2' : '#f9fafb',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px'
        }}>
          <span style={{ fontSize: '32px' }}>🗑️</span>
          <h3 style={{ 
            margin: 0, 
            fontSize: '22px', 
            fontWeight: 700, 
            color: '#111827' 
          }}>
            {title}
          </h3>
        </div>
        
        {/* Content */}
        <div style={{
          padding: '32px',
          color: '#374151',
          fontSize: '17px',
          lineHeight: '1.6',
          overflowY: 'auto',
          maxHeight: '45vh'
        }}>
          <p style={{ margin: 0 }}>{message}</p>
        </div>
        
        {/* Actions */}
        <div style={{
          padding: '24px 32px',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '16px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
          borderBottomLeftRadius: '12px',
          borderBottomRightRadius: '12px'
        }}>
          <button 
            type="button"
            onClick={handleCancel}
            style={{
              padding: '14px 28px',
              borderRadius: '8px',
              border: '2px solid #d1d5db',
              backgroundColor: '#ffffff',
              color: '#374151',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              minWidth: '120px'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#f3f4f6'
              e.target.style.borderColor = '#9ca3af'
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#ffffff'
              e.target.style.borderColor = '#d1d5db'
            }}
          >
            {cancelText}
          </button>
          <button 
            type="button"
            onClick={handleConfirm}
            style={{
              padding: '14px 28px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              minWidth: '120px',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#b91c1c'
              e.target.style.transform = 'scale(1.02)'
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#dc2626'
              e.target.style.transform = 'scale(1)'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )

  // Render dialog using portal to place it at document body level
  return createPortal(dialogContent, document.body)
}

export default ConfirmDialog
