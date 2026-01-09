/**
 * Analytics Dashboard Page Component
 * Sprint 4: Issue #41 - Analytics / Stats Dashboard
 * 
 * Displays comprehensive statistics and analytics for staff/admins.
 * Features:
 * - Overview stats (total items, claims, approval rates)
 * - Interactive charts (bar, line, pie)
 * - Items added per week graph
 * - Claims per category graph
 * - Recent activity feed
 * - Items/Claims breakdown
 * 
 * Author: Team 15 (Ruhani, Sheehan, Aidan, Neng, Theni)
 * Sprint: 4
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyticsAPI, authAPI } from '../services/api'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import './AnalyticsDashboardPage.css'

// Color palette for charts
const COLORS = ['#003366', '#004488', '#0055aa', '#28a745', '#20c997', '#17a2b8', '#6610f2', '#e83e8c', '#fd7e14', '#ffc107']

function AnalyticsDashboardPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [analyticsData, setAnalyticsData] = useState(null)
  const [selectedChart, setSelectedChart] = useState('items_per_week') // items_per_week, claims_per_week, items_category, claims_category, location
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      
      const data = await analyticsAPI.getDashboardAnalytics()
      setAnalyticsData(data)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Error fetching analytics:', err)
      if (err.response?.status === 401) {
        navigate('/login')
      } else if (err.response?.status === 403) {
        setError('Access denied. Staff access required.')
      } else {
        setError('Failed to load analytics data. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }, [navigate])

  const checkAuthAndFetchAnalytics = useCallback(async () => {
    try {
      // Check authentication
      const sessionData = await authAPI.verifySession()
      if (!sessionData.valid) {
        navigate('/login')
        return
      }

      // Check if user is staff
      const userData = await authAPI.getCurrentUser()
      if (userData.role !== 'staff') {
        navigate('/student/dashboard')
        return
      }

      // Fetch analytics data
      await fetchAnalytics()
    } catch (error) {
      console.error('Auth check failed:', error)
      navigate('/login')
    }
  }, [fetchAnalytics, navigate])

  useEffect(() => {
    checkAuthAndFetchAnalytics()
  }, [checkAuthAndFetchAnalytics])

  useEffect(() => {
    const interval = setInterval(() => {
      fetchAnalytics()
    }, 60000)
    return () => clearInterval(interval)
  }, [fetchAnalytics])

  const formatWeekLabel = (weekString) => {
    if (!weekString) return ''
    // Format: 2025-47 -> Week 47
    const week = weekString.split('-')[1]
    return `Week ${week}`
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  const getActivityIcon = (actionType) => {
    switch (actionType) {
      case 'item_added':
        return '📦'
      case 'claim_submitted':
        return '📋'
      default:
        return '•'
    }
  }

  const getActivityText = (activity) => {
    switch (activity.action_type) {
      case 'item_added':
        return `New ${activity.category} item added`
      case 'claim_submitted':
        return `${activity.entity_description} submitted a claim`
      default:
        return 'Activity'
    }
  }

  if (loading) {
    return (
      <div className="analytics-dashboard-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="analytics-dashboard-page">
        <div className="error-state">
          <p className="error-message">{error}</p>
          <button onClick={fetchAnalytics} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="analytics-dashboard-page">
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h2>No Analytics Data Available</h2>
          <p>Analytics data will appear here once items and claims are created.</p>
        </div>
      </div>
    )
  }

  const { overview, claims_breakdown, items_breakdown, charts, recent_activity } = analyticsData

  return (
    <div className="analytics-dashboard-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>📊 Analytics Dashboard</h1>
          <p className="page-subtitle">
            Comprehensive statistics and insights for the Lost &amp; Found system
          </p>
        </div>
        <button onClick={fetchAnalytics} className="refresh-button" title="Refresh data">
          🔄 Refresh
        </button>
      </div>
      {lastUpdated && (
        <p className="last-updated">
          Last updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}

      {/* Overview Stats Cards - Enhanced */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon-wrapper">
            <div className="stat-icon">📦</div>
          </div>
          <div className="stat-content">
            <div className="stat-number">{overview.total_items}</div>
            <div className="stat-label">TOTAL ITEMS</div>
            <div className="stat-breakdown">
              <span className="stat-breakdown-item">
                <span className="breakdown-dot unclaimed"></span>
                {items_breakdown.unclaimed} Available
              </span>
              <span className="stat-breakdown-item">
                <span className="breakdown-dot claimed"></span>
                {items_breakdown.claimed} Claimed
              </span>
            </div>
          </div>
          <div className="stat-trend">
            <span className="trend-indicator up">↑</span>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon-wrapper">
            <div className="stat-icon">📋</div>
          </div>
          <div className="stat-content">
            <div className="stat-number">{overview.total_claims}</div>
            <div className="stat-label">TOTAL CLAIMS</div>
            <div className="stat-breakdown">
              <span className="stat-breakdown-item">
                <span className="breakdown-dot pending"></span>
                {claims_breakdown.pending} Pending
              </span>
              <span className="stat-breakdown-item">
                <span className="breakdown-dot approved"></span>
                {claims_breakdown.approved + claims_breakdown.picked_up} Approved
              </span>
            </div>
          </div>
          <div className="stat-trend">
            <span className="trend-indicator up">↑</span>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon-wrapper">
            <div className="stat-icon">👥</div>
          </div>
          <div className="stat-content">
            <div className="stat-number">{overview.total_users}</div>
            <div className="stat-label">TOTAL USERS</div>
            <div className="stat-detail">
              {overview.total_students} Students • {overview.total_staff} Staff
            </div>
          </div>
          <div className="stat-trend">
            <span className="trend-indicator neutral">→</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="section-header">
          <h2>📈 Data Visualizations</h2>
          <div className="chart-selector">
            <button
              className={`chart-tab ${selectedChart === 'items_per_week' ? 'active' : ''}`}
              onClick={() => setSelectedChart('items_per_week')}
            >
              Items Added
            </button>
            <button
              className={`chart-tab ${selectedChart === 'claims_per_week' ? 'active' : ''}`}
              onClick={() => setSelectedChart('claims_per_week')}
            >
              Claims Timeline
            </button>
            <button
              className={`chart-tab ${selectedChart === 'items_category' ? 'active' : ''}`}
              onClick={() => setSelectedChart('items_category')}
            >
              Items by Category
            </button>
            <button
              className={`chart-tab ${selectedChart === 'claims_category' ? 'active' : ''}`}
              onClick={() => setSelectedChart('claims_category')}
            >
              Claims by Category
            </button>
            <button
              className={`chart-tab ${selectedChart === 'location' ? 'active' : ''}`}
              onClick={() => setSelectedChart('location')}
            >
              Items by Location
            </button>
          </div>
        </div>

        <div className="chart-container">
          {/* Items Per Week Chart */}
          {selectedChart === 'items_per_week' && (
            <div className="chart-wrapper">
              <h3>Items Added Per Week (Last 8 Weeks)</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={charts.items_per_week}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="week"
                    tickFormatter={formatWeekLabel}
                    stroke="#666"
                  />
                  <YAxis stroke="#666" />
                  <Tooltip
                    labelFormatter={formatWeekLabel}
                    formatter={(value) => [value, 'Items']}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Items Added"
                    stroke="#003366"
                    strokeWidth={3}
                    dot={{ fill: '#003366', r: 5 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Claims Per Week Chart */}
          {selectedChart === 'claims_per_week' && (
            <div className="chart-wrapper">
              <h3>Claims Submitted Per Week (Last 8 Weeks)</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={charts.claims_per_week}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="week"
                    tickFormatter={formatWeekLabel}
                    stroke="#666"
                  />
                  <YAxis stroke="#666" />
                  <Tooltip
                    labelFormatter={formatWeekLabel}
                    formatter={(value) => [value, 'Claims']}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Claims Submitted"
                    stroke="#28a745"
                    strokeWidth={3}
                    dot={{ fill: '#28a745', r: 5 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Items Per Category Chart */}
          {selectedChart === 'items_category' && (
            <div className="chart-wrapper">
              <h3>Items Distribution by Category</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={charts.items_per_category}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip formatter={(value) => [value, 'Items']} />
                  <Legend />
                  <Bar dataKey="count" name="Total Items" fill="#003366">
                    {charts.items_per_category.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Claims Per Category Chart */}
          {selectedChart === 'claims_category' && (
            <div className="chart-wrapper">
              <h3>Claims Distribution by Item Category</h3>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={charts.claims_per_category}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={(entry) => `${entry.category}: ${entry.count}`}
                    outerRadius={140}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {charts.claims_per_category.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Claims']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Items Per Location Chart */}
          {selectedChart === 'location' && (
            <div className="chart-wrapper">
              <h3>Items Found by Location</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={charts.items_per_location} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#666" />
                  <YAxis type="category" dataKey="location" stroke="#666" width={100} />
                  <Tooltip formatter={(value) => [value, 'Items']} />
                  <Legend />
                  <Bar dataKey="count" name="Items Found" fill="#17a2b8">
                    {charts.items_per_location.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Breakdowns Grid */}
      <div className="breakdowns-grid">
        {/* Claims Breakdown */}
        <div className="breakdown-card">
          <h3>📋 Claims Status Breakdown</h3>
          <div className="breakdown-list">
            <div className="breakdown-item pending">
              <span className="breakdown-label">Pending</span>
              <span className="breakdown-value">{claims_breakdown.pending}</span>
            </div>
            <div className="breakdown-item approved">
              <span className="breakdown-label">Approved</span>
              <span className="breakdown-value">{claims_breakdown.approved}</span>
            </div>
            <div className="breakdown-item rejected">
              <span className="breakdown-label">Rejected</span>
              <span className="breakdown-value">{claims_breakdown.rejected}</span>
            </div>
            <div className="breakdown-item picked-up">
              <span className="breakdown-label">Picked Up</span>
              <span className="breakdown-value">{claims_breakdown.picked_up}</span>
            </div>
          </div>
        </div>

        {/* Items Breakdown */}
        <div className="breakdown-card">
          <h3>📦 Items Status Breakdown</h3>
          <div className="breakdown-list">
            <div className="breakdown-item unclaimed">
              <span className="breakdown-label">Unclaimed</span>
              <span className="breakdown-value">{items_breakdown.unclaimed}</span>
            </div>
            <div className="breakdown-item claimed">
              <span className="breakdown-label">Claimed / Picked Up</span>
              <span className="breakdown-value">{items_breakdown.claimed}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="activity-section">
        <h2>🕒 Recent Activity</h2>
        {recent_activity && recent_activity.length > 0 ? (
          <div className="activity-feed">
            {recent_activity.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">{getActivityIcon(activity.action_type)}</div>
                <div className="activity-content">
                  <div className="activity-text">{getActivityText(activity)}</div>
                  <div className="activity-time">{formatDate(activity.timestamp)}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-activity">No recent activity</p>
        )}
      </div>
    </div>
  )
}

export default AnalyticsDashboardPage

