const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const requireLogin = require('../middleware/requireLogin');
const Post = mongoose.model('Post');

router.get('/allposts', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("postedBy", "_id name")
      .populate("comments.postedBy", "_id name")
      .sort('-createdAt')
    res.json({ posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve posts" });
  }
});

router.get('/getsubpost', requireLogin, async (req, res) => {
  try {
    const posts = await Post.find({ postedBy: { $in: req.user.following } })
      .populate("postedBy", "_id name")
      .populate("comments.postedBy", "_id name")
      .sort('-createdAt');
    res.json({ posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve subscribed posts" });
  }
});

router.post('/createpost', requireLogin, async (req, res) => {
  const { title, body, pic } = req.body;
  if (!title || !body || !pic) {
    return res.status(422).json({ error: "Please add all fields" });
  }

  try {
    req.user.password = undefined;
    const post = new Post({
      title,
      body,
      pic,
      postedBy: req.user
    });
    const result = await post.save();
    res.json({ post: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create post" });
  }
});

router.get('/mypost', requireLogin, async (req, res) => {
  try {
    const mypost = await Post.find({ postedBy: req.user._id })
      .populate("postedBy", "_id name");
    res.json({ mypost });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve your posts" });
  }
});

router.put('/like', requireLogin, async (req, res) => {
  try {
    const result = await Post.findByIdAndUpdate(
      req.body.postId,
      { $push: { likes: req.user._id } },
      { new: true }
    );
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(422).json({ error: err });
  }
});

router.put('/unlike', requireLogin, async (req, res) => {
  try {
    const result = await Post.findByIdAndUpdate(
      req.body.postId,
      { $pull: { likes: req.user._id } },
      { new: true }
    );
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(422).json({ error: err });
  }
});

router.put('/comment', requireLogin, async (req, res) => {
  const comment = {
    text: req.body.text,
    postedBy: req.user._id
  };

  try {
    const result = await Post.findByIdAndUpdate(
      req.body.postId,
      { $push: { comments: comment } },
      { new: true }
    )
      .populate("comments.postedBy", "_id name")
      .populate("postedBy", "_id name");
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(422).json({ error: err });
  }
});

router.delete('/deletepost/:postId', requireLogin, async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.postId })
      .populate("postedBy", "_id");
    
    if (!post) {
      return res.status(422).json({ error: "Post not found" });
    }
    
    if (post.postedBy._id.toString() === req.user._id.toString()) {
      await Post.deleteOne({ _id: req.params.postId });
      res.json({ message: "Post deleted successfully" });
    } else {
      res.status(403).json({ error: "Unauthorized action" }); 
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete post" });
  }
});

module.exports = router;
