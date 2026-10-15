import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Cloudflare R2 S3-Compatible Storage Configuration
 * R2 provides S3-compatible API with zero egress bandwidth costs.
 */
const accountId = process.env.R2_ACCOUNT_ID || "";
const accessKeyId =
  process.env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY || "";
const secretAccessKey =
  process.env.R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_KEY || "";
const bucketName = process.env.R2_BUCKET_NAME || "sirdas-audio";
const publicBaseUrl = (
  process.env.R2_PUBLIC_BASE_URL || "https://media.sirdas.ai"
).replace(/\/+$/, "");

const endpoint =
  process.env.R2_ENDPOINT ||
  (accountId
    ? `https://${accountId}.r2.cloudflarestorage.com`
    : "https://r2.cloudflarestorage.com");

/**
 * Singleton instance of S3Client configured for Cloudflare R2
 */
let cachedClient: S3Client | null = null;

export function getR2Client(): S3Client {
  if (!cachedClient) {
    cachedClient = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId: accessKeyId || "placeholder-access-key",
        secretAccessKey: secretAccessKey || "placeholder-secret-key",
      },
    });
  }
  return cachedClient;
}

export const r2Client = getR2Client();

export interface UploadSnippetParams {
  key: string;
  body: Buffer | Uint8Array | Blob | string;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface UploadSnippetResult {
  key: string;
  publicUrl: string;
  bucket: string;
}

/**
 * Generate public URL for an audio file hosted on Cloudflare R2
 * Used to send .ogg audio snippets via Meta WhatsApp Cloud API
 */
export function getPublicAudioUrl(key: string): string {
  const cleanKey = key.startsWith("/") ? key.slice(1) : key;
  return `${publicBaseUrl}/${cleanKey}`;
}

/**
 * Upload an audio snippet (.ogg libopus 32k) or asset to Cloudflare R2
 */
export async function uploadAudioSnippet(
  params: UploadSnippetParams
): Promise<UploadSnippetResult> {
  const client = getR2Client();
  const cleanKey = params.key.startsWith("/") ? params.key.slice(1) : params.key;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: cleanKey,
    Body: params.body as any,
    ContentType: params.contentType || "audio/ogg",
    Metadata: params.metadata,
  });

  await client.send(command);

  return {
    key: cleanKey,
    publicUrl: getPublicAudioUrl(cleanKey),
    bucket: bucketName,
  };
}

/**
 * Generate a pre-signed temporary download URL for protected or private assets
 */
export async function getPresignedDownloadUrl(
  key: string,
  expiresInSeconds: number = 3600
): Promise<string> {
  const client = getR2Client();
  const cleanKey = key.startsWith("/") ? key.slice(1) : key;

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: cleanKey,
  });

  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

/**
 * Delete an audio snippet or asset from Cloudflare R2
 */
export async function deleteAudioSnippet(key: string): Promise<boolean> {
  try {
    const client = getR2Client();
    const cleanKey = key.startsWith("/") ? key.slice(1) : key;

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: cleanKey,
    });

    await client.send(command);
    return true;
  } catch (err) {
    console.error(`[Cloudflare R2 Delete Error] Key: ${key}`, err);
    return false;
  }
}

/**
 * Test R2 connection by performing a shallow list objects call
 */
export async function checkR2Connection(): Promise<{
  ok: boolean;
  message: string;
  bucket: string;
}> {
  if (!accessKeyId || !secretAccessKey) {
    return {
      ok: false,
      message: "R2 credentials (R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY) are not set in environment.",
      bucket: bucketName,
    };
  }

  try {
    const client = getR2Client();
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 1,
    });

    await client.send(command);
    return {
      ok: true,
      message: "R2 connection successful.",
      bucket: bucketName,
    };
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    return {
      ok: false,
      message: `R2 connection failed: ${error.message}`,
      bucket: bucketName,
    };
  }
}

export default {
  getR2Client,
  r2Client,
  getPublicAudioUrl,
  uploadAudioSnippet,
  getPresignedDownloadUrl,
  deleteAudioSnippet,
  checkR2Connection,
};
