/**
 * Profile Page Component
 * Sprint 4: Issue #43 - User Profile Management
 * 
 * Allows users to edit their profile (name, email) and change password.
 * 
 * Author: Team 15 (Ruhani, Sheehan, Aidan, Neng, Theni)
 * Sprint: 4
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import api from '../services/api'
import './ProfilePage.css'

function ProfilePage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Profile Edit State
  const [editMode, setEditMode] = useState(false)
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    profile_picture: ''
  })
  const [profilePicturePreview, setProfilePicturePreview] = useState(null)
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)
  
  // Password Change State
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  useEffect(() => {
    checkAuthAndLoadProfile()
  }, [])

  const checkAuthAndLoadProfile = async () => {
    try {
      const sessionData = await authAPI.verifySession()
      if (!sessionData.valid) {
        navigate('/login')
        return
      }

      const userData = await authAPI.getCurrentUser()
      setUser(userData)
      setProfileData({
        name: userData.name,
        email: userData.email,
        profile_picture: userData.profile_picture || ''
      })
      setProfilePicturePreview(userData.profile_picture || null)
    } catch (error) {
      console.error('Auth check failed:', error)
      navigate('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }))
    setProfileError('')
  }

  const handlePictureUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setProfileError('Please upload an image file (JPG, PNG, etc.)')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setProfileError('Image must be less than 5MB')
      return
    }

    // Convert to base64 and preview
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result
      setProfilePicturePreview(base64String)
      setProfileData(prev => ({
        ...prev,
        profile_picture: base64String
      }))
      setProfileError('')
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePicture = () => {
    setProfilePicturePreview(null)
    setProfileData(prev => ({
      ...prev,
      profile_picture: ''
    }))
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))
    setPasswordError('')
  }

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setProfileError('')
    setProfileSuccess('')

    // Validation
    if (!profileData.name.trim()) {
      setProfileError('Name is required')
      return
    }

    if (!profileData.email.trim()) {
      setProfileError('Email is required')
      return
    }

    if (!profileData.email.endsWith('@uwaterloo.ca')) {
      setProfileError('Email must be a @uwaterloo.ca address')
      return
    }

    try {
      setProfileLoading(true)
      const response = await api.patch('/auth/profile', {
        name: profileData.name.trim(),
        email: profileData.email.trim().toLowerCase()
      })

      setProfileSuccess('Profile updated successfully!')
      setUser(response.data.user)
      setEditMode(false)
      
      // Clear success message after 5 seconds
      setTimeout(() => setProfileSuccess(''), 5000)
    } catch (err) {
      console.error('Profile update error:', err)
      if (err.response?.data?.error) {
        setProfileError(err.response.data.error)
      } else {
        setProfileError('Failed to update profile. Please try again.')
      }
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    // Validation
    if (!passwordData.current_password) {
      setPasswordError('Current password is required')
      return
    }

    if (!passwordData.new_password) {
      setPasswordError('New password is required')
      return
    }

    if (passwordData.new_password.length < 6) {
      setPasswordError('New password must be at least 6 characters')
      return
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError('New passwords do not match')
      return
    }

    if (passwordData.current_password === passwordData.new_password) {
      setPasswordError('New password must be different from current password')
      return
    }

    try {
      setPasswordLoading(true)
      await api.post('/auth/change-password', passwordData)

      setPasswordSuccess('Password changed successfully!')
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      })
      setShowPasswordForm(false)
      
      // Clear success message after 5 seconds
      setTimeout(() => setPasswordSuccess(''), 5000)
    } catch (err) {
      console.error('Password change error:', err)
      if (err.response?.data?.error) {
        setPasswordError(err.response.data.error)
      } else {
        setPasswordError('Failed to change password. Please try again.')
      }
    } finally {
      setPasswordLoading(false)
    }
  }

  const cancelEdit = () => {
    setProfileData({
      name: user.name,
      email: user.email
    })
    setEditMode(false)
    setProfileError('')
  }

  const cancelPasswordChange = () => {
    setPasswordData({
      current_password: '',
      new_password: '',
      confirm_password: ''
    })
    setShowPasswordForm(false)
    setPasswordError('')
  }

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Page Header with Profile Picture */}
        <div className="profile-header">
          <div className="profile-avatar-section">
            <div className="profile-avatar-wrapper">
              {profilePicturePreview ? (
                <img 
                  src={profilePicturePreview} 
                  alt={`${user?.name}'s profile`}
                  className="profile-avatar"
                />
              ) : (
                <div className="profile-avatar-placeholder">
                  <span className="avatar-initials">
                    {user?.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
              <label htmlFor="profile-picture-input" className="avatar-upload-btn" title="Change profile picture">
                📷
                <input
                  type="file"
                  id="profile-picture-input"
                  accept="image/*"
                  onChange={handlePictureUpload}
                  style={{ display: 'none' }}
                />
              </label>
              {profilePicturePreview && (
                <button 
                  onClick={handleRemovePicture} 
                  className="avatar-remove-btn"
                  title="Remove picture"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="profile-user-info">
              <h1 className="profile-name">{user?.name || 'User'}</h1>
              <p className="profile-email">{user?.email}</p>
              <span className={`profile-role-badge ${user?.role}`}>
                {user?.role === 'staff' ? '👨‍💼 Staff' : '🎓 Student'}
              </span>
            </div>
          </div>
          <p className="subtitle">Manage your account information and settings</p>
        </div>

        {/* Success Messages */}
        {(profileSuccess || passwordSuccess) && (
          <div className="success-banner">
            <span className="success-icon">✓</span>
            <span>{profileSuccess || passwordSuccess}</span>
          </div>
        )}

        {/* Profile Information Card */}
        <div className="profile-card">
          <div className="card-header">
            <h2>📝 Profile Information</h2>
            {!editMode && (
              <button className="edit-button" onClick={() => setEditMode(true)}>
                ✏️ Edit Profile
              </button>
            )}
          </div>

          {profileError && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <span>{profileError}</span>
            </div>
          )}

          {!editMode ? (
            <div className="profile-info">
              <div className="info-row">
                <span className="info-label">Name:</span>
                <span className="info-value">{user?.name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{user?.email}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Role:</span>
                <span className={`role-badge ${user?.role}`}>
                  {user?.role === 'staff' ? '👨‍💼 Staff' : '👨‍🎓 Student'}
                </span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleProfileSubmit} className="profile-form">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  disabled={profileLoading}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  disabled={profileLoading}
                  required
                />
                <span className="field-hint">Must be a @uwaterloo.ca email</span>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="save-button"
                  disabled={profileLoading}
                >
                  {profileLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  className="cancel-button"
                  onClick={cancelEdit}
                  disabled={profileLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Change Password Card */}
        <div className="profile-card">
          <div className="card-header">
            <h2>🔐 Change Password</h2>
            {!showPasswordForm && (
              <button className="edit-button" onClick={() => setShowPasswordForm(true)}>
                🔒 Change Password
              </button>
            )}
          </div>

          {passwordError && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <span>{passwordError}</span>
            </div>
          )}

          {!showPasswordForm ? (
            <div className="password-info">
              <p className="info-text">
                Keep your account secure by using a strong password and changing it regularly.
              </p>
              <ul className="password-tips">
                <li>Use at least 6 characters</li>
                <li>Mix letters, numbers, and symbols</li>
                <li>Don't reuse passwords from other sites</li>
              </ul>
            </div>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="password-form">
              <div className="form-group">
                <label htmlFor="current_password">Current Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    id="current_password"
                    name="current_password"
                    value={passwordData.current_password}
                    onChange={handlePasswordChange}
                    disabled={passwordLoading}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => togglePasswordVisibility('current')}
                    disabled={passwordLoading}
                  >
                    {showPasswords.current ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="new_password">New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    id="new_password"
                    name="new_password"
                    value={passwordData.new_password}
                    onChange={handlePasswordChange}
                    disabled={passwordLoading}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => togglePasswordVisibility('new')}
                    disabled={passwordLoading}
                  >
                    {showPasswords.new ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                <span className="field-hint">Minimum 6 characters</span>
              </div>

              <div className="form-group">
                <label htmlFor="confirm_password">Confirm New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    id="confirm_password"
                    name="confirm_password"
                    value={passwordData.confirm_password}
                    onChange={handlePasswordChange}
                    disabled={passwordLoading}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => togglePasswordVisibility('confirm')}
                    disabled={passwordLoading}
                  >
                    {showPasswords.confirm ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="save-button"
                  disabled={passwordLoading}
                >
                  {passwordLoading ? 'Changing...' : 'Change Password'}
                </button>
                <button
                  type="button"
                  className="cancel-button"
                  onClick={cancelPasswordChange}
                  disabled={passwordLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage

