import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

let Uri = process.env.URI,
  db = process.env.DB,
  port = process.env.PORT,
  profilePicture = process.env.PROFILE_PICTURE,
  secret = process.env.SECRET,
  cloudinaryName = process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryKey = process.env.CLOUDINARY_KEY,
  cloudinarySecret = process.env.CLOUDINARY_SECRET;

export {
  Uri,
  db,
  port,
  profilePicture,
  secret,
  cloudinaryName,
  cloudinaryKey,
  cloudinarySecret,
};
