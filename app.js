const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

app.use(cors());
require('dotenv').config();
mongoose.connect(process.env.MONGOURI)
.then(() => {
  console.log('Connected to MongoDB');
})
.catch(err => {
  console.error('Error connecting to MongoDB', err);
});

require('./models/user');
require('./models/post');

app.use(express.json());
app.use(require('./routes/auth'));
app.use(require('./routes/post'));
app.use(require('./routes/user'));



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
