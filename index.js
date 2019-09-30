const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const bcrypt = require("bcryptjs");

const db = require('./database/dbConfig.js');
const Users = require('./users/users-model.js');

const server = express();

server.use(helmet());
server.use(express.json());
server.use(cors());

server.get('/', (req, res) => {
  res.send("It's alive!");
});

server.post('/api/register', (req, res) => {
  let user = req.body;
  const hash = bcrypt.hashSync(user.password, 14);
  user.password = hash;

  db("users").insert(user).then(result => {
    console.log('result is: ', result);
    res.status(201).json(user);
  }).catch(err => {
    res.status(500).json(err);
  })
});

server.post('/api/login', (req, res) => {
  const credentials = req.body;
  db("users").where({username: credentials.username}).first().then(user => {
    if (user && bcrypt.compareSync(credentials.password, user.password)) {
      res.status(200).json({ message: `Welcome ${user.username}!` });
    }
    else {
      res.status(401).json({ message: 'Invalid Credentials' });
    }
  }).catch(error => {
    res.status(500).json(error);
  });
});

server.get('/api/users', (req, res) => {
  Users.find()
    .then(users => {
      res.json(users);
    })
    .catch(err => res.send(err));
});

const port = process.env.PORT || 5000;
server.listen(port, () => console.log(`\n** Running on port ${port} **\n`));
