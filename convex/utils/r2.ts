import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Initialize S3 Client for Cloudflare R2
// Using environment variables mapped from .env.local
const R2_ACCOUNT_ID = process.env.STORAGE_ENDPOINT?.split('.')[0].replace('https://', '') || "";
const R2_ACCESS_KEY_ID = process.env.STORAGE_ACCESS_KEY || "";
const R2_SECRET_ACCESS_KEY = process.env.STORAGE_SECRET_KEY || "";
const R2_BUCKET_NAME = process.env.STORAGE_BUCKET || "";
const R2_PUBLIC_DOMAIN = process.env.STORAGE_DOMAIN || "";

// Ensure endpoint is correctly formatted for AWS SDK
// It should be: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
const R2_ENDPOINT = process.env.STORAGE_ENDPOINT || "";

const S3 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export async function uploadImageToR2(imageUrl: string, prompt: string): Promise<string> {
  // Validate configuration
  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_ENDPOINT) {
    console.warn("R2 Configuration missing. Skipping upload and returning original URL.");
    console.warn("Missing:", { 
      hasAccessKey: !!R2_ACCESS_KEY_ID, 
      hasSecret: !!R2_SECRET_ACCESS_KEY, 
      hasBucket: !!R2_BUCKET_NAME,
      hasEndpoint: !!R2_ENDPOINT
    });
    return imageUrl;
  }

  try {
    console.log(`[R2] Starting upload for image from: ${imageUrl}`);
    
    // 1. Download image from the temporary URL
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const contentType = response.headers.get("content-type") || "image/png";

    // 2. Generate a unique filename
    // Format: <timestamp>-<random>.png
    const extension = contentType.split('/')[1] || 'png';
    const filename = `gen-${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

    // 3. Upload to R2
    await S3.send(new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: filename,
      Body: buffer,
      ContentType: contentType,
    }));

    console.log(`[R2] Upload successful: ${filename}`);

    // 4. Return the public URL
    // If STORAGE_DOMAIN is set, use it. Otherwise construct from endpoint (which usually isn't public)
    if (R2_PUBLIC_DOMAIN) {
      return `${R2_PUBLIC_DOMAIN}/${filename}`;
    } else {
        // Fallback (though R2 usually requires a custom domain or worker for public access)
        return `https://${R2_BUCKET_NAME}.${R2_ENDPOINT.replace('https://', '')}/${filename}`;
    }

  } catch (error) {
    console.error("[R2] Upload Error:", error);
    // Fallback: return the original URL if R2 upload fails, so the user still gets an image
    return imageUrl;
  }
}
