import { api, unwrapResponse } from '@/lib/axios'

export type ImageUploadScope =
  | 'general'
  | 'product'
  | 'category'
  | 'brand'
  | 'supplier'
  | 'customer'
  | 'branch'
  | 'master-catalog-item'
  | 'master-catalog-category'

export interface UploadedImage {
  publicId: string
  url: string
  width?: number
  height?: number
  format?: string
  bytes?: number
  originalFilename: string
}

export async function uploadImage(file: File, scope: ImageUploadScope = 'general') {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('scope', scope)

  return unwrapResponse<UploadedImage>(api.post('/uploads/images', formData))
}
