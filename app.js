import dotenv from "dotenv";
dotenv.config();

import { fileURLToPath } from 'url';
import path from 'path';
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import GoogleStrategy from "passport-google-oauth2";
import { Strategy } from "passport-local";
import express from "express";
import flash from "connect-flash";

import loadUserData from "./middlewares/middlewaredbrequests.js";
import { ensureAuthenticated } from "./routes/authRoutes.js";
import { addNewUserData, saveFeedback, addAddress,
  updateRecipientPreferences, changeUserPassword, softDeleteUserByEmail, 
  updateSubscription, updateUserAddress, updateSubscriptionWithAddress, 
  updateRecipientDetails, updateUserProfile, getUserTransactions,
  saveVerificationToken, retrieveRecipientEmail, getDeliveryDate, markEmailUnverified, 
  isRecipientSuspended, suspendRecipientByToken, getAddressByUnsubscribeToken
} from "./database/dbqueries.js";
import { sendEmail } from "./services/emailExampleService.js";
import { generateToken } from "./services/tokenService.js";
import { generateFakeHistory } from "./routes/fakeHistory.js";
import db from "./database/db.js";
import { welcomeEmailHTML } from "./emails/newSignUp.js";
import { samplePoemHTML } from "./emails/samplePoem.js";
import getRandomPoem from "./database/poemDbApi.js";
import { refreshScheduledDate, nextPaymentDate, getSubscriptionCost } from "./database/scheduleSetter.js";


import engine from "ejs-mate";

const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const saltRounds = 10;



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

app.engine("ejs", engine);          // activate ejs-mate
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static("public"));
app.use(express.json());

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

import suspensionHandler from "./emails/suspensionhandler.js";
import verifyEmailRouter from "./routes/verifyEmail.js";
app.use("/", suspensionHandler);
app.use("/", verifyEmailRouter);


app.get("/", (req, res) => {
  const alert = req.flash("alert")[0];

  res.render("PoetrySub", {
    flash: alert || { text: null, type: null }
  });
});


app.get("/login", (req, res) => {
  res.render("PS_login", { 
    message: null,
    flash: req.flash("alert")[0] || null
  });
});
   
app.get("/HowitWorks", (req, res) => {

  const faqs = [
    { question: "How often are emails sent?", answer: "You can choose the frequency of your poem deliveries during the signup process. Options typically include monthly, bi-monthly, or quarterly deliveries." },
    { question: "Can I customize my Amore?", answer: "Yes! You can provide details about your relationship and preferences to help our poets create personalized verses that resonate with your unique story." },
    { question: "What if I want to change my subscription plan?", answer: "You can easily upgrade or downgrade your subscription plan at any time through your account settings." },
    { question: "Is there a trial period available?", answer: "We currently do not offer a trial period, but we do have a satisfaction guarantee. If you're not happy with your subscription, please contact our support team for assistance." },
    { question: "How do I cancel my subscription?", answer: "You can cancel your subscription at any time through your account settings free of charge. Please note that we do not offer refunds for already delivered poems." },
    { question: "Can I gift a subscription to someone else?", answer: "Yes, you can purchase a subscription as a gift for someone else. During the signup process, simply provide the recipient's details for delivery." },
    { question: "How is my information used?", answer: "We take your privacy seriously and use industry-standard security measures to protect your personal information. Your recipient's email will include your name and email so they can know who sent the Amore." }, 
    { question: "Can I pause my subscription?", answer: "No, we do not currently offer subscription pauses but we do offer effortless recipient changes. Perhaps your mother, aunt or an old flame might appreciate an Amore." }
  ];

  res.render("PS_HowitWorks", { faqs });
});

app.get("/payment", loadUserData, (req, res) => {

  const flashMessage = req.flash("alert")[0] || null;

  try{
    if (!req.isAuthenticated()) {
  return res.redirect("/login");
}
  res.render("PS_payment", {
    user: res.locals.user,
    subscription: res.locals.subscription,
    flash: flashMessage,
  });

  console.log("Subscription data:", res.locals.subscription);
  console.log("User data:", res.locals.user);

}catch(err)
{
      console.error("Error in /payment route:", err);
      return res.status(500).send("Server error");
    }

});

