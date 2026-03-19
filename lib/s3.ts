import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Endpoint = process.env.S3_ENDPOINT;
const s3AccessKey = process.env.S3_ACCESS_KEY;
const s3SecretKey = process.env.S3_SECRET_KEY;
const s3BucketName = process.env.S3_BUCKET_NAME;

if (!s3Endpoint || !s3AccessKey || !s3SecretKey || !s3BucketName) {
  throw new Error("S3 (MinIO) secrets are not set in the .env file!");
}

export const s3Client = new S3Client({
  endpoint: s3Endpoint,       // Where to connect (http://localhost:9000)
  region: "us-east-1",        // Default for AWS (MinIO ignores it, but SDK requires a value)
  credentials: {
    accessKeyId: s3AccessKey,
    secretAccessKey: s3SecretKey,
  },
  // IMPORTANT for MinIO: instructs SDK to use URL format endpoint/bucket, not subdomain bucket.endpoint
  forcePathStyle: true, 
});

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
  try {
    // 1. "Put object into bucket" command
    const command = new PutObjectCommand({
      Bucket: s3BucketName,
      Key: fileName,          // the key in S3 is simply the file name (path)
      Body: fileBuffer,       // the raw (binary) data itself
      ContentType: mimeType,  // MIME-type (so the browser opens the PDF in a tab, rather than downloading it)
    });

    // 2. Send command to MinIO
    await s3Client.send(command);

    // 3. Return a public clean link for the frontend and DB
    // NGINX will catch the word /storage/, strip it, and serve the file from the bank-documents bucket
    return `/storage/${s3BucketName}/${fileName}`;
    
  } catch (error) {
    console.error("S3 Error while uploading the document:", error);
    throw error;
  }
}
