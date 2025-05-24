import mongoose from "mongoose";


const courseRankingSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
        unique: true,
    },
    creator_id : {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required : true,
    },
    course_id : {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Course',
        required : true,
    },
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