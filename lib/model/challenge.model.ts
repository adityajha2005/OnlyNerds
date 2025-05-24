import mongoose from "mongoose";

// Clear the cached model to ensure schema changes take effect
if (mongoose.models.Challenge) {
    delete mongoose.models.Challenge;
}

const questionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
    },
    options: [{
        type: String,
        required: true,
    }],
    correctAnswer: {
        type: String,
        required: true,
    }
});

const submissionSchema = new mongoose.Schema({
    answers: [String],
    score: Number,
    percentage: Number,
    signature: String,
    submittedAt: Date
});

const challengeSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
        unique: true,
    },
    creator_id: {
        type: String,
        required: true,
        validate: {
            validator: function (v: string) {
                return /^0x[a-fA-F0-9]{40}$/.test(v);
            },
            message: 'creator_id must be a valid Ethereum address'
        }
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    type: {
        type: String,
        enum: ["mcq"],
        required: true,
    },
    questions: {
        type: [questionSchema],
        required: true,
        validate: {
            validator: function (arr: mongoose.Types.Array<any>) {
                return Array.isArray(arr) && arr.length > 0;
            },
            message: 'At least one question is required'
        }
    },
    signature: {
        type: String,
        required: true,
    },
    reward: {
        type: Number,
        default: 0,
        min: 0
    },
    completed: {
        type: Boolean,
        default: false
    },
    submissions: {
        type: Map,
        of: submissionSchema
    }
}, {
    timestamps: true,
    _id: false
});

challengeSchema.index({ creator_id: 1 });
challengeSchema.index({ completed: 1 });

const Challenge = mongoose.models.Challenge || mongoose.model("Challenge", challengeSchema);

export default Challenge;

// Export types for TypeScript
export interface IQuestion {
    question: string;
    options: string[];
    correctAnswer: string;
}

export interface ISubmission {
    answers: string[];
    score: number;
    percentage: number;
    signature: string;
    submittedAt: Date;
}

export interface IChallenge {
    _id: string;
    creator_id: string;
    name: string;
    type: "mcq";
    questions: IQuestion[];
    signature: string;
    reward: number;
    completed: boolean;
    submissions: Map<string, ISubmission>;
    createdAt: Date;
    updatedAt: Date;
}
