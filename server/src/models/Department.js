const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  mapLink: {
    type: String,
    default: ''
  }
}, { _id: false });

const departmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'عنوان القسم مطلوب'],
    trim: true
  },
  cities: {
    type: [citySchema],
    validate: {
      validator: function(v) {
        return v.length <= 3;
      },
      message: 'لا يمكن إضافة أكثر من 3 مدن'
    }
  },
  requirements: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Department', departmentSchema);
