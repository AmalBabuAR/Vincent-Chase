const { response, urlencoded } = require("express");
const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const { ObjectId, Db } = require("mongodb");
const urlencodedParser = express.urlencoded({ extended: true });
const productHelper = require("../helpers/product-helpers");
const userHelper = require("../helpers/user-helpers");

router.use((req, res, next) => {
  // changing layout for my admin panel
  req.app.set("layout", "layout/layout");
  next();
});

const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next();
  } else {
    res.redirect("/login");
  }
};
/**
 * @discription Home page
 * @method Get/
 */
router.get("/", async (req, res, next) => {
  let users = req.session.user;
  console.log(users);
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id);
  }
  let category = await productHelper.getAllCategory();
  let products = await productHelper.getAllProducts();

  res.render("user/Cards", {
    users,
    products,
    home: true,
    cartCount,
    category,
  });
});

router.get("/singleview/:id", async (req, res) => {
  let product = await productHelper.getProductDetails(req.params.id);
  let category = await productHelper.getAllCategory();
  res.render("user/single", { product, home: true, category });
});

/**
 * @discription login
 * @method Get/login
 */
router.get("/login", (req, res) => {
  if (req.session.loggedIn) {
    res.redirect("/");
  } else {
    res.render("user/login", { loginErr: req.session.loginErr, signin: true });
    req.session.loginErr = false;
  }
});
/**
 * @discription login
 * @method Post/login
 */
router.post("/login", (req, res) => {
  userHelper.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true;
      req.session.user = response.user;
      res.redirect("/");
    } else if (response.incorrectPwd) {
      res.render("user/login", { pwd: "incorrect password", signin: true });
    } else if (response.userblocked) {
      res.render("user/login", { user: "user blocked", signin: true });
    } else {
      res.render("user/login", { user: "incorrect user", signin: true });
    }
  });
});
// router.get('/verify',(req,res)=>{
//     twilio
//     .verify
//     .services(process.env.Service_SID)
//     .verificationChecks
//     .create({
//         to:`+${req.query.phoneNumber}`,
//         code:req.query.code
//     }).then((data)=>{
//         res.status(200).send(data)
//     })
// })
/**
 * @discription logout session distroyed
 * @method Get/logout
 */
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});
/**
 * @discription signup
 * @method Get/signup
 */
router.get("/signup", (req, res) => {
  res.render("user/signup", { signin: true });
});
/**
 * @discription signup validation
 * @method Get/signup
 */
