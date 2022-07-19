var db = require('../config/connection')
var collection = require('../config/collections')
const collections = require('../config/collections')
const { resolve, reject } = require('promise')
const { response } = require('express')
const { ObjectId } = require('mongodb')
var objectId = require('mongodb').ObjectId

module.exports = {
  addProduct: (product, callback) => {
    let pro = {
      productName: product.productName,
      Category: objectId(product.Category),
      subCategory: product.subCategory,
      brand: product.brand,
      price: parseInt(product.price),
      stock: product.stock,
      description: product.description
    }
    db.get().collection('product').insertOne(pro).then((data) => {
      callback(data.insertedId)
    })
  },
  getAllProductss: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
      resolve(products)
    })
  },
  deleteProduct: (proId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: objectId(proId) }).then((response) => {
        resolve(response)
      })

    })
  },
  getProductDetails: (proId) => {
    return new Promise(async (resolve, reject) => {
      let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(proId) })

      resolve(product)
    })
  },
  updateProduct: (proId, productDetails) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(proId) }, {
        $set: {
          productName: productDetails.productName,
          Category: productDetails.Category,
          price: productDetails.price,
          stock: productDetails.stock,
          subCategory: productDetails.subCategory,
          brand: productDetails.brand,
          description: productDetails.description
        }
      }, { upsert: true }
      ).then((response) => {
        resolve()
      })
    })
  },
  AddCategory: (data) => {
    return new Promise(async (resolve, reject) => {
      let response = {}
      let category = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ categoryName: data.categoryName })
      console.log(category);
      if (category) {
        response.category = true
        response.data = category.categoryName
        resolve(response)
      }
      else {
        db.get().collection(collection.CATEGORY_COLLECTION).insertOne(data)
        response.category = false
        resolve(response)
      }
    })
  },
  getAllCategory: () => {
    return new Promise(async (resolve, reject) => {
      let category = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
      console.log(category);
      resolve(category)
    })
  },
  getCategory: (catId) => {
    return new Promise(async (resolve, reject) => {
      let category = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ _id: objectId(catId) })
      resolve(category)
    })
  },
  getAllOrders: () => {
    return new Promise(async (resolve, reject) => {
      let orders = await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
      resolve(orders)
    })

  },
  changeOrderStatus: (orderId, status) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, {
        $set: {
          status: status.status
        }
      }).then((response) => {
        resolve(response)
      })
    })
  },

  getDailySales: () => {
    return new Promise(async (resolve, reject) => {

      let dailysales = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match: {
            "status": { $nin: ['cancelled', 'pending'] }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$time" } },
            total: { $sum: '$total' },
            count: { $sum: 1 },
          }
        },
        {
          $sort: { _id: 1 },
        }
      ]).toArray()
      resolve(dailysales)
      console.log(dailysales);
    })
  },
  getMonthlySales: () => {
    return new Promise(async (resolve, reject) => {

      let monthlySales = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match: {
            "status": { $nin: ['cancelled', 'pending'] }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$time" } },
            total: { $sum: '$total' },
            count: { $sum: 1 },
          }
        },
        {
          $sort: { _id: 1 },
        }
      ]).toArray()
      resolve(monthlySales)
      console.log(monthlySales);
    })
  },
  getYearlySales: () => {
    return new Promise(async (resolve, reject) => {

      let yearlySales = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match: {
            "status": { $nin: ['cancelled', 'pending'] }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y", date: "$time" } },
            total: { $sum: '$total' },
            count: { $sum: 1 },
          }
        },
        {
          $sort: { _id: 1 },
        }
      ]).toArray()
      resolve(yearlySales)
      console.log(yearlySales);
    })
  },
  addOffer: (offerData) => {
    offerData.status = true
    return new Promise(async (resolve, reject) => {
      db.get().collection(collection.OFFER_COLLECCTION).insertOne(offerData).then((response) => {
        response.status = true
        resolve(response)
      })

    })
  },
  getAllOffers: () => {
    return new Promise(async (resolve, reject) => {
      let offers = await db.get().collection(collection.OFFER_COLLECCTION).find().toArray()
      resolve(offers)
    })
  },
  deleteOffer: (offreId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.OFFER_COLLECCTION).deleteOne({ _id: objectId(offreId) }).then((response) => {
        resolve(response)
      })
    })
  },
  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
        {
          $lookup:
          {
            from: "category",
            localField: "Category",
            foreignField: "_id",
            as: "category"
          }
        }
        ,
        {
          $replaceRoot: 
          { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$category", 0] }, "$$ROOT"] } }
        },
        { $project: { fromItems: 0 ,category:0} }

      ]).toArray()
      resolve(products)
    })
  },
  applyProductOffer:(proId,offerId)=>{
    return new Promise (async (resolve,reject)=>{
      let offer=await db.get().collection(collection.OFFER_COLLECCTION).findOne({_id:objectId(offerId)})
        let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)})
        let dPercentage=offer.dPercentage
        let price = parseInt( product.price)
        await db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(proId)},{
          $set:{
            MRP:price,
            price:parseInt((price-((price*dPercentage)/100))),
            dPercentage:dPercentage
          }
        })

        resolve(response)
    })
  },
  removeOffer:(proId)=>{
    return new Promise ((resolve,reject)=>{
      db.get().collection(collection.PRODUCT_COLLECTION).updateOne({proId},{
        $unset:{dPrice}
      })
    })
  }

  // ,
  // getProduct:(proId)=>{
  //     let response={}
  //     return new Promise(async (resolve,reject)=>{
  //         let product= await db.get().collection(collection.PRODUCT_COLLECTION).find({_id:objectId(proId)})
  //         let categoryId=product.category
  //         console.log(product);
  //         console.log('kkkkkkkkkkkkkkkkkkkkkkk');
  //         console.log(categoryId);
  //        let category=await db.get().collection(collection.CATEGORY_COLLECTION).find({category:categoryId})
  //        console.log(category);
  //        response.product=product
  //        response.category=category
  //         resolve(response)
  //     })
  // }
}