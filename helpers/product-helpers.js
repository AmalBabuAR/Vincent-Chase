const db = require('../config/connection')
const collection = require('../config/collections')
const objectId = require('mongodb').ObjectId

module.exports = {

  addProduct: (pro, callback) => {
    let Discount = pro.Price*((100-pro.ProductOffer)/100)
    const product ={
      Name : pro.Name ,
      Category : pro.Category,
      Price : pro.Price,
      ProductOffer : pro.ProductOffer,
      DiscountPrice :  Math.round(Discount),
      Stocks : parseInt(pro.Stocks) ,
      Description : pro.Description
    }
    db.get().collection(collection.PRODUCT_COLLECTION)
      .insertOne(product)
      .then((data) => {
        callback(product._id)
      })
  },
  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .find()
        .toArray()
      resolve(products)
    })
  },
  deleteProducts: (prodId) => {
    return new Promise((resolve, reject) => {
      console.log(prodId);
      console.log(objectId(prodId));
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .deleteOne({ _id: objectId(prodId) })
        .then((responce) => {
          // console.log(responce);
          resolve(responce)
        })
    })
  },
  getProductDetails: (prodId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: objectId(prodId) })
        .then((product) => {
          resolve(product)
        })
    })
  },
  getAllUsers: () => {
    return new Promise(async (resolve, reject) => {
      let users = await db.get()
        .collection(collection.USER_COLLECTION)
        .find()
        .toArray()
      resolve(users)
    })
  },
  updateProduct: (prodId, proDetails) => {
    console.log("pro", proDetails);
    let Discount = proDetails.Price*((100-proDetails.ProductOffer)/100)
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne({ _id: objectId(prodId) }, {
          $set: {
            Name: proDetails.Name,
            Description: proDetails.Description,
            Price: proDetails.Price,
            ProductOffer: proDetails.ProductOffer,
            DiscountPrice : Math.round(Discount),
            Category: proDetails.Category,
            Stocks: parseInt(proDetails.Stocks)
          }
        }).then((responce) => {
          resolve()
        })
    })
  },
  addCategory: (category, callback) => {
    console.log(category);
    db.get().collection(collection.CATEGORY_COLLECTION)
      .insertOne(category)
      .then((data) => {
        callback(category._id)
      })
  },
  getAllCategory: () => {
    return new Promise(async (resolve, reject) => {
      let category = await db.get()
        .collection(collection.CATEGORY_COLLECTION)
        .find()
        .toArray()
      resolve(category)
    })
  },
  deleteCategory: (cateId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CATEGORY_COLLECTION)
        .deleteOne({ _id: objectId(cateId) })
        .then((responce) => {
          resolve(responce)
        })
    })
  },
  getCategoryDetails: (cateId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CATEGORY_COLLECTION)
        .findOne({ _id: objectId(cateId) })
        .then((category) => {
          resolve(category)
        })
    })
  },
  updateCategory: (cateId, cateDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CATEGORY_COLLECTION)
        .updateOne({ _id: objectId(cateId) }, {
          $set: {
            Category: cateDetails.Category
          }
        }).then((responce) => {
          resolve()
        })
    })
  },
  addCoupon: (coupon) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.COUPON_COLLECTION)
        .insertOne(coupon)
        .then((responce) => {
          resolve()
        })
    })
  },
  getCoupon: (couponDetails) => {
    console.log("comes to db");
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.COUPON_COLLECTION)
        .findOne({
          coupon: couponDetails.coupon
        })
        .then((getCoupon) => {
          resolve(getCoupon)

        })
    })
  },
  addCouponUser: (coupon, userId) => {

    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.COUPON_COLLECTION)
        .updateOne({ coupon: coupon }, {
          $push: {
            user: objectId(userId)
          }
        })
        .then(() => {
          resolve()
        })
    })
  },
  getAllCoupon: () => {
    return new Promise(async (resolve, reject) => {
      let coupons = await db.get()
        .collection(collection.COUPON_COLLECTION)
        .find()
        .toArray()
      resolve(coupons)
    })
  },
addSales:(product) =>{
  return new Promise((resolve,reject)=>{
    product.forEach((value,index)=>{
      console.log("value and indeszx");
      console.log(value,index);
      const proId = product[index].item
      // const stock = value.quantity.toString()
      // const sales = value.quantity
      
      console.log("addd sales db ");
      console.log(proId);
              db.get()
                .collection(collection.PRODUCT_COLLECTION)
                .updateOne({_id:proId},
                  {
                    $inc: {Sales: value.quantity, Stocks: -value.quantity}
                  })
      
    })
  })

},
  getTotalSumOfOrders: () => {
    return new Promise(async (resolve, reject) => {
      let total = await db.get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([{
          $group: {
            _id: "",
            "totalAmount": { $sum: '$totalAmount' }
          }
        }, {
          $project: {
            _id: 0,
            "total": '$totalAmount'
          }
        }])
        .toArray()
      resolve(total[0]?.total)
    })
  },
  getAllOrdersCount: () => {
    return new Promise(async (resolve, reject) => {
      let orders = await db.get()
        .collection(collection.ORDER_COLLECTION)
        .find()
        .count()
      resolve(orders)
    })
  },
  getAllUsersCount: () => {
    return new Promise(async (resolve, reject) => {
      let AllUsers = await db.get()
        .collection(collection.USER_COLLECTION)
        .find()
        .count()
      resolve(AllUsers)
    })
  },
  getAllProductsCount: () => {
    return new Promise(async (resolve, reject) => {
      let AllProducts = await db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .find()
        .count()
      resolve(AllProducts)
    })

  },
  getTimeOfSaleOrder: () => {
    return new Promise(async (resolve, reject) => {
      let orderDates = await db.get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $project: { _id: 0, date: 1 }
          }
        ])
        .toArray()
      timeOfSale = []
      for (let orderDate of orderDates) {
        timeOfSale.push(orderDate.date.toISOString().substring(0, 10))
      }
      resolve(timeOfSale)
    })
  },
  getAmountOfSale:()=>{
    return new Promise(async(resolve,reject)=>{
      let orderAmount = await db.get()
                                 .collection(collection.ORDER_COLLECTION)
                                 .aggregate([
                                  {
                                    $project: {
                                      _id:0,
                                      totalAmount:1
                                    }
                                  }
                                 ])
                                 .toArray()
                  amountOfSale = []
                  for(let amount of orderAmount){
                    amountOfSale.push(amount.totalAmount)
                  }
                  console.log(amountOfSale);
                  resolve(amountOfSale)
    })
  }




}