/**
 * Login Success Notification Component
 * Sprint 4: Enhanced UI/UX
 * 
 * Beautiful animated notification that appears after successful login
 * Slides in from the top and displays for a few seconds
 * 
 * Author: Team 15
 * Sprint: 4
 */

import React, { useState, useEffect } from 'react'
import './LoginSuccessNotification.css'

function LoginSuccessNotification({ userName, userRole, onComplete }) {
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    // Slide in after a short delay
    const slideInTimer = setTimeout(() => {
      setVisible(true)
    }, 100)

    // Start sliding out after 2.5 seconds
    const slideOutTimer = setTimeout(() => {
      setLeaving(true)
    }, 2500)

    // Complete animation and call callback
    const completeTimer = setTimeout(() => {
      setVisible(false)
      if (onComplete) {
        onComplete()
      }
    }, 3000)

    return () => {
      clearTimeout(slideInTimer)
      clearTimeout(slideOutTimer)
      clearTimeout(completeTimer)
    }
  }, [onComplete])

  const getMessage = () => {
    if (userRole === 'staff') {
      return 'Welcome to Staff Dashboard'
    }
    return 'Welcome to Student Dashboard'
  }

  const getIcon = () => {
    if (userRole === 'staff') {
      return '🎯'
    }
    return '🎓'
  }

  return (
    <div className={`login-success-notification ${visible ? 'visible' : ''} ${leaving ? 'leaving' : ''}`}>
      <div className="notification-content">
        <div className="notification-icon-wrapper">
          <div className="notification-icon">{getIcon()}</div>
          <div className="notification-checkmark">✓</div>
        </div>
        <div className="notification-text">
          <h2 className="notification-title">Welcome, {userName}!</h2>
          <p className="notification-message">{getMessage()}</p>
        </div>
      </div>
      <div className="notification-progress-bar"></div>
    </div>
  )
}

export default LoginSuccessNotification

