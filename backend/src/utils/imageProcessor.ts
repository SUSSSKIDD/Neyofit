import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;
const QUALITY = 80;

export async function compressImage(filePath: string): Promise<{ filePath: string; size: number }> {
    const ext = path.extname(filePath).toLowerCase();

    // SVG files cannot be processed by sharp — return as-is
    if (ext === '.svg') {
        const stats = await fs.stat(filePath);
        return { filePath, size: stats.size };
    }

    const tempPath = filePath + '.tmp';

    try {
        let pipeline = sharp(filePath)
            .resize(MAX_WIDTH, MAX_HEIGHT, {
                fit: 'inside',
                withoutEnlargement: true
            });

        if (ext === '.jpg' || ext === '.jpeg') {
            pipeline = pipeline.jpeg({ quality: QUALITY });
        } else if (ext === '.png') {
            pipeline = pipeline.png({ quality: QUALITY });
        } else if (ext === '.webp') {
            pipeline = pipeline.webp({ quality: QUALITY });
        }
        // GIF: sharp will process but not lose animation frames for single-frame GIFs

        await pipeline.toFile(tempPath);

        // Replace original with compressed version
        await fs.rename(tempPath, filePath);

        const stats = await fs.stat(filePath);
        return { filePath, size: stats.size };
    } catch (error) {
        // Clean up temp file if it exists
        try { await fs.unlink(tempPath); } catch {}
        throw error;
    }
}
