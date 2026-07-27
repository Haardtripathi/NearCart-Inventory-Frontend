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

/** POST /auth/send-otp response — unauthenticated (email+code, no session yet), used to let a
 *  self-registered org owner who's blocked at login (403 "please verify your email") request a
 *  fresh code without needing to already be signed in. See auth.service.ts's login()/sendOtp(). */
export interface SendEmailOtpResponse {
  sent: boolean
}

/** POST /auth/verify-otp response. On success the account's `emailVerified` flips server-side,
 *  unblocking a subsequent /auth/login call — this endpoint does not itself return a session. */
export interface VerifyEmailOtpResponse {
  emailVerified: boolean
}
