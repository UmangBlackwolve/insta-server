const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = mongoose.model('User');
const requireLogin = require('../middleware/requireLogin');

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD
  }
});

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

    try {
      await transporter.sendMail({
        to: "umangl.blackwolve@gmail.com",
        from: process.env.EMAIL,
        subject: "Signup succeeded",
        html: "<h1>Welcome to Insta</h1>"
      });
      console.log("Email sent successfully");
    } catch (err) {
      console.error("Error sending email: ", err);
      return res.status(500).json({ error: "Failed to send email" });
    }

    res.json({ message: "Saved successfully" });
  } catch (err) {
    console.error("Error during signup:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post('/signin', requireLogin, async (req, res) => {
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
    console.error("Error during signin:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post('/reset-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(422).json({ error: "Please add email" });
  }

  try {
    const savedUser = await User.findOne({ email: email });
    if (!savedUser) {
      return res.status(422).json({ error: "User not found" });
    }

    const token = jwt.sign({ _id: savedUser._id }, process.env.JWT_SECRET);
    const link = `http://insta-clone-umang.vercel.app/reset/${token}`;
    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Reset Password",
      html: `<a href="${link}">Click here to reset your password</a>`
    });
    console.log("Email sent successfully");
    res.json({ message: "Password reset link sent to your email" });
  } catch (err) {
    console.error("Error during password reset:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post('/new-password', async (req, res) => {
  const { password } = req.body;
  const sentToken = req.body.token;
  if (!password) {
    return res.status(422).json({ error: "Please add all fields" });
  }
  try {
    const savedUser = await User.findOne({ _id: jwt.verify(sentToken, process.env.JWT_SECRET)._id });
    if (!savedUser) {
      return res.status(422).json({ error: "User not found" });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    savedUser.password = hashedPassword;
    await savedUser.save();
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Error during password update:", err);
    res.status(500).json({ error: "Server error" });
  }
});



module.exports = router;
