import { useMemo } from 'react'

import { useOrganizationQuery } from '@/features/organizations/organizations.api'
import { useAuth } from '@/hooks/useAuth'
import type { Industry, OrganizationSummary } from '@/types/common'

function getPrimaryIndustryEntry(organization?: OrganizationSummary | null) {
  return organization?.industries?.find((entry) => entry.isPrimary) ?? organization?.industries?.[0] ?? null
}

export function getOrganizationDefaultIndustryId(organization?: OrganizationSummary | null) {
  return getPrimaryIndustryEntry(organization)?.industryId ?? null
}

export function useActiveOrganizationContext() {
  const { activeOrganizationId, memberships } = useAuth()

  const activeMembership = useMemo(
    () => memberships.find((membership) => membership.organizationId === activeOrganizationId) ?? null,
    [activeOrganizationId, memberships],
  )

  const membershipOrganization = activeMembership?.organization ?? null
  const shouldFetchOrganization = Boolean(activeOrganizationId && !(membershipOrganization?.industries?.length))
  const organizationQuery = useOrganizationQuery(shouldFetchOrganization ? activeOrganizationId ?? undefined : undefined)
  const activeOrganization = organizationQuery.data ?? membershipOrganization
  const defaultIndustryEntry = useMemo(
    () => getPrimaryIndustryEntry(activeOrganization),
    [activeOrganization],
  )

  return {
    activeMembership,
    activeOrganization,
    defaultIndustryId: defaultIndustryEntry?.industryId ?? null,
    defaultIndustry: (defaultIndustryEntry?.industry as Industry | undefined) ?? null,
    isLoading: shouldFetchOrganization && organizationQuery.isLoading,
  }
}