router.post(
  "/signup",
  urlencodedParser,
  [
    check("Name").notEmpty().withMessage("Enter a Name"),
    check("Number")
      .matches(/[\d]{10}/)
      .withMessage("Enter a valid mobile number"),
    check("Number")
      .matches(/^[6-9][\d]{9}/)
      .withMessage("Enter a valid mobile number"),
    check("Email").notEmpty().withMessage("Enter a username"),
    check("Email")
      .matches(/^\w+([\._]?\w+)?@\w+(\.\w{2,3})(\.\w{2})?$/)
      .withMessage("Username must be a valid email id"),
    check("Password")
      .matches(/[\w\d!@#$%^&*?]{8,}/)
      .withMessage("Password must contains 8 characters"),
    check("Password")
      .matches(/[a-z]/)
      .withMessage("Password must contains 1 lowercase letter"),
    check("Password")
      .matches(/[A-Z]/)
      .withMessage("Password must contains 1 uppercase letter"),
    check("Password")
      .matches(/\d/)
      .withMessage("Password must contains 1 number"),
    check("Password")
      .matches(/[!@#$%^&*?]/)
      .withMessage("Password must contains 1 special character"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // return res.status(422).jsonp(errors.array())
      userErr = errors.errors.find((item) => item.param === "Name") || "";
      numberErr = errors.errors.find((item) => item.param === "Number") || "";
      emailErr = errors.errors.find((item) => item.param === "Email") || "";
      passwordErr =
        errors.errors.find((item) => item.param === "Password") || "";
      // console.log(userErr.msg);
      res.render("user/signup", {
        name: userErr.msg,
        number: numberErr.msg,
        email: emailErr.msg,
        password: passwordErr.msg,
      });
    } else {
      userHelper.doSignup(req.body).then((response) => {
        console.log(response);
        console.log("dddsdfsdfs");
        req.session.loggedIn = true;
        req.session.user = response;
        res.redirect("/otpLoginVerify");
      });
    }
  }
);

router.get("/otpLoginVerify", (req, res) => {
  res.render("user/otpLoginVerify", { signin: true });
});

router.post("/otpLoginVerify", (req, res) => {
  userHelper.otpSignupVerifyPost(req, res);
  req.session.user = response;
  req.session.loggedIn = true;
  res.redirect("/");
});
/**
 * @discription cart
 * @method Get/cart
 */
router.get("/cart", verifyLogin, async (req, res) => {
  let products = await userHelper.getCartProducts(req.session.user._id);
  let totalValue = await userHelper.getTotalAmount(req.session.user._id);

  // console.log(products);
  res.render("user/cart", { products, user: req.session.user, totalValue });
});
//using demo cart
router.get("/democart", verifyLogin, async (req, res) => {
  let users = req.session.user;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id);
  }
  let products = await userHelper.getCartProducts(req.session.user._id);
  let totalValue = 0;
  if (products.length > 0) {
    totalValue = await userHelper.getTotalAmount(req.session.user._id);
  }

  let category = await productHelper.getAllCategory();
  // console.log('@@@'+req.session.user._id);
  res.render("user/CartDemo", {
    home: true,
    products,
    users,
    cartCount,
    totalValue,
    user: req.session.user._id,
    category,
  });
});

/**
 * @discription cart
 * @method Get/add-to-cart
 */
router.get("/add-to-cart/:id", (req, res) => {
  console.log("Add to cart");
  userHelper
    .addToCart(req.params.id, req.session.user._id) //after resolving then
    .then(() => {
      res.json({ status: true });
    });
});
/**
 * @discription cart
 * @method Post/change-product-quantity
 */
router.post("/changeproductquantity", (req, res, next) => {
  console.log("check");
  console.log(req.body);

  userHelper.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelper.getTotalAmount(req.body.user);
    response.cartQuantity = await userHelper.getCartQuantity(req.body)
    //       .then((cart)=>{
    //         console.log("cartQuantity");

    //         console.log(cart);
    res.json(response);
  })

  // console.log(response);
  // });
});
router.post("/removecart", (req, res) => {
  let cartId = req.body.cart;
  let userId = req.body.user;

  userHelper.removeCartProduct(cartId, userId).then(async (response) => {
    res.json(response);
  });
});

// router.get('/place-order', verifyLogin, async (req, res) => {
//     let total = await userHelper.getTotalAmount(req.session.user._id);
//     res.render('user/place-order', { total, admin:true,user:req.session.user })
// })
//democart
router.get("/place-order", verifyLogin, async (req, res) => {
  let users = req.session.user;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id);
  }
  let address = await userHelper.getUserAddress(users);
  console.log("adress check", address);
  // let address = users.address
  let total = await userHelper.getTotalAmount(req.session.user._id);
  let category = await productHelper.getAllCategory();
  res.render("user/place-orderDemo", {
    address,
    total,
    user: req.session.user,
    home: true,
    category,
    users,
    cartCount,
  });
});

router.post("/place-order", async (req, res) => {
  let products = await userHelper.getCartProductList(req.body.userId);
  let totalPrice = await userHelper.getTotalAmount(req.body.userId);
  console.log(totalPrice);
  console.log(products);
  if (discountAdded > 0) {
    userHelper.placeOrder(req.body, products, discountAdded).then((orderId) => {
      productHelper.addSales(products)
      productHelper.addCouponUser(coupon, req.body.userId);
      if (req.body["payment-method"] == "COD") {
        res.json({ codSuccess: true });
      } else {
        userHelper.generateRazorpay(orderId, discountAdded).then((response) => {
          res.json(response);
        });
      }
    });
  } else {
    userHelper.placeOrder(req.body, products, totalPrice).then((orderId) => {
      productHelper.addSales(products)
      if (req.body["payment-method"] == "COD") {
        res.json({ codSuccess: true });
      } else {
        userHelper.generateRazorpay(orderId, totalPrice).then((response) => {
          res.json(response);
        });
      }
    });
  }
  console.log(req.body);
});
// router.post('/coupon-check',async(req,res)=>{
//   // console.log(req.body.userId);
//   // console.log("comes to coupon rote check ur id");