app.get("/yourdashboard", ensureAuthenticated, loadUserData, async (req, res) => {
  const flashMessage = req.flash("alert")[0] || null;
  const email = req.user.email;
  const { rows: transactions } = await getUserTransactions(email);
  const poem = await getRandomPoem();
  const poemHTML = poem.lines.map(line => `${line}<br>`).join("");
  await refreshScheduledDate(email);
  const nextPayment = await nextPaymentDate(email);
  const scheduledDate = await getDeliveryDate(email);
  const subscriptionCost = await getSubscriptionCost(email);
console.log("SUSP CHECK VALUE:", req.user.email, typeof req.user.email);

    if (!res.locals.subscription) {
      return res.redirect("/changesubscription");
    }

  res.render("PS_account", {
      user: res.locals.user,
      subscription: res.locals.subscription,
      transactions,
      poem,
      scheduledDate,
      nextPayment,
      subscriptionCost,
      poemHTML,
      flash: flashMessage,
    });

});

app.get("/changedetails", ensureAuthenticated, loadUserData, (req, res) => {
  const flashMessage = req.flash("alert")[0] || null;

  res.render("changedetails", {
    flash: flashMessage,
    user: res.locals.user,
    subscription: res.locals.subscription
  });
});

app.get("/changepassword", (req, res) => {
  const flashMessage = req.flash("alert")[0] || null;

    res.render("PS_changepassword", {
  flash: flashMessage,
});

});

app.get("/forgotpassword", (req, res) => {
  const flashMessage = req.flash("alert")[0] || null;

    res.render("PS_forgotpassword", {
  flash: flashMessage,
});
});

app.get("/changesubscription", ensureAuthenticated, loadUserData, async (req, res) => {
  const flashMessage = req.flash("alert")[0] || null;
  const subscription = res.locals.subscription;

  try {
    res.render("changesubscription", {
      subscription: {
        sub_type: subscription.sub_type,
        freq_type: subscription.freq_type,  
        recipient_email: subscription.recipient_email,
        preferences: subscription.preferences || 'N/A'
      },
      flash: flashMessage
    });

  } catch (err) {
    console.error("Error loading subscription:", err);
    res.status(500).send("Server error with subscription data");
  }
});

app.get("/newsignup", (req, res) => {
  const { sub_type, freq_type } = req.query;

  res.render("PS_newsignupform", {
    title: "Register New Account",
    heading: "Join Our Poetry Subscription Service",
    flash: req.flash("alert")[0] || null,
    sub_type: sub_type || null,
    freq_type: freq_type || null
  });
});

app.get("/verified", (req, res) => {
  res.render("verified");
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

app.get("/logout", (req, res, next) => {
  req.logout(function(err) {
    if (err) return next(err);

    // Flash BEFORE destroying session
    req.flash("alert", {
      type: "info",
      text: "You have been logged out."
    });

    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
      }

      res.clearCookie("connect.sid");
      return res.redirect("/login");
    });
  });
});


app.get("/deletefeedback", (req, res) => {

   req.flash("success", {
      type: "info",
      text: "You account has been successfully deleted."
    });

  res.render("deletefeedback", {
    flash: req.flash("success")[0] || null
  });
});



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

app.post("/yourdashboard", ensureAuthenticated, loadUserData, async (req, res) => {
  console.log("Dashboard session:", req.session);

  const { finalPrice } = req.body;

  if (finalPrice) {
    req.session.price = finalPrice;
    console.log("Price saved:", finalPrice);
  }

  try {
    const email = req.user.email;

    const newRecipientEmail = req.body["recipient-email"];
    const newRecipientAddress = req.body["recipient-address"];

    // Use your new DB helper function
    await updateRecipientDetails(email, newRecipientEmail, newRecipientAddress);

    res.sendStatus(200);

  } catch (err) {
    console.error("Dashboard update error:", err);
    res.status(500).send("Server error");
  }
});

app.post("/yourdashboard/send-recipient-email", ensureAuthenticated, loadUserData, async (req, res) => {


  try {
    const email = req.user.email;
    const suspended = await isRecipientSuspended(req.user.email);

      if (suspended) {
        req.flash("alert", {
          type: "info",
          text: `The recipient email is currently suspended and cannot receive Amores.`,
        });

        return res.redirect("/yourdashboard");
      }

    const result = await retrieveRecipientEmail(email);

    if (result.rows.length === 0) { 
      return res.status(404).send("Recipient email not found");
    }

    await refreshScheduledDate(email);
    const nextPayment = await nextPaymentDate(email);
    const scheduledDate = await getDeliveryDate(email);
    const subscriptionCost = await getSubscriptionCost(email);

    const recipientEmail = result.rows[0].recipient_email;
    const poem = await getRandomPoem();
    const poemHTML = poem.lines.map(line => `${line}<br>`).join("");
    const unsubscribeToken = result.rows[0].unsubscribe_token;
    
  await sendEmail(
  recipientEmail,
  "You've been Amored! 💘",
  samplePoemHTML(recipientEmail, poem.title, poem.author, poemHTML, unsubscribeToken)
);

     const { rows: transactions } = await getUserTransactions(email);
    console.log("Recipient email sent to:", recipientEmail);
    
      return res.render("PS_account", {
        user: res.locals.user,
        subscription: res.locals.subscription,
        transactions,
        subscriptionCost,
        nextPayment,
        scheduledDate,
        poem,
        poemHTML,
        flash: {
          type: "success",
          text: `An Amore has been sent to ${recipientEmail}!`
        }
      });

  } catch (err) {
    console.error("Error sending recipient email:", err);
    return res.status(500).send("Server error while sending email");
  }
});


