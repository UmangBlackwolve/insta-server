const mongoose = require('mongoose')
const { ObjectId } = mongoose.Schema.Types
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  pic: {
    type: String,
    default: "https://cdn.iconscout.com/icon/free/png-256/avatar-372-456332.png"
  },
  followers: [
    {
      type: ObjectId,
      ref: 'User'
    }
  ],
  following: [
    {
      type: ObjectId,
      ref: 'User'
    }
  ]
})

mongoose.model('User', userSchema)