const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = mongoose.model('User');
const Post = mongoose.model('Post');
const requireLogin = require('../middleware/requireLogin');

// Get User Profile
router.get('/user/:id', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const posts = await Post.find({ postedBy: req.params.id })
      .populate("postedBy", "_id name");

    res.json({ user, posts });
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ error: "Failed to retrieve user profile" });
  }
});

// Follow User
router.put('/follow', requireLogin, async (req, res) => {
  try {
    const followUser = await User.findByIdAndUpdate(
      req.body.followId,
      { $push: { followers: req.user._id } },
      { new: true }
    );

    if (!followUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const currentUser = await User.findByIdAndUpdate(
      req.user._id,
      { $push: { following: req.body.followId } },
      { new: true }
    ).select("-password");

    res.json(currentUser);
  } catch (err) {
    console.error('Error in follow route:', err);
    res.status(500).json({ error: "Failed to follow user" });
  }
});

// Unfollow User
router.put('/unfollow', requireLogin, async (req, res) => {
  try {
    const unfollowUser = await User.findByIdAndUpdate(
      req.body.unfollowId,
      { $pull: { followers: req.user._id } },
      { new: true }
    );

    if (!unfollowUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const currentUser = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { following: req.body.unfollowId } },
      { new: true }
    ).select("-password");

    res.json(currentUser);
  } catch (err) {
    console.error('Error in unfollow route:', err);
    res.status(500).json({ error: "Failed to unfollow user" });
  }
});

// Update Profile Picture
router.put('/updatepic', requireLogin, async (req, res) => {
  try {
    const result = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { pic: req.body.pic } },
      { new: true }
    );

    res.json(result);
  } catch (err) {
    console.error('Error updating profile picture:', err);
    res.status(500).json({ error: "Failed to update profile picture" });
  }
});

module.exports = router;
