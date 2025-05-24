import mongoose from "mongoose";


const submissionSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
        unique: true,
    },
    assessments_id : {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Asessment',
    },
    challenge_id : {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Challenge',
    },
    submitted_by : {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required : true,
    },
    type : {
        type: String,
        enum : ["project", "challenge"],
        required: true,
    },
    projectSubmission : {
        type: String, 
        validate: {
            validator: function(v: string) {
                return /^(https?:\/\/)?.+\..+/.test(v);
            },
            message: 'Please enter a valid URL'
        },
        required : false,
    },
    status : {
        type: String,
        enum : ["pending", "accepted","rejected"],
        required: true,
    },
    feedback : {
        type: String,
        required: false,
    }
}, { 
    timestamps: true,
});



const Submission = mongoose.models.Submission || mongoose.model("Submission", submissionSchema);

export default Submission;