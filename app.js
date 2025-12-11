import express from "express";
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import GoogleStrategy from "passport-google-oauth2";
import { Strategy } from "passport-local";
import env from "dotenv";

const PORT = process.env.PORT || 3000;
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

app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public/static_files')));


app.use(
  session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
   cookie: {
     maxAge: 1000 * 60 * 60,
     httpOnly: true,
     secure: process.env.NODE_ENV === "production", // only HTTPS in prod
    sameSite: "lax" 
   }// 60 MINUTE SESSION DURATION
})
);

let savedDate = '';

app.use(express.static('public'));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(passport.initialize());
app.use(passport.session());


app.get("/", (req, res) => {
    res.render("PoetrySub");
});

app.get("/login", (req, res) => {
  const message = req.query.msg === "emailExists"
    ? "This email is already registered. Please log in."
    : null;
  res.render("PS_login", { message });
});

app.get("/register", (req, res) => {
    res.render("PS_register");
});

app.get("/HowitWorks", (req, res) => {
    res.render("PS_HowitWorks");
});

app.get("/payment", (req, res) => {
  if (!req.session.signupData) {
    return res.redirect("/newsignup"); // fallback if no data
  }
  console.log("Signup Data in Session:", req.session.signupData);
  res.render("PS_payment", { signupData: req.session.signupData });
});



function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

app.get("/yourdashboard", ensureAuthenticated, async (req, res) => {
  try {
    const email = req.user.email; // comes from deserializeUser
    const result = await db.query("SELECT * FROM logins WHERE email = $1", [email]);
    const result2 = await db.query("SELECT * FROM addresses WHERE account_email = $1", [email]);

    res.render("PS_account", {
      signupData: result.rows[0],
      signupData2: result2.rows[0],
      savedDate
    });
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).send("Server error");
  }
});


app.get("/accountchanges", (req, res) => {
    res.render("PS_account-options");
});

app.get("/changepassword", (req, res) => {
    res.render("PS_changepassword");
});

app.get("/forgotpassword", (req, res) => {
    res.render("PS_forgotpassword");
});

app.get("/newsignup", (req, res) => {
  const choice = req.query.choice || "option1";
    res.render("PS_newsignupform", { choice });
});

//API route test for render.com free hosting
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from Render free hosting!" });
});


app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", {
    successRedirect: "/yourdashboard",
    failureRedirect: "/login",
  })
);


app.post('/save-date', (req, res) => {
  const { date } = req.body;
  console.log('Received date:', date);
  // Save to DB or session here
  res.status(200).send({ message: 'Date saved successfully' });
});



app.post("/login",
  passport.authenticate("local", {
    successRedirect: "/yourdashboard",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

app.post('/account', (req, res) => {
  if (req.body.newText) {
    const newText = req.body.newText;
    console.log('Updated text:', newText);
  }
  if (req.body.date) {
    savedDate = req.body.date;
    console.log('Date saved:', savedDate);
  }

  res.sendStatus(200);
});

//MAKE SURE THIS WORKS AND DOESNT COLLIDE OR INTERFERE WITH OTHER POST REQUESTS INTO DATABASE
// app.post("/account", async (req, res) => {
//   const account_address = req.body['recipient-email'];
//   const recipient_address = req.body['recipient-post'];
//   const sub_type = req.body['sub_type'];

//   try {
//     await db.query("INSERT INTO addresses (receipient-email, recipientpost, sub_type) WHERE ($1, $2)",
//       [account_address, recipient_address, sub_type]);
//     res.redirect("/account");
//   } catch (err) {
//     console.log(err);
//   }
// });


// //THIS NEEDS FIXING - ALLOW FOR LINKING EJS FILE ITEMS TO DATABASE ITEMS    
// app.post("/account", async (req, res) => {
//     const item = req.body.updatedItemTitle;

//   try {
//     await db.query("UPDATE items SET title = ($1) WHERE id = $2", [item, id]);
//     res.redirect("/account");
//   } catch (err) {
//     console.log(err);
//   }
// });



app.post("/newsignup", async (req, res) => {
  console.log("Received signup data:", req.body);

  const { 
    email, 
    password, 
    firstName, 
    lastName, 
    username, 
    addressLine1, 
    addressLine2, 
    city, 
    postcode, 
    recipientEmail, 
    recipientAddressLine1, 
    recipientAddressLine2, 
    recipientCity, 
    recipientPostcode, 
    recipientCountry, 
    choice,       // subscription type radio
    freqchoice    // frequency type radio
  } = req.body;

  // Build full addresses
  const fullAddress = [addressLine1, addressLine2, city, postcode]
    .filter(Boolean)
    .join(", ");

  const fullAddressRecipient = [recipientAddressLine1, recipientAddressLine2, recipientCity, recipientPostcode, recipientCountry]
    .filter(Boolean)
    .join(", ");

  try {
    // Hash password
    const hash = await bcrypt.hash(password, saltRounds);

    // Check if email already exists
    const checkResult = await db.query("SELECT * FROM logins WHERE email = $1", [email]);
    if (checkResult.rows.length > 0) {
      return res.redirect("/login?msg=emailExists");
    }

    // Insert into logins
    const result = await db.query(
      "INSERT INTO logins (firstname, lastname, email, password, username) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [firstName, lastName, email, hash, username]
    );

    // Insert into addresses
    const result2 = await db.query(
      "INSERT INTO addresses (account_address, recipient_address, sub_type, recipient_email, account_email, freq_type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [fullAddress, fullAddressRecipient, choice, recipientEmail, email, freqchoice]
    );

    // Authenticate user
    const user = result.rows[0];
    req.login(user, (err) => {
      if (err) {
        console.error("Login error:", err);
        return res.redirect("/login");
      }

      // Store both sets of data in session
      req.session.signupData = { 
        firstName, 
        lastName, 
        email, 
        username, 
        sub_type: choice, 
        freq_type: freqchoice, 
        address: fullAddress, 
        recipientAddress: fullAddressRecipient, 
        recipientEmail 
      };

      req.session.signupData2 = result2.rows[0]; // store address record if needed

      return res.redirect("/payment");
    });

  } catch (err) {
    console.error("Error in signup:", err);
    return res.status(500).send("Server error");
  }
});



passport.use(
  "local",
  new Strategy({ usernameField: 'email' }, async function verify(email, password, cb) {
    try {
      const result = await db.query("SELECT * FROM logins WHERE email = $1", [
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
        return cb(null, false, { message: "User not found" });
      }
    } catch (err) {
      console.log(err);
      return cb(err);
    }
  }));

passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        console.log(profile);
        const result = await db.query("SELECT * FROM logins WHERE email = $1", [
          profile.email,
        ]);
        if (result.rows.length === 0) {
          const newUser = await db.query(
            "INSERT INTO logins (email, password) VALUES ($1, $2)",
            [profile.email, "google"]
          );
          return cb(null, newUser.rows[0]);
        } else {
          return cb(null, result.rows[0]);
        }
      } catch (err) {
        return cb(err);
      }
    }
  )
);


passport.serializeUser((user, cb) => {
cb(null, user.id); // store only ID
});

passport.deserializeUser(async (id, cb) => {
  try {
    const result = await db.query("SELECT * FROM logins WHERE id = $1", [id]);
    cb(null, result.rows[0]);
  } catch (err) {
    cb(err);
  }
});


app.listen(PORT, () => console.log(`Server running at localhost:${PORT}`));