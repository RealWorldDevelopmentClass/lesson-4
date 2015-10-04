var express = require('express');
var router = express.Router();

var monk = require('monk');
var db = monk("localhost:27017/socialTest");

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var Q = require('q');

/* GET home page. */
router.get('/', function (req, res) {
  res.render('index', {title: 'Exprasdasdasess', user: req.user});
});

// ########## SIGNUP #############

router.get('/signup', function (req, res) {
  res.render('signup');
});

router.post('/signup', function (req, res) {
  var user = req.body.user;
  var password = req.body.password;


  var Users = db.get('Users');
  Q.ninvoke(Users, "insert", {
    "user": user,
    "password": password
  })
    .then(function (doc) {
      res.jsonp(doc);
    });


});

// ########## VISUALIZZA LISTA USER #############

router.get('/visualizzaUsers', function (req, res) {
  var Users = db.get('Users');

  Q.ninvoke(Users, "find", {})
    .fail(function (err) {
    })
    .then(function (docs) {
      res.render('visualizzaUsers', {users: docs});
    })
})
;


// ######## LOGIN #########

// alla fine della richiesta viene chiamato serializeUser
passport.serializeUser(function (user, done) {
  done(null, user._id);
});

passport.deserializeUser(function (id, done) {
  var Users = db.get('Users');
  Q.ninvoke(Users, "findById", id)
    .fail(function (err) {
      done(err, null);
    })
    .then(function (doc) {
      done(null, doc);
    });

});

passport.use(new LocalStrategy(
  function (username, password, done) {
    var Users = db.get('Users');

    Q.ninvoke(Users, "findOne", {user: username})
      .fail(function (err) {
        // se c'è stato un errore: es di connessione
        if (err) {
          return done(err);
        }
      })
      .then(function (user) {
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

router.get('/posts', ensureAuthenticated, function (req, res) {
  var Posts = db.get('posts');
  var Users = db.get('Users');


  var userList = Q.ninvoke(Users, "find", {});
  var registeredUserList = Q.ninvoke(Users, "find", {})
    .then(function (docs) {
      // il return è il parametro del prossimo then o spread
      return docs.length;
    }).then(function (numeroElementi) {
      return numeroElementi;
    });
  var postList = Q.ninvoke(Posts, "find", {});

  Q.all([userList, postList, registeredUserList]).spread(
    function (users, posts, nUsers) {
      res.render('postsAndUsers', {posts: posts, users: users, nUsers: nUsers});
    });
});

router.post('/writePost', function (req, res) {
  var Posts = db.get('posts');
  var text = req.body.text;
  var user = req.user.user;
  Q.ninvoke(Posts, "insert", {
    user: user,
    text: text
  }).then(function () {
    res.redirect('/posts');
  });
});

module.exports = router;
