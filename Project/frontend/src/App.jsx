/**
 * UW Lost-and-Found App - Main App Component
 * Sprint 3: Staff Claiming Management UI (Front-End)
 * 
 * This component sets up the main application structure with routing.
 * Includes navigation bar and routes for all primary pages.
 * 
 * Author: Team 15 (Ruhani, Sheehan, Aidan, Neng, Theni)
 * Sprint: 3
 */

import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Navigation from './components/Navigation'
import LostItemsPage from './pages/LostItemsPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ProfilePage from './pages/ProfilePage'
import HomePage from './pages/HomePage'
import StaffDashboardPage from './pages/StaffDashboardPage'
import StudentDashboardPage from './pages/StudentDashboardPage'
import MyClaimsPage from './pages/MyClaimsPage'
import StaffClaimsManagementPage from './pages/StaffClaimsManagementPage'
import ArchivedItemsPage from './pages/ArchivedItemsPage'
import AnalyticsDashboardPage from './pages/AnalyticsDashboardPage'
import ActivityLogPage from './pages/ActivityLogPage'
import StaffDeleteItemPage from './pages/StaffDeleteItemPage'
import { ToastProvider } from './components/ui/Toast'
import './App.css'
import './styles/premiumForms.css'
import './styles/enhancedForms.css'

function App() {
  return (
    <div className="App">
      <ToastProvider />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Navigation />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/lost-items" element={<LostItemsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/staff/dashboard" element={<StaffDashboardPage />} />
          <Route path="/staff/items/:itemId/delete" element={<StaffDeleteItemPage />} />
          <Route path="/staff/claims" element={<StaffClaimsManagementPage />} />
          <Route path="/staff/archived" element={<ArchivedItemsPage />} />
          <Route path="/staff/analytics" element={<AnalyticsDashboardPage />} />
          <Route path="/staff/activity-log" element={<ActivityLogPage />} />
          <Route path="/student/dashboard" element={<StudentDashboardPage />} />
          <Route path="/my-claims" element={<MyClaimsPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App

