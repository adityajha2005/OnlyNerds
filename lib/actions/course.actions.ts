"use server";

import { connectToDB } from "@/lib/mongoose";
import Course from "@/lib/model/course.model";
import CourseRanking from "@/lib/model/courseRanking.model";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

interface CreateCourseParams {
    courseId: string;
    name: string;
    description?: string;
    background?: string;
    creator_id: string;
    isPublic?: boolean;
    categories: string[];
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
    return {
        _id: course._id.toString(),
        name: course.name,
        description: course.description,
        background: course.background,
        creator_id: course.creator_id.toString(),
        isPublic: course.isPublic,
        categories: course.categories,
        difficulty: course.difficulty,
        isOriginal: course.isOriginal,
        forkedFrom: course.forkedFrom?.toString(),
        createdAt: course.createdAt?.toISOString(),
        updatedAt: course.updatedAt?.toISOString(),
        ranking: course.ranking ? {
            _id: course.ranking._id.toString(),
            creator_id: course.ranking.creator_id.toString(),
            upvotes: course.ranking.upvotes,
            downvotes: course.ranking.downvotes,
            eloScore: course.ranking.eloScore,
            createdAt: course.ranking.createdAt?.toISOString(),
            updatedAt: course.ranking.updatedAt?.toISOString()
        } : null
    };
};

export async function createCourse({
    courseId,
    name,
    description,
    background,
    creator_id,
    isPublic = true,
    categories,
    difficulty,
    isOriginal = true,
    forkedFrom
}: CreateCourseParams): Promise<{ success: boolean; message: string; course?: any }> {
    try {
        await connectToDB();
        const newCourse = await Course.create({
            _id: courseId,
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
            _id: `${courseId}_ranking`,
            creator_id,
            course_id: courseId,
        });

        revalidatePath("/courses");
        return { 
            success: true, 
            message: "Course created successfully",
            course: newCourse 
        };
    } catch (error: any) {
        return { 
            success: false, 
            message: error.message || "Failed to create course" 
        };
    }
}
//updating existing course
export async function updateCourse({
    courseId,
    name,
    description,
    background,
    isPublic,
    categories,
    difficulty,
}: UpdateCourseParams): Promise<{ success: boolean; message: string }> {
    try {
        await connectToDB();

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
        return { 
            success: false, 
            message: error.message || "Failed to update course" 
        };
    }
}

//getting a single course by ID
export async function getCourse(courseId: string) {
    try {
        await connectToDB();

        const course = await Course.findById(courseId)
            .populate('creator_id')
            .populate('forkedFrom')
            .populate('ranking')
            .lean();
        
        if (!course) {
            throw new Error("Course not found");
        }

        return serializeCourse(course);
    } catch (error: any) {
        throw new Error(`Failed to fetch course: ${error.message}`);
    }
}

// Get all public courses with optional filters
export async function getCourses({
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
}) {
    try {
        await connectToDB();

        const query: any = { isPublic: true };
        
        // Apply filters
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
            // Use aggregation pipeline for sorting by eloScore
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
                { $sort: { 'ranking.eloScore': -1 } },
                { $skip: skip },
                { $limit: limit }
            ]);

            // Manually populate creator_id since aggregate doesn't support populate
            await Course.populate(courses, { path: 'creator_id' });
        } else {
            courses = await Course.find(query)
                .populate('creator_id')
                .populate('ranking')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();
        }

        const totalCourses = await Course.countDocuments(query);

        return {
            courses: courses.map(serializeCourse),
            totalPages: Math.ceil(totalCourses / limit),
            currentPage: page,
            totalCourses
        };
    } catch (error: any) {
        throw new Error(`Failed to fetch courses: ${error.message}`);
    }
}

// Get courses created by a specific user
export async function getUserCourses(userId: string) {
    try {
        await connectToDB();

        const courses = await Course.find({ creator_id: userId })
            .populate('creator_id')
            .populate('ranking')
            .lean();

        return courses.map(serializeCourse);
    } catch (error: any) {
        throw new Error(`Failed to fetch user courses: ${error.message}`);
    }
}