app.post("/deletefeedback", ensureAuthenticated, async (req, res) => {
  try {
    const email = req.user.email;
    const { reason, satisfaction, return_likelihood, comments } = req.body;

    // 1. Save feedback
    await saveFeedback(reason, satisfaction, return_likelihood, comments);

    // 2. Soft delete the user
    await softDeleteUserByEmail(email);

    // 3. Flash BEFORE logout/session destruction
    req.flash("alert", {
      type: "success",
      text: `Your account has been deleted. Thank you for your feedback.`
    });
    console.log("User feedback saved and account marked deleted for:", email);
    // 4. Log the user out
    req.logout(err => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).send("Server error during logout");
      }

      // 5. Destroy the session
      req.session.destroy(err => {
        if (err) {
          console.error("Session destruction error:", err);
          return res.status(500).send("Server error during session destruction");
        }

        // 6. Clear cookie
        res.clearCookie("connect.sid");

        // 7. Redirect home
        return res.redirect("/");
      });
    });

  } catch (err) {
    console.error("Delete-feedback error:", err);
    return res.status(500).send("Server error during account deletion");
  }
});




app.post("/changedetails/update-details", ensureAuthenticated, async (req, res) => {
  try {
    const originalEmail = req.user.email.trim().toLowerCase();
    const { firstName, lastName, email, address, username } = req.body;

    const newEmail = email.trim().toLowerCase();

    // Basic validation
    if (!firstName || !lastName || !newEmail || !username || !address) {
      req.flash("alert", {
        type: "error",
        text: "All fields are required."
      });
      return res.redirect("/yourdashboard");
    }

     await updateUserProfile(originalEmail, firstName, lastName, username);

    if (newEmail !== originalEmail) {
          const addrRes = await updateUserAddress(originalEmail, address, newEmail);
          if (!addrRes || addrRes.rowCount === 0) {
            // No address row matched originalEmail — try matching by newEmail as fallback
            await updateUserAddress(newEmail, address);
          }          
        await markEmailUnverified(originalEmail);

          // 2. Generate new verification token
          const token = await generateToken(newEmail);

          // 3. Send verification email
          await sendEmail(
            newEmail,
            "Verify your new email",
            verifyChangeEmailHTML(firstName, token)
          );

          console.log("Email changed — verification required:", newEmail);

        } else {
          // Email unchanged — update address normally
          await updateUserAddress(originalEmail, address);
        }

            console.log('New account email saved:', newEmail);
            console.log('New name saved:', firstName, lastName);
            console.log('New address saved:', address);

    // Success flash message
    req.flash("alert", {
      type: "success",
      text: "Your account details have been updated successfully."
    });

    return res.redirect("/yourdashboard");

  } catch (err) {
    console.error("Account update error:", err);

    req.flash("alert", {
      type: "error",
      text: "Something went wrong while updating your details."
    });

    return res.redirect("/yourdashboard");
  }
});


