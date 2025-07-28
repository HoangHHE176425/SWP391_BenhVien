const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
  RoleID: {
    type: Number,
    required: true,
    unique: true,
  },
  RoleName: {
    type: String,
    required: true,
  },
  Description: {
    type: String,
  },
}, {
  collection: 'roles',
  versionKey: false,
});

module.exports = mongoose.model('Role', RoleSchema);
