export function getImageDimensions(buf: ArrayBuffer): { width: number; height: number } | null {
  const u8 = new Uint8Array(buf)
  // PNG: signature 89 50 4E 47 0D 0A 1A 0A, IHDR chunk contains width/height at bytes 16-23 (big-endian)
  if (u8.length >= 24 && u8[0] === 0x89 && u8[1] === 0x50 && u8[2] === 0x4E && u8[3] === 0x47) {
    const dv = new DataView(buf)
    const width = dv.getUint32(16, false)
    const height = dv.getUint32(20, false)
    if (width > 0 && height > 0) return { width, height }
  }
  // JPEG: markers start with 0xFF, SOF0..SOF3 contain dimensions
  if (u8.length > 4 && u8[0] === 0xFF && u8[1] === 0xD8) {
    let off = 2
    while (off + 9 < u8.length) {
      // find marker
      if (u8[off] !== 0xFF) {
        off++
        continue
      }
      let marker = u8[off + 1]
      // skip padding FFs
      while (marker === 0xFF) {
        off++
        marker = u8[off + 1]
      }
      // markers that have length
      const hasLength = marker !== 0xD9 && marker !== 0xDA
      if (!hasLength) {
        off += 2
        continue
      }
      const len = (u8[off + 2] << 8) | u8[off + 3]
      if (len < 2) return null
      // SOF0(0xC0), SOF1(0xC1), SOF2(0xC2), SOF3(0xC3)
      if (marker >= 0xC0 && marker <= 0xC3) {
        // [precision][height hi][height lo][width hi][width lo]
        const height = (u8[off + 5] << 8) | u8[off + 6]
        const width = (u8[off + 7] << 8) | u8[off + 8]
        if (width > 0 && height > 0) return { width, height }
        return null
      }
      off += 2 + len
    }
  }
  return null
}
