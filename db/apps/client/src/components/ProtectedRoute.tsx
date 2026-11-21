import { Navigate, useLocation } from "react-router-dom"
import { useAuthStore } from "../stores/authStore"
import { useAuth } from "../types/auth-context"

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth()
  const location = useLocation()
  const sessionReady = useAuthStore((state) => state.sessionReady)

  if (!sessionReady) {
    return null
  }

  if (!user) {
    // Customers never sign in; send anonymous visitors to the public site.
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
