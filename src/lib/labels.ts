import type { TFunction } from 'i18next'

export function humanizeEnum(value: string) {
  return value
    .trim()
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function translateEnumValue(t: TFunction, key: string, value: string) {
  return t(`${key}.${value}`, {
    ns: 'common',
    defaultValue: humanizeEnum(value),
  })
}

export function getLanguageLabel(t: TFunction, value: string) {
  return translateEnumValue(t, 'languageNames', value.toUpperCase())
}

export function getBranchTypeLabel(t: TFunction, value: string) {
  return translateEnumValue(t, 'branchTypeValues', value)
}

export function getSalesOrderStatusLabel(t: TFunction, value: string) {
  return translateEnumValue(t, 'salesOrderStatusValues', value)
}

export function getPaymentStatusLabel(t: TFunction, value: string) {
  return translateEnumValue(t, 'paymentStatusValues', value)
}

export function getOrderSourceLabel(t: TFunction, value: string) {
  return translateEnumValue(t, 'orderSourceValues', value)
}

export function getStockMovementTypeLabel(t: TFunction, value: string) {
  return translateEnumValue(t, 'stockMovementTypeValues', value)
}

export function getAuditActionLabel(t: TFunction, value: string) {
  return translateEnumValue(t, 'auditActionValues', value)
}

export function getMembershipStatusLabel(t: TFunction, value: string) {
  return translateEnumValue(t, 'membershipStatusValues', value)
}

export function getUserRoleLabel(t: TFunction, value: string) {
  return translateEnumValue(t, 'roleValues', value)
}
