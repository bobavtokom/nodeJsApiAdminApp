
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');
const app = express();
const port = 3000;
// Import the functions you need from the SDKs you need







mongoose.connect('mongodb://localhost:27017/adminUsersPanel', { useNewUrlParser: true, useUnifiedTopology: true });

const User = mongoose.model('User', new mongoose.Schema({
  username: String,
  password: String,
}));

const mongoUri = 'mongodb://localhost:27017'; // r MongoDB connection string
const dbName = 'adminUsersPanel'; // Replace with your database name

async function connectToDatabase() {
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('Connected to the database');
    return client.db(dbName);
  } catch (error) {
    console.error('Error connecting to the database:', error);
    throw error;
  }
}

app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await User.findOne({ username });
    
    if (!user) {
      return done(null, false, { message: 'Incorrect username.' });
    }
    
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (passwordMatch) {
      return done(null, user);
    } else {
      return done(null, false, { message: 'Incorrect password.' });
    }
  } catch (error) {
    return done(error);
  }
}));




passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

app.use(session({ secret: 'arsenal0000', resave: true, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.post('/sendNotification', async (req, res) => {
  const { token, title, body } = req.body;

  const message = {
    token,
    notification: {
      title,
      body,
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Notification sent:', response);
    res.send('Notification sent successfully');
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/', (req, res) => {
  res.redirect('/newUser');
});

app.get('/adminSignIn', (req, res) => {
  res.render('adminSignIn');
});

app.post('/adminSignIn', passport.authenticate('local', {
  successRedirect: '/newUser',
  failureRedirect: '/adminSignIn',
}));
app.get('/addAdmin',(req,res)=>{
  res.render('addAdmin');
})
app.post('/addAdminUser', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const existingUser = await User.findOne({ username });
    if (!existingUser) {
      const adminUser = new User({ username, password: hashedPassword });
      await adminUser.save();
      res.send('Admin user added successfully.');
    } else {
      res.send('Admin user already exists.');
    }
  } catch (error) {
    console.error('Error adding admin user:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/newUser', isAuthenticated, (req, res) => {
  const user =  req.user;
  res.render('newUser', {user});
});

app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/adminSignIn');
  });
});



// ... (previous code)

app.get('/allUsers', isAuthenticated, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const collection = db.collection('users');
    const users = await collection.find().toArray();

    res.render('allUsers', { users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/submit', async (req, res) => {
  const { number, email, vip, standard } = req.body;

  try {
    const db = await connectToDatabase();
    const collection = db.collection('users');

    // Insert the submitted data into the MongoDB collection
    await collection.insertOne({ number, email, vip, standard });

    // Redirect to the allUsers page after form submission
    res.redirect('/allUsers');
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).send('Internal Server Error');
  }
});

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/adminSignIn');
}

app.delete('/deleteUser/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    const db = await connectToDatabase();
    const collection = db.collection('users');

    // Use ObjectId directly (without new)
    const ObjectId = require('mongodb').ObjectId;
    const objectId = new ObjectId(userId);

    // Delete the user based on the provided user ID
    const result = await collection.deleteOne({ _id: objectId });

    if (result.deletedCount === 1) {
      res.json({ success: true });
    } else {
      res.json({ success: false, error: 'User not found or already deleted' });
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});
app.get('/editUser/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    const db = await connectToDatabase();
    const collection = db.collection('users');

    // Use ObjectId directly (without new)
    const ObjectId = require('mongodb').ObjectId;
    const objectId = new ObjectId(userId);

    // Find the user based on the provided user ID
    const user = await collection.findOne({ _id: objectId });

    if (user) {
      res.render('editUser', { user });
    } else {
      res.status(404).send('User not found');
    }
  } catch (error) {
    console.error('Error retrieving user data:', error);
    res.status(500).send('Internal Server Error');
  }
});
 
app.post('/updateUser/:id', async (req, res) => {
  const userId = req.params.id;
  const updatedUserData = req.body;

  try {
    const db = await connectToDatabase();
    const collection = db.collection('users');

    // Use ObjectId directly (without new)
    const ObjectId = require('mongodb').ObjectId;
    const objectId = new ObjectId(userId);

    // Update the user based on the provided user ID
    const result = await collection.updateOne({ _id: objectId }, { $set: updatedUserData });

    if (result.modifiedCount === 1) {
      res.redirect('/allUsers'); // Redirect to the user list or another page
    } else {
      res.status(404).send('User not found or not updated');
    }
  } catch (error) {
    console.error('Error updating user data:', error);
    res.status(500).send('Internal Server Error');
  }
});





app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
