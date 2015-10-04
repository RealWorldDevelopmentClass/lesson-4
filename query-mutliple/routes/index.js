var express = require('express');
var router = express.Router();

var monk = require("monk");
var db = monk("localhost:27017/nodeDBTest")
var ObjectId = require('mongodb').ObjectID;

var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;

var populate = require("monk-populate")
var Q = require('q');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', {title: 'Express'});
});


// CREAZIONE ACCOUNT
router.get('/addAccount', function (req, res, next) {
  res.render('addAccount');
});

router.post('/addAccount', function (req, res, next) {
  var user = req.body.user;
  var pass = req.body.pass;
  var AccountTBL = db.get("account");

  AccountTBL.insert({
    user: user,
    pass: pass
  }).success(function (doc) {
    res.jsonp(doc);
  })
});


//LOGIN

passport.serializeUser(function (user, done) {
  done(null, user._id);
});

passport.deserializeUser(function (id, done) {
  var AccountTBL = db.get("account");
  AccountTBL.findById(id, function (err, user) {
    done(err, user);
  });
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

passport.use(new LocalStrategy(
  function (username, password, done) {
    var AccountTBL = db.get("account");
    AccountTBL.findOne({user: username}, function (err, user) {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false);
      }
      if (!user.pass == password) {
        return done(null, false);
      }
      return done(null, user);
    });
  }
));

router.get('/login',
  function (req, res) {
    res.render('login');
  });

router.post('/login',
  passport.authenticate('local', {failureRedirect: '/login'}),
  function (req, res) {
    res.redirect('/logged');
  });


router.get('/logged', ensureAuthenticated,
  function (req, res) {
    res.render('logged', {'user': req.user});
  });

// POST

router.get('/post', ensureAuthenticated,
  function (req, res) {
    var PostTBL = db.get("post");
    var AccountTBL = db.get("account");

    var posts = Q.npost(PostTBL, "find", [{}]).then(function (a) {
      var deferred = Q.defer();

      var count = 0;
      a.forEach(function (t) {
        AccountTBL.findById(t.user)
          .success(function (doc) {
            t.user = doc;
            count++;
            if (count == a.length)
              deferred.resolve(a);
          })
      })
      return deferred.promise;
    })

    var nUsers = Q.npost(AccountTBL, "find", [{}]).then(function (a) {
      return a.length;
    });


    Q.all([posts,nUsers]).spread(function (posts, nUsers) {
      res.render('post', {'user': req.user, posts: posts, nUsers: nUsers});
    })

  });

router.post('/post', ensureAuthenticated,
  function (req, res, next) {
    var text = req.body.text;
    var PostTBL = db.get("post");

    PostTBL.insert({
      user: ObjectId(req.user._id),
      text: text
    }).success(function (doc) {
      res.redirect("post");
    })
  });


module.exports = router;

