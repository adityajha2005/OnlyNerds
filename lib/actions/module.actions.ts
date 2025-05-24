"use server";

import { connectToDB } from "@/lib/mongoose";
import Module from "@/lib/model/module.model";
import { revalidatePath } from "next/cache";

export const createModule = async ({
  course_id,
  name,
  content,
  media = [],
  index
}: {
  course_id: string;
  name: string;
  content: string;
  media?: string[];
  index: number;
}) => {
  try {
    await connectToDB();

    const moduleId = `module_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newModule = new Module({
      _id: moduleId,
      course_id,
      name: name.trim(),
      content: content.trim(),
      media,
      index
    });

    await newModule.save();

    revalidatePath(`/my-courses/${course_id}`);
    revalidatePath(`/courses/${course_id}`);

    return { success: true, module: newModule };
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

    const modules = await Module.find({ course_id: courseId })
      .sort({ index: 1 })
      .lean();

    return modules.map(module => ({
      ...module,
      _id: module._id.toString(),
      course_id: module.course_id,
      createdAt: module.createdAt?.toISOString(),
      updatedAt: module.updatedAt?.toISOString(),
    }));
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
}: {
  moduleId: string;
  name: string;
  content: string;
  media?: string[];
  index: number;
}) => {
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
    );

    if (!updatedModule) {
      return { success: false, message: "Module not found" };
    }

    revalidatePath(`/my-courses/${updatedModule.course_id}`);
    revalidatePath(`/courses/${updatedModule.course_id}`);

    return { success: true, module: updatedModule };
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

    const deletedModule = await Module.findByIdAndDelete(moduleId);

    if (!deletedModule) {
      return { success: false, message: "Module not found" };
    }

    revalidatePath(`/my-courses/${deletedModule.course_id}`);
    revalidatePath(`/courses/${deletedModule.course_id}`);

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

    const module = await Module.findById(moduleId).lean();

    if (!module) {
      throw new Error("Module not found");
    }

    return {
      ...module,
      _id: module._id.toString(),
      course_id: module.course_id,
      createdAt: module.createdAt?.toISOString(),
      updatedAt: module.updatedAt?.toISOString(),
    };
  } catch (error: any) {
    console.error("Error fetching module:", error);
    throw new Error(`Failed to fetch module: ${error.message}`);
  }
};

export const reorderModules = async (courseId: string, moduleOrders: { moduleId: string; index: number }[]) => {
  try {
    await connectToDB();

    const updatePromises = moduleOrders.map(({ moduleId, index }) =>
      Module.findByIdAndUpdate(moduleId, { index, updatedAt: new Date() })
    );

    await Promise.all(updatePromises);

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

    const newModuleId = `module_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Find the highest index in the course and add 1
    const highestIndexModule = await Module.findOne({ course_id: originalModule.course_id })
      .sort({ index: -1 });
    
    const newIndex = (highestIndexModule?.index || 0) + 1;

    const duplicatedModule = new Module({
      _id: newModuleId,
      course_id: originalModule.course_id,
      name: `${originalModule.name} (Copy)`,
      content: originalModule.content,
      media: [...originalModule.media],
      index: newIndex
    });

    await duplicatedModule.save();

    revalidatePath(`/my-courses/${originalModule.course_id}`);
    revalidatePath(`/courses/${originalModule.course_id}`);

    return { success: true, module: duplicatedModule };
  } catch (error: any) {
    console.error("Error duplicating module:", error);
    return { 
      success: false, 
      message: error.message || "Failed to duplicate module" 
    };
  }
};