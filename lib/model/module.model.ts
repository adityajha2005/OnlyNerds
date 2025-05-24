import mongoose from "mongoose";


const moduleSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
        unique: true,
    },
    course_id : {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Course',
        required : true,
    },   
    index : {
        type: Number,
        required: true,
        default : 1        
    },
    name : {
        type: String,
        required: true,
    },
    content : {
        type: String,
        required: true,
    },
    media : [{
        type: String, 
        validate: {
            validator: function(v: string) {
                return /^(https?:\/\/)?.+\..+/.test(v);
            },
            message: 'Please enter a valid URL'
        }
    }], 
}, { 
    timestamps: true,
});


moduleSchema.index({ course_id: 1 });
moduleSchema.index({ course_id: 1, name: 1 });    

const Module = mongoose.models.Module || mongoose.model("Module", moduleSchema);

export default Module;