import { Navigate, useSearchParams } from "react-router-dom"
import { useAuth } from "../types/auth-context"
import { useAuthStore } from "../stores/authStore"
import { sanitizeRedirect } from "../utils/post-auth-redirect"

export const GuestRoute = ({
  children,
  redirectTo = "/admin",
}: {
  children: React.ReactNode
  redirectTo?: string
}) => {
  const { user } = useAuth()
  const sessionReady = useAuthStore((state) => state.sessionReady)
  const [searchParams] = useSearchParams()

  if (!sessionReady) {
    return null
  }

  if (user) {
    const next = sanitizeRedirect(searchParams.get("redirect")) ?? redirectTo
    return <Navigate to={next} replace />
  }

  return <>{children}</>
}
