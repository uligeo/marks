/** Downloads the blob, or opens the native share sheet when `mode` is 'share'. */
export async function saveBlob(blob: Blob, name: string, mode: 'download' | 'share'): Promise<void> {
  if (mode === 'share') {
    await navigator.share({ files: [new File([blob], name, { type: blob.type })] })
    return
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
