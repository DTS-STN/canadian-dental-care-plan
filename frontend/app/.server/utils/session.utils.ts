import type { Cookie } from '@remix-run/node';
import { createSessionStorage } from '@remix-run/node';

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

interface FileSessionStorageOptions {
  cookie: Cookie;
  dir: string;
}

/**
 * Creates a synchronous FileSessionStorage version so the file isn't corrupted on concurrent writes.
 *
 * @remarks
 * The remix's node file session storage implementation doesn't work well since loaders can run in parallel.
 * There is no file-locking on the current one so it's very possible to corrupt session data.
 *
 * @see https://github.com/remix-run/remix/issues/4353
 */
export function createFileSessionStorage({ cookie, dir }: FileSessionStorageOptions) {
  return createSessionStorage({
    cookie,
    // eslint-disable-next-line @typescript-eslint/require-await
    async createData(data, expires) {
      const content = JSON.stringify({ data, expires });
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      while (true) {
        const id = crypto.randomUUID({ disableEntropyCache: true });
        try {
          const file = getFile(dir, id);
          fs.mkdirSync(path.dirname(file), { recursive: true });
          fs.writeFileSync(file, content, { encoding: 'utf-8', flag: 'wx' });
          return id;
        } catch (error) {
          if (error instanceof Error && 'code' in error && error.code !== 'EEXIST') throw error;
        }
      }
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    async readData(id) {
      try {
        const file = getFile(dir, id);
        const content = JSON.parse(fs.readFileSync(file, 'utf-8'));
        if (!isExpired(content.expires)) return content.data;
        fs.unlinkSync(file);
        return null;
      } catch (error) {
        if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') throw error;
        return null;
      }
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    async updateData(id, data, expires) {
      const content = JSON.stringify({ data, expires });
      const file = getFile(dir, id);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, content, 'utf-8');
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    async deleteData(id) {
      try {
        fs.unlinkSync(getFile(dir, id));
      } catch (error) {
        if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') throw error;
      }
    },
  });
}

// Divide the session id up into a directory (first 2 bytes) and filename
// (remaining 6 bytes) to reduce the chance of having very large directories,
// which should speed up file access. This is a maximum of 2^16 directories,
// each with 2^48 files.
function getFile(dir: string, id: string) {
  return path.join(dir, id.slice(0, 4), id.slice(4));
}

function isExpired(date?: string) {
  const expires = typeof date === 'string' ? new Date(date) : null;
  return expires ? expires < new Date() : false;
}
