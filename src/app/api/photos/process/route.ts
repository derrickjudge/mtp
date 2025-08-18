import { NextRequest, NextResponse } from 'next/server';
import { generateThumbnail, getImageDimensions } from '@/utils/imageProcessing';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const thumbnailBuffer = await generateThumbnail(buffer);
    const dimensions = await getImageDimensions(buffer);

    // Convert buffers to base64 for response
    const thumbnailBase64 = thumbnailBuffer.toString('base64');
    const thumbnailDataUrl = `data:image/jpeg;base64,${thumbnailBase64}`;

    return NextResponse.json({
      thumbnail: thumbnailDataUrl,
      width: dimensions.width,
      height: dimensions.height,
    });
  } catch (error) {
    console.error('Error processing image:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
} 