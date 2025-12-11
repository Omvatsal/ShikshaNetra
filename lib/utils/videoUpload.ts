import { uploadVideo } from "../services/storageService";

/**
 * Upload video file to Supabase and return metadata
 * Centralized utility for video upload operations
 */
export async function uploadVideoToStorage(
  file: File,
  userId: string
): Promise<{
  success: boolean;
  videoMetadata?: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    videoUrl: string;
    storagePath: string;
  };
  error?: string;
}> {
  try {
    console.log(`Uploading video to Supabase: ${file.name}`);
    const uploadResult = await uploadVideo(file, userId, file.name);

    if (!uploadResult.success) {
      return {
        success: false,
        error: uploadResult.error || "Failed to upload video to storage",
      };
    }

    console.log(`Video uploaded successfully`);

    // For private buckets, we use the storage path as the video URL identifier
    // Actual playback will require generating signed URLs
    const videoUrl = `supabase://${uploadResult.path}`;

    // Return standardized video metadata
    return {
      success: true,
      videoMetadata: {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        videoUrl: videoUrl,
        storagePath: uploadResult.path!,
      },
    };
  } catch (error) {
    console.error("Upload video utility error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown upload error",
    };
  }
}

/**
 * Convert File to base64 string for sending to ML service
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Extract base64 part (remove data:video/...;base64, prefix)
      const base64String = result.split(",")[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Prepare ML microservice payload with downloaded video content (base64)
 * Instead of sending a signed URL, download the video and send it as base64
 */
export async function prepareMLPayload(
  file: File,
  subject: string,
  language: string,
  userId: string
) {
  try {
    // Convert file to base64
    const videoBase64 = await fileToBase64(file);
    
    return {
      video_data: videoBase64,
      video_filename: file.name,
      video_mimeType: file.type,
      topic: subject,
      language: language,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        userId: userId,
      },
    };
  } catch (error) {
    console.error("Error preparing ML payload:", error);
    throw error;
  }
}
