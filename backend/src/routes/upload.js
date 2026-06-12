import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

// Configuración de Cloudinary usando variables de entorno
cloudinary.config({ 
    cloud_name: process.env.CLOUD_NAME, 
    api_key: process.env.API_KEY, 
    api_secret: process.env.API_SECRET
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/', authenticate, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    // Subir desde buffer a Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'quizztrack' },
        (error, result) => {
            if (error) {
                console.error("Cloudinary Error:", error);
                return res.status(500).json({ error: 'Upload failed' });
            }
            res.json({ url: result.secure_url });
        }
    );

    uploadStream.end(req.file.buffer);
});

export default router;
