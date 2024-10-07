const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const multer = require('multer');
const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

router.post('/submit_signup', async (req, res) => {
  const { fullname, email, password, city } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ fullname, email, password: hashedPassword, city });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/submit_login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    req.session.userId = user._id;
    res.json({ message: 'Login successful', user, redirectUrl: '/user_profile/User.html' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/getLoggedInUser', async (req, res) => {
  const userId = req.session.userId;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/updateUser', upload.single('photo'), async (req, res) => {
  const userId = req.session.userId;
  const { fullname, city } = req.body;
  const photo = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.fullname = fullname;
    user.city = city;
    if (photo) {
      user.photo = photo;
    }

    await user.save();
    res.json({ message: 'User updated successfully', photo: user.photo });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
