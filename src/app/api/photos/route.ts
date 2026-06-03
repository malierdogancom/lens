import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  const folderId = req.nextUrl.searchParams.get('folderId');
  const db = await getDb();
  const query = folderId ? { folderId } : {};
  const photos = await db.collection('photos').find(query).sort({ createdAt: -1 }).toArray();
  return NextResponse.json(photos.map(p => ({ ...p, id: p._id.toString(), _id: undefined })));
}
