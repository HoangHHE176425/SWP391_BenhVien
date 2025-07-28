const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required:false 
  },
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },  email: { type: String, required: true }, // Email của người hỏi (có thể là của user hoặc người ngoài)

  status: { 
    type: String, 
    enum: ['pending', 'answered', 'closed'], 
    default: 'pending' 
  },
  reply: { 
    type: String, 
    default: '' 
  },
  repliedAt: { 
    type: Date 
  },
  isFaq: { // danh dau la cau hoi thuong gap
    type: Boolean,
    default: false
  }
}, { timestamps: true }); // createdAt, updatedAt

module.exports = mongoose.models.Question || mongoose.model('Question', questionSchema);
