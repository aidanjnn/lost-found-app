import React from 'react'
import './NotificationCenter.css'

const typeIconMap = {
  success: '✅',
  warning: '⚠️',
  info: 'ℹ️',
  danger: '❗'
}

function NotificationCenter({ notifications = [], loading = false, onMarkRead }) {
  if (loading) {
    return (
      <div className="notification-center skeleton">
        <div className="notification-skeleton"></div>
      </div>
    )
  }

  if (!notifications.length) {
    return null
  }

  return (
    <div className="notification-center">
      <div className="notification-header">
        <div>
          <p className="notification-eyebrow">Latest Alerts</p>
          <h3>Claim Updates</h3>
        </div>
        <span className="notification-count">{notifications.length} new</span>
      </div>
      <div className="notification-list">
        {notifications.map((notification) => (
          <div key={notification.notification_id} className={`notification-card ${notification.type}`}>
            <div className="notification-icon">
              {typeIconMap[notification.type] || '🔔'}
            </div>
            <div className="notification-copy">
              <p className="notification-title">{notification.title}</p>
              <p className="notification-message">{notification.message}</p>
              {notification.metadata?.claim_id && (
                <span className="notification-meta">
                  Claim #{notification.metadata.claim_id}
                  {notification.metadata.item_id ? ` • Item #${notification.metadata.item_id}` : ''}
                </span>
              )}
              <span className="notification-time">
                {new Date(notification.created_at).toLocaleString()}
              </span>
            </div>
            <button
              className="notification-action"
              onClick={() => onMarkRead?.(notification)}
            >
              Mark read
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default NotificationCenter

