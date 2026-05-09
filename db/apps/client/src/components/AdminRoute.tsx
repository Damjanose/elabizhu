import { Navigate, useLocation } from "react-router-dom"
import { useAuthStore } from "../stores/authStore"
import { useAuth } from "../types/auth-context"

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth()
  const location = useLocation()
  const sessionReady = useAuthStore((state) => state.sessionReady)

  if (!sessionReady) {
    return null
  }

  if (!user) {
    const target = `${location.pathname}${location.search}${location.hash}`
    const redirect = encodeURIComponent(target || "/")
    return <Navigate to={`/login?redirect=${redirect}`} replace />
  }

  if (!user.permissions.includes("admin")) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
