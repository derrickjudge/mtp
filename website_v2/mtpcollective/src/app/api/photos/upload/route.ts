import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { processImage, uploadToR2, generateR2Key } from '@/lib/r2';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin', { 
      user_id: session.user.id 
    });
    if (adminError || !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const categoryIds = formData.getAll('categoryIds') as string[];
    const tags = formData.getAll('tags') as string[];

    if (!file || !title) {
      return NextResponse.json(
        { error: 'File and title are required' },
        { status: 400 }
      );
    }

    // Process image
    const buffer = Buffer.from(await file.arrayBuffer());
    const { fullSize, thumbnail, aspectRatio, width, height } = await processImage(buffer);

    // Generate unique keys for R2
    const fullSizeKey = generateR2Key(file.name, 'full');
    const thumbnailKey = generateR2Key(file.name, 'thumbnail');

    // Upload to R2
    const [fullSizeUrl, thumbnailUrl] = await Promise.all([
      uploadToR2(fullSize, fullSizeKey, 'image/webp'),
      uploadToR2(thumbnail, thumbnailKey, 'image/webp'),
    ]);

    // Save to database
    const { data: photo, error: dbError } = await supabase
      .from('photos')
      .insert([
        {
          title,
          description,
          url: fullSizeUrl,
          thumbnail: thumbnailUrl,
          published: false,
          featured: false,
          metadata: {
            width,
            height,
            aspectRatio,
            originalName: file.name,
          },
          author_id: session.user.id,
        },
      ])
      .select()
      .single();

    if (dbError) {
      throw dbError;
    }

    // Add categories if provided
    if (categoryIds.length > 0) {
      const { error: categoryError } = await supabase
        .from('_PhotoCategories')
        .insert(
          categoryIds.map(categoryId => ({
            A: photo.id,
            B: categoryId,
          }))
        );

      if (categoryError) {
        console.error('Error adding categories:', categoryError);
      }
    }

    // Add tags if provided
    if (tags.length > 0) {
      // First, ensure all tags exist
      const { data: existingTags, error: tagsError } = await supabase
        .from('tags')
        .select('id, name')
        .in('name', tags);

      if (tagsError) {
        console.error('Error fetching tags:', tagsError);
      }

      const existingTagNames = new Set(existingTags?.map(t => t.name) || []);
      const newTags = tags.filter(tag => !existingTagNames.has(tag));

      if (newTags.length > 0) {
        const { data: createdTags, error: createError } = await supabase
          .from('tags')
          .insert(
            newTags.map(name => ({
              name,
              slug: name.toLowerCase().replace(/\s+/g, '-'),
            }))
          )
          .select();

        if (createError) {
          console.error('Error creating tags:', createError);
        }

        const allTags = [...(existingTags || []), ...(createdTags || [])];
        
        // Add photo-tag relationships
        const { error: photoTagsError } = await supabase
          .from('_PhotoTags')
          .insert(
            allTags.map(tag => ({
              A: photo.id,
              B: tag.id,
            }))
          );

        if (photoTagsError) {
          console.error('Error adding photo tags:', photoTagsError);
        }
      }
    }

    return NextResponse.json(photo);
  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json(
      { error: 'Failed to upload photo' },
      { status: 500 }
    );
  }
} 