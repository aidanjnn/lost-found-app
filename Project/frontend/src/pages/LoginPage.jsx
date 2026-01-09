/**
 * Login Page Component
 * Sprint 2: Connected to Authentication API
 * 
 * Login page for students and staff using @uwaterloo.ca email and password.
 * 
 * Author: Team 15 (Ruhani, Sheehan, Aidan, Neng, Theni)
 * Sprint: 2
 */

import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'
import LoginSuccessNotification from '../components/LoginSuccessNotification'
import './LoginPage.css'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showSuccessNotification, setShowSuccessNotification] = useState(false)
  const [loginUser, setLoginUser] = useState(null)
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
        // Not authenticated - stay on login page
      }
    }
    checkAuth()
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      console.log('Attempting login with:', { email, passwordLength: password.length })
      const response = await authAPI.login(email, password)
      console.log('Login response:', response)
      
      if (response.message === 'Login successful') {
        // Show success notification
        setLoginUser(response.user)
        setShowSuccessNotification(true)
        
        // Redirect after notification completes (3 seconds)
        const userRole = response.user?.role
        console.log('Login successful, user role:', userRole)
        
        setTimeout(() => {
          if (userRole === 'staff') {
            window.location.href = '/staff/dashboard'
          } else {
            window.location.href = '/student/dashboard'
          }
        }, 3000)
      } else {
        const msg = 'Login failed. Unexpected response.'
        setError(msg)
        toast.error(msg)
      }
    } catch (err) {
      console.error('Login error details:', err)
      console.error('Error response:', err.response)
      console.error('Error message:', err.message)
      
      let errorMsg = ''
      
      if (err.code === 'ECONNREFUSED' || err.message?.includes('Network Error')) {
        errorMsg = 'Cannot connect to server. Please make sure the backend is running.'
      } else if (err.response?.status === 401) {
        errorMsg = err.response.data?.error || 'Invalid email or password. Please try again.'
      } else if (err.response?.status === 400) {
        errorMsg = err.response.data?.error || 'Invalid email format. Must be @uwaterloo.ca'
      } else if (err.response?.data?.error) {
        errorMsg = err.response.data.error
      } else {
        errorMsg = `Login failed: ${err.message || 'Please try again.'}`
      }
      
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      {/* Login Success Notification */}
      {showSuccessNotification && loginUser && (
        <LoginSuccessNotification
          userName={loginUser.name}
          userRole={loginUser.role}
          onComplete={() => setShowSuccessNotification(false)}
        />
      )}
      
      <div className="login-container">
        <h1>Login</h1>
        <p className="page-description">
          Sign in with your @uwaterloo.ca email and password
        </p>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
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

          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
          
          <div className="forgot-password-link">
            <Link to="/forgot-password">Forgot your password?</Link>
          </div>
        </form>

        <div className="login-info">
          <p className="info-text">
            <strong>Default Staff Account:</strong><br />
            Email: admin@uwaterloo.ca<br />
            Password: admin123
          </p>
        </div>

        <div className="signup-link">
          <p>
            Don't have an account?{' '}
            <Link to="/signup">Sign up here</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage

