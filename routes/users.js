var express = require('express');
const session = require('express-session');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');
var otp = require('../helpers/otp')
var client = require('twilio')(otp.accountSID, otp.authToken)
const paypal = require('paypal-rest-sdk');


const verifyLogin = (req, res, next) => {
  if (req.session.userLoggedin) {
    next()
  } else {
    res.redirect('/login')
  }
}
const verify = (req, res, next) => {
  if (req.session.signup) {
    next()
  } else {
    res.redirect('/')
  }
}


/* GET home page. */
router.get('/', async function (req, res, next) {
  let user = req.session.user
  let cartCount = null
  if (user) {
    cartCount = await userHelpers.getCartCount(user._id)
  }
  productHelpers.getAllProducts().then((products) => {
    res.render('users/index', { userUi: true, products, user, cartCount });
  })

});

router.get('/shop', async (req, res) => {
  let user = req.session.user
  let cartCount = null
  if (user) {
    cartCount = await userHelpers.getCartCount(user._id)
  }
  productHelpers.getAllProducts().then(async(products) => {
    let category=await productHelpers.getAllCategory()
    console.log('jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj');
    console.log(category);
    res.render('users/shop', { userUi: true, products, user, cartCount,category })
  })

})
router.get('/login', (req, res) => {
  if (req.session.user) {
    res.redirect('/')
  } else {
    res.render('users/login-page', { "loginErr": req.session.userloginErr })
    req.session.userloginErr = false

  }

})
router.post('/login', (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {

    if (response.status) {
      if (response.user.status) {
        req.session.user = response.user
        req.session.userLoggedin = true
        res.redirect('/')
      } else {
        req.session.userloginErr = 'User Blocked'
        res.redirect('/login')
      }
    }
    else {
      req.session.userloginErr = 'invalid user or password'
      res.redirect('/login')
    }
  })
  // res.redirect('/')
})

router.get('/logout', (req, res) => {

  req.session.user = null
  req.session.userLoggedin = false
  res.redirect('/')
})

router.get('/signup', (req, res) => {
  if (req.session.user) {
    res.redirect('/')
  } else
    res.render('users/signup-page', { userexistErr: req.session.userexistErr })
  req.session.userexistErr = false
  req.session.signup = true
})

router.post('/signup', (req, res) => {
  userHelpers.userExist(req.body).then((response) => {
    if (response.user) {
      req.session.userexistErr = 'User already exist'
      res.redirect('/signup')
    } else {
      // otptextMessage()
      var Number = req.body.mobile
      req.session.phone = Number
      req.session.userdata = req.body


      client.verify
        .services(otp.serviseSID)
        .verifications
        .create({
          to: `+91${Number}`,
          channel: 'sms'
        })
        .then((data) => {

          res.redirect('/otp-verify')
        })
    }
  })


})

router.get('/otp-verify', verify, (req, res) => {
  res.render('users/otpVerify')
})

router.post('/otp-verify', (req, res) => {
  var Number = req.session.phone
  var otps = req.body.number
  client.verify
    .services(otp.serviseSID)
    .verificationChecks.create({
      to: `+91${Number}`,
      code: otps
    })
    .then((data) => {
      if (data.status == 'approved') {
        userHelpers.doSignup(req.session.userdata).then((response) => {
          req.session.signup = false
          res.redirect('/login')
        })
      } else {
        otpErr = 'Invalid OTP'
        res.redirect('/otpVerify', { otpErr, Number })
      }

    });

})

// single-product route

router.get('/single-product:id', (req, res) => {
  let user = req.session.user
  productHelpers.getProductDetails(req.params.id).then((product) => {
    let catId = product.Category
    productHelpers.getCategory(catId).then((category) => {
      res.render('users/single-product', { userUi: true, product, user, category })
    })

  })

})

// router.get('/add-address', (req, res) => {
//   res.render('users/add-address', { userUi: true })
// })

// router.get('/view-address', verifyLogin, (req, res) => {
//   console.log(req.session.user);
//   let userAddresses = req.session.user.Addresses
//   console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@')
//   console.log(userAddresses);
//   res.render('users/view-address', { userUi: true, userAddresses })
// })




// block User  unblock
router.get('/admin/block-user/:id', (req, res) => {
  let id = req.params.id
  console.log(id);
  userHelpers.blockUser(id).then((response) => {
    res.redirect('/admin/view-users')
  })
})


router.get('/admin/unblock-user/:id', (req, res) => {
  let id = req.params.id
  userHelpers.unblockUser(id).then((response) => {
    res.redirect('/admin/view-users')
  })
})

