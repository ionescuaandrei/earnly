import * as crypto from "crypto";
import * as admin from "firebase-admin";
import { getApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

// v2
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions/v2";
import { onRequest } from "firebase-functions/v2/https";

try {
  getApp();
} catch {
  admin.initializeApp();
}
const db = getFirestore();

// Declare secrets (must match names you set via CLI)
const BITLABS_SERVER = defineSecret("BITLABS_SERVER");
const BITLABS_SECRET = defineSecret("BITLABS_SECRET");

function timingSafeEq(a: string, b: string) {
  const A = Buffer.from(a || "", "utf8");
  const B = Buffer.from(b || "", "utf8");
  if (A.length !== B.length) return false;
  return crypto.timingSafeEqual(A, B);
}

export const webhookBitlabs = onRequest(
  {
    invoker: "public",
    region: "us-central1",
    secrets: [BITLABS_SERVER, BITLABS_SECRET],
  },
  async (req, res): Promise<void> => {
    try {
      // Debug logging
      if (req.query?.debug === "true") {
        logger.info("BITLABS DEBUG START", {
          method: req.method,
          query: req.query,
          headers: {
            "x-signature": req.get("x-signature"),
            "x-hub-signature": req.get("x-hub-signature"),
            "x-signature-hmac-sha256": req.get("x-signature-hmac-sha256"),
          },
        });
      }

      const SERVER_KEY = (process.env.BITLABS_SERVER ?? "").trim();
      const HMAC_SECRET = (process.env.BITLABS_SECRET ?? "").trim();

      let user_id: string | undefined;
      let transaction_id: string | undefined;
      let reward_amount_num: number | undefined;
      let verified = false;

      // --- POST with HMAC header ---
      if (req.method === "POST") {
        const sig =
          req.get("x-signature") ||
          req.get("x-hub-signature") ||
          req.get("x-signature-hmac-sha256") ||
          "";

        if (!HMAC_SECRET || !sig) {
          res.status(401).send("Missing signature");
          return;
        }

        const computed = crypto
          .createHmac("sha256", HMAC_SECRET)
          .update(req.rawBody) // raw body
          .digest("hex");

        if (!timingSafeEq(computed, sig)) {
          res.status(401).send("Invalid signature");
          return;
        }

        const b: any = req.body ?? {};
        user_id = b.user_id || b.userId || b.uid;
        transaction_id = b.transaction_id || b.tx_id || b.transactionId;
        const reward_amount = b.reward_amount ?? b.amount ?? b.payout;
        reward_amount_num =
          typeof reward_amount === "number"
            ? reward_amount
            : Number(reward_amount);

        verified = true;
      }

      // --- GET with ?hash= (BitLabs tester) ---
      if (!verified && req.method === "GET") {
        const proto =
          (req.get("x-forwarded-proto") ?? req.protocol ?? "https").toString();
        const host = req.get("x-forwarded-host") ?? req.get("host");

        const u = new URL(`${proto}://${host}${req.originalUrl || req.url}`);
        const provided = (u.searchParams.get("hash") ?? "")
          .trim()
          .toLowerCase();
        u.searchParams.delete("hash");
        const urlToSign = u.toString();

        if (!provided || (!SERVER_KEY && !HMAC_SECRET)) {
          res.status(401).send("Missing secret or hash");
          return;
        }

        const sign = (key: string) =>
          key
            ? crypto
                .createHmac("sha1", key)
                .update(urlToSign, "utf8")
                .digest("hex")
                .toLowerCase()
            : "";

        const h1 = sign(HMAC_SECRET);
        const h2 = sign(SERVER_KEY);

        if (req.query?.debug === "true") {
          logger.info("BITLABS HASH DEBUG", {
            urlToSign,
            provided,
            h1,
            h2,
            used:
              provided === h1
                ? "SECRET"
                : provided === h2
                ? "SERVER"
                : "NONE",
          });
        }

        if (provided !== h1 && provided !== h2) {
          res.status(401).send("Invalid hash");
          return;
        }

        const q: any = req.query ?? {};
        user_id = (q.user_id || q.userId || q.uid) as string | undefined;
        transaction_id = (q.transaction_id ||
          q.tx_id ||
          q.transactionId ||
          q.tid) as string | undefined;
        const rawAmount =
          q.reward_amount ?? q.amount ?? q.payout ?? q.value;
        reward_amount_num =
          typeof rawAmount === "number" ? rawAmount : Number(rawAmount);

        verified = true;
      }

      if (!verified) {
        res.status(405).send("Method Not Allowed");
        return;
      }

      if (!user_id || !transaction_id || !Number.isFinite(reward_amount_num!)) {
        res.status(400).send("Bad payload");
        return;
      }

      const credits = Math.round(reward_amount_num!);

      await db.runTransaction(async (t) => {
        const txRef = db.doc(`taskEvents/${transaction_id}`);
        if ((await t.get(txRef)).exists) return;

        const userRef = db.doc(`users/${user_id}`);

        t.set(txRef, {
          uid: user_id,
          source: "bitlabs",
          credits,
          at: FieldValue.serverTimestamp(),
        });

        t.set(
          userRef,
          {
            balance: FieldValue.increment(credits),
            totalEarned: FieldValue.increment(credits),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        const logRef = db
          .collection(`userEarnings/${user_id}/entries`)
          .doc();
        t.set(logRef, {
          source: "bitlabs",
          txId: transaction_id,
          credits,
          at: FieldValue.serverTimestamp(),
        });
      });

      res.status(200).send("OK");
    } catch (e) {
      logger.error("webhookBitlabs error", e);
      res.status(500).send("Server error");
    }
  }
);
