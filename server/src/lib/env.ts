import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import { z, ZodError } from 'zod';

expand(config());

const envSchema = z.object({
  DB_HOST: z.string(),
  DB_PORT: z.coerce.number(),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),
  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_API_SECRET: z.string(),
  GOOGLE_CREDENTIALS_B64: z.string(),
  RESEND_API_KEY: z.string(),
  STREAM_API_KEY: z.string(),
  STREAM_API_SECRET: z.string(),
});

export type env = z.infer<typeof envSchema>;

let env: env;

try {
  env = envSchema.parse(process.env);
} catch (e) {
  const error = e as ZodError;
  console.error('Invalid ENV');
  console.error(error.flatten().fieldErrors);
  process.exit(1);
}

export default env;
