const express = require("express");
const bcrypt = require("bcrypt-nodejs");
const cors = require("cors");
const knex = require("knex");

const db = knex({
  client: "pg",
  connection: {
    host: "127.0.0.1",
    user: "Ostrowski",
    password: "",
    database: "facerec",
  },
});

db.select("*")
  .from("users")
  .then((data) => {
    console.log(data)
  });

const app = express();
app.use(cors());

app.use(express.json());


app.get("/", (req, res) => {
  res.send(database.users);
});

app.get("/profile/:id", (req, res) => {
  const { id } = req.params;
  db.select("*")
    .from("users")
    .where({ id })
    .then((user) => {
      if (user.length) {
        res.json(user[0]);
      } else {
        res.status(400).json("error getting user");
      }
    });
});

app.post("/signin", (req, res) => {
  db.select("email", "hash")
    .from("login")
    .where("email", "=", req.body.email)
    .then((data) => {

      const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
      if (isValid){
       return db.select('*').from('users')
        .where("email", "=", req.body.email)
        .then(user=>{

          res.json(user[0])

        })
        .catch(err=>res.status(400).json('unable to fetch user'))
      }else{
        res.status(400).json('wrong credentials')
      }
    })
    .catch(err=>res.status(400).json('wrong credentials'))
});

app.post("/register", (req, res) => {
  const { email, name, password } = req.body;
  if(!email || !name||!password){
    return res.status(400).json('incorrect submission')
  }
  const hash = bcrypt.hashSync(password);

  db.transaction((trx) => {
    trx
      .insert({ hash, email })
      .into("login")
      .returning("email")
      .then((loginEmail) => {
        return trx("users")
          .returning("*")
          .insert({ email: loginEmail[0], name, joined: new Date() })
          .then((user) => {
            res.json(user[user.length - 1]);
          })
          .then(trx.commit);
      })
      .catch(trx.rollback);
  }).catch((err) => res.status(400).json("Unable to register"));
});

app.put("/image", (req, res) => {
  const { id } = req.body;
  db("users")
    .where("id", "=", id)
    .increment("entries", 1)
    .returning("entries")
    .then((entries) => {
      res.json(entries[0]);
    })
    .catch(() => res.status(400).json("unable to fetch entries"));
});

app.listen(process.env.PORT || 3000, () => {
});
