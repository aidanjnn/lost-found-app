/**
 * Forgot Password Page Component
 * Sprint 4: Issue #42 - Email Notifications (Password Recovery)
 * 
 * Allows users to request password recovery via email.
 * 
 * Author: Team 15 (Ruhani, Sheehan, Aidan, Neng, Theni)
 * Sprint: 4
 */

import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import './ForgotPasswordPage.css'

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    // Validation
    if (!email.trim()) {
      setError('Please enter your email address')
      return
    }

    if (!email.endsWith('@uwaterloo.ca')) {
      setError('Please use your @uwaterloo.ca email')
      return
    }

    try {
      setLoading(true)
      await api.post('/auth/forgot-password', { email })
      
      setSuccess(true)
      setEmail('')
    } catch (err) {
      console.error('Forgot password error:', err)
      if (err.response?.data?.error) {
        setError(err.response.data.error)
      } else {
        setError('An error occurred. Please try again later.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <div className="forgot-password-header">
          <div className="logo-section">
            <div className="lock-icon">🔐</div>
            <h1>Forgot Password?</h1>
            <p className="subtitle">No worries, we'll help you recover it!</p>
          </div>
        </div>

        <div className="forgot-password-card">
          {success ? (
            <div className="success-state">
              <div className="success-icon">✉️</div>
              <h2>Check Your Email!</h2>
              <p className="success-message">
                If an account exists with the email you provided, password recovery instructions have been sent.
              </p>
              <p className="info-text">
                Please check your inbox and follow the instructions to recover your password.
              </p>
              <div className="actions">
                <Link to="/login" className="back-to-login-btn">
                  ← Back to Login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="forgot-password-form">
              <p className="form-description">
                Enter your @uwaterloo.ca email address and we'll send you password recovery instructions.
              </p>

              {error && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-with-icon">
                  <span className="input-icon">📧</span>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="youremail@uwaterloo.ca"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Sending...
                  </>
                ) : (
                  <>
                    Send Recovery Email
                  </>
                )}
              </button>

              <div className="divider"></div>

              <div className="back-link">
                <Link to="/login">← Back to Login</Link>
              </div>
            </form>
          )}
        </div>

        <div className="info-section">
          <div className="info-card">
            <h3>📝 Important Notes</h3>
            <ul>
              <li>For security reasons, password recovery requires staff verification</li>
              <li>Check your spam folder if you don't see the email</li>
              <li>Recovery emails are sent from noreply@uwaterloo.ca</li>
              <li>If you need immediate assistance, visit the Lost & Found office</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage


