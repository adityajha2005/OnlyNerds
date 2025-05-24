"use server";

import { connectToDB } from "@/lib/mongoose"
import User from "@/lib/model/user.model";
import { revalidatePath } from "next/cache";

interface UpdateUserParams {
    userId: string;
    name: string;
    bio?: string;
    avatar?: string;
    email?: string;
    socials?: {
        github?: string;
        x?: string;
        linkedin?: string;
    };
}

// Helper function to serialize MongoDB document
const serializeUser = (user: any) => {
    if (!user) return null;
    const doc = user.toObject ? user.toObject() : user;
    return {
        _id: doc._id.toString(),
        name: doc.name,
        bio: doc.bio,
        avatar: doc.avatar,
        email: doc.email,
        socials: doc.socials,
        createdAt: doc.createdAt?.toISOString(),
        updatedAt: doc.updatedAt?.toISOString()
    };
};

export async function updateUser({
    userId,
    name,
    bio,
    avatar,
    email,
    socials
}: UpdateUserParams): Promise<{ success: boolean; message: string }> {
    try {
        await connectToDB();

        const updateData: Partial<UpdateUserParams> = {
            name,
        };

        if (bio) updateData.bio = bio;
        if (avatar) updateData.avatar = avatar;
        if (email) updateData.email = email;
        if (socials) updateData.socials = socials;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return { success: false, message: "User not found" };
        }

        revalidatePath("/profile");
        return { success: true, message: "Profile updated successfully" };
    } catch (error: any) {
        return { 
            success: false, 
            message: error.message || "Failed to update user profile" 
        };
    }
}

export async function getUser(userId: string) {
    try {
        await connectToDB();

        const user = await User.findById(userId);
        
        if (!user) {
            throw new Error("User not found");
        }

        return serializeUser(user);
    } catch (error: any) {
        throw new Error(`Failed to fetch user: ${error.message}`);
    }
}

export async function createUser(userId: string) {
    try {
        await connectToDB();

        const existingUser = await User.findById(userId);
        if (existingUser) {
            return serializeUser(existingUser);
        }

        const newUser = await User.create({
            _id: userId,
            name: `User_${userId.slice(0, 6)}`,
        });

        return serializeUser(newUser);
    } catch (error: any) {
        throw new Error(`Failed to create user: ${error.message}`);
    }
}

export async function checkUserProfileComplete(userId: string): Promise<boolean> {
    try {
        await connectToDB();

        const user = await User.findById(userId);
        if (!user) return false;

        const doc = user.toObject();
        return !!(
            doc.name &&
            doc.name !== `User_${userId.slice(0, 6)}` &&
            doc.email &&
            doc.bio
        );
    } catch (error) {
        return false;
    }
}
