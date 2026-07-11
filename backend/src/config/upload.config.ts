import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

// process.cwd() is always /app inside the Docker container (WORKDIR /app),
// and the backend root directory in local dev — both correct for finding uploads/
const UPLOAD_DIR = path.join(process.cwd(), 'uploads/gym-pictures');

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = crypto.randomBytes(16).toString('hex');
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: JPEG, PNG, WebP, GIF, SVG`));
    }
};

export const gymPictureUpload = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE }
});

export const UPLOAD_BASE_DIR = path.join(process.cwd(), 'uploads');
export { UPLOAD_DIR };
