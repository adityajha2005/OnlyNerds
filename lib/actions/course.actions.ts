"use server";

import { connectToDB } from "@/lib/mongoose";
import Course from "@/lib/model/course.model";
import CourseRanking from "@/lib/model/courseRanking.model";
import { revalidatePath } from "next/cache";
import Module from "@/lib/model/module.model";
import Assessment from "@/lib/model/assessment.model";

interface CreateCourseParams {
    name: string;
    description?: string;
    background?: string;
    creator_id: string;
    isPublic?: boolean;
    categories: string[] | null;
    difficulty: "Beginner" | "Intermediate" | "Advanced";
    isOriginal?: boolean;
    forkedFrom?: string;
}

interface UpdateCourseParams extends CreateCourseParams {
    courseId: string;
}

// Helper function to serialize MongoDB document
const serializeCourse = (course: any) => {
    if (!course) return null;
    
    // Handle populated creator_id field
    const creatorId = typeof course.creator_id === 'object' 
        ? course.creator_id._id?.toString()
        : course.creator_id?.toString();

    return {
        _id: course._id?.toString(),
        name: course.name,
        description: course.description,
        background: course.background,
        creator_id: creatorId,
        isPublic: course.isPublic,
        categories: course.categories,
        difficulty: course.difficulty,
        isOriginal: course.isOriginal,
        forkedFrom: course.forkedFrom?.toString(),
        forkedBy: course.forkedBy?.toString(),
        createdAt: course.createdAt?.toISOString(),
        updatedAt: course.updatedAt?.toISOString(),
        ranking: course.ranking ? {
            _id: course.ranking._id?.toString(),
            creator_id: course.ranking.creator_id?.toString(),
            upvotes: course.ranking.upvotes || 0,
            downvotes: course.ranking.downvotes || 0,
            eloScore: course.ranking.eloScore || 0,
            createdAt: course.ranking.createdAt?.toISOString(),
            updatedAt: course.ranking.updatedAt?.toISOString()
        } : undefined
    };
};

export const createCourse = async ({
    name,
    description,
    background,
    creator_id,
    isPublic = true,
    categories,
    difficulty,
    isOriginal = true,
    forkedFrom
}: CreateCourseParams): Promise<{ success: boolean; message: string; course?: any }> => {
    try {
        await connectToDB();
        
        if (!name || !creator_id || !categories || !difficulty) {
            return { success: false, message: 'Name, creator_id, categories, and difficulty are required' };
        }

        const newCourse = await Course.create({
            name,
            description,
            background,
            creator_id,
            isPublic,
            categories,
            difficulty,
            isOriginal,
            forkedFrom
        });

        await CourseRanking.create({
            creator_id: creator_id,
            course_id: newCourse._id,
        });

        return { 
            success: true, 
            message: "Course created successfully",
            course: serializeCourse(newCourse)
        };
    } catch (error: any) {
        console.error(error);
        return { 
            success: false, 
            message: error.message || "Failed to create course" 
        };
    }
};

export const updateCourse = async ({
    courseId,
    name,
    description,
    background,
    isPublic,
    categories,
    difficulty,
}: UpdateCourseParams): Promise<{ success: boolean; message: string }> => {
    try {
        await connectToDB();

        if (!courseId) {
            return { success: false, message: 'Course ID is required' };
        }

        const updateData: Partial<UpdateCourseParams> = {
            name,
            categories,
            difficulty,
        };

        if (description) updateData.description = description;
        if (background) updateData.background = background;
        if (typeof isPublic === 'boolean') updateData.isPublic = isPublic;

        const updatedCourse = await Course.findByIdAndUpdate(
            courseId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedCourse) {
            return { success: false, message: "Course not found" };
        }

        revalidatePath("/courses");
        return { success: true, message: "Course updated successfully" };
    } catch (error: any) {
        console.error(error);
        return { 
            success: false, 
            message: error.message || "Failed to update course" 
        };
    }
};


export const getCourseByCreatorId = async (creator_id: string) => {
    try {
        await connectToDB();

        if (!creator_id) {
            throw new Error('Creator ID is required');
        }

        const coursesData = await Course.find({ creator_id })
            .lean();

        // Get rankings for each course
        const courses = await Promise.all(
            coursesData.map(async (course) => {
                const ranking = await CourseRanking.findOne({ course_id: course._id }).lean();
                return { ...course, ranking };
            })
        );

        return courses.map(serializeCourse).filter(course => course !== null);
    } catch (error: any) {
        console.error(error);
        throw new Error(`Failed to fetch courses: ${error.message}`);
    }
};

