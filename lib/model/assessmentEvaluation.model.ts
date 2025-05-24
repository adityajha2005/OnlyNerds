import mongoose from "mongoose";


const assessmentEvalutationSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
        unique: true,
    },
    assesment_id : {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Asessment',
        required : true,
    },
    answers : [{
        type: String,
        required: false,
    }],
    testcases : [{
        values : String,
        required : false,
    }],
}, { 
    timestamps: true,
});



const AsessmentEvaluation = mongoose.models.AsessmentEvaluation || mongoose.model("AsessmentEvaluation", assessmentEvalutationSchema);

export default AsessmentEvaluation;