import axios from 'axios'

import { useAuthStore } from '@/store/auth.store'
import { useUiStore } from '@/store/ui.store'
import { toBackendLanguage } from './locale'
import type { ApiSuccessResponse } from '@/types/api'
import { parseApiError } from './utils'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const { token, activeOrganizationId } = useAuthStore.getState()
  const { language } = useUiStore.getState()
  const requestUrl = typeof config.url === 'string' ? config.url : ''
  const isPublicAuthRequest =
    requestUrl.includes('/auth/login') ||
    requestUrl.includes('/auth/bootstrap-super-admin') ||
    requestUrl.includes('/auth/register-organization-owner') ||
    requestUrl.includes('/auth/complete-account-setup') ||
    requestUrl.includes('/auth/reset-password')

  if (token && !isPublicAuthRequest) {
    config.headers.Authorization = `Bearer ${token}`
  }

  if (activeOrganizationId && !isPublicAuthRequest) {
    config.headers['x-organization-id'] = activeOrganizationId
  }

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }

  config.headers['Accept-Language'] = toBackendLanguage(language).toLowerCase()
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { statusCode } = parseApiError(error)

    if (statusCode === 401) {
      useAuthStore.getState().clearSession()

      if (window.location.pathname !== '/login') {
        window.location.replace('/login')
      }
    }

    return Promise.reject(error)
  },
)

export async function unwrapResponse<T>(promise: Promise<{ data: ApiSuccessResponse<T> }>) {
  const response = await promise
  return response.data.data
}

export { api }
