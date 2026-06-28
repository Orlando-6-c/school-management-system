import { put } from '@vercel/blob';
import { getSession } from '@/lib/session';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session.userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return Response.json({ error: 'File storage not configured (BLOB_READ_WRITE_TOKEN missing)' }, { status: 503 });
    }

    const form = await request.formData();
    const file = form.get('file') as File | null;

    if (!file || !file.size) {
        return Response.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!file.type.startsWith('image/')) {
        return Response.json({ error: 'Only image files are allowed' }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
        return Response.json({ error: 'Image must be under 5 MB' }, { status: 400 });
    }

    const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const prefix = session.schoolId ? `schools/${session.schoolId}` : 'global';
    const blob = await put(`${prefix}/photos/${Date.now()}.${ext}`, file, { access: 'public' });

    return Response.json({ url: blob.url });
}
