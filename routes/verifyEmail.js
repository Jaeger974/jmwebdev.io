import express from "express";
import db from "../database/db.js"; 
import passport from "passport";

const router = express.Router();

router.get("/verify-email/:token", async (req, res) => {
  const { token } = req.params;

  try {
    // 1. Look up token
    const tokenResult = await db.query(
      "SELECT email, created_at FROM email_verification_tokens WHERE token = $1",
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).send("Invalid or expired verification link.");
    }

    const { email, created_at } = tokenResult.rows[0];

    // 2. Optional expiry check (24 hours)
    const tokenAgeHours =
      (Date.now() - new Date(created_at).getTime()) / (1000 * 60 * 60);

    if (tokenAgeHours > 24) {
      return res.status(400).send("Verification link has expired.");
    }

    // 3. Mark user as verified
    await db.query(
      `UPDATE logins SET email_verified = true WHERE email = $1`,
      [email]
    );

    // 4. Fetch the user so we can log them in
    const userResult = await db.query(
      "SELECT id, email FROM logins WHERE email = $1",
      [email]
    );

    const user = userResult.rows[0];

    // 5. Delete token
    await db.query(
      "DELETE FROM email_verification_tokens WHERE token = $1",
      [token]
    );

    // 6. Auto-login using Passport
    req.login(user, (err) => {
      if (err) {
        console.error("Auto-login error:", err);
        return res.status(500).send("Verification succeeded, but login failed.");
      }

      // 7. Redirect to your verified page
      return res.redirect("/verified");
    });

  } catch (err) {
    console.error("Verification error:", err);
    return res.status(500).send("Server error during verification.");
  }
});

export default router;