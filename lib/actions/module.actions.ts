"use server";

import { connectToDB } from "@/lib/mongoose";
import Module from "@/lib/model/module.model";
import { revalidatePath } from "next/cache";
import { Document, Types } from 'mongoose';

interface ModuleDocument extends Document {
  _id: string;
  course_id: string;
  name: string;
  content: string;
  media: string[];
  index: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ModuleData {
  _id: string;
  course_id: string;
  name: string;
  content: string;
  media: string[];
  index: number;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

interface RawModule {
  _id: Types.ObjectId;
  course_id: string;
  name: string;
  content: string;
  media: string[];
  index: number;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

interface CreateModuleParams {
  course_id: string;
  name: string;
  content: string;
  media?: string[];
  index: number;
}

interface UpdateModuleParams {
  moduleId: string;
  name: string;
  content: string;
  media?: string[];
  index: number;
}

export const createModule = async ({
  course_id,
  name,
  content,
  media = [],
  index
}: CreateModuleParams) => {
  try {
    await connectToDB();

    const newModule = new Module({
      course_id,
      name: name.trim(),
      content: content.trim(),
      media,
      index
    });

    const savedModule = await newModule.save();
    
    // Convert the module to a plain object and ensure proper type conversion
    const moduleResponse = {
      _id: savedModule._id.toString(),
      course_id: savedModule.course_id,
      name: savedModule.name,
      content: savedModule.content,
      media: savedModule.media || [],
      index: savedModule.index,
      createdAt: savedModule.createdAt?.toISOString(),
      updatedAt: savedModule.updatedAt?.toISOString()
    };

    revalidatePath(`/my-courses/${course_id}`);
    revalidatePath(`/courses/${course_id}`);

    return { success: true, module: moduleResponse };
  } catch (error: any) {
    console.error("Error creating module:", error);
    return { 
      success: false, 
      message: error.message || "Failed to create module" 
    };
  }
};

export const getModulesByCourseId = async (courseId: string) => {
  try {
    await connectToDB();

    const rawModules = await Module.find({ course_id: courseId })
      .sort({ index: 1 })
      .lean() as RawModule[];

    // Convert the raw modules to the expected format
    const modules = rawModules.map(module => ({
      _id: module._id.toString(),
      course_id: module.course_id,
      name: module.name,
      content: module.content,
      media: module.media || [],
      index: module.index,
      createdAt: module.createdAt?.toISOString(),
      updatedAt: module.updatedAt?.toISOString(),
      __v: module.__v
    }));

    return modules;
  } catch (error: any) {
    console.error("Error fetching modules:", error);
    throw new Error(`Failed to fetch modules: ${error.message}`);
  }
};

export const updateModule = async ({
  moduleId,
  name,
  content,
  media = [],
  index
}: UpdateModuleParams) => {
  try {
    await connectToDB();

    const updatedModule = await Module.findByIdAndUpdate(
      moduleId,
      {
        name: name.trim(),
        content: content.trim(),
        media,
        index,
        updatedAt: new Date()
      },
      { new: true }
    ).lean() as unknown as ModuleDocument;

    if (!updatedModule) {
      return { success: false, message: "Module not found" };
    }

    // Convert to plain object with proper type conversion
    const moduleResponse = {
      _id: updatedModule._id.toString(),
      course_id: updatedModule.course_id,
      name: updatedModule.name,
      content: updatedModule.content,
      media: updatedModule.media || [],
      index: updatedModule.index,
      createdAt: updatedModule.createdAt?.toISOString(),
      updatedAt: updatedModule.updatedAt?.toISOString()
    };

    revalidatePath(`/my-courses/${updatedModule.course_id}`);
    revalidatePath(`/courses/${updatedModule.course_id}`);

    return { success: true, module: moduleResponse };
  } catch (error: any) {
    console.error("Error updating module:", error);
    return { 
      success: false, 
      message: error.message || "Failed to update module" 
    };
  }
};

export const deleteModule = async (moduleId: string) => {
  try {
    await connectToDB();

    const module = await Module.findByIdAndDelete(moduleId);

    if (!module) {
      return { success: false, message: "Module not found" };
    }

    revalidatePath(`/my-courses/${module.course_id}`);
    revalidatePath(`/courses/${module.course_id}`);

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting module:", error);
    return { 
      success: false, 
      message: error.message || "Failed to delete module" 
    };
  }
};

export const getModuleById = async (moduleId: string) => {
  try {
    await connectToDB();

    const module = await Module.findById(moduleId).lean() as unknown as ModuleDocument;

    if (!module) {
      return null;
    }

    return {
      _id: module._id.toString(),
      course_id: module.course_id,
      name: module.name,
      content: module.content,
      media: module.media || [],
      index: module.index,
      createdAt: module.createdAt?.toISOString(),
      updatedAt: module.updatedAt?.toISOString()
    };
  } catch (error: any) {
    console.error("Error fetching module:", error);
    throw new Error(`Failed to fetch module: ${error.message}`);
  }
};

export const reorderModules = async (courseId: string, moduleOrders: { moduleId: string; index: number }[]) => {
  try {
    await connectToDB();

    // Update each module's index
    await Promise.all(
      moduleOrders.map(({ moduleId, index }) =>
        Module.findByIdAndUpdate(moduleId, { index })
      )
    );

    revalidatePath(`/my-courses/${courseId}`);
    revalidatePath(`/courses/${courseId}`);

    return { success: true };
  } catch (error: any) {
    console.error("Error reordering modules:", error);
    return { 
      success: false, 
      message: error.message || "Failed to reorder modules" 
    };
  }
};

export const duplicateModule = async (moduleId: string) => {
  try {
    await connectToDB();

    const originalModule = await Module.findById(moduleId);

    if (!originalModule) {
      return { success: false, message: "Module not found" };
    }

    const newModule = new Module({
      course_id: originalModule.course_id,
      name: `${originalModule.name} (Copy)`,
      content: originalModule.content,
      media: originalModule.media,
      index: originalModule.index + 1
    });

    const savedModule = await newModule.save();

    // Update indices of all modules after this one
    await Module.updateMany(
      { 
        course_id: originalModule.course_id, 
        index: { $gt: originalModule.index } 
      },
      { $inc: { index: 1 } }
    );

    // Convert to plain object with proper type conversion
    const moduleResponse = {
      _id: savedModule._id.toString(),
      course_id: savedModule.course_id,
      name: savedModule.name,
      content: savedModule.content,
      media: savedModule.media || [],
      index: savedModule.index,
      createdAt: savedModule.createdAt?.toISOString(),
      updatedAt: savedModule.updatedAt?.toISOString()
    };

    revalidatePath(`/my-courses/${originalModule.course_id}`);
    revalidatePath(`/courses/${originalModule.course_id}`);

    return { success: true, module: moduleResponse };
  } catch (error: any) {
    console.error("Error duplicating module:", error);
    return { 
      success: false, 
      message: error.message || "Failed to duplicate module" 
    };
  }
};