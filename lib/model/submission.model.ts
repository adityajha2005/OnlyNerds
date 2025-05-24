import mongoose from "mongoose";


const submissionSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
        unique: true,
    },
    assessments_id : {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Module',
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
        }
    },
}, { 
    timestamps: true,
});



const Submission = mongoose.models.Submission || mongoose.model("Submission", submissionSchema);

export default Submission;