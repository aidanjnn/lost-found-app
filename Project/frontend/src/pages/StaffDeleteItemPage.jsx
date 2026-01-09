import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { authAPI, itemsAPI } from '../services/api'
import toast from 'react-hot-toast'
import './StaffDeleteItemPage.css'

function StaffDeleteItemPage() {
  const { itemId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [item, setItem] = useState(location.state?.item || null)
  const [loading, setLoading] = useState(!location.state?.item)
  const [error, setError] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const itemAlreadyDeleted = item?.status === 'deleted'

  useEffect(() => {
    const hydrate = async () => {
      try {
        setError(null)
        const sessionResponse = await authAPI.verifySession()
        if (!sessionResponse.valid) {
          navigate('/login', { replace: true })
          return
        }

        const currentUser = await authAPI.getCurrentUser()
        if (currentUser.role !== 'staff') {
          navigate('/student/dashboard', { replace: true })
          return
        }

        const response = await itemsAPI.getItemById(itemId)
        setItem(response.item)
      } catch (err) {
        const message = err.response?.data?.error || 'Unable to load item details.'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    hydrate()
  }, [itemId, navigate])

  const formattedDateFound = useMemo(() => {
    if (!item?.date_found) return 'Unknown'
    try {
      return new Date(item.date_found).toLocaleString()
    } catch (err) {
      return item.date_found
    }
  }, [item])

  const handleCancel = () => {
    if (location.state?.from) {
      navigate(location.state.from)
    } else {
      navigate('/staff/dashboard')
    }
  }

  const handleDelete = async () => {
    if (!item || itemAlreadyDeleted) {
      return
    }

    try {
      setIsDeleting(true)
      setError(null)
      await itemsAPI.deleteItem(item.item_id)
      toast.success('Item deleted successfully')
      navigate('/staff/dashboard', {
        replace: true,
        state: {
          deletedItemId: item.item_id
        }
      })
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Failed to delete item.'
      setError(message)
      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="staff-delete-page">
        <div className="delete-card loading-state">
          <div className="spinner" />
          <p>Loading item details...</p>
        </div>
      </div>
    )
  }

  if (error && !item) {
    return (
      <div className="staff-delete-page">
        <div className="delete-card error-state">
          <h2>Unable to load item</h2>
          <p>{error}</p>
          <div className="actions">
            <button className="btn-secondary" onClick={handleCancel}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="staff-delete-page">
      <div className="delete-card">
        <div className="delete-card-header">
          <div>
            <p className="eyebrow">Danger Zone</p>
            <h1>Confirm item deletion</h1>
            <p className="subtitle">
              This action permanently hides the item from both staff and students. All claims referencing this item will remain but the item
              will no longer be displayed.
            </p>
          </div>
          <div className="header-actions">
            <button className="btn-secondary" onClick={handleCancel}>
              ← Back to Dashboard
            </button>
            <Link to="/staff/activity-log" className="btn-link">
              View audit log
            </Link>
          </div>
        </div>

        <div className="item-summary">
          <div className="item-summary-main">
            <div className="item-status">
              <span className={`status-pill ${item.status}`}>{item.status === 'deleted' ? 'Deleted' : item.status}</span>
              <span className="item-id">Item #{item.item_id}</span>
            </div>
            <h2>{item.description || 'No description provided'}</h2>
            <div className="item-meta">
              <div>
                <label>Category</label>
                <p>{item.category || 'N/A'}</p>
              </div>
              <div>
                <label>Found at</label>
                <p>{item.location_found || 'N/A'}</p>
              </div>
              <div>
                <label>Pickup location</label>
                <p>{item.pickup_at || 'N/A'}</p>
              </div>
              <div>
                <label>Date recorded</label>
                <p>{formattedDateFound}</p>
              </div>
            </div>
          </div>
          {item.image_url ? (
            <div className="item-image-preview">
              <img src={item.image_url} alt={item.description || 'Item'} />
            </div>
          ) : (
            <div className="item-image-preview placeholder">
              <span role="img" aria-label="box">
                📦
              </span>
              <p>No image provided</p>
            </div>
          )}
        </div>

        <div className="danger-card">
          <h3>Before you delete</h3>
          <ul>
            <li>Students will no longer be able to see or claim this item.</li>
            <li>Existing claims stay in the system for auditing.</li>
            <li>Deletion is logged in the staff activity log.</li>
          </ul>
        </div>

        {error && (
          <div className="inline-error">
            <span>⚠️ {error}</span>
          </div>
        )}

        <div className="danger-actions">
          <button className="btn-secondary" onClick={handleCancel} disabled={isDeleting}>
            Keep item
          </button>
          <button
            className="btn-danger"
            onClick={handleDelete}
            disabled={isDeleting || itemAlreadyDeleted}
            title={itemAlreadyDeleted ? 'This item is already deleted' : undefined}
          >
            {itemAlreadyDeleted ? 'Item already deleted' : isDeleting ? 'Deleting...' : 'Yes, delete this item'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default StaffDeleteItemPage

