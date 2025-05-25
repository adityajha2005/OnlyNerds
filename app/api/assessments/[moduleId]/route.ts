import { NextResponse } from 'next/server';
import { getAssessmentByModuleId, createAssessment } from '@/lib/actions/assessment.actions';

export async function GET(
  request: Request,
  { params }: { params: { moduleId: string } }
) {
  try {
    console.log('Fetching assessment for module:', params.moduleId);
    const assessment = await getAssessmentByModuleId(params.moduleId);
    console.log('Assessment found:', assessment);
    return NextResponse.json(assessment);
  } catch (error: any) {
    console.error('Error fetching assessment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch assessment' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { moduleId: string } }
) {
  try {
    const body = await request.json();
    const { course_id, questions } = body;

    console.log('Creating/updating assessment for module:', params.moduleId);
    console.log('Course ID:', course_id);
    console.log('Questions:', questions);

    if (!course_id) {
      console.error('Missing course_id in request body');
      return NextResponse.json(
        { error: 'course_id is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(questions)) {
      console.error('Questions must be an array');
      return NextResponse.json(
        { error: 'questions must be an array' },
        { status: 400 }
      );
    }

    const result = await createAssessment({
      module_id: params.moduleId,
      course_id,
      questions
    });

    console.log('Assessment creation/update result:', result);

    if (!result.success) {
      throw new Error(result.message);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error creating/updating assessment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create/update assessment' },
      { status: 500 }
    );
  }
} 