import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  const { folderId, password } = await req.json();
  const db = await getDb();
  const folder = await db.collection('folders').findOne({ _id: folderId as any });
  if (!folder) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (folder.password !== password) return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
  return NextResponse.json({ success: true });
}
