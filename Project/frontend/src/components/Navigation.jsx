/**
 * Navigation Component - Professional UI Overhaul
 * Sprint 4: Issue #46 - Enhanced UI with UWaterloo Branding
 * 
 * Features:
 * - UWaterloo logo integration
 * - Professional animations
 * - Responsive design
 * - Accessibility compliant
 * 
 * Author: Team 15
 * Sprint: 4
 */

import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import './Navigation.css'

const Navigation = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isStaff, setIsStaff] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check authentication status - with debouncing to prevent spam
  useEffect(() => {
    let isMounted = true;
    let timeoutId;

    const checkStaffStatus = async () => {
      try {
        const response = await authAPI.verifySession()
        if (isMounted) {
          if (response.valid) {
            setIsAuthenticated(true)
            const userResponse = await authAPI.getCurrentUser()
            setIsStaff(userResponse.role === 'staff')
          } else {
            setIsAuthenticated(false)
            setIsStaff(false)
          }
        }
      } catch (err) {
        // 401 errors are expected when not logged in - handle silently
        if (isMounted && err.response?.status !== 401) {
          console.error('Auth check error:', err);
        }
        if (isMounted) {
          setIsAuthenticated(false)
          setIsStaff(false)
        }
      }
    }

    // Debounce: Only check after 300ms of no route changes
    timeoutId = setTimeout(() => {
      checkStaffStatus()
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [location.pathname])

  const isActive = (path) => {
    return location.pathname === path ? 'nav-link active' : 'nav-link'
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleLogout = async () => {
    try {
      await authAPI.logout()
      setIsAuthenticated(false)
      setIsStaff(false)
      navigate('/login')
      window.location.href = '/login'
    } catch (err) {
      console.error('Logout error:', err)
      window.location.href = '/login'
    }
  }

  return (
    <nav className="navigation">
      <div className="nav-container">
        {/* Logo Section */}
        <Link to="/" className="nav-brand">
          <img 
            src="/assets/images/logos/logo.png" 
            alt="University of Waterloo" 
            className="nav-brand-logo"
            onError={(e) => {
              console.error('Logo failed to load, trying fallback');
              // Try fallback to UW official logo
              e.target.src = 'https://uwaterloo.ca/brand/sites/default/files/uploads/images/uw-logo-main.svg';
              e.target.onerror = () => {
                // If fallback also fails, show placeholder
                console.error('Fallback logo also failed');
                e.target.style.display = 'none';
              };
            }}
          />
          <span className="nav-brand-text">Lost & Found</span>
        </Link>
        
        {/* Desktop Navigation */}
        <ul className="nav-links">
          <li>
            <Link to="/" className={isActive('/')}>
              Home
            </Link>
          </li>
          {!isAuthenticated ? (
            <>
              <li>
                <Link to="/login" className={isActive('/login')}>
                  Login
                </Link>
              </li>
              <li>
                <Link to="/signup" className={isActive('/signup')}>
                  Sign Up
                </Link>
              </li>
            </>
          ) : (
            <>
              <li>
                {isStaff ? (
                  <Link to="/staff/dashboard" className={isActive('/staff/dashboard')}>
                    Staff Dashboard
                  </Link>
                ) : (
                  <Link to="/student/dashboard" className={isActive('/student/dashboard')}>
                    Dashboard
                  </Link>
                )}
              </li>
              {!isStaff && (
                <li>
                  <Link to="/my-claims" className={isActive('/my-claims')}>
                    My Claims
                  </Link>
                </li>
              )}
              {isStaff && (
                <>
                  <li>
                    <Link to="/staff/claims" className={isActive('/staff/claims')}>
                      Manage Claims
                    </Link>
                  </li>
                  <li>
                    <Link to="/staff/archived" className={isActive('/staff/archived')}>
                      Archived Items
                    </Link>
                  </li>
                  <li>
                    <Link to="/staff/analytics" className={isActive('/staff/analytics')}>
                      Analytics
                    </Link>
                  </li>
                  <li>
                    <Link to="/staff/activity-log" className={isActive('/staff/activity-log')}>
                      Activity Log
                    </Link>
                  </li>
                </>
              )}
              <li>
                <Link to="/profile" className={isActive('/profile')}>
                  Profile
                </Link>
              </li>
              <li>
                <button onClick={handleLogout} className="logout-btn">
                  Logout
                </button>
              </li>
            </>
          )}
        </ul>

        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-btn"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
        >
          <span className={isMobileMenuOpen ? 'active' : ''}></span>
          <span className={isMobileMenuOpen ? 'active' : ''}></span>
          <span className={isMobileMenuOpen ? 'active' : ''}></span>
        </button>
      </div>

      {/* Mobile Navigation */}
      <ul className={`mobile-nav-links ${isMobileMenuOpen ? 'open' : ''}`}>
        <li>
          <Link to="/" onClick={toggleMobileMenu} className={isActive('/')}>
            Home
          </Link>
        </li>
        {!isAuthenticated ? (
          <>
            <li>
              <Link to="/login" onClick={toggleMobileMenu} className={isActive('/login')}>
                Login
              </Link>
            </li>
            <li>
              <Link to="/signup" onClick={toggleMobileMenu} className={isActive('/signup')}>
                Sign Up
              </Link>
            </li>
          </>
        ) : (
          <>
            <li>
              {isStaff ? (
                <Link to="/staff/dashboard" onClick={toggleMobileMenu} className={isActive('/staff/dashboard')}>
                  Staff Dashboard
                </Link>
              ) : (
                <Link to="/student/dashboard" onClick={toggleMobileMenu} className={isActive('/student/dashboard')}>
                  Dashboard
                </Link>
              )}
            </li>
            {!isStaff && (
              <li>
                <Link to="/my-claims" onClick={toggleMobileMenu} className={isActive('/my-claims')}>
                  My Claims
                </Link>
              </li>
            )}
            {isStaff && (
              <>
                <li>
                  <Link to="/staff/claims" onClick={toggleMobileMenu} className={isActive('/staff/claims')}>
                    Manage Claims
                  </Link>
                </li>
                <li>
                  <Link to="/staff/archived" onClick={toggleMobileMenu} className={isActive('/staff/archived')}>
                    Archived Items
                  </Link>
                </li>
                <li>
                  <Link to="/staff/analytics" onClick={toggleMobileMenu} className={isActive('/staff/analytics')}>
                    Analytics
                  </Link>
                </li>
                <li>
                  <Link to="/staff/activity-log" onClick={toggleMobileMenu} className={isActive('/staff/activity-log')}>
                    Activity Log
                  </Link>
                </li>
              </>
            )}
            <li>
              <Link to="/profile" onClick={toggleMobileMenu} className={isActive('/profile')}>
                Profile
              </Link>
            </li>
            <li>
              <button onClick={() => { toggleMobileMenu(); handleLogout(); }} className="logout-btn">
                Logout
              </button>
            </li>
          </>
        )}
      </ul>
    </nav>
  )
}

export default Navigation
