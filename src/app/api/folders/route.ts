import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { verifyAuth } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function GET() {
  const db = await getDb();
  const folders = await db.collection('folders').find({}).sort({ createdAt: -1 }).toArray();
  return NextResponse.json(folders.map(f => ({ ...f, id: f._id.toString(), _id: undefined, password: undefined })));
}

export async function POST(req: NextRequest) {
  if (!await verifyAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { name } = await req.json();
  const db = await getDb();
  const result = await db.collection('folders').insertOne({ name, createdAt: new Date().toISOString() });
  return NextResponse.json({ id: result.insertedId.toString() });
}
