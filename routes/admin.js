const { response } = require('express');
var express = require('express');
const { addCategory, getCategory } = require('../helpers/product-helpers');
// const { Session } = require('express-session');
var router = express.Router();
var productHelpers=require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');
var objectId = require('mongodb').ObjectId
const verify=(req,res,next)=>{
if(req.session.admin){
next()
}else{
  res.redirect('/admin/login')
}
}


/* GET users listing. */
router.get('/',verify, function(req, res) {
  res.render('admin/admin-dashboard',{adminUi:true})
});
router.get('/login',(req,res)=>{
  if(req.session.admin){
    res.redirect('/admin')
  }else{
    res.render('admin/admin-login',{adminUi:true,"loginErr":req.session.loginErr})
    
    req.session.loginErr=false
  }

})

router.post('/login',(req,res)=>{
  let credentials={
    adminId:"admin@gmail.com",
    password:123
  }
  if(req.body.adminId==credentials.adminId&&req.body.password==credentials.password){
    req.session.admin=true
    res.redirect('/admin')  
    
  }else{
    
    req.session.loginErr='invalid Id or Password'
    res.redirect('/admin/login')
  }
})

//logout

router.get('/logout',(req,res)=>{
  // req.session.admin=false
  
  req.session.destroy();
  res.redirect('/admin')

})

// add product
router.get('/add-product',verify,(req,res)=>{
  productHelpers.getAllCategory().then((category)=>{
    console.log(category);
    res.render('admin/add-product',{adminUi:true,category})
  })
  
})

router.post('/add-product',(req,res)=>{

  console.log(req.body);
  
  console.log(req.files.Image);
  productHelpers.addProduct(req.body,(id)=>{
    console.log(id);
    let image=req.files.Image
    image.mv('./public/product-images/'+id+'.jpg',(err)=>{
      if(!err){
        res.redirect('/admin/add-product')
      }else{
        console.log(err);
      }
    })

   
  })
})

router.get('/view-products',verify,(req,res)=>{
  productHelpers.getAllProducts().then(async(products)=>{
    // let category=await productHelpers.getAllCategory(products)
    console.log('ttttttttttttttttttttttttttttt');
    console.log(products);
    res.render('admin/view-products',{adminUi:true,products})
  })
  
})

router.get('/view-users',verify,(req,res)=>{
  userHelpers.getAllUsers().then((users)=>{
    res.render('admin/view-users',{adminUi:true,users})
  })
  
})


router.get('/delete-product/:id',verify,(req,res)=>{
  let proId=req.params.id
  console.log(proId);
  productHelpers.deleteProduct(proId).then((response)=>{
    res.redirect('/admin/view-products')
  })
 
})

router.get('/edit-product',verify,(req,res)=>{
  let proId=req.query.id
  // console.log(proId);
 productHelpers.getProductDetails(proId).then((product)=>{
  res.render('admin/edit-product',{adminUi:true,product})
 })
})

router.post('/edit-product:id',(req,res)=>{
  let id=req.params.id
  let image=req.files.Image
  productHelpers.updateProduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin/view-products')
    if(req.files.Image){
      image.mv('./public/product-images/'+id+'.jpg')
    }
  })
})

router.get('/add-category',verify,(req,res)=>{
  res.render('admin/add-category',{adminUi:true,"categoryStatus":req.session.categoryStatus})
  req.session.categoryStatus=false
})

router.post('/add-category',(req,res)=>{
  productHelpers.
  AddCategory(req.body).then((response)=>{
    
    if(response.category){
      let category=response.data
      req.session.categoryStatus=`${category} already exists`
      res.redirect('/admin/add-category')
    }else{
        req.session.categoryStatus='Category added succesfully'
        res.redirect('/admin/add-category')
    }
  })
})

router.get('/view-orders',verify, (req,res)=>{
  productHelpers.getAllOrders().then((orders)=>{
    console.log(orders);
    res.render('admin/view-orders',{adminUi:true,orders})
  })
 
})
router.post('/change-order-status/:id',(req,res)=>{
  console.log(req.params);
  console.log(req.body);
  productHelpers.changeOrderStatus(req.params.id,req.body).then((response)=>{
    res.json({status:true})
  })
})

router.get('/sales-report',verify,async (req,res)=>{
  let dailySales=await productHelpers.getDailySales()
  let monthlySales=await productHelpers.getMonthlySales()
  let yearlySales=await productHelpers.getYearlySales()
  res.render('admin/sales-report',{adminUi:true,dailySales,monthlySales,yearlySales})
})



// offers

router.get('/manage-offers',async(req,res)=>{
  let products= await productHelpers.getAllProducts()
  let offers= await productHelpers.getAllOffers()
  console.log(products);
  console.log(offers);
  res.render('admin/manage-offers',{adminUi:true,products,offers})


})

router.post('/add-offer',(req,res)=>{
  productHelpers.addOffer(req.body).then((response)=>{
    res.json(response)
  })
})

router.post('/delete-offer/:id',(req,res)=>{
  console.log(req.params.id);
  productHelpers.deleteOffer(req.params.id).then((response)=>{
    res.json(response)
  })
})

router.post('/apply-offer/:id',(req,res)=>{
  console.log(req.params.id);
  console.log(req.body);
  productHelpers.applyProductOffer(req.body.proId,req.body.offerId).then((response)=>{
    res.redirect('/admin/manage-offers')
  })
})












module.exports = router;
