function startsWithBytes(file: Buffer, signature: number[]): boolean {
  return file.length >= signature.length
    && signature.every((byte, index) => file[index] === byte);
}

export function hasValidFileSignature(file: Buffer, mimeType: string): boolean {
  switch (mimeType) {
    case 'image/jpeg':
      return startsWithBytes(file, [0xff, 0xd8, 0xff]);
    case 'image/png':
      return startsWithBytes(file, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case 'image/gif':
      return file.subarray(0, 6).toString('ascii') === 'GIF87a'
        || file.subarray(0, 6).toString('ascii') === 'GIF89a';
    case 'image/webp':
      return file.subarray(0, 4).toString('ascii') === 'RIFF'
        && file.subarray(8, 12).toString('ascii') === 'WEBP';
    case 'application/pdf':
      return file.subarray(0, 5).toString('ascii') === '%PDF-';
    default:
      return false;
  }
}
