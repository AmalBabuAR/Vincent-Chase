const { response, urlencoded } = require('express')
const express = require('express')
const router = express.Router()
const {check, validationResult} = require('express-validator')
const urlencodedParser =express.urlencoded({ extended:true })
const productHelper = require('../helpers/product-helpers')
const userHelper = require('../helpers/user-helpers')
const verifyLogin=(req,res,next)=>{
    if(req.session.loggedIn){
        next()
    }else{
        res.redirect('/login')
    }
}
/**
 * @discription Home page
 * @method Get/
 */
router.get('/',async (req,res,next) =>{
    let users=req.session.user
    console.log(users);
    let cartCount=null
    if(req.session.user){
    cartCount = await userHelper.getCartCount(req.session.user._id)
    }
    productHelper.getAllProducts()
        .then((products)=>{
           res.render('user/Cards',{users,products,home:true,cartCount}) 
        })
})

router.get('/singleview/:id',async(req,res)=>{
    let product =await productHelper.getProductDetails(req.params.id)
    res.render('user/single',{product,home:true})
})


/**
 * @discription login
 * @method Get/login
 */
router.get('/login', (req,res) =>{
if(req.session.loggedIn){
    res.redirect('/')
}else{
    res.render('user/login',{"loginErr":req.session.loginErr,signin:true})
    req.session.loginErr=false
} 
});
/**
 * @discription login
 * @method Post/login
 */
router.post('/login',(req,res) =>{
    userHelper.doLogin(req.body).then((response)=>{
            if(response.status){
                req.session.loggedIn=true
                req.session.user=response.user
                res.redirect('/')
            }else if(response.incorrectPwd){
                res.render('user/login',{pwd:"incorrect password",signin:true})
            }else if(response.userblocked){
                res.render('user/login',{user:"user blocked",signin:true})
            }else{
                res.render('user/login',{user:"incorrect user",signin:true})
            }
        })}     
    )
/**
 * @discription logout session distroyed
 * @method Get/logout
 */
router.get('/logout',(req,res)=>{
    req.session.destroy()
    res.redirect('/')
})
/**
 * @discription signup
 * @method Get/signup
 */
router.get('/signup', (req,res) =>{
    res.render('user/signup',{signin:true})
});
/**
 * @discription signup validation
 * @method Get/signup
 */
router.post('/signup',urlencodedParser,[
    check('Name').notEmpty()
    .withMessage('Enter a Name'),
    check('Number').matches(/[\d]{10}/)
    .withMessage("Enter a valid mobile number"),
    check('Number').matches(/^[6-9][\d]{9}/)
    .withMessage("Enter a valid mobile number"),
    check('Email').notEmpty()
    .withMessage('Enter a username'),
    check('Email').matches(/^\w+([\._]?\w+)?@\w+(\.\w{2,3})(\.\w{2})?$/)
    .withMessage("Username must be a valid email id"),
    check('Password').matches(/[\w\d!@#$%^&*?]{8,}/)
    .withMessage("Password must contains 8 characters"),
    check('Password').matches(/[a-z]/)
    .withMessage("Password must contains 1 lowercase letter"),
    check('Password').matches(/[A-Z]/)
    .withMessage("Password must contains 1 uppercase letter"),
    check('Password').matches(/\d/)
    .withMessage("Password must contains 1 number"),
    check('Password').matches(/[!@#$%^&*?]/)
    .withMessage("Password must contains 1 special character")
  ],(req,res) => {
      const errors = validationResult(req)
      if(!errors.isEmpty()){
          // return res.status(422).jsonp(errors.array())
          userErr =errors.errors.find(item=>item.param==='Name') || '';
          numberErr =errors.errors.find(item=>item.param==='Number') || '';
          emailErr =errors.errors.find(item=>item.param==='Email') || '';
          passwordErr =errors.errors.find(item=>item.param==='Password') || '';
          // console.log(userErr.msg);
          res.render('user/signup',{ name:userErr.msg, number:numberErr.msg, email:emailErr.msg, password:passwordErr.msg })
      }else{ 
           userHelper.doSignup(req.body).then((response) =>{
              console.log(response);
              console.log('dddsdfsdfs');
              req.session.loggedIn=true
              req.session.user=response
              res.redirect('/')
          })
      }   
  })
/**
 * @discription cart
 * @method Get/cart
 */
router.get('/cart',verifyLogin,async(req,res) =>{
    let products=await userHelper.getCartProducts(req.session.user._id)
    let totalValue=await userHelper.getTotalAmount(req.session.user._id)
    
    console.log(products);
    res.render('user/cart',{products,user:req.session.user._id,totalValue})
});
//using demo cart
router.get('/democart',verifyLogin,async(req,res)=>{
    let users=req.session.user
    let cartCount=null
    console.log('count........');
    if(req.session.user){
        console.log("session");
    cartCount = await userHelper.getCartCount(req.session.user._id)
    }

    let products=await userHelper.getCartProducts(req.session.user._id)
    let totalValue=await userHelper.getTotalAmount(req.session.user._id)
    console.log('00000000000000');
    console.log(req.session.user);
    res.render('user/CartDemo' ,{home:true,products,users,cartCount,totalValue,user:req.session})
})


/**
 * @discription cart
 * @method Get/add-to-cart
 */
router.get('/add-to-cart/:id',(req,res)=>{
    console.log('api call');
    userHelper.addToCart(req.params.id,req.session.user._id) //after resolving then
        .then(() => {
            res.json({status:true})
        })
})
/**
 * @discription cart
 * @method Post/change-product-quantity
 */
router.post('/changeproductquantity',(req,res,next) =>{
    console.log(req.body);
  
    userHelper.changeProductQuantity(req.body).then(async(response)=>{
        response.total=await userHelper.getTotalAmount(req.body.user)
          res.json(response)
    }) 
})
router.get('/place-order',verifyLogin,async(req,res)=>{
    let total= await userHelper.getTotalAmount(req.session.user._id)
 
    res.render('user/place-order',{total,admin:true})
})


module.exports = router; 