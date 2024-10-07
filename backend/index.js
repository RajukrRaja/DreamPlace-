const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 3000;
const UPLOADS_DIR = 'uploads';
const JWT_SECRET = 'your_jwt_secret_key'; // Replace with your own secret key

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(cookieParser());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/Dreamplace', { useNewUrlParser: true, useUnifiedTopology: true });

// Check MongoDB connection
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// Define the schema and model
const userSchema = new mongoose.Schema({
    fullname: String,
    email: { type: String, unique: true },
    password: String,
    city: String,
    photo: String,
});

const User = mongoose.model('User', userSchema, 'register');

// Create uploads directory if not exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Serve static files
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, UPLOADS_DIR)));

// POST route for user signup
app.post('/submit_signup', async (req, res) => {
    const { fullname, email, password, city } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ fullname, email, password: hashedPassword, city });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error('Error saving user data:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login route with JWT token
app.post('/submit_login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user) {
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (passwordMatch) {
                const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '1h' });
                res.cookie('token', token, { httpOnly: true });
                return res.status(200).json({ 
                    message: 'Login successful', 
                    user: {
                        fullname: user.fullname,
                        email: user.email,
                        city: user.city,
                        photo: user.photo
                    },
                    redirectUrl: 'http://127.0.0.1:5500/frontend/component/User/User.html'
                });
            } else {
                return res.status(401).json({ error: 'Invalid email or password' });
            }
        } else {
            return res.status(404).json({ error: 'User not found' });
        }
    } catch (err) {
        console.error('Internal server error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Middleware to authenticate using JWT
const authenticate = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        req.email = decoded.email;
        next();
    });
};

// Endpoint to get user profile data
app.get('/getLoggedInUser', authenticate, async (req, res) => {
    const email = req.email;
    try {
        const user = await User.findOne({ email });
        if (user) {
            res.status(200).json({ 
                fullname: user.fullname,
                email: user.email,
                city: user.city,
                photo: user.photo
            });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (err) {
        console.error('Internal server error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Endpoint to update profile data
app.post('/update_profile', authenticate, upload.single('photo'), async (req, res) => {
    const { fullname, city } = req.body;
    const email = req.email;
    const updateData = { fullname, city };
    if (req.file) {
        updateData.photo = `/uploads/${req.file.filename}`;
    }
    try {
        const updatedUser = await User.findOneAndUpdate({ email }, updateData, { new: true });
        if (updatedUser) {
            res.status(200).json({ 
                fullname: updatedUser.fullname,
                email: updatedUser.email,
                city: updatedUser.city,
                photo: updatedUser.photo
            });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (err) {
        console.error('Internal server error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Serve static HTML files
app.use(express.static(path.join(__dirname, 'public')));

// Serve the signup form
app.get('/signup', (req, res) => {
    res.sendFile('signup.html', { root: path.join(__dirname, 'public', 'signup') });
});

// Serve the login form
app.get('/login', (req, res) => {
    res.sendFile('login.html', { root: path.join(__dirname, 'public', 'login') });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
