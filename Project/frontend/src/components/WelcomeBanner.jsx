/**
 * Welcome Banner Component
 * Sprint 4: Enhanced UI/UX
 * 
 * Beautiful animated welcome message shown after login
 * Displays personalized greeting with smooth animations
 * 
 * Author: Team 15
 * Sprint: 4
 */

import React, { useState, useEffect } from 'react'
import './WelcomeBanner.css'

function WelcomeBanner({ user, role }) {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if banner was dismissed in this session
    const wasDismissed = sessionStorage.getItem('welcomeBannerDismissed')
    if (wasDismissed) {
      setDismissed(true)
      return
    }

    // Animate in after a short delay
    const timer = setTimeout(() => {
      setVisible(true)
    }, 300)

    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    setVisible(false)
    setTimeout(() => {
      setDismissed(true)
      sessionStorage.setItem('welcomeBannerDismissed', 'true')
    }, 500)
  }

  if (dismissed) return null

  const getGreeting = () => {
    // Get current time in Canada/Eastern timezone (Toronto/Waterloo)
    const now = new Date()
    const canadianTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Toronto' }))
    const hour = canadianTime.getHours()
    
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const getEmoji = () => {
    if (role === 'staff') return '👋'
    return '🎓'
  }

  const getMessage = () => {
    if (role === 'staff') {
      return 'Ready to help Warriors find their belongings?'
    }
    return 'Looking for something? We\'re here to help!'
  }

  return (
    <div className={`welcome-banner ${visible ? 'visible' : ''}`}>
      <div className="welcome-banner-content">
        <div className="welcome-banner-left">
          <div className="welcome-emoji">{getEmoji()}</div>
          <div className="welcome-text">
            <h2 className="welcome-greeting">
              {getGreeting()}, <span className="welcome-name">{user?.name || 'Warrior'}!</span>
            </h2>
            <p className="welcome-message">{getMessage()}</p>
          </div>
        </div>
        <button 
          className="welcome-dismiss" 
          onClick={handleDismiss}
          aria-label="Dismiss welcome message"
        >
          ✕
        </button>
      </div>
      <div className="welcome-banner-shine"></div>
    </div>
  )
}

export default WelcomeBanner

