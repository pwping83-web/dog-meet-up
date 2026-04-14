/** dog-photos 업로드용으로 허용하는 확장자 */
const IMAGE_EXT = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif', 'bmp']);

export function extFromFileName(file: File): string {
  if (!file.name.includes('.')) return '';
  return file.name.split('.').pop()?.toLowerCase() ?? '';
}

/** 경로에 쓸 안전한 확장자 (미지원이면 jpg) */
export function safeImageExtForDogPhotos(file: File): string {
  const ext = extFromFileName(file);
  return ext && IMAGE_EXT.has(ext) ? ext : 'jpg';
}

/**
 * Storage `contentType`용. 빈 `file.type`이어도 image/* 로 맞춤.
 * `application/octet-stream` 은 버킷 MIME 제한 시 자주 거절됨.
 */
export function imageContentTypeForDogPhotosUpload(file: File, ext: string): string {
  if (file.type && file.type.startsWith('image/')) return file.type;
  const e = ext.toLowerCase();
  if (e === 'png') return 'image/png';
  if (e === 'webp') return 'image/webp';
  if (e === 'gif') return 'image/gif';
  if (e === 'heic' || e === 'heif') return 'image/heic';
  if (e === 'bmp') return 'image/bmp';
  return 'image/jpeg';
}
