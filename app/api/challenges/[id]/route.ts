import { connectToDB } from "@/lib/mongoose";
import Challenge from "@/lib/model/challenge.model";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        await connectToDB();

        const challenge = await Challenge.findById(params.id).lean();

        if (!challenge) {
            return NextResponse.json(
                { success: false, error: "Challenge not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: challenge });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        await connectToDB();

        const { creator_id } = await req.json();

        // Verify challenge exists and belongs to creator
        const challenge = await Challenge.findOne({
            _id: params.id,
            creator_id
        });

        if (!challenge) {
            return NextResponse.json(
                { success: false, error: "Challenge not found or unauthorized" },
                { status: 404 }
            );
        }

        await Challenge.findByIdAndDelete(params.id);

        return NextResponse.json({ 
            success: true, 
            message: "Challenge deleted successfully" 
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        await connectToDB();

        const body = await req.json();
        const { creator_id, ...updateData } = body;

        // Verify challenge exists and belongs to creator
        const challenge = await Challenge.findOne({
            _id: params.id,
            creator_id
        });

        if (!challenge) {
            return NextResponse.json(
                { success: false, error: "Challenge not found or unauthorized" },
                { status: 404 }
            );
        }

        const updatedChallenge = await Challenge.findByIdAndUpdate(
            params.id,
            updateData,
            { new: true }
        ).lean();

        return NextResponse.json({ success: true, data: updatedChallenge });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
} 