import { type ClassValue, clsx } from 'clsx'
import dayjs from 'dayjs'
import { twMerge } from 'tailwind-merge'
import type { AxiosError } from 'axios'

import type { ApiErrorResponse } from '@/types/api'
import type { LocalizedRecord, Nullable } from '@/types/common'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: Nullable<string | number>, currency = 'INR') {
  const numericValue = Number(value ?? 0)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(numericValue) ? numericValue : 0)
}

export function formatNumber(value: Nullable<string | number>, maximumFractionDigits = 2) {
  const numericValue = Number(value ?? 0)
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits,
  }).format(Number.isFinite(numericValue) ? numericValue : 0)
}

export function formatDate(value?: string | Date | null, pattern = 'DD MMM YYYY') {
  if (!value) {
    return '—'
  }

  const date = dayjs(value)
  return date.isValid() ? date.format(pattern) : '—'
}

export function formatDateTime(value?: string | Date | null) {
  return formatDate(value, 'DD MMM YYYY, hh:mm A')
}

export function parseDateValue(value?: string | Date | null) {
  if (!value) {
    return undefined
  }

  const date = dayjs(value)
  return date.isValid() ? date.toDate() : undefined
}

export function formatDateForInput(value?: string | Date | null, pattern = 'YYYY-MM-DD') {
  if (!value) {
    return ''
  }

  const date = dayjs(value)
  return date.isValid() ? date.format(pattern) : ''
}

export function getDisplayName(record?: LocalizedRecord | null, fallback = 'Untitled') {
  return record?.displayName?.trim() || record?.name?.trim() || fallback
}

export function getDisplayDescription(record?: LocalizedRecord | null) {
  return record?.displayDescription?.trim() || record?.description?.trim() || ''
}

export function normalizeNullableString(value?: string | null) {
  const nextValue = value?.trim()
  return nextValue ? nextValue : null
}

export function coerceStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((item) => String(item)).filter(Boolean)
}

export function parseKeyValueText(value?: string | null) {
  if (!value) {
    return {}
  }

  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((accumulator, line) => {
      const [key, ...rest] = line.split(':')
      if (!key || rest.length === 0) {
        return accumulator
      }

      accumulator[key.trim()] = rest.join(':').trim()
      return accumulator
    }, {})
}

export function stringifyKeyValueRecord(value?: Record<string, string> | null) {
  if (!value) {
    return ''
  }

  return Object.entries(value)
    .map(([key, recordValue]) => `${key}: ${recordValue}`)
    .join('\n')
}

export function parseApiError(error: unknown) {
  const axiosError = error as AxiosError<ApiErrorResponse>
  const payload = axiosError.response?.data

  if (payload?.message) {
    return {
      message: payload.message,
      errors: payload.errors,
      statusCode: axiosError.response?.status,
    }
  }

  if (axiosError.code === 'ECONNABORTED') {
    return {
      message: 'The server took too long to respond. Please try again.',
      errors: [],
      statusCode: axiosError.response?.status,
    }
  }

  if (axiosError.message === 'Network Error' || (!axiosError.response && Boolean(axiosError.message))) {
    return {
      message: 'Unable to reach the server. Please check the connection and try again.',
      errors: [],
      statusCode: axiosError.response?.status,
    }
  }

  if (axiosError.message) {
    return {
      message: axiosError.message,
      errors: [],
      statusCode: axiosError.response?.status,
    }
  }

  return {
    message: 'Something went wrong',
    errors: [],
    statusCode: undefined,
  }
}

export function isNotFoundError(error: unknown) {
  return parseApiError(error).statusCode === 404
}

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function sleep(milliseconds: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds)
  })
}
