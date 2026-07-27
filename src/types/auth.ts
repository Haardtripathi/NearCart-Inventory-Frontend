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

/** POST /auth/register-organization-owner response. Previously this was byte-for-byte the same
 *  shape as LoginResponse (a working session token, no email verification required) — confirmed
 *  live as a bug: the token worked immediately against authenticated routes even though the new
 *  account's emailVerified is false, unlike /auth/login which 403s in that exact case. Fixed
 *  server-side (auth.service.ts's registerOrganizationOwner) to no longer issue a token at all;
 *  it now auto-sends the same OTP /auth/send-otp uses and returns this instead, so the client
 *  must complete /auth/verify-otp and then /auth/login to obtain a real session. */
export interface RegisterOrganizationOwnerResponse {
  requiresEmailVerification: true
  email: string
  fullName: string
  organizationId: string
}

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
