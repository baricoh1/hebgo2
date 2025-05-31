const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON request bodies

// Connect to MongoDB
mongoose.connect(
  'mongodb+srv://hebgoAdmin:HebGo1234%21@hebgo.ungpego.mongodb.net/hebrewGo?retryWrites=true&w=majority&appName=HebGo',
  {} 
);
// Confirm connection
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('✅ Connected to MongoDB'));

const userSchema = new mongoose.Schema({
  name:       { type: String, required: true, unique: true },
  password:   { type: String, required: true },
  gender:     { type: String, enum: ['male', 'female', 'other'], default: 'other' }, 
  progress:   {
    us:   { easy: [Number], medium: [Number], hard: [Number] },
    es:   { easy: [Number], medium: [Number], hard: [Number] },
    ru:   { easy: [Number], medium: [Number], hard: [Number] }
  }
});

const User = mongoose.model('User', userSchema);

// Registration endpoint
app.post('/api/register', async (req, res) => {
  const { username, password, progress, gender } = req.body; // 👈 gender נוסף כאן
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }
  try {
    if (await User.findOne({ name: username })) {
      return res.status(400).json({ error: 'User already exists.' });
    }

    const user = new User({ name: username, password, progress, gender }); // 👈 gender נוסף כאן
    await user.save();
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message });
  }
});




app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const user = await User.findOne({ name: username });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Optional: exclude password from response
    const { password: _, ...userWithoutPassword } = user.toObject();

    res.status(200).json({ message: 'Login successful', user: userWithoutPassword });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.get('/api/user/:name', async (req, res) => {
  try {
    const user = await User.findOne({ name: req.params.name });
    res.status(200).json(user || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/save', async (req, res) => {
  const { name, language, difficulty, progress } = req.body;

  if (!name || !language || !difficulty || !progress) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const user = await User.findOne({ name });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // ודא שקיים progress לפי השפה, ואם לא – צור אותו
    if (!user.progress[language]) {
      user.progress[language] = { easy: [], medium: [], hard: [] };
    }

    // עדכון ספציפי לפי השפה ורמת הקושי
    user.progress[language][difficulty] = progress[language][difficulty];

    await user.save();
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving user progress:', error);
    res.status(500).json({ error: 'Failed to save progress' });
  }
});



// Start server
app.listen(PORT, () => console.log(`🚀 Server is running at http://localhost:${PORT}`));
