import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AppProvider } from './contexts/AppContext'
import { LoginPage } from './components/auth/LoginPage'
import { OnboardingPage } from './components/auth/OnboardingPage'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './components/dashboard/Dashboard'

function AppContent() {
  const { user, profile, loading } = useAuth()

  console.log('🎯 AppContent render state:', { 
    hasUser: !!user, 
    hasProfile: !!profile, 
    profileOnboarded: profile?.onboarded,
    loading 
  })

  // Show loading spinner while authentication and profile data is being fetched
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show login page if no user is authenticated
  if (!user) {
    console.log('📄 Rendering LoginPage - no user authenticated')
    return <LoginPage />
  }

  // Show onboarding for users who haven't completed onboarding
  // This includes users with no profile (new users) or users with profile but onboarded: false
  if (!profile?.onboarded) {
    console.log('📄 Rendering OnboardingPage - user not onboarded')
    return <OnboardingPage />
  }

  // Show dashboard for onboarded users
  console.log('📄 Rendering Dashboard - user is onboarded')
  return (
    <Layout>
      <Dashboard />
    </Layout>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </AuthProvider>
    </Router>
  )
}

export default App