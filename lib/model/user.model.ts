import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
        minLength: [2, 'Name must be at least 2 characters'],
        maxLength: [50, 'Name cannot exceed 50 characters']
    },
    bio: {
        type: String,
        trim: true,
        maxLength: [500, 'Bio cannot exceed 500 characters']
    },
    avatar: {
        type: String, 
        validate: {
            validator: function(v: string) {
                return /^(https?:\/\/)?.+\..+/.test(v);
            },
            message: 'Please enter a valid URL'
        }
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        validate: {
            validator: function(v) {
                return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
            },
            message: 'Please enter a valid email'
        }
    },
    socials: {
        github: {
            type: String,
            validate: {
                validator: function(v: string) {
                    return !v || v.startsWith('https://github.com/');
                },
                message: 'Invalid GitHub URL'
            }
        },
        x: {
            type: String,
            validate: {
                validator: function(v: string) {
                    return !v || v.startsWith('https://x.com/');
                },
                message: 'Invalid X/Twitter URL'
            }
        },
        linkedin: {
            type: String,
            validate: {
                validator: function(v: string) {
                    return !v || v.startsWith('https://www.linkedin.com/in/');
                },
                message: 'Invalid LinkedIn URL'
            }
        }
    }
}, { 
    timestamps: true,
});

userSchema.index({ id: 1 });
userSchema.index({ email: 1 });

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;