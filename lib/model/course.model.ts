import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
    creator_id: { type: String, ref: 'User', required: true }, 
    name: { 
        type: String, 
        required: true, 
        trim: true,
        minLength: [2, 'Name must be at least 2 characters'],
        maxLength: [70, 'Name cannot exceed 70 characters']
    },
    description: { 
        type: String, 
        required: false, 
        trim: true,
        maxLength: [500, 'Description cannot exceed 500 characters']
    },
    background: { 
        type: String, 
        required: false,
        validate: {
            validator: function(v: string) {
                return !v || /^(https?:\/\/)?.+\..+/.test(v);
            },
            message: 'Please enter a valid URL'
        }
    },
    isPublic: { type: Boolean, required: true, default: true },
    categories: [{ 
        type: String, 
        enum: ['Web3', 'AI/ML', 'Full Stack Development', 'Marketing', 'Designs'],
        required: true 
    }],
    difficulty: { 
        type: String, 
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        required: true 
    },
    isOriginal: { type: Boolean, required: true, default: true },
    forkedFrom: { type: String, ref: 'Course', required: false },
    forkedBy: { type: String, ref: 'User', required: false }
}, { timestamps: true });

courseSchema.index({ categories: 1 });  
courseSchema.index({ difficulty: 1 }); 
courseSchema.index({ isPublic: 1 });    
courseSchema.index({ creator_id: 1 });
courseSchema.index({ isOriginal: 1, forkedFrom: 1 }); 
courseSchema.index({ isPublic: 1, categories: 1 }); 

const Course = mongoose.models.Course || mongoose.model("Course", courseSchema);

export default Course;