export const getCourseById = async (courseId: string) => {
    try {
        await connectToDB();

        if (!courseId) {
            return null;
        }

        // First find the course without population
        const course = await Course.findById(courseId).lean();
        
        // If no course found, return null early
        if (!course) {
            return null;
        }

        // Get course ranking
        const ranking = await CourseRanking.findOne({ 
            course_id: courseId 
        }).lean();

        // Combine course with ranking and serialize
        const courseWithRanking = { ...course, ranking: ranking || null };
        return serializeCourse(courseWithRanking);
    } catch (error: any) {
        console.error('Error in getCourseById:', error);
        return null;
    }
};

export const getCourses = async ({
    category,
    difficulty,
    searchQuery,
    page = 1,
    limit = 10,
    sortBy = 'createdAt'
}: {
    category?: string;
    difficulty?: string;
    searchQuery?: string;
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'eloScore';
}) => {
    try {
        await connectToDB();

        const query: any = { isPublic: true };
        
        if (category) query.categories = category;
        if (difficulty) query.difficulty = difficulty;
        if (searchQuery) {
            query.$or = [
                { name: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;

        let courses;
        if (sortBy === 'eloScore') {
            courses = await Course.aggregate([
                { $match: query },
                {
                    $lookup: {
                        from: 'courserankings',
                        localField: '_id',
                        foreignField: 'course_id',
                        as: 'ranking'
                    }
                },
                { $unwind: { path: '$ranking', preserveNullAndEmptyArrays: true } },
                { $sort: { 'ranking.eloScore': -1 } },
                { $skip: skip },
                { $limit: limit }
            ]);
        } else {
            const coursesData = await Course.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            // Get rankings for each course
            courses = await Promise.all(
                coursesData.map(async (course) => {
                    const ranking = await CourseRanking.findOne({ course_id: course._id }).lean();
                    return { ...course, ranking };
                })
            );
        }

        const totalCourses = await Course.countDocuments(query);

        return {
            courses: courses.map(serializeCourse),
            totalPages: Math.ceil(totalCourses / limit),
            currentPage: page,
            totalCourses
        };
    } catch (error: any) {
        console.error(error);
        throw new Error(`Failed to fetch courses: ${error.message}`);
    }
};


export const forkCourse = async ({
    originalCourseId,
    newCourseId,
    creator_id
}: {
    originalCourseId: string;
    newCourseId: string;
    creator_id: string;
}) => {
    try {
        await connectToDB();

        if (!originalCourseId || !newCourseId || !creator_id) {
            throw new Error("Original course ID, new course ID, and creator ID are required");
        }

        const originalCourse = await Course.findById(originalCourseId);
        if (!originalCourse) {
            throw new Error("Original course not found");
        }

        // Create the forked course
        const forkedCourse = await Course.create({
            name: `${originalCourse.name} (Forked)`,
            description: originalCourse.description,
            background: originalCourse.background,
            creator_id,
            isPublic: false,
            categories: originalCourse.categories,
            difficulty: originalCourse.difficulty,
            isOriginal: false,
            forkedFrom: originalCourseId,
            forkedBy: creator_id
        });

        // Create course ranking
        await CourseRanking.create({
            creator_id,
            course_id: forkedCourse._id,
        });

        // Get all modules from the original course
        const originalModules = await Module.find({ course_id: originalCourseId }).sort({ index: 1 });

        // Create new modules for the forked course
        const moduleIdMap = new Map<string, string>(); // Map old module IDs to new module IDs
        for (const originalModule of originalModules) {
            const newModule = await Module.create({
                course_id: forkedCourse._id,
                name: originalModule.name,
                content: originalModule.content,
                media: originalModule.media,
                index: originalModule.index
            });
            moduleIdMap.set(originalModule._id.toString(), newModule._id.toString());
        }

        // Get all assessments from the original course
        const originalAssessments = await Assessment.find({ course_id: originalCourseId });

        // Create new assessments for the forked course
        for (const originalAssessment of originalAssessments) {
            const newModuleId = moduleIdMap.get(originalAssessment.module_id);
            if (newModuleId) {
                await Assessment.create({
                    module_id: newModuleId,
                    course_id: forkedCourse._id,
                    type: originalAssessment.type,
                    questions: originalAssessment.questions
                });
            }
        }

        revalidatePath("/courses");
        return { 
            success: true, 
            message: "Course forked successfully",
            course: serializeCourse(forkedCourse)
        };
    } catch (error: any) {
        console.error(error);
        throw new Error(`Failed to fork course: ${error.message}`);
    }
};

export const deleteCourse = async (courseId: string) => {
    try {
        await connectToDB();

        if (!courseId) {
            return { success: false, message: "Course ID is required" };
        }

        const deletedCourse = await Course.findByIdAndDelete(courseId);
        if (!deletedCourse) {
            return { success: false, message: "Course not found" };
        }

        await CourseRanking.findOneAndDelete({ course_id: courseId });

        revalidatePath("/courses");
        return { success: true, message: "Course deleted successfully" };
    } catch (error: any) {
        console.error(error);
        return { 
            success: false, 
            message: error.message || "Failed to delete course" 
        };
    }
};

export const updateCourseRanking = async ({
    courseId,
    isUpvote
}: {
    courseId: string;
    isUpvote: boolean;
}): Promise<{ success: boolean; message: string }> => {
    try {
        await connectToDB();

        if (!courseId) {
            return { success: false, message: "Course ID is required" };
        }

        const ranking = await CourseRanking.findOne({ course_id: courseId });

        if (!ranking) {
            return { success: false, message: "Course ranking not found" };
        }

        if (isUpvote) {
            ranking.upvotes += 1;
        } else {
            ranking.downvotes += 1;
        }

        ranking.eloScore = ranking.upvotes - ranking.downvotes;
        await ranking.save();

        revalidatePath("/courses");
        return { success: true, message: "Course ranking updated successfully" };
    } catch (error: any) {
        console.error(error);
        return {
            success: false,
            message: error.message || "Failed to update course ranking"
        };
    }
};

export const getTopRatedCourses = async (limit: number = 10) => {
    try {
        await connectToDB();

        const rankings = await CourseRanking.find()
            .sort({ eloScore: -1 })
            .limit(limit)
            .lean();

        const courses = await Promise.all(
            rankings.map(async (ranking) => {
                const course = await Course.findById(ranking.course_id).lean();
                return course ? { ...course, ranking } : null;
            })
        );

        return courses.filter(course => course !== null).map(serializeCourse);
    } catch (error: any) {
        console.error(error);
        throw new Error(`Failed to fetch top rated courses: ${error.message}`);
    }
};

export const getUserCourseStats = async (userId: string) => {
    try {
        await connectToDB();

        if (!userId) {
            throw new Error('User ID is required');
        }

        const stats = await Course.aggregate([
            { $match: { creator_id: userId } },
            {
                $group: {
                    _id: null,
                    totalCourses: { $sum: 1 },
                    originalCourses: { $sum: { $cond: ["$isOriginal", 1, 0] } },
                    forkedCourses: { $sum: { $cond: ["$isOriginal", 0, 1] } },
                    publicCourses: { $sum: { $cond: ["$isPublic", 1, 0] } },
                    privateCourses: { $sum: { $cond: ["$isPublic", 0, 1] } },
                    categoriesDistribution: { $addToSet: "$categories" },
                    difficultyDistribution: { $addToSet: "$difficulty" }
                }
            }
        ]);

        const rankings = await CourseRanking.aggregate([
            {
                $lookup: {
                    from: 'courses',
                    localField: 'course_id',
                    foreignField: '_id',
                    as: 'course'
                }
            },
            {
                $match: {
                    'course.creator_id': userId
                }
            },
            {
                $group: {
                    _id: null,
                    totalUpvotes: { $sum: "$upvotes" },
                    totalDownvotes: { $sum: "$downvotes" },
                    averageEloScore: { $avg: "$eloScore" }
                }
            }
        ]);

        return {
            ...(stats[0] || {
                totalCourses: 0,
                originalCourses: 0,
                forkedCourses: 0,
                publicCourses: 0,
                privateCourses: 0,
                categoriesDistribution: [],
                difficultyDistribution: []
            }),
            ...(rankings[0] || {
                totalUpvotes: 0,
                totalDownvotes: 0,
                averageEloScore: 0
            })
        };
    } catch (error: any) {
        console.error(error);
        throw new Error(`Failed to fetch user course statistics: ${error.message}`);
    }
};

export const getUserTopCourses = async (userId: string, limit: number = 5) => {
    try {
        await connectToDB();

        if (!userId) {
            throw new Error('User ID is required');
        }

        const topCourses = await Course.aggregate([
            { $match: { creator_id: userId } },
            {
                $lookup: {
                    from: 'courserankings',
                    localField: '_id',
                    foreignField: 'course_id',
                    as: 'ranking'
                }
            },
            { $unwind: { path: '$ranking', preserveNullAndEmptyArrays: true } },
            { $sort: { 'ranking.eloScore': -1 } },
            { $limit: limit }
        ]);

        return topCourses.map(serializeCourse);
    } catch (error: any) {
        console.error(error);
        throw new Error(`Failed to fetch user's top courses: ${error.message}`);
    }
};

export const getUserRecentActivity = async (userId: string, limit: number = 10) => {
    try {
        await connectToDB();

        if (!userId) {
            throw new Error('User ID is required');
        }

        const recentActivity = await Course.find({ creator_id: userId })
            .sort({ updatedAt: -1 })
            .limit(limit)
            .lean();

        const coursesWithRankings = await Promise.all(
            recentActivity.map(async (course) => {
                const ranking = await CourseRanking.findOne({ course_id: course._id }).lean();
                return { ...course, ranking };
            })
        );

        return coursesWithRankings.map(serializeCourse);
    } catch (error: any) {
        console.error(error);
        throw new Error(`Failed to fetch user's recent activity: ${error.message}`);
    }
};