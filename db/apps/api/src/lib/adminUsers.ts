import type { AdminUserRow, PermissionName } from "@jewellery/types"
import { db } from "./db.js"

const iso = (d: Date) => d.toISOString()

const getPermissionMap = async (userIds: string[]) => {
  if (userIds.length === 0) return new Map<string, PermissionName[]>()
  const rows = await db
    .selectFrom("user_permissions as up")
    .innerJoin("permissions as p", "p.id", "up.permission_id")
    .select(["up.user_id as user_id", "p.name as permission"])
    .where("up.user_id", "in", userIds)
    .execute()

  const map = new Map<string, PermissionName[]>()
  for (const row of rows) {
    const list = map.get(row.user_id) ?? []
    list.push(row.permission as PermissionName)
    map.set(row.user_id, list)
  }
  return map
}

const getSessionMap = async (userIds: string[]) => {
  if (userIds.length === 0) return new Map<string, boolean>()
  const activeRows = await db
    .selectFrom("auth_sessions")
    .select("user_id")
    .where("user_id", "in", userIds)
    .where("revoked_at", "is", null)
    .where("expires_at", ">", new Date())
    .groupBy("user_id")
    .execute()

  return new Map<string, boolean>(activeRows.map((row) => [row.user_id, true]))
}

export const listUsers = async (): Promise<{ users: AdminUserRow[]; availablePermissions: PermissionName[] }> => {
  const users = await db
    .selectFrom("users as u")
    .leftJoin("user_details as ud", "ud.user_id", "u.id")
    .select([
      "u.id as id",
      "u.email as email",
      "u.is_active as is_active",
      "u.created_at as created_at",
      "u.updated_at as updated_at",
      "ud.full_name as full_name",
      "ud.phone as phone",
    ])
    .orderBy("u.created_at desc")
    .execute()

  const userIds = users.map((user) => user.id)
  const [permissionMap, sessionMap, availablePermissionRows] = await Promise.all([
    getPermissionMap(userIds),
    getSessionMap(userIds),
    db.selectFrom("permissions").select("name").orderBy("name asc").execute(),
  ])

  return {
    users: users.map((user) => ({
      id: user.id,
      email: user.email,
      fullName: user.full_name ?? user.email,
      phone: user.phone ?? null,
      isActive: user.is_active,
      hasActiveSession: Boolean(sessionMap.get(user.id)),
      permissions: permissionMap.get(user.id) ?? [],
      createdAt: iso(user.created_at),
      updatedAt: iso(user.updated_at),
    })),
    availablePermissions: availablePermissionRows.map((row) => row.name as PermissionName),
  }
}

export const setUserActive = async (adminUserId: string, targetUserId: string, isActive: boolean) => {
  if (!isActive && adminUserId === targetUserId) {
    throw new Error("Cannot deactivate your own account")
  }

  const updated = await db
    .updateTable("users")
    .set({ is_active: isActive, updated_at: new Date() })
    .where("id", "=", targetUserId)
    .returning("id")
    .executeTakeFirst()

  if (!updated) return null
  return listUsers()
}

export const updateUserPermissions = async (adminUserId: string, targetUserId: string, permissions: PermissionName[]) => {
  if (adminUserId === targetUserId && !permissions.includes("admin")) {
    throw new Error("Cannot remove your own admin permission")
  }

  const user = await db.selectFrom("users").select("id").where("id", "=", targetUserId).executeTakeFirst()
  if (!user) return null

  const availableRows = await db.selectFrom("permissions").select(["id", "name"]).execute()
  const permissionIdByName = new Map(availableRows.map((row) => [row.name as PermissionName, row.id]))

  for (const permission of permissions) {
    if (!permissionIdByName.has(permission)) {
      throw new Error(`Unknown permission: ${permission}`)
    }
  }

  await db.transaction().execute(async (trx) => {
    await trx.deleteFrom("user_permissions").where("user_id", "=", targetUserId).execute()
    if (permissions.length > 0) {
      await trx
        .insertInto("user_permissions")
        .values(
          permissions.map((permission) => ({
            user_id: targetUserId,
            permission_id: permissionIdByName.get(permission) as string,
          })),
        )
        .execute()
    }
  })

  return listUsers()
}
