/**
 * Toast Notification System
 * Sprint 4: Issue #46 - Enhanced UI
 * 
 * Provides toast notifications for success/error messages throughout the app.
 * Uses react-hot-toast library for reliable, accessible notifications.
 * 
 * Author: Team 15
 * Sprint: 4
 */

import { Toaster } from 'react-hot-toast'

/**
 * Toast Provider Component
 * Place this at the root of your app (in App.jsx)
 */
export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        // Default options
        duration: 4000,
        style: {
          background: '#FFFFFF',
          color: '#000000',
          padding: '16px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          maxWidth: '500px',
          fontSize: '15px',
          fontWeight: '500',
        },
        // Success toast (UWaterloo Gold - Logo Colors)
        success: {
          duration: 3000,
          style: {
            background: 'linear-gradient(135deg, #E8D066 0%, #C7A842 100%)',
            color: '#000000',
          },
          iconTheme: {
            primary: '#000000',
            secondary: '#C7A842',
          },
        },
        // Error toast (Red)
        error: {
          duration: 5000,
          style: {
            background: '#DC3545',
            color: '#FFFFFF',
          },
          iconTheme: {
            primary: '#FFFFFF',
            secondary: '#DC3545',
          },
        },
        // Loading toast
        loading: {
          style: {
            background: '#003366',
            color: '#FFFFFF',
          },
        },
      }}
    />
  )
}

export default ToastProvider

