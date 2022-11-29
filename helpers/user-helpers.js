const db = require("../config/connection");
const collection = require("../config/collections");
const bcrypt = require("bcrypt");
const { response } = require("express");
const { ObjectID } = require("bson");
const objectId = require("mongodb").ObjectId;
const Razorpay = require('razorpay');
const { resolve } = require("path");
const { request } = require("http");
const dotenv = require("dotenv").config()
const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

var instance = new Razorpay({
  key_id: 'rzp_test_TlOxM5vAeO4Wbp',
  key_secret: 'eWI3ldO7a2wLmExYo5MZI2oO',
});

module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      userData.Password = await bcrypt.hash(userData.Password, 10);
        client
              .verify
              .services(process.env.Service_SID)
              .verifications
              .create({
                  to:`+91${userData.Number}`,
                  channel:"sms"
              }).then((data)=>{
                  (Name1 = userData.Name),
                  (Mobilenumber1 = userData.Number),
                  (Password1 = bcrypt.hashPassword),
                  (Email1 = userData.Email)
                res.redirect('/otpSignupVerify')
              })
      db.get()
        .collection(collection.USER_COLLECTION)
        .insertOne(userData)
        .then((data) => {
          resolve(userData.Password);
        });
    });
  },
 otpSignupVerifyPost: (req, res) => {
    if (req.body.otp.length === 6) {
      client.verify
        .services(process.env.Service_SID)
        .verificationChecks.create({
          to: `+91${Mobilenumber1}`,
          code: req.body.otp,
        })
        .then((data) => {
          if (data.status === "approved") {
            const user = new User({
              Name: Name1,
              Mobilenumber: Mobilenumber1,
              Email: Email1,
              Password: Password1,
            });
            user
              .save()
              .then((result) => {
                console.log("otp signup successful");
              })
              .catch((err) => {
                console.log(err);
              });
            res.redirect("/");
          } else {
            session = req.session;
            session.invalidOTP = true;
            res.redirect("/otpLoginVerify");
          }
        });
    } else {
      session = req.session;
      session.invalidOTP = true;
      res.redirect("/otpLoginVerify");
    }
  },
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ Email: userData.Email });
      if (user) {
        bcrypt.compare(userData.Password, user.Password).then((status) => {
          if (status) {
            if (user.Status == "false") {
              console.log("login success");
              response.user = user;
              response.status = true;
              resolve(response);
            } else {
              console.log("pw in");
              response.userblocked = true;
              resolve(response);
            }
          } else {
            console.log("pw in");
            response.incorrectPwd = true;
            resolve(response);
          }
        });
      } else {
        console.log("us in2");
        response.incorrectUser = true;
        resolve(response);
      }
    });
  },
  addToCart: (proId, userId) => {
    let proObj = {
      item: objectId(proId),
      quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
      let userCart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      if (userCart) {
        let proExist = userCart.products.findIndex(
          (product) => product.item == proId
        );
        console.log(proExist);
        if (proExist != -1) {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: objectId(userId), "products.item": objectId(proId) },
              {
                $inc: { "products.$.quantity": 1 },
              }
            )
            .then(() => {
              resolve();
            });
        } else {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: objectId(userId) },
              {
                $push: { products: proObj },
              }
            )
            .then((response) => {
              resolve();
            });
        }
      } else {
        let cartObj = {
          user: objectId(userId),
          products: [proObj],
        };
        db.get()
          .collection(collection.CART_COLLECTION)
          .insertOne(cartObj)
          .then((response) => {
            resolve();
          });
      }
    });
  },
  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: {
                $arrayElemAt: ["$product",0],
              },
            },
          }
          // {
          //     $lookup:{
          //         from:collection.PRODUCT_COLLECTION,
          //         let:{prodList:'$products'},
          //         pipeline:[
          //             {
          //                 $match:{
          //                     $expr:{
          //                         $in:['$_id','$$prodList']
          //                     }
          //                 }
          //             }
          //         ],
          //         as:'cartItems'
          //     }
          // }
        ])
        .toArray();
      //    console.log(cartItems[0].products);
      resolve(cartItems);
    });
  },
  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      if (cart) {
        count = cart.products.length;
      }
      resolve(count);
    });
  },
  changeProductQuantity: (details) => {
    console.log("in change qty");
    details.count = parseInt(details.count);
    details.quantity = parseInt(details.quantity);

    return new Promise((resolve, reject) => {
      // if (details.count == -1 && details.quantity == 1) {
      //   db.get()
      //     .collection(collection.CART_COLLECTION)
      //     .updateOne(
      //       { _id: objectId(details.cart) },
      //       {
      //         $pull: { products: { item: objectId(details.product) } },
      //       }
      //     )
      //     .then((response) => {
      //       resolve({ removeProduct: true });
      //     });
      // } else {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            {
              _id: objectId(details.cart),
              "products.item": objectId(details.product),
            },
            {
              $inc: { "products.$.quantity": details.count },
            }
          )
          .then((response) => {
            let count = response
            console.log(count);
            console.log("quantity");
            console.log(count.quantity);
            resolve({ status: true },response.quantity);
          });
      // }
    });
  },
  getCartQuantity:(details) =>{
    console.log('getCartQuantity');
    console.log(details);

    return new Promise((resolve,reject)=>{

      if (details.count == -1 && details.quantity == 1) {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            { _id: objectId(details.cart) },
            {
              $pull: { products: { item: objectId(details.product) } },
            }
          )
          .then((response) => {
            resolve({ removeProduct: true });
          });
        }else{
          db.get()
            .collection(collection.CART_COLLECTION)
            .aggregate([
              {
                $match: { _id: objectId(details.cart) },
              },
              {
                $unwind: "$products",
              },
              {
                $project: {
                  item: "$products.item",
                  quantity: "$products.quantity",
                },
              },
              {
                $match :{item :objectId(details.product) }
              },
              
            ])
            .toArray()
            // .find({quantity : 1})
            .then((responce)=>{
              resolve(responce[0].quantity);
              
            })
          }
    })

  },
  getTotalAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let total = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: {
                $arrayElemAt: ["$product", 0],
              },
            },
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: {
                  $multiply: ["$quantity", { $toInt: "$product.Price" }],
                },
              },
            },
          },
        ])
        .toArray();
      resolve(total[0]?.total);
    });
  },
  blockUser: (userId, details) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(userId) },
          {
            $set: {
              Status: details.Status,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },
  UnblockUser: (userId, details) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(userId) },
          {
            $set: {
              Status: details.Status,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },
  placeOrder: (order, products, total) => {
    return new Promise((resolve, reject) => {
      console.log(order);
      let status = order["payment-method"] === "COD" ? "Placed" : "Pending";
      let orderObj = {
        deliveryDetails: {
          name: order.name,
          mobile: order.mobile,
          address: order.address,
          pincode: order.pincode,
        },
        userId: objectId(order.userId),
        paymentMethod: order["payment-method"],
        products: products,
        totalAmount: total,
        status: status,
        date:new Date()
      };

      db.get()
        .collection(collection.ORDER_COLLECTION)
        .insertOne(orderObj)
        .then((response) => {
          db.get()
            .collection(collection.CART_COLLECTION)
            .deleteOne({ user: objectId(order.userId) });
          resolve(response.insertedId);
        });
    });
  },
  getCartProductList: (userId) => {
    console.log(userId)
    return new Promise(async (resolve, reject) => {
      console.log("in ppppp");

      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ "user": objectId(userId) });
     
      resolve(cart?.products);
    });
  },
  getUserOrders:(userId)=>{
    return new Promise(async(resolve,reject)=>{
      console.log(userId);
      let orders=await db.get()
                         .collection(collection.ORDER_COLLECTION)
                         .find({userId:objectId(userId)})
                         .toArray()
                 
                  resolve(orders)
    })
  },
  getOrderProducts:(orderId)=>{
    return new Promise(async(resolve,reject)=>{
      let orderItems = await db.get()
                               .collection(collection.ORDER_COLLECTION)
                               .aggregate([
                                {
                                  $match:{_id:objectId(orderId)}
                                },
                                {
                                  $unwind:'$products'
                                },
                                {
                                  $project:{
                                    item:'$products.item',
                                    quantity:'$products.quantity'
                                  }
                                },
                                {
                                  $lookup:{
                                    from:collection.PRODUCT_COLLECTION,
                                    localField:'item',
                                    foreignField:'_id',
                                    as:'product'
                                  }
                                },
                                {
                                  $project:{
                                    item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                                  }
                                }
                               ]).toArray()
                              
                               resolve(orderItems)
    })
  },
  
  generateRazorpay:(orderId,total)=>{
    return new Promise((resolve,reject)=>{
      var options = {
        amount: total*100,  // amount in the smallest currency unit
        currency: "INR",
        receipt: ""+orderId
      };
      instance.orders.create(options, function(err, order) {
        if(err){
          console.log(err);
        }else{
        console.log('new order :',order);
        resolve(order)
        }
      });
    })
  },
  verifyPayment:(details)=>{
    return new Promise((resolve,reject)=>{
      const crypto = require("crypto");
      let hmac = crypto.createHmac('sha256', 'eWI3ldO7a2wLmExYo5MZI2oO')
      
      hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
      hmac=hmac.digest('hex')
      if(hmac==details['payment[razorpay_signature]']){
        resolve()
      }else{
        reject()
      }

    })
  },
  changePayementStatus:(orderId)=>{
    return new Promise((resolve,reject)=>{
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne({_id:objectId(orderId)},
        {
          $set:{
            status:'Placed'
          }
        }
        ).then(()=>{
          resolve()
        })
    })
  },
  removeCartProduct:(cartId,userId)=>{
    return new Promise((resolve,reject)=>{
      console.log("cardDBid");
      console.log(cartId);
      db.get()
        .collection(collection.CART_COLLECTION)
        .updateOne({
          user:objectId(userId)
        },{
          $pull:{products:{item:objectId(cartId)}}
        })
        .then((response)=>{
          resolve({ removeCart:true})
        })
    })
  },
  getAllOrders:() => {
    return new Promise(async(resolve,reject) => {
      let orders = await db.get()
                           .collection(collection.ORDER_COLLECTION)
                           .find()
                           .toArray()
                          resolve(orders)
    })
  },
  updateStatus:(_id,statusUpdate)=>{
    console.log(_id,statusUpdate);
    return new Promise ((resolve,reject)=>{
                      db.get()
                        .collection(collection.ORDER_COLLECTION)
                        .updateOne({_id:objectId(_id)},{
                          $set:{
                            status:statusUpdate
                          }
                        }).then((response)=>{
                          resolve()
                        })
    })
  },
  addProfileAddress:(address)=>{
    let add = {
      name: address.first_name,
      mobile: address.mobile,
      pincode: address.pincode,
      address: address.address
    }
    return new Promise((resolve,reject)=>{
                      db.get()
                        .collection(collection.USER_COLLECTION)
                        .updateOne({_id: objectId(address.userId)},
                        {
                          $push: { address: add }
                        }
                        ).then((response)=>{
                          resolve()
                        })
    })
  },
  getUserAddress:(userId)=>{
    // console.log("insid db get user add");
    // console.log(userId);
    return new Promise(async(resolve,reject)=>{
           let address = await db.get()
                        .collection(collection.USER_COLLECTION)
                        .findOne({_id:objectId(userId._id)},{
                          address:1
                        })
                        console.log("after find one");
                        console.log(address.address);
                          resolve(address.address)
                       
                             
    })
  }





}
