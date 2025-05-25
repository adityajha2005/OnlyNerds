export interface User {
    _id: string;
    name: string;
    bio?: string;
    avatar?: string;
    email: string;
    socials?: {
        github?: string;
        x?: string;
        linkedin?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

export type Category = 'Web3' | 'AI/ML' | 'Full Stack Development' | 'Marketing' | 'Designs';
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Course {
    _id: string;
    name: string;
    description?: string;
    background?: string;
    creator_id: string;
    isPublic: boolean;
    categories: Category[];
    difficulty: Difficulty;
    isOriginal: boolean;
    forkedFrom?: string;
    forkedBy?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CourseRanking {
    _id: string;
    creator_id: string;
    upvotes: number;
    downvotes: number;
    eloScore: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface CourseWithRanking extends Course {
    ranking?: CourseRanking;
} 