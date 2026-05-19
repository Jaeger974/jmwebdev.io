import db from "../database/db.js";


// middleware/loadUserData.js
export default async function loadUserData(req, res, next) {
  try {
    if (!req.isAuthenticated()) {
      return res.redirect("/login");
    }

    const email = req.user.email;

    // Fresh login info soft-deleted users should not be able to access their account page
 const userResult = await db.query(
      `SELECT firstname, lastname, email, username 
       FROM logins 
       WHERE email = $1 AND deleted_at IS NULL`,
      [email]
    );
    
// If user is soft-deleted, force logout
if (userResult.rows.length === 0) {
      req.logout(() => {});
      req.session.destroy(() => {});
      return res.redirect("/login");
    }

    // Fresh subscription + address info
    const addressResult = await db.query(
      "SELECT * FROM addresses WHERE account_email = $1 AND deleted_at IS NULL",
      [email]
    );

    // Make available to EJS
    res.locals.user = userResult.rows[0];
    res.locals.subscription = addressResult.rows[0] || null;
    res.locals.price = req.session.price;

    next();
  } catch (err) {
    console.error("loadUserData middleware error:", err);
    res.status(500).send("Server error");
  }
};