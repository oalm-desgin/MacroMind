import React, { useEffect } from "react"
import { Routes, Route, Navigate } from "react-router-dom"

import AuthPage from "./pages/Auth/AuthPage"
import DashboardPage from "./pages/Dashboard/DashboardPage"
import AIChatPage from "./pages/AICoach/AIChatPage"
import MealPlannerPage from "./pages/MealPlanner/MealPlannerPage"
import SettingsPage from "./pages/Settings/SettingsPage"
import OnboardingWizard from "./pages/Onboarding/OnboardingWizard"

import ProtectedRoute from "./components/ProtectedRoute"
import AuroraBackground from "./components/AuroraBackground"
import { useAuth } from "./hooks/useAuth"

export default function App() {
  console.log("APP.JSX LOADED – NEW CODE IS RUNNING")

  const { user, loading, hasCompletedOnboarding } = useAuth()

  useEffect(() => {
    console.log("[APP] Route loaded:", window.location.pathname)
    console.log("[APP] User state:", {
      hasUser: !!user,
      hasProfile: !!user?.profile,
      has_completed_onboarding: user?.profile?.has_completed_onboarding,
      hasCompletedOnboarding: hasCompletedOnboarding
        ? hasCompletedOnboarding()
        : "function missing"
    })
  }, [user, hasCompletedOnboarding])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-slate-900 text-white overflow-hidden">
      <AuroraBackground />
      <div className="relative z-10">
        <Routes>

        {/* AUTH */}
        <Route
          path="/auth"
          element={
            user ? (
              hasCompletedOnboarding && hasCompletedOnboarding() ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/onboarding" replace />
              )
            ) : (
              <AuthPage />
            )
          }
        />

        {/* ONBOARDING */}
        <Route
          path="/onboarding"
          element={
            user ? (
              hasCompletedOnboarding && hasCompletedOnboarding() ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <OnboardingWizard />
              )
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* DASHBOARD */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requireOnboarding={true}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* AI COACH */}
        <Route
          path="/ai-coach"
          element={
            <ProtectedRoute requireOnboarding={true}>
              <AIChatPage />
            </ProtectedRoute>
          }
        />

        {/* MEAL PLANNER */}
        <Route
          path="/meal-planner"
          element={
            <ProtectedRoute requireOnboarding={true}>
              <MealPlannerPage />
            </ProtectedRoute>
          }
        />

        {/* SETTINGS */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute requireOnboarding={true}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* FALLBACK */}
        <Route
          path="*"
          element={
            <Navigate to={user ? "/dashboard" : "/auth"} replace />
          }
        />

        </Routes>
      </div>
    </div>
  )
}
