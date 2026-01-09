/**
 * Search Filters Component
 * Sprint 3: Search and Filtering UI
 * 
 * Provides search bar and filter controls for item listings.
 * Supports text search, category, location, status filters, and sorting.
 * 
 * Author: Team 15 (Ruhani, Sheehan, Aidan, Neng, Theni)
 * Sprint: 3
 */

import React, { useState, useEffect, useRef } from 'react'
import './SearchFilters.css'

function SearchFilters({ onFiltersChange, initialFilters = {} }) {
  const [filters, setFilters] = useState({
    search: initialFilters.search || '',
    category: initialFilters.category || '',
    location: initialFilters.location || '',
    status: initialFilters.status || '',
    sort: initialFilters.sort || 'recent'
  })

  const [isExpanded, setIsExpanded] = useState(false)
  const isInitialMount = useRef(true)

  // Notify parent when filters change (but not on initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    
    if (onFiltersChange) {
      onFiltersChange(filters)
    }
  }, [filters, onFiltersChange])

  const handleSearchChange = (e) => {
    setFilters(prev => ({
      ...prev,
      search: e.target.value
    }))
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleClearFilters = () => {
    setFilters({
      search: '',
      category: '',
      location: '',
      status: '',
      sort: 'recent'
    })
    setIsExpanded(false)
  }

  const hasActiveFilters = () => {
    return filters.search || filters.category || filters.location || filters.status || filters.sort !== 'recent'
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (filters.search) count++
    if (filters.category) count++
    if (filters.location) count++
    if (filters.status) count++
    if (filters.sort !== 'recent') count++
    return count
  }

  return (
    <div className="search-filters">
      {/* Search Bar - Always Visible */}
      <div className="search-bar-section">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search items by description, category, or location..."
            value={filters.search}
            onChange={handleSearchChange}
          />
          {filters.search && (
            <button
              className="clear-search-btn"
              onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <button
          className={`toggle-filters-btn ${isExpanded ? 'active' : ''}`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="filter-icon">⚙️</span>
          Filters
          {getActiveFilterCount() > 0 && (
            <span className="filter-count-badge">{getActiveFilterCount()}</span>
          )}
          <span className={`chevron ${isExpanded ? 'up' : 'down'}`}>▼</span>
        </button>
      </div>

      {/* Advanced Filters - Expandable */}
      {isExpanded && (
        <div className="filters-panel">
          <div className="filters-grid">
            {/* Category Filter */}
            <div className="filter-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="">All Categories</option>
                <option value="electronics">Electronics</option>
                <option value="clothing">Clothing</option>
                <option value="cards">Cards/IDs</option>
                <option value="keys">Keys</option>
                <option value="bags">Bags</option>
                <option value="books">Books</option>
                <option value="bottles">Bottles</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Location Filter */}
            <div className="filter-group">
              <label htmlFor="location">Location</label>
              <select
                id="location"
                name="location"
                value={filters.location}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="">All Locations</option>
                <option value="SLC">SLC</option>
                <option value="PAC">PAC</option>
                <option value="CIF">CIF</option>
                <option value="Library">Library</option>
                <option value="DC">DC</option>
                <option value="MC">MC</option>
                <option value="E7">E7</option>
                <option value="QNC">QNC</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="filter-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="">All Statuses</option>
                <option value="unclaimed">Available</option>
                <option value="claimed">Claimed</option>
              </select>
            </div>

            {/* Sort Options */}
            <div className="filter-group">
              <label htmlFor="sort">Sort By</label>
              <select
                id="sort"
                name="sort"
                value={filters.sort}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="recent">Most Recent</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Active Filters Display & Clear Button */}
          {hasActiveFilters() && (
            <div className="filters-footer">
              <div className="active-filters">
                {filters.search && (
                  <span className="active-filter-tag">
                    Search: "{filters.search}"
                  </span>
                )}
                {filters.category && (
                  <span className="active-filter-tag">
                    Category: {filters.category}
                  </span>
                )}
                {filters.location && (
                  <span className="active-filter-tag">
                    Location: {filters.location}
                  </span>
                )}
                {filters.status && (
                  <span className="active-filter-tag">
                    Status: {filters.status === 'unclaimed' ? 'Available' : 'Claimed'}
                  </span>
                )}
                {filters.sort !== 'recent' && (
                  <span className="active-filter-tag">
                    Sort: {filters.sort === 'oldest' ? 'Oldest First' : 'Recent'}
                  </span>
                )}
              </div>
              <button
                className="clear-filters-btn"
                onClick={handleClearFilters}
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchFilters

