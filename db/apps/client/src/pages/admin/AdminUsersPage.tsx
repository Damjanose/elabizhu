import { useEffect, useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { AdminUserRow, PermissionName } from "@jewellery/types"
import { fetchAdminUsers, setUserActive, updateUserPermissions } from "../../services/adminUsers"
import { useAdminUsersStore } from "../../stores/adminUsersStore"

const hasAdminPermission = (user: AdminUserRow) => user.permissions.includes("admin")

export const AdminUsersPage = () => {
  const queryClient = useQueryClient()
  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: fetchAdminUsers,
    retry: 1,
  })
  const { selectedUserId, search, permissionDraft, setSelectedUserId, setSearch, setPermissionDraft } =
    useAdminUsersStore()

  const activeMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) => setUserActive(userId, isActive),
    onSuccess: (data) => queryClient.setQueryData(["admin-users"], data),
  })

  const permissionMutation = useMutation({
    mutationFn: ({ userId, permissions }: { userId: string; permissions: PermissionName[] }) =>
      updateUserPermissions(userId, permissions),
    onSuccess: (data) => queryClient.setQueryData(["admin-users"], data),
  })

  const users = usersQuery.data?.users ?? []
  const availablePermissions = usersQuery.data?.availablePermissions ?? []

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return users
    return users.filter(
      (user) =>
        user.fullName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.permissions.some((permission) => permission.toLowerCase().includes(query)),
    )
  }, [search, users])

  const selectedUser = filteredUsers.find((user) => user.id === selectedUserId) ?? filteredUsers[0]

  useEffect(() => {
    if (!selectedUser) {
      setSelectedUserId("")
      setPermissionDraft([])
      return
    }
    setSelectedUserId(selectedUser.id)
    setPermissionDraft(selectedUser.permissions)
  }, [selectedUser?.id])

  if (usersQuery.isLoading) return <div className="aurelia-admin-panel p-4">Loading users…</div>

  if (usersQuery.isError) {
    return (
      <div className="aurelia-admin-panel p-4">
        <p className="mb-3">Could not load users right now.</p>
        <button type="button" className="aurelia-btn aurelia-btn-primary" onClick={() => void usersQuery.refetch()}>
          Retry
        </button>
      </div>
    )
  }

  const togglePermission = (permission: PermissionName) => {
    const next = permissionDraft.includes(permission)
      ? permissionDraft.filter((item) => item !== permission)
      : [...permissionDraft, permission]
    setPermissionDraft(next)
  }

  const isSaving = activeMutation.isPending || permissionMutation.isPending
  const hasPermissionChanges =
    !!selectedUser &&
    [...permissionDraft].sort().join(",") !== [...selectedUser.permissions].sort().join(",")

  return (
    <div className="aurelia-admin-page">
      <div className="aurelia-admin-page-header">
        <div>
          <p className="aurelia-admin-kicker mb-2">Identity & Access</p>
          <h1 className="aurelia-admin-title mb-0">Users</h1>
        </div>
      </div>

      <div className="aurelia-admin-users-layout">
        <section className="aurelia-admin-users-list">
          <div className="aurelia-admin-users-list-head">
            <label className="aurelia-admin-users-search">
              <span className="material-symbols-outlined" aria-hidden>search</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search users, emails, permissions"
              />
            </label>
            <p className="aurelia-admin-users-count mb-0">{filteredUsers.length} users</p>
          </div>

          <div className="aurelia-admin-users-list-scroll">
            <div className="aurelia-admin-users-table-head">
              <span>Name</span>
              <span>Status</span>
              <span>Role</span>
            </div>
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                className={`aurelia-admin-user-row${selectedUser?.id === user.id ? " is-selected" : ""}`}
                onClick={() => setSelectedUserId(user.id)}
                title={user.email}
              >
                <span className="aurelia-admin-user-row-name">{user.fullName}</span>
                <span className="aurelia-admin-user-row-status">
                  <span className={`aurelia-admin-status-chip ${user.isActive ? "is-success" : "is-danger"}`}>
                    {user.isActive ? "active" : "blocked"}
                  </span>
                </span>
                <span className="aurelia-admin-user-row-role">{hasAdminPermission(user) ? "Admin" : "Member"}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="aurelia-admin-users-detail">
          {!selectedUser ? (
            <div className="aurelia-admin-panel p-4">No users found for this search.</div>
          ) : (
            <div className="aurelia-admin-users-detail-panel">
              <header>
                <p className="aurelia-admin-kicker mb-2">User profile</p>
                <h2 className="aurelia-admin-card-title mb-1">{selectedUser.fullName}</h2>
                <p className="aurelia-muted mb-0">{selectedUser.email}</p>
              </header>

              <div className="aurelia-admin-users-metadata">
                <div>
                  <span>Status</span>
                  <strong>{selectedUser.isActive ? "Active" : "Blocked"}</strong>
                </div>
                <div>
                  <span>Session</span>
                  <strong>{selectedUser.hasActiveSession ? "Online" : "Offline"}</strong>
                </div>
                <div>
                  <span>Role</span>
                  <strong>{hasAdminPermission(selectedUser) ? "Admin" : "Member"}</strong>
                </div>
              </div>

              <div className="aurelia-admin-users-actions">
                <button
                  type="button"
                  className="aurelia-btn aurelia-btn-outline"
                  disabled={isSaving}
                  onClick={() =>
                    void activeMutation.mutateAsync({ userId: selectedUser.id, isActive: !selectedUser.isActive })
                  }
                >
                  {selectedUser.isActive ? "Block user" : "Unblock user"}
                </button>
                <button
                  type="button"
                  className="aurelia-btn aurelia-btn-ghost-danger"
                  disabled={isSaving || !selectedUser.isActive}
                  onClick={() => {
                    if (!window.confirm("Deactivate this account? This is a soft-delete and can be reversed.")) return
                    void activeMutation.mutateAsync({ userId: selectedUser.id, isActive: false })
                  }}
                >
                  Deactivate account
                </button>
              </div>

              <div className="aurelia-admin-users-permissions">
                <h3 className="aurelia-admin-card-title mb-2">Permissions</h3>
                <div className="aurelia-admin-users-permission-grid">
                  {availablePermissions.map((permission) => (
                    <label key={permission} className="aurelia-admin-users-permission-item">
                      <input
                        type="checkbox"
                        checked={permissionDraft.includes(permission)}
                        onChange={() => togglePermission(permission)}
                      />
                      <span>{permission}</span>
                    </label>
                  ))}
                </div>
                <div className="aurelia-admin-users-permission-actions">
                  <button
                    type="button"
                    className="aurelia-btn aurelia-btn-primary"
                    disabled={!hasPermissionChanges || isSaving}
                    onClick={() =>
                      void permissionMutation.mutateAsync({
                        userId: selectedUser.id,
                        permissions: permissionDraft,
                      })
                    }
                  >
                    Save permissions
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
