/**
 * Student Dashboard Page Component
 * Sprint 3: Search and Filtering UI
 * 
 * Dashboard for students to view and interact with lost items.
 * Students can browse, search, filter, sort, and claim items.
 * 
 * Author: Team 15 (Ruhani, Sheehan, Aidan, Neng, Theni)
 * Sprint: 3
 * Issue: #39
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { itemsAPI, authAPI, notificationsAPI } from '../services/api'
import ItemCard from '../components/ItemCard'
import ItemDetailModal from '../components/ItemDetailModal'
import ClaimModal from '../components/ClaimModal'
import SearchFilters from '../components/SearchFilters'
import Pagination from '../components/Pagination'
import { ItemGridSkeleton } from '../components/ui/SkeletonLoader'
import WelcomeBanner from '../components/WelcomeBanner'
import NotificationCenter from '../components/NotificationCenter'
import './StudentDashboardPage.css'

function StudentDashboardPage() {
  const [items, setItems] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [pageSize, setPageSize] = useState(12)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    location: '',
    status: '',
    sort: 'recent'
  })
  const [selectedItem, setSelectedItem] = useState(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notificationsLoading, setNotificationsLoading] = useState(true)
  const navigate = useNavigate()

  // Check authentication on mount
  const loadNotifications = useCallback(async () => {
    try {
      setNotificationsLoading(true)
      const data = await notificationsAPI.getNotifications({ status: 'unread', limit: 5 })
      setNotifications(data.notifications || [])
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setNotificationsLoading(false)
    }
  }, [])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authAPI.verifySession()
        if (response.valid) {
          setIsAuthenticated(true)
          const userResponse = await authAPI.getCurrentUser()
          setUser(userResponse)
          // Redirect staff to their dashboard
          if (userResponse.role === 'staff') {
            navigate('/staff/dashboard')
            return
          }
          await loadNotifications()
          fetchItems()
        } else {
          navigate('/login')
        }
      } catch (err) {
        console.error('Authentication check failed:', err)
        navigate('/login')
      }
    }

    checkAuth()
  }, [navigate, loadNotifications])
  const handleNotificationDismiss = useCallback(async (notification) => {
    try {
      await notificationsAPI.markAsRead(notification.notification_id)
      setNotifications((prev) => prev.filter((note) => note.notification_id !== notification.notification_id))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }, [])

  // Use ref to track if initial load is complete
  const initialLoadRef = useRef(false)

  // Fetch items from API with filters
  const fetchItems = useCallback(async () => {
    if (!isAuthenticated || !user) return
    
    try {
      setLoading(true)
      setError(null)
      
      // Build query parameters matching backend API
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.category) params.append('category', filters.category)
      if (filters.location) params.append('location', filters.location)
      if (filters.status) params.append('status', filters.status)
      
      // Handle sort - backend expects 'recent' or 'oldest'
      const sortValue = filters.sort === 'oldest' ? 'oldest' : 'recent'
      params.append('sort', sortValue)
      
      params.append('page', currentPage)
      params.append('page_size', 12) // Show 12 items per page (nice grid)
      
      const queryString = params.toString()
      console.log('[StudentDashboard] Fetching with params:', queryString)
      
      const data = await itemsAPI.getItems(queryString)
      
      console.log('[StudentDashboard] API Response:', data)
      console.log('[StudentDashboard] Items count:', data.items?.length || 0)
      
      // Ensure we always have an array
      const fetchedItems = Array.isArray(data.items) ? data.items : []
      setItems(fetchedItems)
      
      // Extract pagination data correctly
      const pagination = data.pagination || {}
      setTotalCount(pagination.total_count || 0)
      setTotalPages(pagination.total_pages || 0)
      setPageSize(pagination.page_size || 12)
    } catch (err) {
      console.error('Error fetching items:', err)
      if (err.response?.status === 401) {
        navigate('/login')
      } else {
        setError('Failed to load items. Please try again later.')
        setItems([]) // Clear items on error
      }
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, user, filters.search, filters.category, filters.location, filters.status, filters.sort, currentPage, navigate])

  // Reset to page 1 when filters change (but not on initial mount)
  useEffect(() => {
    if (initialLoadRef.current) {
      setCurrentPage(1)
    }
  }, [filters.search, filters.category, filters.location, filters.status, filters.sort])

  // Fetch items when page changes or on initial authenticated load
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchItems()
      initialLoadRef.current = true
    }
  }, [fetchItems, isAuthenticated, user])

  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters)
  }, [])

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Don't render until auth check is complete
  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="student-dashboard-page">
      {/* Welcome Banner */}
      <WelcomeBanner user={user} role="student" />

      <NotificationCenter
        notifications={notifications}
        loading={notificationsLoading}
        onMarkRead={handleNotificationDismiss}
      />
      
      <div className="dashboard-header">
        <h1>Student Dashboard</h1>
        <p className="welcome-message">
          Browse and search for lost items across campus.
        </p>
      </div>

      {/* Search and Filters */}
      <SearchFilters 
        onFiltersChange={handleFiltersChange}
        initialFilters={filters}
      />

      {/* Results Count */}
      {!loading && !error && totalCount > 0 && (
        <div className="results-summary">
          <span className="results-text">
            Found <strong>{totalCount}</strong> {totalCount === 1 ? 'item' : 'items'}
          </span>
        </div>
      )}

      {loading && items.length === 0 && (
        <ItemGridSkeleton count={6} />
      )}

      {error && (
        <div className="error-state">
          <p className="error-message">{error}</p>
          <button onClick={fetchItems} className="retry-button">
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            {filters.search || filters.category || filters.location || filters.status ? '🔍' : '📦'}
          </div>
          <h2>
            {filters.search || filters.category || filters.location || filters.status 
              ? 'No Items Match Your Filters' 
              : 'No Lost Items Found'}
          </h2>
          <p>
            {filters.search || filters.category || filters.location || filters.status
              ? 'Try adjusting your search or filter criteria'
              : 'There are currently no lost items in the system.'}
          </p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <>
          <div className="items-grid">
            {items.map((item) => (
              <ItemCard 
                key={item.item_id} 
                item={item}
                showClaimButton={true}
                onClaimSuccess={fetchItems}
                onViewDetails={(item) => {
                  setSelectedItem(item)
                  setIsDetailModalOpen(true)
                }}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={pageSize}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}

      {/* Item Detail Modal */}
      <ItemDetailModal
        item={selectedItem}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedItem(null)
        }}
        onClaim={(item) => {
          setIsDetailModalOpen(false)
          setSelectedItem(item)
          setIsClaimModalOpen(true)
        }}
        showClaimButton={true}
      />

      {/* Claim Modal */}
      {selectedItem && (
        <ClaimModal
          item={selectedItem}
          isOpen={isClaimModalOpen}
          onClose={() => {
            setIsClaimModalOpen(false)
            setSelectedItem(null)
          }}
          onClaimSuccess={() => {
            setIsClaimModalOpen(false)
            setSelectedItem(null)
            fetchItems()
          }}
        />
      )}
    </div>
  )
}

export default StudentDashboardPage

