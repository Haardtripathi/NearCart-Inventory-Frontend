import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'

import { useVerifyShopPhotoMutation, type ShopPhotoVerificationResponse } from '@/features/branches/branches.api'
import { StatusBadge } from '@/components/common'
import { Button } from '@/components/ui'
import type { Branch } from '@/types/common'
import { parseApiError } from '@/lib/utils'

/**
 * Compulsory shop-photo verification for onboarding (see backend
 * branches.verification.service.ts). Upload always succeeds and stores the photo even when
 * Replicate isn't configured — the badge below reflects PENDING_VERIFICATION in that case rather
 * than blocking anything, matching the "don't hard-block onboarding on the AI check" requirement.
 */
export function ShopPhotoVerificationPanel({ branch }: { branch: Branch }) {
  const { t } = useTranslation(['branches', 'common'])
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [result, setResult] = useState<ShopPhotoVerificationResponse | null>(null)
  const mutation = useVerifyShopPhotoMutation()

  const status = branch.shopPhotoVerificationStatus ?? 'NOT_UPLOADED'
  const photoUrl = result?.photoUrl ?? branch.shopPhotoUrl
  const reasons = result?.reasons ?? branch.shopPhotoVerificationReasons ?? []

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const data = await mutation.mutateAsync({ id: branch.id, file })
      setResult(data)
      toast.success(t('branches:shopPhotoUploaded'))
    } catch (error) {
      toast.error(parseApiError(error).message || t('branches:shopPhotoUploadFailed'))
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge value={status} />
        {photoUrl ? (
          <a href={photoUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">
            {t('branches:viewCurrentPhoto')}
          </a>
        ) : (
          <span className="text-sm text-slate-500">{t('branches:noPhotoYet')}</span>
        )}
      </div>

      {photoUrl ? (
        <img src={photoUrl} alt={t('branches:shopPhotoAlt')} className="h-32 w-32 rounded-md border border-slate-200 object-cover" />
      ) : null}

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      <Button type="button" variant="outline" loading={mutation.isPending} loadingText={t('branches:uploadingPhoto')} onClick={() => fileInputRef.current?.click()}>
        {photoUrl ? t('branches:replacePhoto') : t('branches:uploadPhoto')}
      </Button>

      {reasons.length > 0 ? (
        <ul className="list-disc space-y-1 pl-5 text-xs text-slate-500">
          {reasons.map((reason, index) => (
            <li key={index}>{reason}</li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
