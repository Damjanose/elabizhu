import type { AdminUsersListResponse, PermissionName } from "@jewellery/types"
import { apiClient } from "../api/client"

export const fetchAdminUsers = async () => {
  const { data } = await apiClient.get<AdminUsersListResponse>("/admin/users")
  return data
}

export const setUserActive = async (userId: string, isActive: boolean) => {
  const { data } = await apiClient.patch<AdminUsersListResponse>(`/admin/users/${userId}/active`, { isActive })
  return data
}

export const updateUserPermissions = async (userId: string, permissions: PermissionName[]) => {
  const { data } = await apiClient.patch<AdminUsersListResponse>(`/admin/users/${userId}/permissions`, { permissions })
  return data
}
