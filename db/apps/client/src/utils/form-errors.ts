import axios from "axios"
import { tNow } from "../i18n"

type ApiIssue = {
  path?: string[]
  message?: string
}

type ApiErrorBody = {
  message?: string
  issues?: ApiIssue[]
}

const humanizeFieldName = (field: string) => {
  if (field === "fullName") return tNow("account.field.fullName")
  if (field === "email") return tNow("account.field.email")
  if (field === "password") return tNow("account.field.password")
  return field
}

const toFriendlyIssueMessage = (field: string, rawMessage: string) => {
  const label = humanizeFieldName(field)
  if (rawMessage.includes("expected string to have >=1 characters")) {
    return tNow("account.validation.fieldRequired", { field: label })
  }
  if (rawMessage.includes("expected string to have >=8 characters")) {
    return tNow("account.validation.fieldMin", { field: label })
  }
  if (rawMessage.toLowerCase().includes("invalid email")) {
    return tNow("account.validation.emailInvalid")
  }
  return rawMessage
}

export const extractFieldErrors = (error: unknown) => {
  const fieldErrors: Record<string, string> = {}
  let formError: string | null = null

  if (!axios.isAxiosError(error)) {
    return { fieldErrors, formError }
  }

  const data = error.response?.data as ApiErrorBody | undefined

  if (Array.isArray(data?.issues)) {
    for (const issue of data.issues) {
      const field = issue.path?.[0]
      if (!field || !issue.message || fieldErrors[field]) {
        continue
      }
      fieldErrors[field] = toFriendlyIssueMessage(field, issue.message)
    }
  }

  formError = data?.message ?? error.message ?? tNow("account.error.requestFailed")
  return { fieldErrors, formError }
}
