import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { verifyAuth } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const PHOTO_BASE = '/mnt/extreme-ssd/Mali/Lens';

export async function POST(req: NextRequest) {
  if (!await verifyAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const folderId = formData.get('folderId') as string;
  const files = formData.getAll('files') as File[];

  if (!folderId || !files.length) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

  const dir = join(PHOTO_BASE, folderId);
  await mkdir(dir, { recursive: true });

  const db = await getDb();
  const inserted = [];

  for (const file of files) {
    const filename = `${Date.now()}-${file.name}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(dir, filename), buffer);

    const url = `/photos/${folderId}/${filename}`;
    const result = await db.collection('photos').insertOne({
      folderId,
      url,
      filename,
      createdAt: new Date().toISOString(),
    });
    inserted.push({ id: result.insertedId.toString(), url });
  }

  return NextResponse.json({ uploaded: inserted });
}
