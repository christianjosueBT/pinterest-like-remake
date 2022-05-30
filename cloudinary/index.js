import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { cloudinaryName, cloudinaryKey, cloudinarySecret } from '../config.js';

cloudinary.config({
  cloud_name: cloudinaryName,
  api_key: cloudinaryKey,
  api_secret: cloudinarySecret,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'coffeeShops',
    allowedFormats: ['jpeg', 'png', 'jpg', 'svg'],
  },
});

export { cloudinary, storage };
