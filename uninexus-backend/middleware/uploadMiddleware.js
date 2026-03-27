const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'profile-photos');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Allowed image MIME types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const userId = req.user?._id || 'unknown';
        const timestamp = Date.now();
        const random = crypto.randomBytes(6).toString('hex');
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${userId}-${timestamp}-${random}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPEG, PNG, and WebP images are allowed.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_SIZE },
});

/**
 * Middleware for uploading a single profile photo.
 * Field name: 'profilePhoto'
 */
const uploadProfilePhoto = upload.single('profilePhoto');

// ─── Gallery Photos Upload ───────────────────────────────────
const galleryStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const userId = req.user?._id || 'unknown';
        const galleryDir = path.join(__dirname, '..', 'uploads', 'gallery', userId.toString());
        if (!fs.existsSync(galleryDir)) {
            fs.mkdirSync(galleryDir, { recursive: true });
        }
        cb(null, galleryDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const random = crypto.randomBytes(6).toString('hex');
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${timestamp}-${random}${ext}`);
    },
});

const galleryUpload = multer({
    storage: galleryStorage,
    fileFilter,
    limits: { fileSize: MAX_SIZE },
});

/**
 * Middleware for uploading up to 5 gallery photos.
 * Field name: 'galleryPhotos'
 */
const uploadGalleryPhotos = galleryUpload.array('galleryPhotos', 5);

module.exports = { uploadProfilePhoto, uploadGalleryPhotos };
