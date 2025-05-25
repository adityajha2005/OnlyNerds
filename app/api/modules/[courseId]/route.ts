import { NextResponse } from 'next/server';
import { getModulesByCourseId } from '@/lib/actions/module.actions';

export async function GET(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const modules = await getModulesByCourseId(params.courseId);
    return NextResponse.json(modules);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch modules' },
      { status: 500 }
    );
  }
} 