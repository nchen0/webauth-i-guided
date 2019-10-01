const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const server = express();
const secret = "it's spicy";
const jwt = require("jsonwebtoken");

const db = require("./database/dbConfig.js");
const Users = require("./users/users-model.js");

const sessionConfig = {
  name: "Nicky Authorization Cookie",
  secret: "you are protected",
  cookie: {
    maxAge: 1000 * 60 * 60,
    secure: false,
    httpOnly: true
  },
  resave: false,
  saveUninitialized: false
};

server.use(helmet());
server.use(express.json());
server.use(cors());
server.use(session(sessionConfig));

server.get("/", (req, res) => {
  res.send("It's alive!");
});

server.post("/api/register", (req, res) => {
  let user = req.body;
  const hash = bcrypt.hashSync(user.password, 14);
  user.password = hash;

  db("users")
    .insert(user)
    .then(result => {
      res.status(201).json(user);
    })
    .catch(err => {
      res.status(500).json(err);
    });
});

server.post("/api/login", (req, res) => {
  const credentials = req.body;
  db("users")
    .where({ username: credentials.username })
    .first()
    .then(user => {
      if (user && bcrypt.compareSync(credentials.password, user.password)) {
        const token = generateToken(user);
        res.status(200).json(token);
      } else {
        res.status(401).json({ message: "Invalid Credentials" });
      }
    })
    .catch(error => {
      res.status(500).json(error);
    });
});

server.post("/api/logout", (req, res) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        res.send("Error logging out");
      } else {
        res.send("Logged out");
      }
    });
  }
});

// Restricted Route
server.get("/api/users", protected, (req, res) => {
  Users.find()
    .then(users => {
      res.json(users);
    })
    .catch(err => res.send(err));
});

const port = process.env.PORT || 5000;
server.listen(port, () => console.log(`\n** Running on port ${port} **\n`));

// To restrict routes:
function protected(req, res, next) {
  const token = req.headers.authorization;
  if (token) {
    jwt.verify(token, secret, function(err, decodedToken) {
      if (err) {
        return res.status(401).json({ error: "Invalid token" });
      }
      next();
    });
  } else {
    return res.status(401).json("You are not permitted");
  }
}

// Generate JWT Token
function generateToken(user) {
  const payload = {
    username: user.username,
    password: user.password
  };
  const options = {
    expiresIn: "2h"
  };
  return jwt.sign(payload, secret, options);
}
