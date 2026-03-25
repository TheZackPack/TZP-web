import { NextResponse } from 'next/server';
import patchnotes from '@/data/patchnotes.json';

export async function GET() {
  return NextResponse.json(patchnotes);
}
