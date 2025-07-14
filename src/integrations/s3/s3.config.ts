import * as dotenv from 'dotenv';
dotenv.config();

export const s3Config = {
  region: process.env.AWS_REGION ?? '',
  bucket: process.env.AWS_BUCKET ?? '',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
};
