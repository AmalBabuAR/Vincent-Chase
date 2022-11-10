const db = require('../config/connection')
const collection=require('../config/collections')
const bcrypt = require('bcrypt')
const { response } = require('express')
const objectId = require('mongodb').ObjectId

module.exports ={
    doSignup:(userData)=>{
        return new Promise(async(resolve,reject) =>{
            userData.Password=await bcrypt.hash(userData.Password,10)
            db.get()
              .collection(collection.USER_COLLECTION)
              .insertOne(userData)
              .then((data)=>{
                resolve(userData.Password)
              })
        })
    },
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject) =>{
            let loginStatus = false
            let response={}
            let user = await db
                                .get()
                                .collection(collection.USER_COLLECTION)
                                .findOne({Email:userData.Email})
            if(user){
               
               bcrypt.compare(userData.Password,user.Password).then((status)=>{
                    if(status){
                        if(user.Status=='false'){
                            console.log('login success')
                        response.user=user
                        response.status=true
                        resolve(response)
                    }else{
                        console.log('pw in')
                        response.userblocked=true
                        resolve(response)

                    }
                    
                        }else{
                            console.log('pw in')
                            response.incorrectPwd=true
                            resolve(response)
                        }
                        
                })
            }else{
                console.log('us in2')
                response.incorrectUser=true
                resolve(response)
            }                    
        })
    },
    addToCart:(proId,userId)=>{
        let proObj={
            item:objectId(proId),
            quantity:1
        }
        return new Promise (async(resolve,reject) =>{
            let userCart= await db
                                  .get()
                                  .collection(collection.CART_COLLECTION)
                                  .findOne({user:objectId(userId)})
            if(userCart){
                let proExist=userCart.products.findIndex(product=>product.item==proId)
                console.log(proExist);
                if(proExist!=-1){
                    db.get()
                      .collection(collection.CART_COLLECTION)
                       .updateOne({user:objectId(userId ),'products.item':objectId(proId)},
                        {
                           $inc:{'products.$.quantity':1}
                        }
                        ).then(()=>{
                        resolve()
                         })                 
                }else{
                    db.get()
                      .collection(collection.CART_COLLECTION)
                      .updateOne({user:objectId(userId)},
                        {
                                $push:{products:proObj}
                        }
                      ).then((response)=> {
                        resolve()
                      })

                }
                
            }else{
                let cartObj ={
                    user:objectId(userId),
                    products:[proObj]
                }
                db.get()
                  .collection(collection.CART_COLLECTION)
                  .insertOne(cartObj)
                        .then((response) => {
                            resolve()
                        })
            }
        })
    },
    getCartProducts:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cartItems= await db
                                   .get()
                                   .collection(collection.CART_COLLECTION)
                                   .aggregate([
                                    {
                                        $match:{user:objectId(userId)}
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
                                            as:"product"
                                        }
                                    },
                                    {
                                        $project:{
                                            item:1,
                                            quantity:1,
                                            product:{
                                                $arrayElemAt:['$product',0]
                                            }
                                        }
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
                                   ]).toArray()
                                //    console.log(cartItems[0].products);
                                   resolve(cartItems)
                                   console.log(cartItems);
        })
    },
    getCartCount:(userId) => {
        return new Promise(async(resolve,reject) => {
            let count=0
            let cart = await db
                               .get()
                               .collection(collection.CART_COLLECTION)
                               .findOne({user:objectId(userId)})
            if(cart){
                count=cart.products.length
            }
            resolve(count)
        })
    },
    changeProductQuantity:(details)=>{
        console.log('in change qty');
        details.count = parseInt(details.count)
        details.quantity=parseInt(details.quantity)

        return new Promise((resolve,reject)=>{
            if(details.count==-1 && details.quantity==1){
                db.get()
                  .collection(collection.CART_COLLECTION)
                  .updateOne({_id:objectId(details.cart)},
                    {
                       $pull:{products:{item:objectId(details.product)}}
                    }
                    ).then((response)=>{
                      resolve({removeProduct:true})
                     })
                }else{
                    db.get()
                      .collection(collection.CART_COLLECTION)
                      .updateOne({_id:objectId(details.cart),'products.item':objectId(details.product)},
                        {
                          $inc:{'products.$.quantity':details.count}
                        }
                        ).then((response)=>{
                             resolve(true)
                        })
                }
        })
    },
    getTotalAmount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let total= await db
                                   .get()
                                   .collection(collection.CART_COLLECTION)
                                   .aggregate([
                                    {
                                        $match:{user:objectId(userId)}
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
                                            as:"product"
                                        }
                                    },
                                    {
                                        $project:{
                                            item:1,
                                            quantity:1,
                                            product:{
                                                $arrayElemAt:['$product',0]
                                            }
                                        }
                                    },
                                    {
                                        $group:{
                                            _id:null, 
                                              total:{$sum:{$multiply:['$quantity',{$toInt:'$product.Price'}]}}
                                        }
                                    }
                                   ]).toArray()
                                   console.log(total[0].total); 
                                   resolve(total[0].total)
                                  
        })
    },
    blockUser:(userId,details) =>{
        return new Promise((resolve,reject) =>{
            db.get()
              .collection(collection.USER_COLLECTION)
              .updateOne({_id:objectId(userId)},{
                $set:{
                    Status:details.Status
                }
              }).then((response)=>{
                resolve()
              })
        })
    },
    UnblockUser:(userId,details) =>{
        return new Promise((resolve,reject) =>{
            db.get()
              .collection(collection.USER_COLLECTION)
              .updateOne({_id:objectId(userId)},{
                $set:{
                    Status:details.Status
                }
              }).then((response)=>{
                resolve()
              })
        })
    },
  
}