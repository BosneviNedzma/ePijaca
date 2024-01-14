const { query } = require("express");
const Product = require("../Models/ProductModel");
const User = require("../Models/UserModel");
const asyncHandler = require("express-async-handler");
const slugify = require('slugify');
const validateMongoDbId = require('../Utils/ValidateMongodbId');

const createProduct = asyncHandler(async (req, res)=>{
    try{
        if(req.body.title){
            req.body.slug = slugify(req.body.title);
        }
        const newProduct = await Product.create(req.body);
        res.json(newProduct);
    }catch(error){
        throw new Error(error);
    }
});

const updateProduct = asyncHandler(async (req, res) => {
    const id = req.params.id;
    try {
      if (req.body.title) {
        req.body.slug = slugify(req.body.title);
      }
      const updateProduct = await Product.findOneAndUpdate({_id: id}, req.body, {
        new: true,
      });
      res.json(updateProduct);
    } catch (error) {
      throw new Error(error);
    }
  });

  const deleteProduct = asyncHandler(async (req, res) => {
    const id = req.params.id;
    try {
      const deleteProduct = await Product.findOneAndDelete(id);
      res.json(deleteProduct);
    } catch (error) {
      throw new Error(error);
    }
  });


const getaProduct = asyncHandler (async (req, res)=>{
    try{
      const findProduct = await Product.findById(id);
      res.json(findProduct);
    }catch(error){
        throw new Error(error);
    }
});

const getAllProduct = asyncHandler(async (req, res)=>{
    try{
      const queryObj = { ... req.query};
      const exludeFields = ["page", "sort", "limit", "fields"];
      exludeFields.forEach((el) => delete queryObj[el]);
      console.log(queryObj);
      let queryStr = JSON.stringify(queryObj);
      queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
      let query = Product.find (JSON.parse(queryStr));

      //Sorting
      if(req.query.sort){
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
      }else{
        query = query.sort('-createdAt');
      }

      // limiting the fields
      if(req.query.fields){
        const fields = req.query.fields.split(",").join(" ");
        query = query.select(fields);
      }else{
        query = query.select("-__v");
      };

      //pagination

      const page = req.query.page;
      const limit = req.query.limit;
      const skip = (page - 1)*limit;
      query = query.skip(skip).limit(limit);
      if(req.query.page){
        const productCount = await Product.countDocuments();
        if(skip>= productCount) throw new Error('This Page does not exists');
      }
      console.log(page, limit, skip);
      const product = await query;
      res.json(product);
    }catch(error){
        throw new Error(error);
    }
});

const addToWishList = asyncHandler(async(req,res)=>{
  const {_id} = req.user;
  const {productId} = req.body;
  try{
    const user = await User.findById(_id);
    const alreadyAdded = user.wishList.find((id) => id.toString() === productId);
    if(alreadyAdded){
      let user = await User.findByIdAndUpdate(_id, {
        $pull: {wishList: productId},
      },{
        new: true,
      });
      res.json(user);
    }else{
      let user = await User.findByIdAndUpdate(_id, {
        $push: {wishList: productId},
      },{
        new: true,
      });
      res.json(user);
    }
  }catch(error){
    throw new Error(error);
  }
});

const rating = asyncHandler(async(req, res)=>{
  const {_id} = req.user;
  const {star, productId, comment} = req.body;
  try{
    const product = await Product.findById(productId);
  let alreadyRated = product.ratings.find((userId)=>userId.postedby.toString() === _id.toString());
  if(alreadyRated){
    const updateRating = await Product.updateOne(
      {ratings:{$elemMatch:alreadyRated},},
      {$set:{"ratings.$.star":star, "ratings.$.comment":comment},},
      {new:true,}
    );
  }else{
    const rateProduct = await Product.findByIdAndUpdate(productId,{
        $push:{
          ratings:{
            star:star,
            comment:comment,
            postedby:_id,
          },
        },
    },{
      new:true,
    });
  }
  const getAllRatings = await Product.findById(productId);
  let totalRating = getAllRatings.ratings.length;
  let ratingSum = getAllRatings.ratings
      .map((item)=>item.star)
      .reduce((previous,current)=>previous+current,0);
  let actualRating = Math.round(ratingSum/totalRating);
  let finalProduct = await Product.findByIdAndUpdate(productId, {
    totalrating: actualRating,
  }, {new:true});
  res.json(finalProduct);
  }catch(error){
    throw new Error(error);
  }
});

module.exports ={createProduct, getaProduct, getAllProduct, updateProduct, deleteProduct, addToWishList, rating};