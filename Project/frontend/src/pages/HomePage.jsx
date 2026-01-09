/**
 * Home Page Component - Professional UI Overhaul
 * Sprint 4: Issue #46 - Beautiful Landing Page
 * 
 * Features:
 * - Stunning hero section with gradient
 * - Feature cards with icons
 * - Smooth animations
 * - Responsive design
 * 
 * Author: Team 15
 * Sprint: 4
 */

import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import { initScrollReveal, cleanupScrollReveal } from '../utils/scrollReveal'
import './HomePage.css'

const HomePage = () => {
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const response = await authAPI.verifySession()
        if (isMounted && response.valid) {
          setIsAuthenticated(true)
          const userResponse = await authAPI.getCurrentUser()
          setUserRole(userResponse.role)
        }
      } catch (err) {
        // 401 errors are expected when not logged in - handle silently
        if (err.response?.status !== 401) {
          console.error('Auth check error:', err);
        }
        if (isMounted) {
          setIsAuthenticated(false)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }
    checkAuth()

    return () => {
      isMounted = false;
    };
  }, [])

  // Initialize scroll reveal animations
  useEffect(() => {
    const observer = initScrollReveal()
    return () => cleanupScrollReveal(observer)
  }, [isLoading])

  const handleGetStarted = () => {
    if (isAuthenticated) {
      if (userRole === 'staff') {
        navigate('/staff/dashboard')
      } else {
        navigate('/student/dashboard')
      }
    } else {
      navigate('/login')
    }
  }

  if (isLoading) {
    return (
      <div className="home-page">
        <div className="hero">
          <div className="hero-content loading-shimmer">
            <div className="shimmer-box shimmer-title"></div>
            <div className="shimmer-box shimmer-subtitle"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-background">
          <div className="hero-gradient"></div>
          <div className="hero-pattern"></div>
        </div>
        
        <div className="hero-content">
          <h1 className="hero-title">
            UW Lost & Found
          </h1>
          <p className="hero-subtitle">
            Centralized lost-and-found service for the University of Waterloo
          </p>
          <p className="hero-description">
            Reconnecting Warriors with their belongings across SLC, PAC, and CIF
          </p>
          
          <div className="hero-actions">
            {isAuthenticated ? (
              <button onClick={handleGetStarted} className="btn btn-primary">
                Go to Dashboard →
              </button>
            ) : (
              <>
                <Link to="/login" className="btn btn-primary">
                  Get Started →
                </Link>
                <Link to="/signup" className="btn btn-secondary">
                  Create Account
                </Link>
              </>
            )}
          </div>

          {/* Stats Bar */}
          <div className="stats-bar">
            <div className="stat-item">
              <div className="stat-icon">📦</div>
              <div className="stat-value">1000+</div>
              <div className="stat-label">Items Found</div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">🎓</div>
              <div className="stat-value">500+</div>
              <div className="stat-label">Happy Students</div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">⚡</div>
              <div className="stat-value">24/7</div>
              <div className="stat-label">Fast Processing</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2 className="section-title scroll-reveal">How It Works</h2>
        <p className="section-subtitle scroll-reveal">
          Simple, secure, and efficient lost-and-found management
        </p>
        
        <div className="feature-grid">
          <div className="feature-card scroll-reveal-scale">
            <div className="feature-icon">🔍</div>
            <h3>Browse Items</h3>
            <p>
              Search through all lost items from SLC, PAC, and CIF desks
              in one centralized location. Filter by category, location, and date.
            </p>
            <div className="feature-badge">For Everyone</div>
          </div>

          <div className="feature-card scroll-reveal-scale">
            <div className="feature-icon">📋</div>
            <h3>Claim Items</h3>
            <p>
              Securely claim your lost items with proper verification.
              Submit detailed descriptions and track your claim status in real-time.
            </p>
            <div className="feature-badge">For Students</div>
          </div>

          <div className="feature-card scroll-reveal-scale">
            <div className="feature-icon">👨‍💼</div>
            <h3>Staff Portal</h3>
            <p>
              Desk staff can easily add and manage found items with photos
              and descriptions. Process claims efficiently with full audit trails.
            </p>
            <div className="feature-badge">For Staff</div>
          </div>
        </div>
      </section>

      {/* Locations Section */}
      <section className="locations">
        <h2 className="section-title scroll-reveal">Covered Locations</h2>
        <div className="locations-grid">
          <div className="location-card scroll-reveal-left">
            <div className="location-icon">🏢</div>
            <h3>SLC</h3>
            <p>Student Life Centre</p>
          </div>
          <div className="location-card scroll-reveal">
            <div className="location-icon">🏃</div>
            <h3>PAC</h3>
            <p>Physical Activities Complex</p>
          </div>
          <div className="location-card scroll-reveal-right">
            <div className="location-icon">🏋️</div>
            <h3>CIF</h3>
            <p>Columbia Icefield</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section scroll-reveal-scale">
        <div className="cta-content">
          <h2>Ready to find your items?</h2>
          <p>Join hundreds of students reunited with their belongings</p>
          {!isAuthenticated && (
            <div className="cta-actions">
              <Link to="/signup" className="btn btn-primary btn-large">
                Sign Up Now →
              </Link>
              <Link to="/login" className="btn btn-secondary btn-large">
                Login
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default HomePage
