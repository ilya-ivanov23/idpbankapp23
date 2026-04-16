import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

let s3ClientInstance: S3Client | null = null;

/**
 * Lazy initialization (паттерн Singleton). 
 * Создает клиент S3 только в тот момент, когда он реально нужен (например при загрузке файла),
 * а не во время сборки Next.js (поиск по файлам).
 */
function getS3Client(): S3Client {
  if (s3ClientInstance) return s3ClientInstance;

  const s3Endpoint = process.env.S3_ENDPOINT;
  const s3AccessKey = process.env.S3_ACCESS_KEY;
  const s3SecretKey = process.env.S3_SECRET_KEY;

  if (!s3Endpoint || !s3AccessKey || !s3SecretKey) {
    throw new Error("S3 (MinIO) secrets are not set in the environment variables!");
  }

  s3ClientInstance = new S3Client({
    endpoint: s3Endpoint,
    region: "us-east-1",
    credentials: {
      accessKeyId: s3AccessKey,
      secretAccessKey: s3SecretKey,
    },
    forcePathStyle: true, 
  });

  return s3ClientInstance;
}

/**
 * Universal function to upload a document to S3
 * @param fileBuffer - binary file buffer (ready or generated)
 * @param fileName - unique name for saving (e.g., UUID + .pdf)
 * @param mimeType - file type (pdf, jpeg, png, etc.)
 */
export async function uploadDocumentToS3(
  fileBuffer: Buffer, 
  fileName: string, 
  mimeType: string = "application/pdf"
) {
  const s3BucketName = process.env.S3_BUCKET_NAME;
  if (!s3BucketName) {
    throw new Error("S3_BUCKET_NAME is not set in the environment variables!");
  }

  try {
    const s3Client = getS3Client();

    // 1. "Put object into bucket" command
    const command = new PutObjectCommand({
      Bucket: s3BucketName,
      Key: fileName,          // the key in S3 is simply the file name (path)
      Body: fileBuffer,       // the raw (binary) data itself
      ContentType: mimeType,  // MIME-type (so the browser opens the PDF in a tab, rather than downloading it)
    });

    // 2. Send command to MinIO
    await s3Client.send(command);

    // 3. Возвращаем публичную ссылку для фронтенда и Базы Данных (Appwrite)
    // Cloudflare R2:
    const publicUrlBase = process.env.NEXT_PUBLIC_S3_URL || "https://pub-fe2adf4adae24598834e9e7b5c18175a.r2.dev";
    return `${publicUrlBase}/${fileName}`;
    
  } catch (error) {
    console.error("S3 Error while uploading the document:", error);
    throw error;
  }
}
