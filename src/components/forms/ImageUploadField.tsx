import { useRef, useState, type ChangeEvent } from 'react'
import { Camera, ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button, Input } from '@/components/ui'

function getCloudinaryConfig() {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined
  const unsignedPreset = import.meta.env.VITE_CLOUDINARY_UNSIGNED_PRESET as string | undefined

  return {
    cloudName,
    unsignedPreset,
    enabled: Boolean(cloudName && unsignedPreset),
  }
}

export function ImageUploadField({
  value,
  onChange,
  label = 'Image',
}: {
  value?: string
  onChange: (url: string) => void
  label?: string
}) {
  const { t } = useTranslation('common')
  const uploadInputRef = useRef<HTMLInputElement | null>(null)
  const captureInputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const { cloudName, unsignedPreset, enabled } = getCloudinaryConfig()

  const onPickFile = () => {
    uploadInputRef.current?.click()
  }

  const onCaptureImage = () => {
    captureInputRef.current?.click()
  }

  const uploadFile = async (file?: File | null) => {
    if (!file || !enabled || !cloudName || !unsignedPreset) {
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', unsignedPreset)

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Image upload failed')
      }

      const data = (await response.json()) as { secure_url?: string }
      if (data.secure_url) {
        onChange(data.secure_url)
      }
    } catch {
      // Keep the previous image value unchanged when upload fails.
    } finally {
      setUploading(false)
      if (uploadInputRef.current) uploadInputRef.current.value = ''
      if (captureInputRef.current) captureInputRef.current.value = ''
    }
  }

  const onFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    await uploadFile(event.target.files?.[0])
  }

  return (
    <div className="space-y-3">
      {value ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          <img src={value} alt={`${label} preview`} className="h-40 w-full object-cover" />
          <div className="border-t border-slate-200 px-3 py-2 text-xs text-slate-500">
            {t('currentImage')}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-3 py-4 text-sm text-slate-500">
          {t('noImageSelected')}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onPickFile} disabled={!enabled || uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          {uploading ? `${t('loading')}...` : t('uploadImage')}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCaptureImage} disabled={!enabled || uploading}>
          <Camera className="h-4 w-4" />
          {t('captureImage')}
        </Button>
        {value ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')} disabled={uploading}>
            <Trash2 className="h-4 w-4" />
            {t('removeImage')}
          </Button>
        ) : null}
      </div>

      {!enabled ? <span className="text-xs text-muted-foreground">{t('imageUploadUnavailable')}</span> : null}

      <Input
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />
      <input ref={uploadInputRef} type="file" accept="image/*" className="hidden" onChange={onFileSelected} />
      <input
        ref={captureInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFileSelected}
      />
    </div>
  )
}
