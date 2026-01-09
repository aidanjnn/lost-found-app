/**
 * Premium Loading Spinner Component
 * Beautiful, smooth loading indicators
 * 
 * Author: Team 15 - Premium UI Enhancement
 */

import React from 'react'
import './PremiumLoader.css'

function PremiumLoader({ size = 'medium', fullPage = false, text = '' }) {
  const sizeClass = `loader-${size}`
  
  if (fullPage) {
    return (
      <div className="loader-fullpage">
        <div className={`premium-loader ${sizeClass}`}>
          <div className="loader-ring"></div>
          <div className="loader-ring"></div>
          <div className="loader-ring"></div>
          <div className="loader-core"></div>
        </div>
        {text && <p className="loader-text">{text}</p>}
      </div>
    )
  }

  return (
    <div className="loader-inline">
      <div className={`premium-loader ${sizeClass}`}>
        <div className="loader-ring"></div>
        <div className="loader-ring"></div>
        <div className="loader-ring"></div>
        <div className="loader-core"></div>
      </div>
      {text && <span className="loader-text-inline">{text}</span>}
    </div>
  )
}

export default PremiumLoader

