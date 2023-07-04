const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

const app = express();
const port = 3000;

const users = [
    { id: 1, username: 'admin', password: 'password' }
];

app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy((username, password, done) => {
    const user = users.find(u => u.username === username);
    if (!user || user.password !== password) {
        return done(null, false);
    }
    return done(null, user);
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    const user = users.find(u => u.id === id);
    done(null, user);
});

app.use(express.json());

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.get('/api/user/login', (req, res) => {
    res.render('login');
});

app.get('/api/user/signup', (req, res) => {
    res.render('signup');
});


app.get('/api/user/me', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('profile', { username: req.user.username });
    } else {
        res.redirect('/api/user/login');
    }
});



app.post('/api/user/login', passport.authenticate('local', { successRedirect: '/api/user/me' }));


app.post('/api/user/signup', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
        return res.status(409).json({ message: 'Username already exists' });
    }

    const newUser = { id: users.length + 1, username, password };
    users.push(newUser);

    req.login(newUser, (err) => {
        if (err) {
            return res.status(500).json({ message: 'Error logging in after registration' });
        }
        return res.redirect('/api/user/me');
    });
});

app.get('/api/user/logout', (req, res) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect('/api/user/login');
    }); 

});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
