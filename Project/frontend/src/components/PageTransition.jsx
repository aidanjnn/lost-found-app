/**
 * Page Transition Wrapper Component
 * Professional-grade page transitions for seamless navigation
 * 
 * Author: Team 15 - Premium UI Enhancement
 */

import React, { useEffect, useState } from 'react'
import './PageTransition.css'

function PageTransition({ children }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 50)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`page-transition ${isVisible ? 'page-visible' : ''}`}>
      {children}
    </div>
  )
}

export default PageTransition

