import { Navigate, useLocation } from "react-router-dom"
import type { PermissionName } from "@jewellery/types"
import { useAuthStore } from "../stores/authStore"
import { useAuth } from "../types/auth-context"

type AdminRouteProps = {
  children: React.ReactNode
  requiredPermissions?: PermissionName[]
}

export const AdminRoute = ({ children, requiredPermissions = ["admin"] }: AdminRouteProps) => {
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

  const hasAccess = requiredPermissions.some((permission) => user.permissions.includes(permission))
  if (!hasAccess) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
