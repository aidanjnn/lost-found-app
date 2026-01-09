/**
 * Lost Items Page Component
 * Sprint 3: Search and Filtering UI
 * 
 * Displays a searchable, filterable list of lost items.
 * Only accessible to authenticated students and staff.
 * 
 * Author: Team 15 (Ruhani, Sheehan, Aidan, Neng, Theni)
 * Sprint: 3
 * Issue: #39
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { itemsAPI, authAPI } from '../services/api'
import ItemCard from '../components/ItemCard'
import SearchFilters from '../components/SearchFilters'
import Pagination from '../components/Pagination'
import { ItemGridSkeleton } from '../components/ui/SkeletonLoader'
import './LostItemsPage.css'

function LostItemsPage() {
  const [items, setItems] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [pageSize, setPageSize] = useState(12)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    location: '',
    status: '',
    sort: 'recent'
  })
  const navigate = useNavigate()

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authAPI.verifySession()
        if (response.valid) {
          setIsAuthenticated(true)
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
  }, [navigate])

  // Use ref to track if initial load is complete
  const initialLoadRef = useRef(false)

  // Fetch items from API with filters
  const fetchItems = useCallback(async () => {
    if (!isAuthenticated) return
    
    try {
      setLoading(true)
      setError(null)
      
      // Build query parameters
      const params = new URLSearchParams()
      if (filters.search) params.append('q', filters.search)
      if (filters.category) params.append('category', filters.category)
      if (filters.location) params.append('location', filters.location)
      if (filters.status) params.append('status', filters.status)
      
      // Handle sort (convert 'recent'/'oldest' to 'date_found' with 'desc'/'asc')
      params.append('sort_by', 'date_found')
      if (filters.sort === 'oldest') {
        params.append('order', 'asc')
      } else {
        params.append('order', 'desc') // default to recent (desc)
      }
      
      params.append('page', currentPage)
      params.append('page_size', 12)
      
      const queryString = params.toString()
      const data = await itemsAPI.getItems(queryString)
      
      setItems(data.items || [])
      setTotalCount(data.total_count || 0)
      setTotalPages(data.total_pages || 0)
      setPageSize(data.page_size || 12)
    } catch (err) {
      console.error('Error fetching items:', err)
      if (err.response?.status === 401) {
        navigate('/login')
      } else {
        setError('Failed to load items. Please try again later.')
      }
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, filters, currentPage, navigate])

  // Reset to page 1 when filters change (but not on initial mount)
  useEffect(() => {
    if (initialLoadRef.current) {
      setCurrentPage(1)
    }
  }, [filters.search, filters.category, filters.location, filters.status, filters.sort])

  // Fetch items when page changes or on initial authenticated load
  useEffect(() => {
    if (isAuthenticated) {
      fetchItems()
      initialLoadRef.current = true
    }
  }, [fetchItems, isAuthenticated])

  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters)
  }, [])

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Don't render until auth check is complete
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="lost-items-page">
      <h1>Lost Items</h1>
      <p className="page-description">
        Browse, search, and filter all lost items from SLC, PAC, and CIF desks.
      </p>

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
              <ItemCard key={item.item_id} item={item} />
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
    </div>
  )
}

export default LostItemsPage

