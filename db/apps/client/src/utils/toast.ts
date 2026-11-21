import { isAxiosError } from "axios"
import { toast, type ToastOptions } from "react-toastify"
import { tNow } from "../i18n"

const baseOptions: ToastOptions = {
  position: "top-right",
  autoClose: 3500,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: false,
}

export const successToast = (message: string, options?: ToastOptions) =>
  toast.success(message, { ...baseOptions, ...options })

export const errorToast = (message: string, options?: ToastOptions) =>
  toast.error(message, { ...baseOptions, autoClose: 5000, ...options })

export const infoToast = (message: string, options?: ToastOptions) =>
  toast.info(message, { ...baseOptions, ...options })

export const warningToast = (message: string, options?: ToastOptions) =>
  toast.warning(message, { ...baseOptions, ...options })

/**
 * Pulls a human-readable message out of an unknown error (Axios responses,
 * Error instances, plain strings) and surfaces it as an error toast.
 * Returns the resolved message so callers can also forward it elsewhere.
 */
export const toastFromError = (error: unknown, fallback = tNow("account.error.generic")): string => {
  let message = fallback

  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined
    message = data?.message ?? error.message ?? fallback
  } else if (error instanceof Error) {
    message = error.message || fallback
  } else if (typeof error === "string" && error.trim().length > 0) {
    message = error
  }

  errorToast(message)
  return message
}

export { toast }
