import { NextRequest, NextResponse } from 'next/server';

// GET /api/tags
export async function GET(req: NextRequest) {
  try {
    // For now, return empty array since tags functionality isn't fully implemented
    // This prevents the PhotoEditModal from breaking when trying to fetch tags
    return NextResponse.json([]);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch tags' },
      { status: 500 }
    );
  }
} 