import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Camera, ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'

import { Button, Input } from '@/components/ui'
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
    <div className="space-y-3">
      {previewUrl ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          <img src={previewUrl} alt={`${label} preview`} className="h-40 w-full object-cover" />
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
        <Button type="button" variant="outline" size="sm" onClick={onPickFile} disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          {uploading ? `${t('loading')}...` : t('uploadImage')}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCaptureImage} disabled={uploading}>
          <Camera className="h-4 w-4" />
          {t('captureImage')}
        </Button>
        {value || localPreviewUrl ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
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

      <Input
        placeholder={t('pasteImageUrl')}
        value={value ?? ''}
        onChange={(event) => {
          resetPreview()
          onChange(event.target.value)
        }}
        autoComplete="off"
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
