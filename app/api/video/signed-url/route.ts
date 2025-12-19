import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/middleware/auth';
import { getSignedVideoUrl } from '@/lib/services/storageService';

// 1. Force Dynamic: Signed URLs expire, so we never want to cache this response on the server
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // 2. Await Auth: Best practice for future-proofing
    const user = authMiddleware(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or missing token' },
        { status: 401 }
      );
    }

    // 3. Get & Validate Path
    const { searchParams } = new URL(req.url);
    const storagePath = searchParams.get('path');

    if (!storagePath) {
      return NextResponse.json(
        { error: 'Storage path is required' },
        { status: 400 }
      );
    }

    // 4. SECURITY CHECK: Path Traversal Prevention
    // Ensure the user is strictly accessing their own folder.
    // We assume your storage structure is: "userId/video.mp4"
    if (!storagePath.startsWith(`${user.id}/`)) {
      console.warn(`Security Alert: User ${user.id} tried to access ${storagePath}`);
      return NextResponse.json(
        { error: 'Access denied - You can only access your own videos' },
        { status: 403 }
      );
    }

    // 5. Generate URL
    // 3600 seconds = 1 hour validity
    const signedUrl = await getSignedVideoUrl(storagePath, 3600);

    if (!signedUrl) {
      return NextResponse.json(
        { error: 'Failed to generate signed URL' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      signedUrl,
      expiresIn: 3600,
    }, { status: 200 });

  } catch (error) {
    console.error('Signed URL error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        // Only return details in development for security
        details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}