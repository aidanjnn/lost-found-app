/**
 * Signup Page Component
 * Sprint 2: Connected to Registration API
 * 
 * Registration page for students and staff using @uwaterloo.ca email.
 * 
 * Author: Team 15 (Ruhani, Sheehan, Aidan, Neng, Theni)
 * Sprint: 2
 */

import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import './SignupPage.css'

function SignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // Check if already logged in - redirect to appropriate dashboard
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authAPI.verifySession()
        if (response.valid) {
          const userResponse = await authAPI.getCurrentUser()
          if (userResponse.role === 'staff') {
            navigate('/staff/dashboard', { replace: true })
          } else {
            navigate('/student/dashboard', { replace: true })
          }
        }
      } catch (err) {
        // Not authenticated - stay on signup page
      }
    }
    checkAuth()
  }, [navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user types
    if (error) setError(null)
  }

  const validateForm = () => {
    if (!formData.email.endsWith('@uwaterloo.ca')) {
      setError('Email must be a @uwaterloo.ca address')
      return false
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return false
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    
    if (!formData.name.trim()) {
      setError('Name is required')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const response = await authAPI.register({
        email: formData.email,
        password: formData.password,
        name: formData.name
      })
      
      if (response.message === 'Account created successfully') {
        // Auto-login after registration
        try {
          const loginResponse = await authAPI.login(formData.email, formData.password)
          // Redirect based on role (should be student for new registrations)
          const userRole = loginResponse.user?.role
          if (userRole === 'staff') {
            window.location.href = '/staff/dashboard'
          } else {
            window.location.href = '/student/dashboard'
          }
        } catch (loginErr) {
          // Registration succeeded but auto-login failed
          window.location.href = '/login'
        }
      }
    } catch (err) {
      console.error('Registration error:', err)
      if (err.response?.status === 400) {
        setError(err.response.data?.error || 'Invalid registration data')
      } else if (err.response?.status === 409) {
        setError('This email is already registered. Please login instead.')
      } else {
        setError('Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="signup-page">
      <div className="signup-container">
        <h1>Sign Up</h1>
        <p className="page-description">
          Create an account with your @uwaterloo.ca email
        </p>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="signup-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="yourname@uwaterloo.ca"
              required
              disabled={loading}
            />
            <small className="form-hint">
              Must be a @uwaterloo.ca email address
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                required
                minLength={6}
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="signup-info">
          <p className="info-text">
            <strong>Note:</strong> New accounts are created as students by default.
            Staff accounts require special setup.
          </p>
        </div>

        <div className="login-link">
          <p>
            Already have an account?{' '}
            <Link to="/login">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignupPage

