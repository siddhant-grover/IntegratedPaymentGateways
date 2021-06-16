if (process.env.NODE_ENV !== "production") {
  const dotenv = require("dotenv");
  dotenv.config();
}

const cors = require("cors");
const express = require("express");
const app = express();
const fs = require("fs");
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cors());

app.set("view engine", "ejs");
app.use(express.static("public"));

const YOUR_DOMAIN = process.env.YOUR_DOMAIN;

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY;
const stripe = require("stripe")(stripeSecretKey);

const Razorpay = require("razorpay");
let KEY_ID = process.env.KEY_ID;
let KEY_SECRET = process.env.KEY_SECRET;
const razorpay = new Razorpay({
  //initailize razorpay
  key_id: KEY_ID,
  key_secret: KEY_SECRET,
});

const paypal = require("paypal-rest-sdk");
paypal.configure({
  mode: "sandbox", //sandbox or live
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
});

app.post("/stripe", async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: req.body.currency,
          product_data: {
            name: req.body.name,
            images: [req.body.image],
          },
          unit_amount: req.body.amount,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${YOUR_DOMAIN}/stripe/success`,
    cancel_url: `${YOUR_DOMAIN}/stripe/cancel`,
  });

  res.json({id: session.id});
});

app.get("/stripe/cancel", function (req, res) {
  res.send("Cancelled");
});
app.get("/stripe/success", function (req, res) {
  res.send("Success");
});

//PAYPAL

let amountStored = 0;
let currency = "";
app.post("/paypal", (req, res) => {
  amountStored = req.body.amount;
  currency = req.body.currency;
  const create_payment_json = {
    intent: "sale",
    payer: {
      payment_method: "paypal",
    },
    redirect_urls: {
      return_url: `${YOUR_DOMAIN}/paypal/success`,
      cancel_url: `${YOUR_DOMAIN}/paypal/cancel`,
    },
    transactions: [
      {
        item_list: {
          items: [
            {
              name: req.body.name,
              sku: "001",
              price: amountStored,
              currency: currency,
              quantity: 1,
            },
          ],
        },
        amount: {
          currency: currency,
          total: amountStored,
        },
        description: req.body.description,
      },
    ],
  };

  paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
      throw error;
    } else {
      for (let i = 0; i < payment.links.length; i++) {
        if (payment.links[i].rel === "approval_url") {
          //res.redirect(payment.links[i].href);
          res.json({forwardLink: payment.links[i].href});
        }
      }
    }
  });
});

app.get("/paypal/success", (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;

  const execute_payment_json = {
    payer_id: payerId,
    transactions: [
      {
        amount: {
          currency: currency,
          total: amountStored,
        },
      },
    ],
  };

  paypal.payment.execute(
    paymentId,
    execute_payment_json,
    function (error, payment) {
      if (error) {
        console.log(error.response);
        throw error;
      } else {
        res.send("Success");
      }
    }
  );
});

app.get("/paypal/cancel", (req, res) => res.send("Cancelled"));

//RAZORPAY

app.post("/razorpay", (req, res) => {
  //make a req from client and client recives an order_id
  let options = {
    amount: req.body.amount, // amount in the smallest currency unit
    currency: req.body.currency,
    //receipt: "order_rcptid_11"//we can generate an unique id from npm (like uuid), and generate a recipt everytime you create an order
  };
  razorpay.orders.create(options, function (err, order) {
    res.json(order);
  });
});

app.post("/is-razorpay-order-completed", (req, res) => {
  //console.log(req.body)//you can collect  "razorpay_payment_id" ,"razorpay_order_id","razorpay_signature" from body and use them to verify the signature and Make provisions to store these fields on your server/db.

  razorpay.payments.fetch(req.body.razorpay_payment_id).then((paymentDoc) => {
    if (paymentDoc.status == "captured") {
      res.send("Payment success");
    } else {
      //res.redirect('/')
    }
  });
});

app.listen(3000, () => {
  console.log("Server Started");
});