router.get('/cart', verifyLogin, async (req, res) => {
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  let products = await userHelpers.getCartProducts(req.session.user._id)
  let subTotal= await userHelpers.getSubtotal(req.session.user._id)
  console.log('aaaaaaaaaaa');
  console.log(subTotal);
  user = req.session.user
  res.render('users/cart', { userUi: true, user, products, total,subTotal })
})


router.get('/add-to-cart/:id', verifyLogin, (req, res) => {
  userHelpers.addTocart(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true })
  })
})

router.post('/change-product-quantity', (req, res, next) => {
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelpers.getTotalAmount(req.body.user)
    // response.cartData=await userHelpers.getSubtotal(req.body.user)
   
    res.json(response)
  })
})

router.get('/place-order', verifyLogin, async (req, res) => {
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  let userAddresses= await userHelpers.getAllUserAddress(req.session.user._id)
  res.render('users/checkout', { userUi: true, total, user:req.session.user,userAddresses })
})

router.post('/place-order', async (req, res) => {

  let products = await userHelpers.getCartProductList(req.body.userId)
  let totalPrice = await userHelpers.getTotalAmount(req.body.userId)

  userHelpers.placeOrder(req.body, products, totalPrice).then((orderId) => {

    if (req.body.paymentMethod == 'COD') {
      res.json({ codSuccess: true })
    } else if(req.body.paymentMethod == 'online') {
      userHelpers.generateRazorpay(orderId, totalPrice).then((response) => {
        res.json({onlineSuccess:true,response}) 
      })
    }else{
      userHelpers.generatePaypal(orderId,totalPrice).then((response)=>{
        req.session.total=totalPrice
        req.session.orderId=orderId
        response.paypalSuccess=true
        res.json(response)
      })
    }

  })
  
  console.log(req.body);
})

router.get('/orders', verifyLogin, async (req, res) => {

  let orders = await userHelpers.getUserOrders(req.session.user._id)
  res.render('users/view-orders', { userUi: true, user: req.session.user, orders })
})

router.get('/view-order-products:id', verifyLogin, async (req, res) => {
  let products = await userHelpers.getOrderProducts(req.params.id)
  res.render('users/view-order-products', { userUi: true, user: req.session.user, products })
})

router.get('/user-profile', verifyLogin, async (req, res) => {
  let userAddresses =await userHelpers.getAllUserAddress(req.session.user._id)
  res.render('users/user-profile', { userUi: true, user: req.session.user,userAddresses })
})

router.get('/user-address', verifyLogin, (req, res) => {
  userHelpers.getAllUserAddress(req.session.user._id).then((Addresses)=>{
    console.log(Addresses);
    res.render('users/view-address', { userUi: true,Addresses,user: req.session.user})
  })
  
})

router.post('/verify-payment', (req, res) => {
  userHelpers.verifyPayment(req.body).then(() => {
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
      console.log('Payment success');
      res.json({ status: true })
    })
  }).catch(() => {
    // console.log(err);
    res.json({ status: false, errMsg: 'Payment Failed' })
  })


})

router.post('/add-address/:id', (req, res) => {
  userHelpers.addUserAddress(req.body,req.params.id).then(() => {
    res.redirect('/user-address')
  })
})

router.get('/change-password', verifyLogin, (req, res) => {
  res.render('users/change-password', { userUi: true, user: req.session.user })

})

router.post('/change-password',verifyLogin,(req,res)=>{
  let userId=req.session.user._id
  userHelpers.changePassword(req.body,userId).then((response)=>{
    res.json({status:true})
  })
})

router.post('/cancel-order/:id',verifyLogin,(req,res)=>{
  console.log(req.params.id);
  userHelpers.cancelOrder(req.params.id).then((response)=>{
    res.json({status:true})
  })
})

router.post('/edit-profile',(req,res)=>{
  
  userHelpers.editUserProfile(req.body).then((response)=>{
    res.json({status:true})
  })
})

router.get('/success', (req, res) => {
  totalPrice=req.session.total
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;

  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
        "amount": {
            "currency": "USD",
            "total": totalPrice
        }
    }]
  };

  paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
    if (error) {
        console.log(error.response);
        throw error;
    } else {
        console.log(JSON.stringify(payment));
        userHelpers.changePaymentStatus(req.session.orderId)
        req.session.total=null
        req.session.orderId=null
        res.redirect('/orders')
    }
});
});



router.post('/edit-address/:id',(req,res)=>{
  userHelpers.updateAddress(req.params.id,req.body,req.body.userId).then((response)=>{
    res.redirect('/user-address')
  })
})


router.post('/delete-address/:id',(req,res)=>{
  console.log(req.body);
  userHelpers.deleteAddress(req.body.addressId,req.body.userId)
})




module.exports = router;
