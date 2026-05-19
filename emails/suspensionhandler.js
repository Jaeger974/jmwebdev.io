import express from "express";
import { 
  getAddressByUnsubscribeToken, 
  suspendRecipientByToken 
} from "../database/dbqueries.js";

const router = express.Router();

router.get("/unwanted-email", async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send("Invalid unsubscribe link.");
  }

  const address = await getAddressByUnsubscribeToken(token);

  if (!address) {
    return res.status(400).send("Invalid or expired unsubscribe link.");
  }

  await suspendRecipientByToken(token);

  res.send("You have been unsubscribed from future Amores.");
});

export default router;