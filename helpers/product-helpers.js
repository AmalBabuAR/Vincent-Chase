const db = require('../config/connection')
const collection=require('../config/collections')
const objectId = require('mongodb').ObjectId

module.exports={

    addProduct:(product,callback) =>{
        db.get().collection(collection.PRODUCT_COLLECTION)
          .insertOne(product)
          .then((data) => {
            callback(product._id)
          })
    },
    getAllProducts:() => {
        return new Promise(async(resolve,reject)=>{
            let products =await db.get()
                             .collection(collection.PRODUCT_COLLECTION)
                             .find()
                             .toArray()
            resolve(products)                 
        })
    },
    deleteProducts:(prodId) => {
        return new Promise((resolve,reject) => {
            console.log(prodId);
            console.log(objectId(prodId));
            db.get()
              .collection(collection.PRODUCT_COLLECTION)
              .deleteOne({_id:objectId(prodId)})
                .then((responce) =>{
                    // console.log(responce);
                    resolve(responce)
                })
        })
    },
    getProductDetails:(prodId)=> {
        return new Promise((resolve,reject) => {
            db.get()
              .collection(collection.PRODUCT_COLLECTION)
              .findOne({_id:objectId(prodId)})
                .then((product) => {
                    resolve(product)
                })
        })
    },
    getAllUsers:() =>{
        return new Promise(async(resolve,reject) =>{
            let users = await db.get()
                            .collection(collection.USER_COLLECTION)
                            .find()
                            .toArray()
            resolve(users)
        })
    },
    updateProduct:(prodId,proDetails) => {
        return new Promise((resolve,reject) => {
            db.get()
              .collection(collection.PRODUCT_COLLECTION)
              .updateOne({_id:objectId(prodId)},{
                $set:{
                    Name:proDetails.Name,
                    Description:proDetails.Description,
                    Price:proDetails.Price,
                    Category:proDetails.Category
                }
              }).then((responce) =>{
                resolve()
              })
        })
    },
    addCategory:(category,callback)=>{
        console.log(category);
        db.get().collection(collection.CATEGORY_COLLECTION)
          .insertOne(category)
          .then((data)=>{
            callback(category._id)
          })
    },
    getAllCategory:()=>{
        return new Promise(async(resolve,reject)=>{
            let category = await db.get()
                                   .collection(collection.CATEGORY_COLLECTION)
                                   .find()
                                   .toArray()
            resolve(category)                       
        })
    },
    deleteCategory:(cateId) => {
        return new Promise ((resolve ,reject) =>{
            db.get()
              .collection(collection.CATEGORY_COLLECTION)
              .deleteOne({_id:objectId(cateId)})
                .then((responce) =>{
                    resolve(responce)
                })
        })
    },
    getCategoryDetails:(cateId)=>{
        return new Promise ((resolve,reject)=> {
            db.get()
              .collection(collection.CATEGORY_COLLECTION)
              .findOne({_id:objectId(cateId)})
                .then((category)=>{
                    resolve(category)
                })
        })
    },
    updateCategory:(cateId,cateDetails) =>{
        return new Promise((resolve,reject) => {
            db.get()
              .collection(collection.CATEGORY_COLLECTION)
              .updateOne({_id:objectId(cateId)},{
                $set:{
                    Category:cateDetails.Category
                }
              }).then((responce)=> {
                resolve()
              })
        })
    }




}