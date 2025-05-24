"use server";

import { connectToDB } from "@/lib/mongoose";
import Module from "@/lib/model/module.model";

export const getModulesByCourseId = async (courseId: string) => {
    try {
        await connectToDB();
        const modules = await Module.find({ course_id: courseId }).lean();
        return modules.map(module => ({
            ...module,
            _id: module._id.toString(),
            course_id: module.course_id.toString(),
            createdAt: module.createdAt?.toISOString(),
            updatedAt: module.updatedAt?.toISOString()
        }));
    } catch (error: any) {
        console.error(error);
        throw new Error(`Failed to fetch modules: ${error.message}`);
    }
};

export const createModule = async (moduleData: any) => {
    try {
        await connectToDB();
        const newModule = await Module.create(moduleData);
        return { success: true, message: "Module created successfully", module: newModule };
    } catch (error: any) {
        console.error(error);
        return { success: false, message: error.message || "Failed to create module" };
    }
};

export const updateModule = async ({ moduleId, ...updateData }: any) => {
    try {
        await connectToDB();
        const updatedModule = await Module.findByIdAndUpdate(moduleId, updateData, { new: true });
        if (!updatedModule) {
            return { success: false, message: "Module not found" };
        }
        return { success: true, message: "Module updated successfully" };
    } catch (error: any) {
        console.error(error);
        return { success: false, message: error.message || "Failed to update module" };
    }
};

export const deleteModule = async (moduleId: string) => {
    try {
        await connectToDB();
        const deletedModule = await Module.findByIdAndDelete(moduleId);
        if (!deletedModule) {
            return { success: false, message: "Module not found" };
        }
        return { success: true, message: "Module deleted successfully" };
    } catch (error: any) {
        console.error(error);
        return { success: false, message: error.message || "Failed to delete module" };
    }
};