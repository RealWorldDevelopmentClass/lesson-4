var express = require('express');
var router = express.Router();

var monk = require('monk');
var db = monk("localhost:27017/socialTest");

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', {title: 'Express', user: req.user});
});

// ########## SIGNUP #############

router.get('/signup', function (req, res, next) {
  res.render('signup');
});

router.post('/signup', function (req, res, next) {
  var user = req.body.user;
  var password = req.body.password;


  var Users = db.get('Users');
  Users.insert({
    "user": user,
    "password": password
  }, function (err, doc) {
    res.jsonp(doc);
  });


});

// ########## VISUALIZZA LISTA USER #############

router.get('/visualizzaUsers', function (req, res, next) {
  var Users = db.get('Users');

  Users.find({}, function (err, docs) {
    res.render('visualizzaUsers', {users: docs});
  })
});


// ######## LOGIN #########

// alla fine della richiesta viene chiamato serializeUser
passport.serializeUser(function (user, done) {
  done(null, user._id);
});

passport.deserializeUser(function (id, done) {
  var Users = db.get('Users');
  Users.findById(id, function (err, doc) {
    done(err, doc);
  })

});

passport.use(new LocalStrategy(
  function (username, password, done) {
    var Users = db.get('Users');

    Users.findOne({user: username}, function (err, user) {
      // se c'è stato un errore: es di connessione
      if (err) {
        return done(err);
      }
      // se user == null -> non ha trovato uno user con questo username
      if (!user) {
        return done(null, false);
      }
      // torna errore perché la password non corrisponde
      if (!(user.password == password)) {
        return done(null, false);
      }
      // sennò tutto è andato bene -> account valido
      return done(null, user);
    });
  }
));


function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

router.get('/login', function (req, res) {
  res.render('login');
});


router.post('/login',
  passport.authenticate('local', {failureRedirect: '/login'}),
  function (req, res) {
    res.redirect('/logged');
  });


router.get('/logged', ensureAuthenticated, function (req, res) {
  res.render('logged', {title: 'Express', user: req.user});
});

// ######## POST #########

router.get('/posts',ensureAuthenticated, function (req,res) {
  var Posts = db.get('posts');
  Posts.find({}, function (err, docs) {
    res.render('posts', {posts: docs});
  });
});

router.post('/writePost', function (req, res, next) {
  var Posts = db.get('posts');
  var text = req.body.text;
  var user = req.user.user;
  Posts.insert({
    user: user,
    text: text
  }, function () {
    res.redirect('/posts');
  })
});

module.exports = router;
