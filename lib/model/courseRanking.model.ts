import mongoose from "mongoose";


const courseRankingSchema = new mongoose.Schema({
    creator_id : {
        type: String,
        required : true,
    },
    course_id: { type: String, ref: 'Course', required: true }, 
    upvotes : {
        type : Number,
        required : true,
        default : 0,
    },
    downvotes : {
        type : Number,
        required : true,
        default : 0,
    },
    eloScore : {
        type : Number,
        required : true,
        default : 0,
    }
}, { 
    timestamps: true,
});



const CourseRanking = mongoose.models.CourseRanking || mongoose.model("CourseRanking", courseRankingSchema);

export default CourseRanking;