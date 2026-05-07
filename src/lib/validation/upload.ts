export const MAX_UPLOAD_SIZE_BYTES = 8 * 1024 * 1024
export const MAX_UPLOAD_SIZE_LABEL = '8MB'

export const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
])

export type FileValidationError =
  | { kind: 'too_large'; message: string }
  | { kind: 'unsupported_type'; message: string }

export const validateImageFile = (file: File): FileValidationError | null => {
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return {
      kind: 'too_large',
      message: `이미지는 ${MAX_UPLOAD_SIZE_LABEL} 이하만 업로드할 수 있습니다.`,
    }
  }
  if (file.type && !ALLOWED_IMAGE_TYPES.has(file.type)) {
    return {
      kind: 'unsupported_type',
      message: '지원하지 않는 이미지 형식입니다. (JPG/PNG/WEBP/GIF/AVIF)',
    }
  }
  return null
}
