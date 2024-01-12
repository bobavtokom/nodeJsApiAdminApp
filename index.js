
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');
const routes = require('./routes');
const app = express();
const port = 3000;

mongoose.connect('mongodb://localhost:27017/adminUsersPanel', { useNewUrlParser: true, useUnifiedTopology: true });

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
app.use('/', routes);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
