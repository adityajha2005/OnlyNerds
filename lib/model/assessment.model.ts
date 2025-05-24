import mongoose from "mongoose";


const assessmentSchema = new mongoose.Schema({
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
    module_id : {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Module',
        required : true,
    },
    type : {
        type: String,
        enum: ["mcq","code","project"],
        required: true,
    },
    questions : [{
        type: String,
        required: true,
    }],
}, { 
    timestamps: true,
});



const Asessment = mongoose.models.Asessment || mongoose.model("Asessment", assessmentSchema);

export default Asessment;