import { NextRequest, NextResponse } from "next/server";
import { getUserUuid } from "@/services/user";
import { respData, respErr } from "@/lib/resp";
import { newStorage } from "@/lib/storage";
import { getSnowId } from "@/lib/hash";

export async function POST(request: NextRequest) {
  try {
    // Check user authentication
    const user_uuid = await getUserUuid();
    
    if (!user_uuid) {
      return respErr("no auth");
    }

    // Get uploaded file
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return respErr("No file provided");
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return respErr("Only image files are allowed");
    }

    // Validate file size (limit 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return respErr("File size too large. Maximum 10MB allowed");
    }

    // Generate unique filename
    const uploadId = getSnowId();
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${uploadId}.${fileExtension}`;
    
    // Build storage path
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const storageKey = `uploads/${year}/${month}/${user_uuid}/${fileName}`;

    console.log("📁 Starting image upload:", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      storageKey: storageKey
    });

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Upload to R2 storage
    const storage = newStorage();
    const uploadResult = await storage.uploadFile({
      body: buffer,
      key: storageKey,
      contentType: file.type,
      disposition: "inline"
    });

    console.log("✅ Image upload successful:", uploadResult.url);

    // TODO: Record upload history to database here
    // await insertUploadHistory({
    //   uuid: uploadId,
    //   user_uuid,
    //   original_name: file.name,
    //   storage_url: uploadResult.url,
    //   storage_key: storageKey,
    //   file_size: file.size,
    //   content_type: file.type
    // });

    return respData({
      uploadId,
      imageUrl: uploadResult.url,
      originalName: file.name,
      fileSize: file.size
    });

  } catch (error) {
    console.error("Upload image API error:", error);
    return respErr(error instanceof Error ? error.message : "Upload failed");
  }
}