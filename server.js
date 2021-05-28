if(process.env.NODE_ENV!=='production')//var set by node, tells us which environment are we on ,
{
    const dotenv = require("dotenv");
    dotenv.config();
}

const cors = require("cors");
//so if we are in production we dont want to use env library 
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY
const stripe = require('stripe')(stripeSecretKey);


const express = require('express');
const app = express();
const fs = require('fs')//allow us to read diff files 
app.use(express.json());
app.use(cors());

app.set('view engine','ejs')//ejs , front end use ejs , in order to render views
app.use(express.static('public')) //where our static file gonna be

app.get('/store',(req,res)=>{
    fs.readFile('items.json',function(error,data){ //data is the info in the file

        if(error){
            res.status(500).end()
        }
        else{
            res.render('store.ejs',{//as we r using express by default all the views that are rendered with render method , need to live in a folder called views 
                    items:JSON.parse(data),//passing items.json data in store.js as an items var 
                    stripePublicKey:stripePublicKey
            })//render our store page , but as we want to use values from our server in the html page save it as ejs file
        }
    })

})


const YOUR_DOMAIN = 'http://localhost:3000'
app.post('/create-checkout-session', async (req, res) => {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: req.body.currency,
            product_data: {
              name: req.body.name,
              images: ['https://images.fineartamerica.com/images/artworkimages/mediumlarge/2/rainbow-rose-michelle-wittensoldner.jpg'],
            },
            unit_amount: req.body.amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${YOUR_DOMAIN}/stripe/success`,
      cancel_url: `${YOUR_DOMAIN}/stripe/cancel`,
    });
  
    res.json({ id: session.id });
  });


  //PAYPAL

  const paypal = require('paypal-rest-sdk');
  paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'Adxzsj7gA3qqtUqWO493AbfVTnkTQeBWWvTxgnKBxTksPFdU1RWf1UjaDkB_o66d5kg0wdMRzY6K7zJ1',
    'client_secret': 'EDvZKSak9gRm-uRohkHsN_SrzmGXXwgChjjltKk-NN2Ba4za9hj7fqf5hE7TTk3weYW5tRHBJpKRLuo2'
  });
  let amountStored = 0;
  let currency = ''
  app.post('/pay', (req, res) => {
      console.log(req.body)
      amountStored = req.body.amount
      currency = req.body.currency
    const create_payment_json = {
      "intent": "sale",
      "payer": {
          "payment_method": "paypal"
      },
      "redirect_urls": {
          "return_url": `${YOUR_DOMAIN}/paypal/success`,
          "cancel_url": `${YOUR_DOMAIN}/paypal/cancel`
      },
      "transactions": [{
          "item_list": {
              "items": [{
                  "name": req.body.name,
                  "sku": "001",
                  "price": amountStored,
                  "currency": currency,
                  "quantity": 1
              }]
          },
          "amount": {
              "currency": currency,
              "total": amountStored
          },
          "description": req.body.description
      }]
  };
  
  paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
        throw error;
    } else {
        for(let i = 0;i < payment.links.length;i++){
          if(payment.links[i].rel === 'approval_url'){
            //res.redirect(payment.links[i].href);
            console.log("hii")
            console.log(payment.links[i].href)
            res.json({forwardLink: payment.links[i].href});
          }
        }
    }
  });
  
  });
  
  app.get('/paypal/success', (req, res) => {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
  
    const execute_payment_json = {
      "payer_id": payerId,
      "transactions": [{
          "amount": {
              "currency": currency,
              "total": amountStored
          }
      }]
    };
  
    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
      if (error) {
          console.log(error.response);
          throw error;
      } else {
          console.log(JSON.stringify(payment));
          res.send('Success');
      }
  });
  });
  
  app.get('/paypal/cancel', (req, res) => res.send('Cancelled'));

 


app.get('/stripe/cancel', function(req, res){ 
    res.render('cancel') 
})
app.get('/stripe/success', function(req, res){ 
  res.render('success') 
})


app.listen(3000,()=>{
    console.log("Server Started")

})



 