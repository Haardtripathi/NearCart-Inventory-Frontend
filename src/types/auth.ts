import type { BranchAccessState, LanguageCode, OrganizationSummary, UserRole } from './common'

export interface AuthUser {
  id: string
  fullName: string
  email: string
  isActive?: boolean
  platformRole?: UserRole | null
  preferredLanguage: LanguageCode
  lastLoginAt?: string | null
}

export interface OrganizationMembership {
  id: string
  organizationId: string
  role: UserRole
  isDefault: boolean
  branchAccess: BranchAccessState
  organization: OrganizationSummary
}

export interface LoginPayload {
  email: string
  password: string
  organizationId?: string
}

export interface LoginResponse {
  token: string
  user: AuthUser
  activeOrganizationId: string | null
  role: UserRole
  memberships: OrganizationMembership[]
}

export interface MeResponse extends AuthUser {
  activeOrganizationId: string | null
  role: UserRole
  memberships: OrganizationMembership[]
}

export type AuthSession = LoginResponse
