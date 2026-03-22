import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Camera, ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'

import { Button } from '@/components/ui'
import { uploadImage, type ImageUploadScope } from '@/features/uploads/uploads.api'
import { parseApiError } from '@/lib/utils'

export function ImageUploadField({
  value,
  onChange,
  label = 'Image',
  scope = 'general',
}: {
  value?: string
  onChange: (url: string) => void
  label?: string
  scope?: ImageUploadScope
}) {
  const { t } = useTranslation('common')
  const uploadInputRef = useRef<HTMLInputElement | null>(null)
  const captureInputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null)
  const previewUrl = localPreviewUrl ?? value

  useEffect(() => () => {
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl)
    }
  }, [localPreviewUrl])

  const resetPreview = () => {
    setLocalPreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl)
      }

      return null
    })
  }

  const onPickFile = () => {
    uploadInputRef.current?.click()
  }

  const onCaptureImage = () => {
    captureInputRef.current?.click()
  }

  const uploadFile = async (file?: File | null) => {
    if (!file) {
      return
    }

    const nextPreviewUrl = URL.createObjectURL(file)
    setLocalPreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl)
      }

      return nextPreviewUrl
    })

    try {
      setUploading(true)
      const data = await uploadImage(file, scope)
      onChange(data.url)
    } catch (error) {
      toast.error(parseApiError(error).message || t('imageUploadFailed'))
    } finally {
      resetPreview()

      setUploading(false)
      if (uploadInputRef.current) uploadInputRef.current.value = ''
      if (captureInputRef.current) captureInputRef.current.value = ''
    }
  }

  const onFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    await uploadFile(event.target.files?.[0])
  }

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 sm:p-4">
      {previewUrl ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <img src={previewUrl} alt={`${label} preview`} className="h-44 w-full object-cover sm:h-48" />
          <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-3 py-2.5">
            <div>
              <p className="text-sm font-semibold text-slate-800">{t('currentImage')}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
              Ready
            </span>
          </div>
        </div>
      ) : (
        <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center shadow-sm">
          <div className="mb-3 rounded-full bg-slate-100 p-3 text-slate-500">
            <ImagePlus className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-slate-700">{t('noImageSelected')}</p>
          <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
            Upload or capture an image. The storage URL stays hidden from the form.
          </p>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-3">
        <Button type="button" variant="outline" size="sm" className="w-full justify-center" onClick={onPickFile} disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          {uploading ? `${t('loading')}...` : t('uploadImage')}
        </Button>
        <Button type="button" variant="outline" size="sm" className="w-full justify-center" onClick={onCaptureImage} disabled={uploading}>
          <Camera className="h-4 w-4" />
          {t('captureImage')}
        </Button>
        {value || localPreviewUrl ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-center"
            onClick={() => {
              resetPreview()
              onChange('')
            }}
            disabled={uploading}
          >
            <Trash2 className="h-4 w-4" />
            {t('removeImage')}
          </Button>
        ) : null}
      </div>

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
