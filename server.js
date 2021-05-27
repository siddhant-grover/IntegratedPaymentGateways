if(process.env.NODE_ENV!=='production')//var set by node, tells us which environment are we on ,
{
    const dotenv = require("dotenv");
    dotenv.config();
}

//so if we are in production we dont want to use env library 
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY

const express = require('express');
const app = express();
const fs = require('fs')//allow us to read diff files 

app.set('view engine','ejs')//ejs , front end use ejs , in order to render views
app.use(express.static('public')) //where our static file gonna be

app.get('/store',(req,res)=>{
    fs.readFile('items.json',function(error,data){ //data is the info in the file

        if(error){
            res.status(500).end()
        }
        else{
            res.render('store.ejs',{//as we r using express by default all the views that are rendered with render method , need to live in a folder called views 
                    items:JSON.parse(data)//passing items.json data in store.js as an items var 
            })//render our store page , but as we want to use values from our server in the html page save it as ejs file
        }
    })

})
app.listen(3000,()=>{
    console.log("Server Started")

})



 