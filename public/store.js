if (document.readyState == 'loading') {
    document.addEventListener('DOMContentLoaded', ready)
} else {
    ready()
}

function ready() {
    var removeCartItemButtons = document.getElementsByClassName('btn-danger')
    for (var i = 0; i < removeCartItemButtons.length; i++) {
        var button = removeCartItemButtons[i]
        button.addEventListener('click', removeCartItem)
    }

    var quantityInputs = document.getElementsByClassName('cart-quantity-input')
    for (var i = 0; i < quantityInputs.length; i++) {
        var input = quantityInputs[i]
        input.addEventListener('change', quantityChanged)
    }

    var addToCartButtons = document.getElementsByClassName('shop-item-button')
    for (var i = 0; i < addToCartButtons.length; i++) {
        var button = addToCartButtons[i]
        button.addEventListener('click', addToCartClicked)
    }

    document.getElementsByClassName('btn-purchase')[0].addEventListener('click', purchaseClicked)
}
var stripe = Stripe(stripePublicKey);

function purchaseClicked(e) { //change this so when we click on purchase button 
    // alert('Thank you for your purchase')
    // var cartItems = document.getElementsByClassName('cart-items')[0]
    // while (cartItems.hasChildNodes()) {
    //     cartItems.removeChild(cartItems.firstChild)
    // }
    // updateCartTotal()
    priceElement = document.getElementsByClassName('cart-total-price')[0]
    var amount = parseFloat((parseFloat(priceElement.innerText.replace('$', '')) * 100).toFixed(2)) //converting to cents
    if(amount === 0){
        alert("Buy some Products")
        return;
    }
console.log(document.getElementById('gateways').value)
if(document.getElementById('gateways').value==='Stripe'){
    fetch("/create-checkout-session", {
        method: "POST",
        body:JSON.stringify({
            amount,
            currency:'USD',
            name:'Generic Store Items',
            image:'https://onlinecourses.one/wp-content/uploads/2019/08/Best-Adobe-After-Effects-Course-Class-Programs-Tutorial-Training-Certification-Online.jpg'
            
        }),
        headers: {
            "Content-Type": "application/json"
          }
    
      })
        .then(function (response) {
          return response.json();
        })
        .then(function (session) {
          return stripe.redirectToCheckout({ sessionId: session.id });
        })
        .then(function (result) {
          // If redirectToCheckout fails due to a browser or network
          // error, you should display the localized error message to your
          // customer using error.message.
          if (result.error) {
            alert(result.error.message);
          }
        })
        .catch(function (error) {
          console.error("Error:", error);
        });
}
if(document.getElementById('gateways').value==='Paypal'){
    fetch("/pay", {
        method: "POST",
        body:JSON.stringify({
            amount:parseFloat(amount/100).toFixed(2),
            currency:'USD',
            name:'Generic Store Items',
            description:'Our products are high quality'
        }),
        headers: {
            "Content-Type": "application/json"
          }
    
      })
      .then((res) => {
          return res.json()
      })
      .then(data=>{
        //console.log(data)
        window.location = data.forwardLink
      })
      .catch((err) => {
        console.log(err)
      })

}

if(document.getElementById('gateways').value==='Razorpay'){
    fetch('/order',{
        method:'POST',//pass body values 
        body:JSON.stringify({
            amount:amount,
            currency:'USD'

        }),
        headers:{"Content-Type":"application/json"}

    })
    .then(resp=>resp.json())
    .then(info=>{
        var options = {
    "key": KEY_ID, // Enter the Key ID generated from the Dashboard
    // "amount": "50000", // Amount is in currency sub units. Default currency is INR. Hence, 50000 refers to 50000 paise
    // "currency": "INR",
    "name": "Music Store",
    "description": "Test Transactions",
    "image": "./images/Album 1.png",
    "order_id": info.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
    "callback_url": "/is-order-completed",//send a post req to this url
    "prefill": {//info from ui - logged in user
        "name": "Gaurav Kumar",
        "email": "gaurav.kumar@example.com",
        "contact": "9999999999"
    },
    "notes": {
        "address": "Razorpay Corporate Office"
    },
    "theme": {
        "color": "#000000"
    }
};

    var rzp1 = new Razorpay(options);
    rzp1.open();
    e.preventDefault();
        
        })

}
}

function removeCartItem(event) {
    var buttonClicked = event.target
    buttonClicked.parentElement.parentElement.remove()
    updateCartTotal()
}

function quantityChanged(event) {
    var input = event.target
    if (isNaN(input.value) || input.value <= 0) {
        input.value = 1
    }
    updateCartTotal()
}

function addToCartClicked(event) {
    var button = event.target
    var shopItem = button.parentElement.parentElement
    var title = shopItem.getElementsByClassName('shop-item-title')[0].innerText
    var price = shopItem.getElementsByClassName('shop-item-price')[0].innerText
    var imageSrc = shopItem.getElementsByClassName('shop-item-image')[0].src
    addItemToCart(title, price, imageSrc)
    updateCartTotal()
}

function addItemToCart(title, price, imageSrc) {
    var cartRow = document.createElement('div')
    cartRow.classList.add('cart-row')
    var cartItems = document.getElementsByClassName('cart-items')[0]
    var cartItemNames = cartItems.getElementsByClassName('cart-item-title')
    for (var i = 0; i < cartItemNames.length; i++) {
        if (cartItemNames[i].innerText == title) {
            alert('This item is already added to the cart')
            return
        }
    }
    var cartRowContents = `
        <div class="cart-item cart-column">
            <img class="cart-item-image" src="${imageSrc}" width="100" height="100">
            <span class="cart-item-title">${title}</span>
        </div>
        <span class="cart-price cart-column">${price}</span>
        <div class="cart-quantity cart-column">
            <input class="cart-quantity-input" type="number" value="1">
            <button class="btn btn-danger" type="button">REMOVE</button>
        </div>`
    cartRow.innerHTML = cartRowContents
    cartItems.append(cartRow)
    cartRow.getElementsByClassName('btn-danger')[0].addEventListener('click', removeCartItem)
    cartRow.getElementsByClassName('cart-quantity-input')[0].addEventListener('change', quantityChanged)
}

function updateCartTotal() {
    var cartItemContainer = document.getElementsByClassName('cart-items')[0]
    var cartRows = cartItemContainer.getElementsByClassName('cart-row')
    var total = 0
    for (var i = 0; i < cartRows.length; i++) {
        var cartRow = cartRows[i]
        var priceElement = cartRow.getElementsByClassName('cart-price')[0]
        var quantityElement = cartRow.getElementsByClassName('cart-quantity-input')[0]
        var price = parseFloat(priceElement.innerText.replace('$', ''))
        var quantity = quantityElement.value
        total = total + (price * quantity)
    }
    total = Math.round(total * 100) / 100
    document.getElementsByClassName('cart-total-price')[0].innerText = '$' + total
}