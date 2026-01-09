/**
 * Activity Log Page Component
 * Sprint 4: Issue #44 - Activity Log (Audit Trail for Staff)
 * 
 * Displays audit trail of all system actions for staff review.
 * 
 * Author: Team 15 (Ruhani, Sheehan, Aidan, Neng, Theni)
 * Sprint: 4
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import api from '../services/api'
import './ActivityLogPage.css'

function ActivityLogPage() {
  const navigate = useNavigate()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Filters
  const [filters, setFilters] = useState({
    user_id: '',
    action_type: '',
    start_date: '',
    end_date: ''
  })
  
  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize] = useState(50)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    checkAuthAndFetchLogs()
  }, [page, filters])

  const checkAuthAndFetchLogs = async () => {
    try {
      const sessionData = await authAPI.verifySession()
      if (!sessionData.valid) {
        navigate('/login')
        return
      }

      const userData = await authAPI.getCurrentUser()
      if (userData.role !== 'staff') {
        navigate('/student/dashboard')
        return
      }

      await fetchLogs()
    } catch (error) {
      console.error('Auth check failed:', error)
      navigate('/login')
    }
  }

  const fetchLogs = async () => {
    try {
      setLoading(true)
      setError('')
      
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString()
      })
      
      if (filters.user_id) params.append('user_id', filters.user_id)
      if (filters.action_type) params.append('action_type', filters.action_type)
      if (filters.start_date) params.append('start_date', filters.start_date)
      if (filters.end_date) params.append('end_date', filters.end_date)
      
      const response = await api.get(`/api/activity-log?${params.toString()}`)
      
      setLogs(response.data.logs)
      setTotalCount(response.data.total_count)
      setTotalPages(response.data.total_pages)
    } catch (err) {
      console.error('Error fetching activity log:', err)
      if (err.response?.status === 401) {
        navigate('/login')
      } else if (err.response?.status === 403) {
        setError('Access denied. Staff access required.')
      } else {
        setError('Failed to load activity log. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({
      ...prev,
      [name]: value
    }))
    setPage(1) // Reset to page 1 when filters change
  }

  const handleClearFilters = () => {
    setFilters({
      user_id: '',
      action_type: '',
      start_date: '',
      end_date: ''
    })
    setPage(1)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  const getActionIcon = (actionType) => {
    const icons = {
      'item_added': '📦',
      'item_updated': '✏️',
      'item_deleted': '🗑️',
      'claim_created': '📋',
      'claim_approved': '✅',
      'claim_rejected': '❌',
      'claim_picked_up': '🎉',
      'user_registered': '👤',
      'user_login': '🔓',
      'profile_updated': '✏️',
      'password_changed': '🔐'
    }
    return icons[actionType] || '•'
  }

  const getActionColor = (actionType) => {
    if (actionType.includes('approved') || actionType.includes('picked_up')) return 'success'
    if (actionType.includes('rejected') || actionType.includes('deleted')) return 'danger'
    if (actionType.includes('updated') || actionType.includes('changed')) return 'warning'
    return 'info'
  }

  const formatActionType = (actionType) => {
    return actionType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.action_type) params.append('action_type', filters.action_type)
      if (filters.start_date) params.append('start_date', filters.start_date)
      if (filters.end_date) params.append('end_date', filters.end_date)
      
      const response = await api.get(`/api/export/activity-log/csv?${params.toString()}`, {
        responseType: 'blob'
      })
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `activity_log_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exporting CSV:', err)
      alert('Failed to export CSV. Please try again.')
    }
  }

  return (
    <div className="activity-log-page">
      <div className="page-header">
        <div className="header-content">
          <h1>📝 Activity Log</h1>
          <p className="subtitle">Audit trail of all system actions</p>
        </div>
        <button onClick={handleExportCSV} className="export-btn" title="Export to CSV">
          📥 Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group">
            <label htmlFor="action_type">Action Type</label>
            <select
              id="action_type"
              name="action_type"
              value={filters.action_type}
              onChange={handleFilterChange}
            >
              <option value="">All Actions</option>
              <option value="item_added">Item Added</option>
              <option value="item_updated">Item Updated</option>
              <option value="item_deleted">Item Deleted</option>
              <option value="claim_created">Claim Created</option>
              <option value="claim_approved">Claim Approved</option>
              <option value="claim_rejected">Claim Rejected</option>
              <option value="claim_picked_up">Claim Picked Up</option>
              <option value="user_registered">User Registered</option>
              <option value="profile_updated">Profile Updated</option>
              <option value="password_changed">Password Changed</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="start_date">Start Date</label>
            <input
              type="date"
              id="start_date"
              name="start_date"
              value={filters.start_date}
              onChange={handleFilterChange}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="end_date">End Date</label>
            <input
              type="date"
              id="end_date"
              name="end_date"
              value={filters.end_date}
              onChange={handleFilterChange}
            />
          </div>

          <button className="clear-filters-btn" onClick={handleClearFilters}>
            Clear Filters
          </button>
        </div>

        <div className="results-count">
          Showing {logs.length} of {totalCount} entries
        </div>
      </div>

      {/* Loading State */}
      {loading && logs.length === 0 && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading activity log...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-state">
          <p className="error-message">{error}</p>
        </div>
      )}

      {/* Activity Log Table */}
      {!loading && !error && logs.length > 0 && (
        <>
          <div className="activity-table-container">
            <table className="activity-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Action</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Details</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.log_id}>
                    <td className="time-cell">{formatDate(log.created_at)}</td>
                    <td className="action-cell">
                      <span className={`action-badge ${getActionColor(log.action_type)}`}>
                        {getActionIcon(log.action_type)} {formatActionType(log.action_type)}
                      </span>
                    </td>
                    <td className="user-cell">
                      <div className="user-info">
                        <div className="user-name">{log.user_name || 'System'}</div>
                        <div className="user-email">{log.user_email || '-'}</div>
                      </div>
                    </td>
                    <td className="role-cell">
                      <span className={`role-badge ${log.user_role}`}>
                        {log.user_role || '-'}
                      </span>
                    </td>
                    <td className="details-cell">{log.details || '-'}</td>
                    <td className="ip-cell">{log.ip_address || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ← Previous
              </button>

              <span className="page-info">
                Page {page} of {totalPages}
              </span>

              <button
                className="page-btn"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && !error && logs.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h2>No Activity Found</h2>
          <p>No activity entries match your current filters.</p>
        </div>
      )}
    </div>
  )
}

export default ActivityLogPage