// Fork a course
export async function forkCourse({
    originalCourseId,
    newCourseId,
    creator_id
}: {
    originalCourseId: string;
    newCourseId: string;
    creator_id: string;
}) {
    try {
        await connectToDB();

        const originalCourse = await Course.findById(originalCourseId);
        if (!originalCourse) {
            throw new Error("Original course not found");
        }

        const forkedCourse = await Course.create({
            _id: newCourseId,
            name: `${originalCourse.name} (Forked)`,
            description: originalCourse.description,
            background: originalCourse.background,
            creator_id,
            isPublic: true,
            categories: originalCourse.categories,
            difficulty: originalCourse.difficulty,
            isOriginal: false,
            forkedFrom: originalCourseId
        });

        // Initialize ranking for forked course
        await CourseRanking.create({
            _id: `${newCourseId}_ranking`,
            creator_id,
            course_id: newCourseId,
        });

        revalidatePath("/courses");
        return { 
            success: true, 
            message: "Course forked successfully",
            course: forkedCourse 
        };
    } catch (error: any) {
        throw new Error(`Failed to fork course: ${error.message}`);
    }
}

// Delete a course
export async function deleteCourse(courseId: string) {
    try {
        await connectToDB();

        // Delete the course
        const deletedCourse = await Course.findByIdAndDelete(courseId);
        if (!deletedCourse) {
            return { success: false, message: "Course not found" };
        }

        // Delete associated ranking
        await CourseRanking.findByIdAndDelete(`${courseId}_ranking`);

        revalidatePath("/courses");
        return { success: true, message: "Course deleted successfully" };
    } catch (error: any) {
        return { 
            success: false, 
            message: error.message || "Failed to delete course" 
        };
    }
}

// Update course ranking
export async function updateCourseRanking({
    courseId,
    isUpvote
}: {
    courseId: string;
    isUpvote: boolean;
}): Promise<{ success: boolean; message: string }> {
    try {
        await connectToDB();

        const rankingId = `${courseId}_ranking`;
        const ranking = await CourseRanking.findById(rankingId);

        if (!ranking) {
            return { success: false, message: "Course ranking not found" };
        }

        // Update votes
        if (isUpvote) {
            ranking.upvotes += 1;
        } else {
            ranking.downvotes += 1;
        }

        // Update Elo score (simple calculation - can be made more sophisticated)
        ranking.eloScore = ranking.upvotes - ranking.downvotes;

        await ranking.save();

        revalidatePath("/courses");
        return { success: true, message: "Course ranking updated successfully" };
    } catch (error: any) {
        return {
            success: false,
            message: error.message || "Failed to update course ranking"
        };
    }
}

// Get top rated courses
export async function getTopRatedCourses(limit: number = 10) {
    try {
        await connectToDB();

        const rankings = await CourseRanking.find()
            .sort({ eloScore: -1 })
            .limit(limit)
            .populate({
                path: 'course_id',
                populate: {
                    path: 'creator_id'
                }
            });

        return rankings.map(ranking => ranking.course_id);
    } catch (error: any) {
        throw new Error(`Failed to fetch top rated courses: ${error.message}`);
    }
}

// Get user's course statistics
export async function getUserCourseStats(userId: string) {
    try {
        await connectToDB();

        const stats = await Course.aggregate([
            { $match: { creator_id: new mongoose.Types.ObjectId(userId) } },
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

        // Get total upvotes and downvotes from course rankings
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
                    'course.creator_id': new mongoose.Types.ObjectId(userId)
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
        throw new Error(`Failed to fetch user course statistics: ${error.message}`);
    }
}

// Get user's top performing courses
export async function getUserTopCourses(userId: string, limit: number = 5) {
    try {
        await connectToDB();

        const topCourses = await Course.aggregate([
            { $match: { creator_id: new mongoose.Types.ObjectId(userId) } },
            {
                $lookup: {
                    from: 'courserankings',
                    localField: '_id',
                    foreignField: 'course_id',
                    as: 'ranking'
                }
            },
            { $unwind: '$ranking' },
            { $sort: { 'ranking.eloScore': -1 } },
            { $limit: limit }
        ]);

        // Populate creator_id since aggregate doesn't support populate
        await Course.populate(topCourses, { path: 'creator_id' });

        return topCourses.map(serializeCourse);
    } catch (error: any) {
        throw new Error(`Failed to fetch user's top courses: ${error.message}`);
    }
}

// Get user's recent course activity
export async function getUserRecentActivity(userId: string, limit: number = 10) {
    try {
        await connectToDB();

        const recentActivity = await Course.find({ creator_id: userId })
            .populate('creator_id')
            .populate('ranking')
            .sort({ updatedAt: -1 })
            .limit(limit)
            .lean();

        return recentActivity.map(serializeCourse);
    } catch (error: any) {
        throw new Error(`Failed to fetch user's recent activity: ${error.message}`);
    }
}
