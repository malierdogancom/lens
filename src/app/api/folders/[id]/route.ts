import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { verifyAuth } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await verifyAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const db = await getDb();
  await db.collection('folders').updateOne({ _id: id as any }, { $set: body });
  return NextResponse.json({ success: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await verifyAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const db = await getDb();
  // Klasördeki tüm fotoğrafları sil
  const photos = await db.collection('photos').find({ folderId: id }).toArray();
  for (const p of photos) {
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/photos/${p._id.toString()}`, { method: 'DELETE' });
  }
  await db.collection('folders').deleteOne({ _id: id as any });
  return NextResponse.json({ success: true });
}
