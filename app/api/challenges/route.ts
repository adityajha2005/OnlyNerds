import { connectToDB } from "@/lib/mongoose";
import Challenge from "@/lib/model/challenge.model";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        await connectToDB();
        
        const body = await req.json();
        const { creator_id, name, questions, signature } = body;

        if (!creator_id || !name || !questions || !signature) {
            return NextResponse.json(
                { success: false, error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Validate questions structure
        if (!Array.isArray(questions)) {
            return NextResponse.json(
                { success: false, error: "Questions must be an array" },
                { status: 400 }
            );
        }

        // Create challenge with validated data
        const challenge = await Challenge.create({
            _id: Math.random().toString(36).substring(7),
            creator_id,
            name,
            type: "mcq",
            questions: questions.map(q => ({
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer
            })),
            signature,
            reward: 0 // Default reward
        });

        return NextResponse.json({ success: true, data: challenge }, { status: 201 });
    } catch (error: any) {
        console.error("POST challenge error:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function GET(req: Request) {
    try {
        await connectToDB();
        
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        const challenges = await Challenge.find({})
            .sort({ createdAt: "desc" })
            .skip(skip)
            .limit(limit)
            .lean();

        const totalChallenges = await Challenge.countDocuments({});

        return NextResponse.json({
            success: true,
            data: {
                challenges,
                totalPages: Math.ceil(totalChallenges / limit),
                currentPage: page
            }
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
} 