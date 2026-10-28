import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import {defineConfig} from 'vite';

function parseTtfNames(ttfBuf: Buffer): Record<string, string> {
  const result: Record<string, string> = {};
  try {
    const numTables = ttfBuf.readUInt16BE(4);
    let nameTableOffset = 0;
    for (let i = 0; i < numTables; i++) {
      const recOffset = 12 + i * 16;
      const tag = ttfBuf.toString('ascii', recOffset, recOffset + 4);
      if (tag === 'name') {
        nameTableOffset = ttfBuf.readUInt32BE(recOffset + 8);
        break;
      }
    }
    if (!nameTableOffset) return result;
    const count = ttfBuf.readUInt16BE(nameTableOffset + 2);
    const stringOffset = nameTableOffset + ttfBuf.readUInt16BE(nameTableOffset + 4);
    for (let i = 0; i < count; i++) {
      const rec = nameTableOffset + 6 + i * 12;
      const platformID = ttfBuf.readUInt16BE(rec);
      const nameID = ttfBuf.readUInt16BE(rec + 6);
      const length = ttfBuf.readUInt16BE(rec + 8);
      const offset = stringOffset + ttfBuf.readUInt16BE(rec + 10);
      if ([1, 2, 4, 6].includes(nameID) && offset + length <= ttfBuf.length) {
        const slice = ttfBuf.subarray(offset, offset + length);
        let str = '';
        if (platformID === 3 || platformID === 0) {
          // UTF-16BE
          const swapped = Buffer.alloc(slice.length);
          for (let j = 0; j + 1 < slice.length; j += 2) {
            swapped[j] = slice[j + 1];
            swapped[j + 1] = slice[j];
          }
          str = swapped.toString('utf16le').replace(/\0/g, '');
        } else {
          str = slice.toString('utf8').replace(/\0/g, '');
        }
        if (str && !result[`name_${nameID}`]) {
          result[`name_${nameID}`] = str;
        }
      }
    }
  } catch {
    // ignore parse errors
  }
  return result;
}

function extractUploadedFontZip() {
  try {
    const zipPath = path.resolve(import.meta.dirname, 'public/assets/aistudio/_____-____3b01bffb.zip');
    const outDir = path.resolve(import.meta.dirname, 'public/assets/fonts');
    if (!fs.existsSync(zipPath)) return;
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    const buf = fs.readFileSync(zipPath);
    let eocdOffset = -1;
    for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
      if (buf.readUInt32LE(i) === 0x06054b50) {
        eocdOffset = i;
        break;
      }
    }
    if (eocdOffset === -1) return;

    const totalEntries = buf.readUInt16LE(eocdOffset + 10);
    let ptr = buf.readUInt32LE(eocdOffset + 16);
    const manifest: Array<Record<string, unknown>> = [];
    let fontIdx = 1;

    for (let e = 0; e < totalEntries; e++) {
      if (ptr + 46 > buf.length || buf.readUInt32LE(ptr) !== 0x02014b50) break;
      const compressionMethod = buf.readUInt16LE(ptr + 10);
      const compressedSize = buf.readUInt32LE(ptr + 20);
      const uncompressedSize = buf.readUInt32LE(ptr + 24);
      const fileNameLen = buf.readUInt16LE(ptr + 28);
      const extraLen = buf.readUInt16LE(ptr + 30);
      const commentLen = buf.readUInt16LE(ptr + 32);
      const localHeaderOffset = buf.readUInt32LE(ptr + 42);
      const rawNameBuf = buf.subarray(ptr + 46, ptr + 46 + fileNameLen);
      ptr += 46 + fileNameLen + extraLen + commentLen;

      let decodedCp874 = '';
      try {
        decodedCp874 = new TextDecoder('windows-874').decode(rawNameBuf);
      } catch {
        decodedCp874 = rawNameBuf.toString('utf8');
      }
      const decodedUtf8 = rawNameBuf.toString('utf8');

      if (buf.readUInt32LE(localHeaderOffset) !== 0x04034b50) continue;
      const localNameLen = buf.readUInt16LE(localHeaderOffset + 26);
      const localExtraLen = buf.readUInt16LE(localHeaderOffset + 28);
      const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
      const compressedSlice = buf.subarray(dataStart, dataStart + compressedSize);

      if (uncompressedSize === 0) continue;

      let fileData: Buffer | null = null;
      if (compressionMethod === 0) {
        fileData = Buffer.from(compressedSlice);
      } else if (compressionMethod === 8) {
        fileData = zlib.inflateRawSync(compressedSlice);
      }

      if (fileData && (decodedUtf8.toLowerCase().endsWith('.ttf') || decodedUtf8.toLowerCase().endsWith('.otf'))) {
        const ext = decodedUtf8.toLowerCase().endsWith('.otf') ? '.otf' : '.ttf';
        const safeFileName = `tchd-font-${fontIdx}${ext}`;
        const outPath = path.join(outDir, safeFileName);
        fs.writeFileSync(outPath, fileData);
        const ttfMeta = parseTtfNames(fileData);
        manifest.push({
          index: fontIdx,
          safeFileName,
          publicUrl: `/assets/fonts/${safeFileName}`,
          decodedCp874,
          decodedUtf8,
          uncompressedSize,
          ttfMeta,
        });
        fontIdx++;
      }
    }

    fs.writeFileSync(
      path.join(outDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2),
      'utf8'
    );
  } catch (err) {
    console.warn('Font zip extraction warning:', err);
  }
}

extractUploadedFontZip();

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [{ name: "firebase", test: /node_modules[\/](@firebase|firebase)[\/]/ }],
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
