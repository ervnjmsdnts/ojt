import { v2 } from 'cloudinary';
import env from './env';

v2.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export const cloudinary = v2;

export async function uploadFile(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const result = await new Promise<{ url: string; public_id: string }>(
    (resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ resource_type: 'raw' }, function (error, result) {
          if (error || result === undefined) {
            reject(error || new Error('Upload result is undefined'));
            return;
          }
          resolve(result);
        })
        .end(buffer);
    },
  );

  return { url: result.url, name: file.name, publicId: result.public_id };
}
