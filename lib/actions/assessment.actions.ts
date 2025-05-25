"use server";

import { connectToDB } from "@/lib/mongoose";
import Assessment from "@/lib/model/assessment.model";
import { revalidatePath } from "next/cache";
import { Document, Types } from 'mongoose';

interface MCQQuestion {
  question: string;
  options: string[];
  correctOption: number;
}

interface AssessmentDocument extends Document {
  _id: Types.ObjectId;
  module_id: string;
  course_id: string;
  type: 'mcq';
  questions: MCQQuestion[];
  createdAt: Date;
  updatedAt: Date;
}

interface CreateAssessmentParams {
  module_id: string;
  course_id: string;
  questions: MCQQuestion[];
}

interface UpdateAssessmentParams {
  module_id: string;
  questions: MCQQuestion[];
}

export const createAssessment = async ({
  module_id,
  course_id,
  questions
}: CreateAssessmentParams) => {
  try {
    await connectToDB();

    // Check if assessment already exists
    let assessment = await Assessment.findOne({ module_id }) as AssessmentDocument | null;

    if (assessment) {
      // Update existing assessment
      assessment.questions = questions;
      assessment.updatedAt = new Date();
      await assessment.save();
    } else {
      // Create new assessment
      assessment = new Assessment({
        module_id,
        course_id,
        questions,
        type: 'mcq'
      }) as AssessmentDocument;
      await assessment.save();
    }

    revalidatePath(`/courses/${course_id}`);
    revalidatePath(`/my-courses/${course_id}`);

    const assessmentObj = assessment.toObject();

    return { 
      success: true, 
      assessment: {
        ...assessmentObj,
        _id: assessmentObj._id.toString(),
        createdAt: assessmentObj.createdAt.toISOString(),
        updatedAt: assessmentObj.updatedAt.toISOString()
      }
    };
  } catch (error: any) {
    console.error("Error creating/updating assessment:", error);
    return {
      success: false,
      message: error.message || "Failed to create/update assessment"
    };
  }
};

export const getAssessmentByModuleId = async (module_id: string) => {
  try {
    await connectToDB();

    const assessment = await Assessment.findOne({ module_id }).lean() as AssessmentDocument | null;
    
    if (!assessment) {
      return null;
    }

    return {
      ...assessment,
      _id: assessment._id.toString(),
      createdAt: assessment.createdAt.toISOString(),
      updatedAt: assessment.updatedAt.toISOString()
    };
  } catch (error: any) {
    console.error("Error fetching assessment:", error);
    throw new Error(`Failed to fetch assessment: ${error.message}`);
  }
};

export const updateAssessment = async ({
  module_id,
  questions
}: UpdateAssessmentParams) => {
  try {
    await connectToDB();

    const assessment = await Assessment.findOne({ module_id }) as AssessmentDocument | null;

    if (!assessment) {
      throw new Error("Assessment not found");
    }

    assessment.questions = questions;
    assessment.updatedAt = new Date();
    await assessment.save();

    revalidatePath(`/courses/${assessment.course_id}`);
    revalidatePath(`/my-courses/${assessment.course_id}`);

    const assessmentObj = assessment.toObject();

    return { 
      success: true, 
      assessment: {
        ...assessmentObj,
        _id: assessmentObj._id.toString(),
        createdAt: assessmentObj.createdAt.toISOString(),
        updatedAt: assessmentObj.updatedAt.toISOString()
      }
    };
  } catch (error: any) {
    console.error("Error updating assessment:", error);
    return {
      success: false,
      message: error.message || "Failed to update assessment"
    };
  }
};

export const deleteAssessment = async (module_id: string) => {
  try {
    await connectToDB();

    const assessment = await Assessment.findOneAndDelete({ module_id }) as AssessmentDocument | null;

    if (!assessment) {
      return { success: false, message: "Assessment not found" };
    }

    revalidatePath(`/courses/${assessment.course_id}`);
    revalidatePath(`/my-courses/${assessment.course_id}`);

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting assessment:", error);
    return {
      success: false,
      message: error.message || "Failed to delete assessment"
    };
  }
}; 