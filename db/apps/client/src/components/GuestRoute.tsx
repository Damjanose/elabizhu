import { Navigate } from "react-router-dom"
import { useAuth } from "../types/auth-context"
import { useAuthStore } from "../stores/authStore"

export const GuestRoute = ({
  children,
  redirectTo = "/account",
}: {
  children: React.ReactNode
  redirectTo?: string
}) => {
  const { user } = useAuth()
  const sessionReady = useAuthStore((state) => state.sessionReady)

  if (!sessionReady) {
    return null
  }

  if (user) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}
