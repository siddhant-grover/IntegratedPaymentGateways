var stripe = Stripe(
  "pk_test_51Ig7NWSFN78cA4x1nCeIU9HLLIBGth1p3Bnk7Lq2ngxJIPUFsX1jSPPmodeyCSL00VDDEVdwsdcDCrFGlbEkBrkp00YQFJpQeS"
);
function purchaseClicked(e) {
  console.log("Payment Function invoked ");
  //change this so when we click on purchase button
  priceElement = document.getElementById("total-price");
  var amount = parseFloat((parseFloat(priceElement.value) * 100).toFixed(2)); //converting to cents//get amount from from backend or total cart value
  if (amount <= 0) {
    alert("Enter a valid mount ");
    return;
  }
  if (document.getElementById("gateways").value === "Stripe") {
    fetch("/stripe", {
      method: "POST",
      body: JSON.stringify({
        amount,
        currency: "USD",
        name: "Generic Store Items",
        image:
          "https://onlinecourses.one/wp-content/uploads/2019/08/Best-Adobe-After-Effects-Course-Class-Programs-Tutorial-Training-Certification-Online.jpg",
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (session) {
        return stripe.redirectToCheckout({sessionId: session.id});
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
  if (document.getElementById("gateways").value === "Paypal") {
    fetch("/paypal", {
      method: "POST",
      maxRedirects: 0,
      body: JSON.stringify({
        amount: parseFloat(amount / 100).toFixed(2),
        currency: "USD",
        name: "Generic Store Items",
        description: "Our products are high quality",
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        window.location = data.forwardLink;
      })
      .catch((err) => {
        console.log(err);
      });
  }

  if (document.getElementById("gateways").value === "Razorpay") {
    fetch("/razorpay", {
      method: "POST",
      body: JSON.stringify({
        amount: amount,
        currency: "USD",
      }),
      headers: {"Content-Type": "application/json"},
    })
      .then((resp) => resp.json())
      .then((info) => {
        var options = {
          key: "rzp_test_qRDRpOoJR0OGFp", // Enter the Key ID generated from the Dashboard
          // "amount": "50000", // Amount is in currency sub units. Default currency is INR. Hence, 50000 refers to 50000 paise
          // "currency": "INR",
          name: "Sample Store",
          description: "Test Transactions",
          image: "./images/Album 1.png",
          order_id: info.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
          callback_url: "/is-razorpay-order-completed", //send a post req to this url
          prefill: {
            //info from ui - logged in user
            name: "Gaurav Kumar",
            email: "gaurav.kumar@example.com",
            contact: "9999999999",
          },
          notes: {
            address: "Razorpay Corporate Office",
          },
          theme: {
            color: "#000000",
          },
        };

        var rzp1 = new Razorpay(options);
        rzp1.open();
        e.preventDefault();
      })
      .catch((err) => {
        console.log(err);
      });
  }
}
