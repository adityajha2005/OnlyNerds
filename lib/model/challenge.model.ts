import mongoose from "mongoose";


const challengeSchema = new mongoose.Schema({
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
    name : {
        type: String,
        required: true,
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
    reward : {
        type : Number,
        required : true,
    }
}, { 
    timestamps: true,
});



const Challenge = mongoose.models.Challenge || mongoose.model("Challenge", challengeSchema);

export default Challenge;