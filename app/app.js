var express = require('express'),
  passport = require('passport'),
  util = require('util'),
  FacebookStrategy = require('passport-facebook').Strategy,
  logger = require('morgan'),
  session = require('express-session'),
  bodyParser = require("body-parser"),
  cookieParser = require("cookie-parser"),
  methodOverride = require('method-override'),
  mongoose = require('mongoose');


var FACEBOOK_APP_ID = "857296724350566"
var FACEBOOK_APP_SECRET = "df18b7d10a316d49a7e8db46d51c37b4";

// conectando o db
mongoose.connect('mongodb://root:root@ds063899.mongolab.com:63899/nejs2015');
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'db connetion error:'));
db.once('open', function(cb) {
  console.log('db connetion open')
});

// construtor esquema do mongoose
var Schema = mongoose.Schema;

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});


// Use the FacebookStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Facebook
//   profile), and invoke a callback with a user object.
passport.use(new FacebookStrategy({
    clientID: FACEBOOK_APP_ID,
    clientSecret: FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function() {
      // console.log(profile)
      return done(null, profile);
    });
  }
));

var app = express();

// configure Express
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(cookieParser());
app.use(bodyParser());
app.use(methodOverride());
app.use(session({
  secret: 'keyboard cat'
}));
// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/public'));


app.get('/', function(req, res) {
  res.redirect('/home');
});

app.get('/account', ensureAuthenticated, function(req, res) {
  res.render('account', {
    user: req.user
  });
});

app.get('/login', function(req, res) {
  res.render('login', {
    user: req.user
  });
});

app.get('/home', ensureAuthenticated,function(req, res) {

  Disciplina.find(function(err, doc) {
    res.render('layout', {
      user: req.user,
      disciplinas: doc
    });
  });

});

// GET /auth/facebook
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Facebook authentication will involve
//   redirecting the user to facebook.com.  After authorization, Facebook will
//   redirect the user back to this application at /auth/facebook/callback
app.get('/auth/facebook',
  passport.authenticate('facebook'),
  function(req, res) {
    // The request will be redirected to Facebook for authentication, so this
    // function will not be called.
  });

// GET /auth/facebook/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/facebook/callback',
  passport.authenticate('facebook', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    res.redirect('/home');
  });

app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

// esquema de documento da disciplina
// var disciplinaSchema = new Schema({ titulo: String });
var disciplinaSchema = new Schema({
  titulo: String,
  userId: String,
  dias: [{
    dia: String,
    horaInicial: String,
    horaFinal: String
  }],
  materias: {
    materia: String,
    dataInicial: String,
    dataFinal: String,
    status: Boolean
  }
});
// construtor do modelo de documento da Disciplina
var Disciplina = mongoose.model('Disciplina', disciplinaSchema);

app.get('/disciplina', ensureAuthenticated, function(req, res) {
  Disciplina.find(function(err, doc) {
    res.json(doc);
    // res.render('disciplina', {
    //   disciplinas: doc
    // });
  });
});

app.get('/disciplina/new', ensureAuthenticated, function(req, res) {
  res.render('create');
});

app.get('/disciplina/edit', ensureAuthenticated, function(req, res) {
  Disciplina.findById({
    _id: req.query.id
  }, function(err, doc) {
    if (err) return;
    res.render('disciplina_edit', doc);
  });
});

app.post('/disciplina/add', ensureAuthenticated, function(req, res) {
  console.log(req.param('horaFinal'));
  dias = [];
  if(req.param('segunda')){
    dias.push({
      dia: 'segunda',
      horaInicial: req.param('horaInicial'),
      horaFinal: req.param('horaFinal')
    })
  }
  if(req.param('terca')){
    dias.push({
      dia: 'terça',
      horaInicial: req.param('horaInicial'),
      horaFinal: req.param('horaFinal')
    })
  }
  if(req.param('quarta')){
    dias.push({
      dia: 'quarta',
      horaInicial: req.param('horaInicial'),
      horaFinal: req.param('horaFinal')
    })
  }
  if(req.param('quinta')){
    dias.push({
      dia: 'quinta',
      horaInicial: req.param('horaInicial'),
      horaFinal: req.param('horaFinal')
    })
  }
  if(req.param('sexta')){
    dias.push({
      dia: req.param('sexta'),
      horaInicial: req.param('horaInicial'),
      horaFinal: req.param('horaFinal')
    })
  }
  if(req.param('sabado')){
    dias.push({
      dia: 'sabado',
      horaInicial: req.param('horaInicial'),
      horaFinal: req.param('horaFinal')
    })
  }
  if(req.param('domingo')){
    dias.push({
      dia: 'domingo',
      horaInicial: req.param('horaInicial'),
      horaFinal: req.param('horaFinal')
    })
  }

  var disciplina = new Disciplina({
    titulo: req.param('disciplina'),
    userId: req.user.id,
    dias: dias,
  });

  disciplina.save(function(err) {
    if (err) return res.json({
      info: 'erro ao salvar disciplina!'
    });;
    res.json({
      info: 'disciplina salva com sucesso!'
    });
  });
});

app.get('/disciplina/remove', ensureAuthenticated, function(req, res) {
  Disciplina.findByIdAndRemove(req.query.id, function(err) {
    if (err) return res.json({
      info: 'erro ao remover disciplina!'
    });;
    res.json({
      info: 'disciplina removida com sucesso!'
    });
  });
});

app.get('/disciplina/update', ensureAuthenticated, function(req, res) {
  Disciplina.findByIdAndUpdate(req.query.id, {
    titulo: req.query.titulo
  }, function(err) {
    if (err) return res.json({
      info: 'erro ao atualizar disciplina!'
    });;
    res.json({
      info: 'disciplina atualizada com sucesso!'
    });
  });
});

app.get('/disciplina/view', ensureAuthenticated, function(req, res) {
  Disciplina.findById({
    _id: req.query.id
  }, function(err, doc) {
    if (err) res.json({
      info: 'erro ao visualizar disciplina!'
    });;
    res.json(doc);
  });
});

// Materias
// esquema de documento da disciplina
// construtor do modelo de documento da Disciplina
// var Disciplina = mongoose.model('Disciplina', disciplinaSchema);

app.listen(3000);


// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login')
}
