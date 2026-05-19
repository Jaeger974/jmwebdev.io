import db from "../database/db.js";

export async function generateFakeHistory(email) {
   try {
    const existing = await db.query(
      `SELECT id FROM transactions
       WHERE account_email = $1 AND fake = TRUE
       LIMIT 1`,
      [email]
    );

    if (existing.rows.length > 0) {
      console.log("Fake history already exists — skipping.");
      return;
    }
  } catch (err) {
    console.error("Error checking for existing fake history:", {
  message: err.message,
});
    throw err;
  }

  try{
  const { rows } = await db.query(
    `SELECT sub_type, freq_type 
     FROM addresses 
     WHERE account_email = $1`,
    [email]
  );

  const { sub_type, freq_type } = rows[0];

  const basePrices = { 
    option1: 3.99,
    option2: 9.99,
    option3: 24.99 
  };

  const frequencyFactors = { 
    option1: 2.4, 
    option2: 1, 
    option3: 0.7, 
    option4: 0.4 
  };

  const amount = (basePrices[sub_type] * frequencyFactors[freq_type]).toFixed(2);

  const months = [1, 2, 3, 4, 5];

 const inserts = months.map(m =>
  db.query(
    `INSERT INTO transactions 
       (account_email, amount, personalised, sub_type, freq_type, created_at, fake)
     VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '${m} months', TRUE)`,
    [
      email,
      amount,
      false,        // personalised = FALSE for fake history
      sub_type,
      freq_type
    ]
  )
);

  return Promise.all(inserts);
  } catch (err) {
    console.error("Error generating fake history:", err);
    throw err;
}
};
