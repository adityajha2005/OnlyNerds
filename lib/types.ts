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