import { describe, expect, it } from 'vitest';
import { chatUpload } from '../../src/middlewares/upload.js';

describe('chat camera uploads', () => {
  it.each([
    ['image/jpeg', '.jpg'],
    ['video/mp4', '.mp4'],
    ['video/webm', '.webm'],
  ])('accepts %s with a server-selected extension', (mimetype, extension) => {
    const file = { mimetype, originalname: 'untrusted.exe' };
    chatUpload.fileFilter({}, file, (error, allowed) => {
      expect(error).toBeNull();
      expect(allowed).toBe(true);
    });
    chatUpload.storage.getFilename({}, file, (error, filename) => {
      expect(error).toBeNull();
      expect(filename).toMatch(new RegExp(`^[a-f0-9-]+\\${extension}$`));
    });
  });

  it('still rejects unsupported file types and limits uploads to 20 MB', () => {
    chatUpload.fileFilter({}, { mimetype: 'application/x-msdownload' }, error => {
      expect(error.status).toBe(400);
    });
    expect(chatUpload.limits.fileSize).toBe(20 * 1024 * 1024);
  });
});
