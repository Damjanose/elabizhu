import type { PermissionName } from "@jewellery/types"
import { create } from "zustand"

type AdminUsersUiState = {
  selectedUserId: string
  search: string
  permissionDraft: PermissionName[]
  setSelectedUserId: (id: string) => void
  setSearch: (value: string) => void
  setPermissionDraft: (permissions: PermissionName[]) => void
}

export const useAdminUsersStore = create<AdminUsersUiState>((set) => ({
  selectedUserId: "",
  search: "",
  permissionDraft: [],
  setSelectedUserId: (selectedUserId) => set({ selectedUserId }),
  setSearch: (search) => set({ search }),
  setPermissionDraft: (permissionDraft) => set({ permissionDraft }),
}))
