import { connectToDB } from "@/lib/mongoose";
import Challenge, { IChallenge, IQuestion } from "@/lib/model/challenge.model";
import { NextResponse } from "next/server";

interface ChallengeDocument {
    _id: string;
    creator_id: string;
    name: string;
    type: "mcq";
    questions: IQuestion[];
    signature: string;
    reward: number;
    completed: boolean;
    submissions: Record<string, {
        answers: string[];
        score: number;
        percentage: number;
        signature: string;
        submittedAt: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        await connectToDB();

        const { challenger_id, answers, signature } = await req.json();

        if (!challenger_id || !answers || !signature) {
            return NextResponse.json(
                { success: false, error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Get the challenge
        const challengeDoc = await Challenge.findById(params.id).lean() as unknown as ChallengeDocument;
        if (!challengeDoc) {
            return NextResponse.json(
                { success: false, error: "Challenge not found" },
                { status: 404 }
            );
        }

        // Verify answers length matches questions length
        if (answers.length !== challengeDoc.questions.length) {
            return NextResponse.json(
                { success: false, error: "Invalid number of answers" },
                { status: 400 }
            );
        }

        // Calculate score
        const correctAnswers = challengeDoc.questions.map(q => q.correctAnswer);
        const score = answers.reduce((acc: number, answer: string, index: number) => 
            answer === correctAnswers[index] ? acc + 1 : acc, 0
        );
        const percentage = (score / challengeDoc.questions.length) * 100;

        // Update challenge completion status
        await Challenge.findByIdAndUpdate(params.id, {
            $set: {
                completed: true,
                [`submissions.${challenger_id}`]: {
                    answers,
                    score,
                    percentage,
                    signature,
                    submittedAt: new Date()
                }
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                score,
                percentage,
                totalQuestions: challengeDoc.questions.length,
                correctAnswers: score
            }
        });
    } catch (error: any) {
        console.error("Submit challenge error:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
} 