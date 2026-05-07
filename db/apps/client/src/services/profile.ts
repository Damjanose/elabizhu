import type { Address, AddressInput, UpdateProfileInput, User } from "@jewellery/types"
import { apiClient } from "../api/client"

export const updateProfile = async (input: UpdateProfileInput) => {
  const { data } = await apiClient.patch<User>("/me/profile", input)
  return data
}

export const fetchAddresses = async () => {
  const { data } = await apiClient.get<Address[]>("/me/addresses")
  return data
}

export const createAddress = async (input: AddressInput) => {
  const { data } = await apiClient.post<Address>("/me/addresses", input)
  return data
}

export const updateAddress = async (id: string, input: AddressInput) => {
  const { data } = await apiClient.patch<Address>(`/me/addresses/${id}`, input)
  return data
}

export const deleteAddress = async (id: string) => {
  await apiClient.delete(`/me/addresses/${id}`)
}

export const setDefaultAddress = async (id: string) => {
  const { data } = await apiClient.post<Address>(`/me/addresses/${id}/default`)
  return data
}
