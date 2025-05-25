import mongoose from "mongoose";

const mcqQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: function(options: string[]) {
        return options.length > 0;
      },
      message: 'At least one option is required'
    }
  },
  correctOption: {
    type: Number,
    required: true,
    min: 0
  }
});

const assessmentSchema = new mongoose.Schema({
  module_id: {
    type: String,
    required: true,
    ref: 'Module'
  },
  course_id: {
    type: String,
    required: true,
    ref: 'Course'
  },
  type: {
    type: String,
    enum: ['mcq'],
    default: 'mcq'
  },
  questions: [mcqQuestionSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
assessmentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create indexes
assessmentSchema.index({ module_id: 1 });
assessmentSchema.index({ course_id: 1 });

const Assessment = mongoose.models.Assessment || mongoose.model('Assessment', assessmentSchema);

export default Assessment;