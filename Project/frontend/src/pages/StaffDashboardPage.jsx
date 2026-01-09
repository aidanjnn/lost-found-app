/**
 * Staff Dashboard Page Component
 * Sprint 3: Staff Claiming Management UI (Front-End)
 * 
 * Provides a dashboard for staff to add lost-and-found items.
 * Includes link to claims management system.
 * Only accessible to authenticated staff members.
 * 
 * Author: Team 15 (Ruhani, Sheehan, Aidan, Neng, Theni)
 * Sprint: 3
 */

import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI, itemsAPI } from '../services/api'
import WelcomeBanner from '../components/WelcomeBanner'
import toast from 'react-hot-toast'
import './StaffDashboardPage.css'
import './StaffDashboardTableStyles.css'

function StaffDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isStaff, setIsStaff] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)
  const [items, setItems] = useState([])
  const [itemsLoading, setItemsLoading] = useState(false)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'table' - default to grid
  const [editingItem, setEditingItem] = useState(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [expandedCards, setExpandedCards] = useState({}) // Track which cards show description
  const navigate = useNavigate()

  const getFriendlyClaimStatus = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending Review'
      case 'approved':
        return 'Approved / Awaiting Pickup'
      case 'rejected':
        return 'Rejected'
      case 'picked_up':
        return 'Picked Up'
      default:
        return null
    }
  }

  const getItemStatusChip = (item) => {
    if (item.is_picked_up || item.status === 'claimed') {
      return { tone: 'picked-up', label: 'Picked Up' }
    }
    if (item.latest_claim_status === 'approved') {
      return { tone: 'approved', label: 'Awaiting Pickup' }
    }
    if (item.latest_claim_status === 'pending') {
      return { tone: 'pending', label: 'Claim Pending' }
    }
    if (item.latest_claim_status === 'rejected') {
      return { tone: 'rejected', label: 'Recently Rejected' }
    }
    return { tone: 'available', label: 'Available' }
  }

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    location_found: '',
    pickup_at: 'SLC',
    date_found: '',
    image_url: '',
    status: 'unclaimed'
  })

  // Validation errors
  const [validationErrors, setValidationErrors] = useState({})
  
  // Image upload states
  const [imageOption, setImageOption] = useState('url') // 'url' or 'upload'
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  // Location Found states
  const [locationOption, setLocationOption] = useState('SLC') // 'SLC', 'PAC', 'CIF', or 'other'
  const [customLocations, setCustomLocations] = useState([]) // User-defined locations
  const [showLocationInput, setShowLocationInput] = useState(false)

  // Check authentication and staff role on mount
  // Fetch items for display
  const fetchItems = async () => {
    try {
      setItemsLoading(true)
      console.log('[StaffDashboard] Fetching items...')
      
      // Use getItems with no filters to get all items
      const data = await itemsAPI.getItems('')
      console.log('[StaffDashboard] Raw API response:', data)
      
      // Ensure we always have an array
      const fetchedItems = Array.isArray(data.items) ? data.items : []
      console.log('[StaffDashboard] Fetched items count:', fetchedItems.length)
      console.log('[StaffDashboard] Items:', fetchedItems)
      
      setItems(fetchedItems)
    } catch (err) {
      console.error('[StaffDashboard] Error fetching items:', err)
      console.error('[StaffDashboard] Error details:', err.response?.data || err.message)
      setItems([]) // Clear items on error
      toast.error('Failed to load items. Please try again.')
    } finally {
      setItemsLoading(false)
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authAPI.verifySession()
        if (response.valid) {
          setIsAuthenticated(true)
          // Get user info to check role
          const userResponse = await authAPI.getCurrentUser()
          setUser(userResponse)
          if (userResponse.role === 'staff') {
            setIsStaff(true)
            await fetchItems() // Load items for staff dashboard
          } else {
            // Not staff - redirect to student dashboard
            navigate('/student/dashboard')
          }
        } else {
          navigate('/login')
        }
      } catch (err) {
        console.error('Authentication check failed:', err)
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [navigate])

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Handle image file selection
  const handleImageFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file')
        return
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size must be less than 5MB')
        return
      }
      
      setImageFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle image option change
  const handleImageOptionChange = (option) => {
    setImageOption(option)
    setImageFile(null)
    setImagePreview(null)
    setFormData(prev => ({
      ...prev,
      image_url: ''
    }))
  }

  // Validate form
  const validateForm = () => {
    const errors = {}
    
    if (!formData.name.trim()) {
      errors.name = 'Item name is required'
    }
    
    if (!formData.category.trim()) {
      errors.category = 'Category is required'
    }
    
    if (!formData.location_found.trim()) {
      errors.location_found = 'Location found is required'
    }
    
    if (!formData.pickup_at) {
      errors.pickup_at = 'Pickup location is required'
    }
    
    if (!formData.date_found) {
      errors.date_found = 'Date found is required'
    }

    // Validate date format
    if (formData.date_found) {
      try {
        const date = new Date(formData.date_found)
        if (isNaN(date.getTime())) {
          errors.date_found = 'Invalid date format'
        }
      } catch (err) {
        errors.date_found = 'Invalid date format'
      }
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      // Format date_found for backend (ISO format)
      const dateFound = formData.date_found
        ? new Date(formData.date_found).toISOString().replace('T', ' ').substring(0, 19)
        : new Date().toISOString().replace('T', ' ').substring(0, 19)

      // Handle image URL - use uploaded file preview if available
      let imageUrl = formData.image_url || null
      if (imageOption === 'upload' && imagePreview) {
        imageUrl = imagePreview  // Base64 encoded image
      }

      const itemData = {
        name: formData.name,
        description: formData.description || null,
        category: formData.category,
        location_found: formData.location_found,
        pickup_at: formData.pickup_at,
        date_found: dateFound,
        image_url: imageUrl,
        found_by_desk: formData.location_found, // Backend still uses found_by_desk field name
        status: formData.status
      }

      if (editingItem) {
        // Update existing item
        console.log('💾 [UPDATE] Updating item ID:', editingItem.item_id)
        console.log('💾 [UPDATE] Sending data:', itemData)
        
        const response = await itemsAPI.updateItem(editingItem.item_id, itemData)
        console.log('💾 [UPDATE] Response:', response)
        
        toast.success('Item updated successfully!')
        setEditingItem(null)
      } else {
        // Create new item
        console.log('✨ [CREATE] Creating new item')
        console.log('✨ [CREATE] Sending data:', itemData)
        
        const response = await itemsAPI.createItem(itemData)
        console.log('✨ [CREATE] Response:', response)
        
        toast.success('Item created successfully!')
      }
      
      setSuccess(true)
      
      console.log('🔄 [SUBMIT] Resetting form and refreshing items...')
      
      // Reset form to default "Create Item" state
      resetForm()
      
      // Refresh items list
      await fetchItems()
      console.log('✅ [SUBMIT] Complete! Form reset to Create mode.')
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000)
    } catch (err) {
      console.error('Error creating item:', err)
      if (err.response?.status === 403) {
        setError('You do not have permission to create items. Staff access required.')
      } else if (err.response?.status === 400) {
        setError(err.response.data?.error || 'Invalid form data. Please check all fields.')
      } else {
        setError('Failed to create item. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Handle edit item - populate form with item data
  // Toggle card description expansion
  const toggleCardExpansion = (itemId) => {
    setExpandedCards(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))
  }

  // Reset form to default "Create Item" state
  const resetForm = () => {
    console.log('🔄 [RESET] Resetting form to Create mode...')
    
    // Clear editing mode
    setEditingItem(null)
    
    // Reset form data
    setFormData({
      name: '',
      description: '',
      category: '',
      location_found: '',
      pickup_at: 'SLC',
      date_found: '',
      image_url: '',
      status: 'unclaimed'
    })
    
    // Clear image states
    setImageOption('url')
    setImageFile(null)
    setImagePreview(null)
    
    // Clear location states
    setLocationOption('SLC')
    setCustomLocations([])
    setShowLocationInput(false)
    
    // Clear validation and errors
    setValidationErrors({})
    setError(null)
    setSuccess(false)
    
    // Clear delete confirmation
    setShowDeleteConfirm(false)
    
    console.log('✅ [RESET] Form reset complete!')
  }

  const handleEditItem = (item) => {
    console.log('📝 [EDIT] Starting edit for item:', item)
    console.log('📝 [EDIT] Item ID:', item.item_id)
    console.log('📝 [EDIT] Item Name:', item.name)
    
    setEditingItem(item)
    
    const populatedFormData = {
      name: item.name || item.description || '',
      description: item.description || '',
      category: item.category || '',
      location_found: item.location_found || item.found_by_desk || '',
      pickup_at: item.pickup_at || 'SLC',
      date_found: item.date_found ? new Date(item.date_found).toISOString().slice(0, 16) : '',
      image_url: item.image_url || '',
      status: item.status || 'unclaimed'
    }
    
    console.log('📝 [EDIT] Populated form data:', populatedFormData)
    setFormData(populatedFormData)
    setValidationErrors({})
    setShowDeleteConfirm(false)
    
    // Scroll to top of add-item section smoothly with offset
    setTimeout(() => {
      const addItemSection = document.querySelector('.add-item-section')
      if (addItemSection) {
        const yOffset = -100 // 100px above the element
        const y = addItemSection.getBoundingClientRect().top + window.pageYOffset + yOffset
        window.scrollTo({ top: y, behavior: 'smooth' })
      }
    }, 100)
  }

  // NEW Delete functionality - Inline confirmation
  const handleInitiateDelete = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setShowDeleteConfirm(true)
  }

  const handleCancelDelete = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setShowDeleteConfirm(false)
  }

  const handleConfirmDelete = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!editingItem?.item_id) {
      toast.error('Cannot delete: No item selected')
      return
    }

    setIsDeleting(true)
    
    try {
      await itemsAPI.deleteItem(editingItem.item_id)
      toast.success(`Item "${editingItem.name || editingItem.description}" deleted successfully!`)
      
      // Reset everything
      setShowDeleteConfirm(false)
      setEditingItem(null)
      setFormData({
        name: '',
        description: '',
        category: '',
        location_found: '',
        pickup_at: 'SLC',
        date_found: '',
        image_url: '',
        status: 'unclaimed'
      })
      
      // Refresh list
      await fetchItems()
      
    } catch (err) {
      console.error('Delete error:', err)
      const errorMsg = err.response?.data?.error || err.message || 'Failed to delete item'
      toast.error(errorMsg)
    } finally {
      setIsDeleting(false)
    }
  }

  // Don't render until auth check is complete
  if (loading) {
    return (
      <div className="staff-dashboard-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !isStaff) {
    return null
  }

  return (
    <div className="staff-dashboard-page">
      {/* Welcome Banner */}
      <WelcomeBanner user={user} role="staff" />
      
      <div className="dashboard-header">
        <h1>Staff Dashboard</h1>
        <p className="welcome-message">
          Manage lost-and-found items, process claims, and track analytics.
        </p>
      </div>

      {/* Quick Links Section */}
      <div className="quick-links-grid">
        {/* Claims Management Link */}
        <div className="quick-link-card claims-card">
          <div className="card-content">
            <div className="card-icon">📋</div>
            <div className="card-text">
              <h3>Manage Student Claims</h3>
              <p>Review and process claims submitted by students</p>
            </div>
            <Link to="/staff/claims" className="card-button">
              View Claims →
            </Link>
          </div>
        </div>

        {/* Archived Items Link */}
        <div className="quick-link-card archived-card">
          <div className="card-content">
            <div className="card-icon">📦</div>
            <div className="card-text">
              <h3>Archived Items</h3>
              <p>View picked-up items and pickup history</p>
            </div>
            <Link to="/staff/archived" className="card-button">
              View Archive →
            </Link>
          </div>
        </div>

        {/* Analytics Dashboard Link */}
        <div className="quick-link-card analytics-card">
          <div className="card-content">
            <div className="card-icon">📊</div>
            <div className="card-text">
              <h3>Analytics Dashboard</h3>
              <p>View statistics, charts, and activity insights</p>
            </div>
            <Link to="/staff/analytics" className="card-button">
              View Analytics →
            </Link>
          </div>
        </div>

        {/* Activity Log Link */}
        <div className="quick-link-card activity-log-card">
          <div className="card-content">
            <div className="card-icon">📝</div>
            <div className="card-text">
              <h3>Activity Log</h3>
              <p>View audit trail and system activity</p>
            </div>
            <Link to="/staff/activity-log" className="card-button">
              View Activity Log →
            </Link>
          </div>
        </div>
      </div>
      
      <div className="dashboard-sections">
        <div className="add-item-section">
          <div className="section-title-row">
            <div>
              <h2>{editingItem ? '✏️ Edit Item' : '➕ Add New Item'}</h2>
              <p className="section-description">
                {editingItem ? 'Update item information below.' : 'Add new lost-and-found items to the database.'}
              </p>
            </div>
            {editingItem && (
              <button 
                className="cancel-edit-btn"
                onClick={() => {
                  setEditingItem(null)
                  setFormData({
                    name: '',
                    description: '',
                    category: '',
                    location_found: '',
                    pickup_at: 'SLC',
                    date_found: '',
                    image_url: '',
                    status: 'unclaimed'
                  })
                  setValidationErrors({})
                }}
              >
                ✖ Cancel Edit
              </button>
            )}
          </div>

      {success && (
        <div className="success-message">
          <span className="success-icon">✓</span>
          <span>Item created successfully!</span>
        </div>
      )}

      {error && (
        <div className="error-message">
          <span className="error-icon">✗</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="item-form">
        <div className="form-section">
          <h2>Item Information</h2>
          
          <div className="form-group">
            <label htmlFor="name">
              Item Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Blue Backpack, iPhone 13, Water Bottle"
              className={validationErrors.name ? 'error' : ''}
            />
            <small className="form-hint">
              A short, clear name for the item
            </small>
            {validationErrors.name && (
              <span className="field-error">{validationErrors.name}</span>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="category">
              Category <span className="required">*</span>
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={validationErrors.category ? 'error' : ''}
            >
              <option value="">Select category</option>
              <option value="electronics">Electronics</option>
              <option value="clothing">Clothing</option>
              <option value="cards">Cards</option>
              <option value="keys">Keys</option>
              <option value="bags">Bags</option>
              <option value="books">Books</option>
              <option value="other">Other</option>
            </select>
            {validationErrors.category && (
              <span className="field-error">{validationErrors.category}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Describe the item (type, colour, distinguishing marks, etc.)"
            />
          </div>

          <div className="form-group">
            <label>Item Image (optional)</label>
            
            {/* Image option selector */}
            <div className="image-option-selector">
              <button
                type="button"
                className={`option-btn ${imageOption === 'url' ? 'active' : ''}`}
                onClick={() => handleImageOptionChange('url')}
              >
                🔗 Image URL / Google Drive Link
              </button>
              <button
                type="button"
                className={`option-btn ${imageOption === 'upload' ? 'active' : ''}`}
                onClick={() => handleImageOptionChange('upload')}
              >
                📁 Upload Image
              </button>
            </div>

            {/* URL input */}
            {imageOption === 'url' && (
              <div className="image-input-section">
                <input
                  type="url"
                  id="image_url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg or Google Drive sharing link"
                  className="url-input"
                />
                <small className="form-hint">
                  📋 Paste a direct image URL or Google Drive sharing link
                </small>
              </div>
            )}

            {/* File upload */}
            {imageOption === 'upload' && (
              <div className="image-input-section">
                <input
                  type="file"
                  id="image_file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="file-input"
                />
                <small className="form-hint">
                  📸 Upload an image file (max 5MB, JPG/PNG/GIF)
                </small>
                
                {/* Image preview */}
                {imagePreview && (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview" />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => {
                        setImageFile(null)
                        setImagePreview(null)
                      }}
                    >
                      ✕ Remove
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="form-section">
          <h2>Location Information</h2>
          
          <div className="form-group location-found-group">
            <label htmlFor="location_found">
              Location Found <span className="required">*</span>
            </label>
            <p className="field-hint">Select where the item was found</p>
            
            <div className="location-options">
              <button
                type="button"
                className={`location-btn ${formData.location_found === 'SLC' ? 'active' : ''}`}
                onClick={() => {
                  setFormData(prev => ({ ...prev, location_found: 'SLC' }))
                  setShowLocationInput(false)
                  if (validationErrors.location_found) {
                    setValidationErrors(prev => {
                      const newErrors = { ...prev }
                      delete newErrors.location_found
                      return newErrors
                    })
                  }
                }}
              >
                <span className="location-icon">🏢</span>
                <span className="location-name">SLC</span>
              </button>
              
              <button
                type="button"
                className={`location-btn ${formData.location_found === 'PAC' ? 'active' : ''}`}
                onClick={() => {
                  setFormData(prev => ({ ...prev, location_found: 'PAC' }))
                  setShowLocationInput(false)
                  if (validationErrors.location_found) {
                    setValidationErrors(prev => {
                      const newErrors = { ...prev }
                      delete newErrors.location_found
                      return newErrors
                    })
                  }
                }}
              >
                <span className="location-icon">🏃</span>
                <span className="location-name">PAC</span>
              </button>
              
              <button
                type="button"
                className={`location-btn ${formData.location_found === 'CIF' ? 'active' : ''}`}
                onClick={() => {
                  setFormData(prev => ({ ...prev, location_found: 'CIF' }))
                  setShowLocationInput(false)
                  if (validationErrors.location_found) {
                    setValidationErrors(prev => {
                      const newErrors = { ...prev }
                      delete newErrors.location_found
                      return newErrors
                    })
                  }
                }}
              >
                <span className="location-icon">🎯</span>
                <span className="location-name">CIF</span>
              </button>
              
              <button
                type="button"
                className={`location-btn ${showLocationInput || (formData.location_found && !['SLC', 'PAC', 'CIF'].includes(formData.location_found)) ? 'active' : ''}`}
                onClick={() => {
                  setShowLocationInput(true)
                  // Clear the location_found if it was SLC/PAC/CIF
                  if (['SLC', 'PAC', 'CIF'].includes(formData.location_found)) {
                    setFormData(prev => ({ ...prev, location_found: '' }))
                  }
                }}
              >
                <span className="location-icon">➕</span>
                <span className="location-name">Other</span>
              </button>
            </div>
            
            {(showLocationInput || (formData.location_found && !['SLC', 'PAC', 'CIF'].includes(formData.location_found))) && (
              <div className="custom-location-input">
                <input
                  type="text"
                  id="location_found"
                  name="location_found"
                  value={(!['SLC', 'PAC', 'CIF'].includes(formData.location_found)) ? formData.location_found : ''}
                  onChange={(e) => {
                    const value = e.target.value
                    setFormData(prev => ({ ...prev, location_found: value }))
                    // Clear validation error
                    if (validationErrors.location_found) {
                      setValidationErrors(prev => {
                        const newErrors = { ...prev }
                        delete newErrors.location_found
                        return newErrors
                      })
                    }
                  }}
                  onBlur={(e) => {
                    // Add to custom locations when user finishes typing
                    const value = e.target.value.trim()
                    if (value && !['SLC', 'PAC', 'CIF'].includes(value) && !customLocations.includes(value)) {
                      setCustomLocations(prev => [...prev, value])
                    }
                  }}
                  placeholder="e.g., MC, DC, E7, DP..."
                  className={validationErrors.location_found ? 'error' : ''}
                  autoFocus
                />
                <button
                  type="button"
                  className="close-location-input"
                  onClick={() => {
                    setShowLocationInput(false)
                    setFormData(prev => ({ ...prev, location_found: 'SLC' }))
                  }}
                  title="Cancel custom location"
                >
                  ✕
                </button>
              </div>
            )}
            
            {customLocations.length > 0 && (
              <div className="custom-locations-list">
                <p className="custom-locations-title">Recent Custom Locations:</p>
                <div className="custom-locations">
                  {customLocations.map((loc, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`custom-location-chip ${formData.location_found === loc ? 'active' : ''}`}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, location_found: loc }))
                        setShowLocationInput(false)
                      }}
                    >
                      {loc}
                      <span 
                        className="remove-location"
                        onClick={(e) => {
                          e.stopPropagation()
                          setCustomLocations(prev => prev.filter((_, i) => i !== index))
                          if (formData.location_found === loc) {
                            setFormData(prev => ({ ...prev, location_found: 'SLC' }))
                          }
                        }}
                      >
                        ✕
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {validationErrors.location_found && (
              <span className="field-error">{validationErrors.location_found}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="pickup_at">
              Pickup Location <span className="required">*</span>
            </label>
            <select
              id="pickup_at"
              name="pickup_at"
              value={formData.pickup_at}
              onChange={handleChange}
              className={validationErrors.pickup_at ? 'error' : ''}
            >
              <option value="SLC">SLC</option>
              <option value="PAC">PAC</option>
              <option value="CIF">CIF</option>
            </select>
            {validationErrors.pickup_at && (
              <span className="field-error">{validationErrors.pickup_at}</span>
            )}
          </div>
        </div>

        <div className="form-section">
          <h2>Additional Information</h2>
          
          <div className="form-group">
            <label htmlFor="date_found">
              Date Found <span className="required">*</span>
            </label>
            <div className="date-input-with-button">
              <input
                type="datetime-local"
                id="date_found"
                name="date_found"
                value={formData.date_found}
                onChange={handleChange}
                className={validationErrors.date_found ? 'error' : ''}
              />
              <button
                type="button"
                className="today-button"
                onClick={() => {
                  const now = new Date()
                  const localDateTime = new Date(now.getTime() - (now.getTimezoneOffset() * 60000))
                    .toISOString()
                    .slice(0, 16)
                  setFormData(prev => ({ ...prev, date_found: localDateTime }))
                  if (validationErrors.date_found) {
                    setValidationErrors(prev => {
                      const newErrors = { ...prev }
                      delete newErrors.date_found
                      return newErrors
                    })
                  }
                }}
              >
                <span className="today-icon">⚡</span>
                <span className="today-text">Right Now</span>
              </button>
            </div>
            {validationErrors.date_found && (
              <span className="field-error">{validationErrors.date_found}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="unclaimed">Unclaimed</option>
              <option value="claimed">Claimed</option>
            </select>
            <small className="form-hint">
              Default status for new items is "Unclaimed"
            </small>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={submitting}
            className="submit-button"
          >
            {submitting 
              ? (editingItem ? 'Updating...' : 'Creating...') 
              : (editingItem ? '✅ Update Item' : '➕ Create Item')
            }
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="reset-button"
            title={editingItem ? "Cancel editing and return to create mode" : "Clear all form fields"}
          >
            {editingItem ? '✕ Cancel Edit' : '🔄 Reset Form'}
          </button>
        </div>

        {/* Danger Zone - Delete Item Section */}
        {editingItem && (
          <div className="danger-zone">
            <div className="danger-zone-header">
              <h3>⚠️ Danger Zone</h3>
              <p>Permanent actions that cannot be undone</p>
            </div>
            
            {!showDeleteConfirm ? (
              <div className="danger-zone-content">
                <div className="danger-action">
                  <div className="danger-action-info">
                    <h4>Delete this item</h4>
                    <p>Once deleted, this item will be permanently removed from the system.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleInitiateDelete}
                    className="danger-button"
                    disabled={submitting}
                  >
                    🗑️ Delete Item
                  </button>
                </div>
              </div>
            ) : (
              <div className="danger-zone-confirm">
                <div className="confirm-message">
                  <span className="confirm-icon">⚠️</span>
                  <span className="confirm-text">
                    Are you sure you want to delete <strong>"{editingItem.name || editingItem.description}"</strong>?
                  </span>
                </div>
                <div className="confirm-buttons">
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="confirm-yes-button"
                    disabled={isDeleting}
                  >
                    {isDeleting ? '⏳ Deleting...' : '✓ Yes, Delete'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelDelete}
                    className="confirm-no-button"
                    disabled={isDeleting}
                  >
                    ✕ No, Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </form>
      </div>

      <div className="items-section">
        <div className="section-header items-section-header">
          <h2 className="section-title">All Lost Items ({items.length})</h2>
          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => {
                console.log('[VIEW TOGGLE] Switching to grid');
                setViewMode('grid');
              }}
              title="Grid View"
            >
              <span className="icon">⊞</span> Grid
            </button>
            <button 
              className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => {
                console.log('[VIEW TOGGLE] Switching to table');
                setViewMode('table');
              }}
              title="Table View"
            >
              <span className="icon">☰</span> Table
            </button>
          </div>
        </div>

        {/* Loading State */}
        {itemsLoading && items.length === 0 && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading items...</p>
          </div>
        )}

        {/* Empty State */}
        {!itemsLoading && items.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>No Items Yet</h3>
            <p>No items in the system yet. Add your first item above!</p>
          </div>
        )}

        {/* Grid View */}
        {!itemsLoading && items.length > 0 && viewMode === 'grid' && (
          <div className="items-grid-container">
            <div className="items-grid">
          {items.map((item) => {
            const statusChip = getItemStatusChip(item)
            const claimStatusLabel = getFriendlyClaimStatus(item.latest_claim_status)
            const displayName = item.name || item.description || 'Unnamed Item'
            
            return (
              <div key={item.item_id} className="grid-item-card">
                <div className="card-image">
                  {item.image_url ? (
                    <img src={item.image_url} alt={displayName} />
                  ) : (
                    <div className="no-image">
                      <span className="no-image-icon">📦</span>
                      <p>No Image</p>
                    </div>
                  )}
                </div>
                <div className="card-content">
                  <div className="card-header">
                    <div className="card-title-stack">
                      {item.item_id && <span className="item-id-tag">#{item.item_id}</span>}
                      <h3 className="item-name" title={displayName}>
                        {displayName}
                      </h3>
                    </div>
                    <span className={`status-badge ${statusChip.tone}`}>
                      {statusChip.label}
                    </span>
                  </div>
                  <div className="card-details">
                    <div className="detail-row">
                      <span className="detail-label">Category:</span>
                      <span className="category-badge">{item.category}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Location:</span>
                      <span className="detail-value">{item.location_found}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Found:</span>
                      <span className="detail-value">
                        {new Date(item.date_found).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Pickup:</span>
                      <span className="detail-value">{item.pickup_at || 'N/A'}</span>
                    </div>
                    {claimStatusLabel && (
                      <div className="detail-row">
                        <span className="detail-label">Claim Status:</span>
                        <span className={`detail-value claim-pill ${item.latest_claim_status || ''}`}>
                          {claimStatusLabel}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Description Toggle Button */}
                  {item.description && (
                    <div className="card-description-section">
                      {expandedCards[item.item_id] && (
                        <div className="card-description-content">
                          <p>{item.description}</p>
                        </div>
                      )}
                      <button
                        className="btn-toggle-description"
                        onClick={() => toggleCardExpansion(item.item_id)}
                      >
                        {expandedCards[item.item_id] ? '▲ Hide Description' : '▼ Show Description'}
                      </button>
                    </div>
                  )}
                  
                  <div className="card-actions">
                    <button 
                      className="btn-edit-card"
                      onClick={() => handleEditItem(item)}
                      title="Edit Item"
                    >
                      ✏️ Edit
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
            </div>
          </div>
        )}

        {/* Table View */}
        {!itemsLoading && items.length > 0 && viewMode === 'table' && (
          <div className="items-table-container">
            <table className="items-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Item ID</th>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Date Found</th>
                  <th>Claim Status</th>
                  <th>Item Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const statusChip = getItemStatusChip(item)
                  const claimStatusLabel = getFriendlyClaimStatus(item.latest_claim_status)
                  const displayName = item.name || item.description
                  
                  return (
                    <tr key={`item-table-${item.item_id}`} className="item-row">
                      <td>
                        {item.image_url ? (
                          <img 
                            src={item.image_url} 
                            alt={displayName} 
                            className="table-item-image"
                          />
                        ) : (
                          <div className="table-no-image">📦</div>
                        )}
                      </td>
                      <td className="item-id-cell">{item.item_id ? `#${item.item_id}` : '—'}</td>
                      <td className="item-description" title={displayName}>
                        {displayName}
                      </td>
                      <td><span className="category-badge">{item.category}</span></td>
                      <td>{item.location_found}</td>
                      <td>{new Date(item.date_found).toLocaleDateString()}</td>
                      <td>
                        {claimStatusLabel ? (
                          <span className={`claim-pill ${item.latest_claim_status || ''}`}>
                            {claimStatusLabel}
                          </span>
                        ) : (
                          <span className="claim-pill muted">No Active Claim</span>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${statusChip.tone}`}>
                          {statusChip.label}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn-edit"
                            onClick={() => handleEditItem(item)}
                            title="Edit Item"
                          >
                            ✏️ Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>

    </div>
  )
}

export default StaffDashboardPage

