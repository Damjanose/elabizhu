import { db } from "./db.js"
import type { Address, AddressInput, UpdateProfileInput } from "@jewellery/types"

const serializeAddress = (row: {
  id: string
  label: string
  recipient_name: string
  line1: string
  line2: string | null
  city: string
  postal_code: string
  country: string
  phone: string | null
  is_default: boolean
  created_at: Date
  updated_at: Date
}): Address => ({
  id: row.id,
  label: row.label,
  recipientName: row.recipient_name,
  line1: row.line1,
  line2: row.line2,
  city: row.city,
  postalCode: row.postal_code,
  country: row.country,
  phone: row.phone,
  isDefault: row.is_default,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
})

export const updateProfile = async (userId: string, input: UpdateProfileInput) => {
  await db
    .updateTable("user_details")
    .set({
      full_name: input.fullName,
      phone: input.phone ?? null,
      updated_at: new Date(),
    })
    .where("user_id", "=", userId)
    .execute()
}

export const listAddresses = async (userId: string): Promise<Address[]> => {
  const rows = await db
    .selectFrom("user_addresses")
    .selectAll()
    .where("user_id", "=", userId)
    .orderBy("is_default", "desc")
    .orderBy("created_at", "desc")
    .execute()
  return rows.map(serializeAddress)
}

export const getAddress = async (userId: string, addressId: string): Promise<Address | null> => {
  const row = await db
    .selectFrom("user_addresses")
    .selectAll()
    .where("user_id", "=", userId)
    .where("id", "=", addressId)
    .executeTakeFirst()
  return row ? serializeAddress(row) : null
}

export const createAddress = async (userId: string, input: AddressInput): Promise<Address> => {
  return db.transaction().execute(async (trx) => {
    const existingCount = await trx
      .selectFrom("user_addresses")
      .select(({ fn }) => [fn.countAll<string>().as("count")])
      .where("user_id", "=", userId)
      .executeTakeFirstOrThrow()

    const isFirst = Number(existingCount.count) === 0
    const shouldBeDefault = input.isDefault === true || isFirst

    if (shouldBeDefault) {
      await trx
        .updateTable("user_addresses")
        .set({ is_default: false, updated_at: new Date() })
        .where("user_id", "=", userId)
        .execute()
    }

    const inserted = await trx
      .insertInto("user_addresses")
      .values({
        user_id: userId,
        label: input.label,
        recipient_name: input.recipientName,
        line1: input.line1,
        line2: input.line2 ?? null,
        city: input.city,
        postal_code: input.postalCode,
        country: input.country,
        phone: input.phone ?? null,
        is_default: shouldBeDefault,
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    return serializeAddress(inserted)
  })
}

export const updateAddress = async (
  userId: string,
  addressId: string,
  input: AddressInput,
): Promise<Address | null> => {
  return db.transaction().execute(async (trx) => {
    const existing = await trx
      .selectFrom("user_addresses")
      .selectAll()
      .where("user_id", "=", userId)
      .where("id", "=", addressId)
      .executeTakeFirst()

    if (!existing) return null

    if (input.isDefault === true && !existing.is_default) {
      await trx
        .updateTable("user_addresses")
        .set({ is_default: false, updated_at: new Date() })
        .where("user_id", "=", userId)
        .where("id", "!=", addressId)
        .execute()
    }

    const updated = await trx
      .updateTable("user_addresses")
      .set({
        label: input.label,
        recipient_name: input.recipientName,
        line1: input.line1,
        line2: input.line2 ?? null,
        city: input.city,
        postal_code: input.postalCode,
        country: input.country,
        phone: input.phone ?? null,
        is_default: input.isDefault === true ? true : existing.is_default,
        updated_at: new Date(),
      })
      .where("id", "=", addressId)
      .where("user_id", "=", userId)
      .returningAll()
      .executeTakeFirstOrThrow()

    return serializeAddress(updated)
  })
}

export const deleteAddress = async (userId: string, addressId: string): Promise<boolean> => {
  return db.transaction().execute(async (trx) => {
    const existing = await trx
      .selectFrom("user_addresses")
      .selectAll()
      .where("user_id", "=", userId)
      .where("id", "=", addressId)
      .executeTakeFirst()

    if (!existing) return false

    await trx
      .deleteFrom("user_addresses")
      .where("id", "=", addressId)
      .where("user_id", "=", userId)
      .execute()

    // If we removed the default, promote the most recently created address as the new default.
    if (existing.is_default) {
      const fallback = await trx
        .selectFrom("user_addresses")
        .select("id")
        .where("user_id", "=", userId)
        .orderBy("created_at", "desc")
        .limit(1)
        .executeTakeFirst()

      if (fallback) {
        await trx
          .updateTable("user_addresses")
          .set({ is_default: true, updated_at: new Date() })
          .where("id", "=", fallback.id)
          .execute()
      }
    }

    return true
  })
}

export const setDefaultAddress = async (
  userId: string,
  addressId: string,
): Promise<Address | null> => {
  return db.transaction().execute(async (trx) => {
    const existing = await trx
      .selectFrom("user_addresses")
      .selectAll()
      .where("user_id", "=", userId)
      .where("id", "=", addressId)
      .executeTakeFirst()

    if (!existing) return null

    await trx
      .updateTable("user_addresses")
      .set({ is_default: false, updated_at: new Date() })
      .where("user_id", "=", userId)
      .execute()

    const updated = await trx
      .updateTable("user_addresses")
      .set({ is_default: true, updated_at: new Date() })
      .where("user_id", "=", userId)
      .where("id", "=", addressId)
      .returningAll()
      .executeTakeFirstOrThrow()

    return serializeAddress(updated)
  })
}
