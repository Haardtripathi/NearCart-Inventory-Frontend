import { useRef, useState, type ChangeEvent } from 'react'
import { ImagePlus, Loader2 } from 'lucide-react'

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
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const { cloudName, unsignedPreset, enabled } = getCloudinaryConfig()

  const onPickFile = () => {
    inputRef.current?.click()
  }

  const onFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
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
      // Keep URL field editable as fallback.
    } finally {
      setUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onPickFile} disabled={!enabled || uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          {uploading ? 'Uploading...' : `Upload ${label.toLowerCase()}`}
        </Button>
        {!enabled ? <span className="text-xs text-muted-foreground">Cloudinary not configured. Using URL input.</span> : null}
      </div>
      <Input value={value ?? ''} onChange={(event) => onChange(event.target.value)} placeholder="https://..." />
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFileSelected} />
    </div>
  )
}