//   let totalPrice = await userHelper.getTotalAmount(req.body.userId);
//   productHelper.getCoupoun(req.body)
//   .then((response)=>{
//     req.json(response)
//   })
// })

// ======================================================
let discountAdded;
let coupon;
router.post("/coupon-check", async (req, res) => {
  const userId = req.body.userId;
  // console.log("comes to coupon rote check ur id");
  let totalPrice = await userHelper.getTotalAmount(req.body.userId);
  productHelper
    .getCoupon(req.body)
    .then((findcoupon) => {
      console.log("inside route then findcoupon");
      console.log(findcoupon);
      console.log("user");
      // console.log(findcoupon.user);

      // console.log("user",coupon);
      // console.log("min value");

      // if(findcoupon.user){

      //   findcoupon.user.forEach((user)=>{
      //     if(req.body.userId == ObjectId(user)){
      //       res.json({ status:true, errMsg:"Coupon already used"})
      //     }
      //   })
      // }

      if (findcoupon == null) {
        res.json({ code: true, errMsg: "Invalid Coupon" });
        // console.log("no coupon");
      } else if (findcoupon.user) {
        console.log("inside loop");
        let n = 0;
        for (couponUser of findcoupon.user) {
          if (couponUser == userId) {
            n++;
          }
        }
        if (n > 0) {
          res.json({ status: true, errMsg: "Coupon already used" });
        } else {
          coupon = findcoupon.coupon;
          let value = parseInt(findcoupon.minvalue);
          let discount = parseInt(findcoupon.discount);
  
          if (totalPrice > value) {
            discountAdded = totalPrice - discount;
            res.json({ discountAdded, discount, errMsg: "Coupon Applied" });
            // console.log(discountAdded);
          } else {
            res.json({ value, errMsg: "Amount is Not Enough" });
            // console.log("coupon min value is",value );
          }
        }
      }else {
        coupon = findcoupon.coupon;
        let value = parseInt(findcoupon.minvalue);
        let discount = parseInt(findcoupon.discount);

        if (totalPrice > value) {
          discountAdded = totalPrice - discount;
          res.json({ discountAdded, discount, errMsg: "Coupon Applied" });
          // console.log(discountAdded);
        } else {
          res.json({ value, errMsg: "Amount is Not Enough" });
          // console.log("coupon min value is",value );
        }
      }


    })
    .catch((err) => {
      console.log(err);
    });
});

//=================================================

router.get("/order-success", async (req, res) => {
  let users = req.session.user;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id);
  }
  let category = await productHelper.getAllCategory();
  res.render("user/order-success", {
    home: true, category, users, cartCount
  });
});
router.get("/orders", async (req, res) => {
  let users = req.session.user;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id);
  }
  let category = await productHelper.getAllCategory();

  let orders = await userHelper.getUserOrders(req.session.user._id);

  res.render("user/orders", { orders, home: true, category, users, cartCount });
});
router.get("/view-order-products/:id", async (req, res) => {
  let users = req.session.user;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id);
  }
  let category = await productHelper.getAllCategory();
  let products = await userHelper.getOrderProducts(req.params.id);
  res.render("user/view-order-products", { products, home: true, category, users, cartCount });
});
router.post("/status/:user", (req, res) => {
  userHelper.updateStatus(req.params.user, req.body.status).then(() => {
    res.redirect("/orders");
  });
});

router.post("/verify-payment", (req, res) => {
  console.log(req.body);
  userHelper
    .verifyPayment(req.body)
    .then(() => {
      userHelper.changePayementStatus(req.body["order[receipt]"]).then(() => {
        console.log("Payment Successful ");
        res.json({ status: true });
      });
    })
    .catch((err) => {
      console.log(err);
      res.json({ status: false, errMssg: "Payment failed" });
    });
});
router.get("/profile", async (req, res) => {
  let userId = req.session.user._id;
  let users = req.session.user;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id);
  }
  console.log(userId);
  let category = await productHelper.getAllCategory();
  res.render("user/profile", { home: true, category, userId, users, cartCount });
});
router.post("/address", (req, res) => {
  console.log("address");
  console.log(req.body);
  userHelper.addProfileAddress(req.body);
  res.redirect("/profile");
});
module.exports = router;