app.post("/newsignup", async (req, res) => {
  try {
    const { email, firstName, lastName, username, password, sub_type, freq_type, addressLine1, addressLine2, city, postcode, country, recipientAddressLine1, recipientAddressLine2, recipientCity, recipientPostcode, recipientCountry, recipientEmail, preferences, startDate} = req.body;
    const account_address = [addressLine1, addressLine2, city, postcode, country].filter(Boolean).join(", ");

    const recipient_address = [recipientAddressLine1, recipientAddressLine2, recipientCity, recipientPostcode, recipientCountry].filter(Boolean).join(", ");

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUserResult = await addNewUserData(email, firstName, lastName, username, hashedPassword);
    const newUser = newUserResult.rows[0];
    const unsubscribeToken = generateToken();

    await addAddress(email, recipientEmail, account_address, recipient_address, sub_type, freq_type, preferences, startDate, unsubscribeToken);

    req.login(newUser, async (err) => {
      if (err) return res.status(500).send("Server error");

      const token = generateToken();
      await saveVerificationToken(email, token);

  await sendEmail(
  email,
  "Verify Your Email",
  welcomeEmailHTML(firstName, token)
);


      res.redirect("/payment")
      await generateFakeHistory(email, sub_type, freq_type);
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).send("Server error");
  }
});



app.post("/changesubscription", ensureAuthenticated, loadUserData, async (req, res) => {
  try {
    const email = req.user.email;

    const {
      "recipient-email": newRecipientEmail,
      sub_type,
      freq_type,
      address1,
      address2,
      city,
      postcode
    } = req.body;

    const newPreferences = req.body["recipient-preferences"];

     if (newPreferences) {
      await updateRecipientPreferences(email, newPreferences);
    }

    await generateFakeHistory(email, sub_type, freq_type);

    const validSubs = ["option1", "option2", "option3"];
    const validFreqs = ["option1", "option2", "option3", "option4"];

    if (!validSubs.includes(sub_type) || !validFreqs.includes(freq_type)) {
      return res.status(400).send("Invalid subscription type or frequency");
    }
    const pricing = {
      option1: 3.99,
      option2: 9.99,
      option3: 24.99
    };

    const freqMultiplier = {
      option1: 2.4,
      option2: 1,
      option3: 0.7,
      option4: 0.6
    };

    const newPrice = pricing[sub_type] * freqMultiplier[freq_type];
    req.session.price = newPrice.toFixed(2);

    let fullAddress = null;

    if (sub_type === "option3") {
      fullAddress = [address1, address2, city, postcode]
        .filter(Boolean)
        .join(", ");

      await updateSubscriptionWithAddress(email, sub_type, freq_type, fullAddress);

    } else {
      await updateSubscription(email, sub_type, freq_type);
    }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (newRecipientEmail && emailRegex.test(newRecipientEmail)) {
      await updateRecipientDetails(email, newRecipientEmail, null);
}

    req.flash("alert", {
      type: "success",
      text: "Your subscription has been changed successfully!"
    });

    res.redirect("/yourdashboard?updated=true");

  } catch (err) {
    console.error("Error updating subscription:", err);
    res.status(500).send("Server error");
  }
});

app.post("/changepassword", ensureAuthenticated, async (req, res) => {
  try {
    const email = req.user.email;
    const { currentPassword, newPassword } = req.body;

    const result = await db.query("SELECT password FROM logins WHERE email = $1", [email]);
    const storedHashedPassword = result.rows[0].password;

    const isMatch = await bcrypt.compare(currentPassword, storedHashedPassword);
    if (!isMatch) {
      req.flash("alert", {
        type: "error",
        text: "Current password is incorrect."
      });
      return res.redirect("/changepassword");
    }

    const newHashedPassword = await bcrypt.hash(newPassword, saltRounds);
    await changeUserPassword(email, newHashedPassword);

    console.log("Password changed for user:", email);

     req.flash("alert", {
        type: "success",
        text: "Your password has been changed successfully!"
      });

    res.redirect("/yourdashboard");

  } catch (err) {
    console.error("Error changing password:", err);
    req.flash("alert", {
      type: "error",
      text: "Something went wrong while changing your password."
    });
    res.redirect("/changepassword");
  }
});

passport.use(
  "local",
  new Strategy({ usernameField: "email" }, async (email, password, cb) => {
    try {
      const result = await db.query(
        `SELECT * FROM logins 
         WHERE email = $1 
         AND deleted_at IS NULL`,
        [email]
      );

      if (result.rows.length === 0) {
        return cb(null, false, { message: "Invalid credentials" });
      }

      const user = result.rows[0];
      const valid = await bcrypt.compare(password, user.password);

      if (!valid) {
        return cb(null, false, { message: "Invalid credentials" });
      }

      return cb(null, user);

    } catch (err) {
      console.error("Passport login error:", err);
      return cb(err);
    }
  })
);

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
        const result = await db.query("SELECT * FROM logins WHERE email = $1 AND deleted_at IS NULL", [
          profile.email,
        ]);
        if (result.rows.length === 0) {
          const newUser = await db.query(
            "INSERT INTO logins (email, password) VALUES ($1, $2) RETURNING *",
            [profile.email, null]
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
    const result = await db.query("SELECT * FROM logins WHERE id = $1 AND deleted_at IS NULL", [id]);
    cb(null, result.rows[0]);
  } catch (err) {
    cb(err);
  }
});


app.listen(PORT, () => console.log(`Server running at localhost:${PORT}`));