import { NextRequest } from "next/server";
import { getUserUuid } from "@/services/user";
import { respData, respErr } from "@/lib/resp";
import { getImageGenerationByUuid, deleteImageGeneration } from "@/models/image";
import { newStorage } from "@/lib/storage";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const user_uuid = await getUserUuid();
    const { uuid } = await params;
    
    if (!user_uuid) {
      return respErr("no auth");
    }

    if (!uuid) {
      return respErr("UUID is required");
    }

    // 获取图片详情
    const image = await getImageGenerationByUuid(uuid);
    
    // 验证图片属于当前用户
    if (image.user_uuid !== user_uuid) {
      return respErr("Access denied");
    }

    return respData(image);

  } catch (error) {
    console.error("Get image detail API error:", error);
    return respErr(error instanceof Error ? error.message : "Internal server error");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const user_uuid = await getUserUuid();
    const { uuid } = await params;
    
    if (!user_uuid) {
      return respErr("no auth");
    }

    if (!uuid) {
      return respErr("UUID is required");
    }

    // 先获取图片信息以获取storage_key
    const image = await getImageGenerationByUuid(uuid);
    
    // 验证图片属于当前用户
    if (image.user_uuid !== user_uuid) {
      return respErr("Access denied");
    }

    // 删除R2存储中的文件（如果有storage_key）
    if (image.storage_key) {
      try {
        const storage = newStorage();
        await storage.deleteFile({
          key: image.storage_key,
        });
        console.log(`✅ R2文件已删除: ${image.storage_key}`);
      } catch (storageError) {
        console.error("R2删除失败:", storageError);
        // 不阻止删除流程，即使R2删除失败也继续删除数据库记录
      }
    }

    // 删除数据库记录
    await deleteImageGeneration(uuid, user_uuid);

    return respData({
      success: true,
      message: "Image deleted successfully"
    });

  } catch (error) {
    console.error("Delete image API error:", error);
    return respErr(error instanceof Error ? error.message : "Internal server error");
  }
}