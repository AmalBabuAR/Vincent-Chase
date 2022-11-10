const express = require('express')
const router = express.Router()
const productHelper = require('../helpers/product-helpers')
const userHelpers = require('../helpers/user-helpers')
const credential = {
    email:"admin@123.com",
    password:"1234"
}

/**
 * @discription login
 * @method Get/login
 */
 router.get('/', (req,res) => {
    res.render('admin/login')
})
/**
 * @discription login
 * @method Post/login
 */
router.post('/', (req,res) => {
    if(req.body.email == credential.email && req.body.password == credential.password){
        req.session.user = req.body.email;
        res.redirect('/admin/dashbord')
        // res.end("login succesfull")
        
    }else{
        res.render('admin/login',{msg:"invalid admin"})
    }
});
/**
 * @discription dashbord
 * @method Get/dashbord
 */
router.get('/dashbord', (req,res,next) =>{
    productHelper.getAllProducts()
        .then((products)=>{
           console.log(products);
           res.render('admin/view-products',{products, admin:true}) 
        })
});
/**
 * @discription adding products
 * @method Get/add-product
 */
router.get('/add-product', (req,res) => {
    productHelper.getAllCategory()
        .then((category)=> {
            console.log(category);
             res.render('admin/add-product',{category,admin: true })
        })
   
})
/**
 * @discription giving product to db
 * @method Post/add-product
 */
router.post('/add-product', (req,res) => {
    // console.log(req.body)
    // console.log(req.files.image);
    productHelper.addProduct(req.body,(id) =>{
        let image = req.files.Image
        console.log(id);
        image.mv('./public/product-image/'+id+'.jpg',(err,done)=>{
            if(!err){
               res.redirect('/admin/add-product') 

            }else{
                console.log(err);
            }
        }) 
    })
})
/**
 * @discription for user details
 * @method Get/users
 */
router.get('/users', (req,res,next) =>{
    productHelper.getAllUsers()
        .then((users)=>{
           res.render('admin/view-user',{users, admin:true}) 
        })    
});
router.post('/userblock/:id',(req,res)=> {
    let userId = req.params.id
    console.log(userId);
    userHelpers.blockUser(req.params.id,req.body)

        .then(()=>{
            res.redirect('/admin/users')
        })
})
router.post('/userUnblock/:id',(req,res)=> {
    let userId = req.params.id
    console.log(userId);
    userHelpers.UnblockUser(req.params.id,req.body)

        .then(()=>{
            res.redirect('/admin/users')
        })
})
/**
 * @discription for a particular product
 * @method Get/delete-product
 */
router.get('/delete-product/:id',(req,res) =>{
    let prodId = req.params.id
    console.log(prodId);
    productHelper.deleteProducts(prodId)  
        .then((responce) =>{
            res.redirect('/admin/dashbord')
        })
})
/**
 * @discription for edit product ,product from db
 * @method Get/edit-product
 */
router.get('/edit-product/:id', async (req,res) => {
    let product = await productHelper.getProductDetails(req.params.id)
    console.log(product);   
    res.render('admin/edit-product',{product,admin:true})
})
/**
 * @discription geting data from body,id and update in db
 * @method Post/edit-product
 */
router.post('/edit-product/:id', (req,res) =>{
    console.log(req.params.id);
    let id =req.params.id
    productHelper.updateProduct(req.params.id,req.body)
    
        .then(()=>{
            res.redirect('/admin/dashbord')
            if(req.files){
                let image = req.files.Image 
                image.mv('./public/product-image/'+id+'.jpg')
            }
        })
})
/**
 * @discription Category
 * @method Get/category
 */
router.get('/category',(req,res)=>{
    productHelper.getAllCategory()
        .then((category)=>{
            console.log(category);
            res.render('admin/category',{category,admin:true})
        })
    
})
/**
 * @discription details from cate form
 * @method post/add-category
 */
router.post('/add-category',(req,res) =>{
    productHelper.addCategory(req.body,(id)=>{
        console.log(req.body);
        res.redirect('/admin/category')
    })
})
/**
 * @discription deleting a Category
 * @method Get/delete-category
 */
router.get('/delete-category/:id',(req,res) => {
    let cateId =req.params.id
    console.log(cateId);
    productHelper.deleteCategory(cateId)
      .then((responce)=> {
        res.redirect('/admin/category')
      })
})
/**
 * @discription edit-Category
 * @method Get/edit-category
 */
router.get('/edit-category/:id',async(req,res) => {
    let category= await productHelper.getCategoryDetails(req.params.id)
    console.log(category);
    res.render('admin/edit-category',{category,admin:true})
})
/**
 * @discription form details of editCategory
 * @method Post/edit-category
 */
router.post('/edit-category/:id', (req,res)=>{
    console.log(req.params.id);
    let id = req.params.id
    productHelper.updateCategory(req.params.id,req.body)

        .then(()=>{
            res.redirect('/admin/category')
        })
})
module.exports = router;