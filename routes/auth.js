const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = mongoose.model('User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/keys');
const requireLogin = require('../middleware/requireLogin');

router.post('/signup', async (req, res) => {
  const { name, email, password, pic } = req.body;

  if (!name || !email || !password) {
    return res.status(422).json({ error: "Please add all fields" });
  }

  try {
    const savedUser = await User.findOne({ email: email });
    if (savedUser) {
      return res.status(422).json({ error: "User already exists with that email" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new User({
      email,
      password: hashedPassword,
      name,
      pic
    });

    await user.save();
    res.json({ message: "Saved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post('/signin', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(422).json({ error: "Please add email or password" });
  }

  try {
    const savedUser = await User.findOne({ email: email });
    if (!savedUser) {
      return res.status(422).json({ error: "Invalid email or password" });
    }

    const doMatch = await bcrypt.compare(password, savedUser.password);
    if (doMatch) {
      const token = jwt.sign({ _id: savedUser._id }, process.env.JWT_SECRET);
      const { _id, name, email, followers, following, pic } = savedUser;
      res.json({ token, user: { _id, name, email, followers, following, pic }, message: "Successfully signed in" });
    } else {
      res.status(422).json({ error: "Invalid email or password" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
