import express from "express";
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";
import env from "dotenv";

const PORT = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const saltRounds = 10;

env.config();

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public/')));


app.use(
  session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
   cookie: {
     maxAge: 1000 * 60 * 10,
   }// THIS CODE ALLOWS FOR A 10 MINUTE SESSION DURATION
})
);


let savedDate = '';

app.use(express.static('public'));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));



app.get("/", (req, res) => {
    res.render("views/PoetrySub.ejs");
});

app.get("/login", (req, res) => {
    res.render("PS_login.ejs");
});

app.get("/register", (req, res) => {
    res.render("PS_register.ejs");
});

app.get("/HowitWorks", (req, res) => {
    res.render("PS_HowitWorks.ejs");
});

app.get("/payment", (req, res) => {
    res.render("PS_payment.ejs");
});

app.get("/account", (req, res) => {
    res.render("PS_account.ejs", { savedDate: savedDate });
});

app.get("/account-options", (req, res) => {
    res.render("PS_account-options.ejs");
});

app.get("/changepassword", (req, res) => {
    res.render("PS_changepassword.ejs");
});

app.get("/forgot-password", (req, res) => {
    res.render("PS_forgotpassword.ejs");
});




app.post('/save-date', (req, res) => {
  const { date } = req.body;
  console.log('Received date:', date);
  // Save to DB or session here
  res.status(200).send({ message: 'Date saved successfully' });
});



app.post("/login", passport.authenticate("local", {
  successRedirect: "/account",
  failureRedirect: "/login",
})
);

app.post('/account', (req, res) => {
  const newText = req.body.newText;
  // Save to DB or file here
  console.log('Updated text:', newText);
  res.sendStatus(200);
});

app.post('/account', (req, res) => {
  savedDate = req.body.date;
  console.log('Date saved:', savedDate);
  res.sendStatus(200);
});

//MAKE SURE THIS WORKS AND DOESNT COLLIDE OR INTERFERE WITH OTHER POST REQUESTS INTO DATABASE
app.post("/account", async (req, res) => {
  const account_address = req.body['recipient-email'];
  const recipient_address = req.body['recipient-post'];
  const sub_type = req.body['sub_type'];

  try {
    await db.query("INSERT INTO addresses (receipient-email, recipientpost, sub_type) WHERE ($1, $2)",
      [account_address, recipient_address, sub_type]);
    res.redirect("/account");
  } catch (err) {
    console.log(err);
  }
});


//THIS NEEDS FIXING - ALLOW FOR LINKING EJS FILE ITEMS TO DATABASE ITEMS    
app.post("/account", async (req, res) => {
    const item = req.body.updatedItemTitle;

  try {
    await db.query("UPDATE items SET title = ($1) WHERE id = $2", [item, id]);
    res.redirect("/account");
  } catch (err) {
    console.log(err);
  }
});




app.post("/register", async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const firstname = req.body.firstname;
    const lastname = req.body.lastname; 

    const checkResult = await db.query("SELECT * FROM logins WHERE email = $1; ",[email]
    );

    if (checkResult.rows.length > 0) {
          req.redirect("/login");
        } else {
          //hashing the password and saving it in the database
          bcrypt.hash(password, saltRounds, async (err, hash) => {
            if (err) {
              console.error("Error hashing password:", err);
            } else {
              const result = await db.query(
                "INSERT INTO users (firstname, lastname, email, password) VALUES ($1, $2, $3, $4) RETURNING *",
                [firstname, lastname, email, hash]
              );
              const user = result.rows[0];
              req.login(user, (err) => {
                console.log("err");
                res.redirect("/account");
              });
            }
          });
        }
      } catch (err) {
        console.log(err);
      }
});





// app.post("/login", async (req, res) => {
//     const email = req.body.username;
//     const password = req.body.password;

//   const checkLogin = await db.query("SELECT * FROM logins WHERE email = $1",
//       [email]
//     );
//     const checkPassword = await db.query("SELECT * FROM logins WHERE password = $1",
//       [password]
//     );

//   try {
// if (checkLogin.rows.length == 0){
// res.send("This email does not exist. Try registering an account first");
// } 
// if (checkPassword.rows.length == 0) {
//   res.send("Password incorrect. Please try again");
// } else {
//   res.render("/PS_account");
//   console.log("User logged in successfully");
// }
//   } 
//   catch (err) {
//     console.log(err)
//   }
// });



passport.use(
  new Strategy(async function verify(email, password, cb) {
 try {
    const result = await db.query("SELECT * FROM logins WHERE email = $1 ", [
      email,
    ]);
    if (result.rows.length > 0) {

      const user = result.rows[0];
      const storedHashedPassword = user.password;

      bcrypt.compare(password, storedHashedPassword, (err, valid) => {
        if (err) {

          console.error("Error comparing passwords:", err);
          return cb(err);

        } else {

          if (valid) {
            return cb(null, user);
          } else {
            return cb(null, false);
          }

        }
      });
    } else {
      return cb("User not found");
    }
  } catch (err) {
    console.log(err);
  }
})
);



passport.serializeUser((user, cb) => {
cb(null, user);
});
passport.deserializeUser((user, cb) => {
  cb(null, user);
  });

app.listen(PORT, () => console.log(`Server running at localhost:${PORT}`));