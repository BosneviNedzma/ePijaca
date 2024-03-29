const express = require('express');
const User = require('../Models/UserModel');
const Product = require('../Models/ProductModel');
const Cart = require('../Models/CartModel');
const {generateToken} = require('../Config/jwtToken');
const asyncHandler = require("express-async-handler");
const validateMonngoDBId = require('../Utils/ValidateMongodbId');
const {generateRefreshToken} = require('../Config/refreshtoken');
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const sendEmail = require('./EmailController');
const validateMongoDBId = require('../Utils/ValidateMongodbId');
//Create a user  
const createUser = asyncHandler(async (req, res) => {
    const email = req.body.email;
    const findUser = await User.findOne({email:email});
    if(!findUser) {
        //Create a new user
        const newUser = User.create(req.body);
        res.json(newUser);
    }else{
       throw new Error('User Already Exists');
    }
});

//Login a user 
const loginUserController = asyncHandler(async(req, res) =>{
    const {email, password} = req.body;
    
    const findUser = await User.findOne({email});
    if(findUser && (await findUser.isPasswordMatched(password))){
        const refreshToken = await generateRefreshToken(findUser?._id);
        const updateUser = await User.findByIdAndUpdate(findUser.id, {refreshToken: refreshToken}, {new:true});
        res.cookie('refreshToken', refreshToken,{
            httpOnly:true,
            maxAge:72*60*60*1000,
        } );
        res.status(200).json({
        _id: findUser?._id,
        firstName: findUser?.firstName,
        lastName: findUser?.lastName,
        email: findUser?.email,
        mobile: findUser?.mobile,
        token: generateToken(findUser?._id),
        });
    }else{
        throw new Error("Invalid Credentials");
    }
});

//Admin login
const loginAdmin = asyncHandler(async(req, res) =>{
    const {email, password} = req.body;
    
    const findAdmin = await User.findOne({email});
    if(findAdmin.role !== 'admin') throw new Error('Not Authorized');
    if(findAdmin && (await findAdmin.isPasswordMatched(password))){
        const refreshToken = await generateRefreshToken(findAdmin?._id);
        const updateUser = await User.findByIdAndUpdate(findAdmin.id, {refreshToken: refreshToken}, {new:true});
        res.cookie('refreshToken', refreshToken,{
            httpOnly:true,
            maxAge:72*60*60*1000,
        } );
        res.status(200).json({
        _id: findAdmin?._id,
        firstName: findAdmin?.firstName,
        lastName: findAdmin?.lastName,
        email: findAdmin?.email,
        mobile: findAdmin?.mobile,
        token: generateToken(findAdmin?._id),
        });
    }else{
        throw new Error("Invalid Credentials");
    }
});

//Handle refresh token
const handleRefreshToken = asyncHandler(async(req, res) =>{
    const cookie = req.cookies;
    if(!cookie?.refreshToken) throw new Error('No Refresh Token in Cookies');
    const refreshToken = cookie.refreshToken;
    const user = await User.findOne({refreshToken });
    if(!user) throw new Error('No Refresh Token present in db or not matched');
    jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded)=>{
        if(err || user.id !== decoded.id){
            throw new Error('There is something wrong with refresh token!');
        }
        const accessToken = generateToken(user?._id);
        res.json({accessToken});
    });

});

//Logout functionality
const logout = asyncHandler(async (req, res) => {
    const cookie = req.cookies;
    if (!cookie?.refreshToken) throw new Error("No Refresh Token in Cookies");
    const refreshToken = cookie.refreshToken;
    const user = await User.findOne({ refreshToken });
    if (!user) {
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
      });
      return res.sendStatus(204); // forbidden
    }
    await User.findOneAndUpdate({ refreshToken: refreshToken }, {
      refreshToken: "",
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
    });
    res.sendStatus(204); // forbidden
  });

//Update a user
const updateaUser = asyncHandler(async(req,res)=>{
    const{id} = req.user;
    validateMonngoDBId(id);
    try{
        const updateUser = await User.findByIdAndUpdate(id, {
            firstName:req?.body?.firstName,
            lastName:req?.body?.lastName,
            email:req?.body?.email,
            mobile:req?.body?.mobile,
        },
        {
            new:true,
        });
        res.json(updateUser)
    }catch(error){
        throw new Error(error);
    }
});

function getAddressDataFromRequest(req) {
    return {
      country: req?.body?.country,
      city: req?.body?.city,
      postalCode: req?.body?.postalCode,
      street: req?.body?.street,
    };
  }
  
//Save user address
const saveAddress = asyncHandler(async(req,res, next)=>{
    const{_id} = req.user;
    validateMonngoDBId(_id);

    try{
        const addressData = getAddressDataFromRequest(req);

        const updatedUser = await User.findByIdAndUpdate(
        _id,
        { address: addressData,},
        { new: true }
  );
    
        res.json(updatedUser)
    }catch(error){
        throw new Error(error);
    }
});

//Get all users
const getAllUsers = asyncHandler(async(req, res) =>{
    try{
        const getUsers = await User.find();
        res.json(getUsers);
    }catch(error){
        throw new Error(error)
    }
})

//Get a single user
const getaUser = asyncHandler(async(req, res) =>{
    const {id} = req.params;
    validateMonngoDBId(id);
    try{
        const getaUser = await User.findById(id);
        res.json({getaUser});
    }catch(error){
        throw new Error(error);
    }
})

//Delete a single user
const deleteaUser = asyncHandler(async(req, res) =>{
    const {id} = req.params;
    validateMonngoDBId(id);
    try{
        const deleteaUser = await User.findByIdAndDelete(id);
        res.json({
            deleteaUser,
        });
    }catch(error){
        throw new Error(error);
    }
})

const blockUser = asyncHandler(async(req, res) =>{
    const {id} = req.params;
    validateMonngoDBId(id);
    try{
        const block = await User.findByIdAndUpdate(id,{
            isBlocked:true,
        },{
            new:true,
        });
        res.json({
            message:"User Blocked",
        });
    }catch(error){
        throw new Error(error);
    }
});
const unblockUser = asyncHandler(async(req, res) =>{
    const {id} = req.params;
    validateMonngoDBId(id);
    try{
        const unblock = await User.findByIdAndUpdate(id,{
            isBlocked:false,
        },{
            new:true,
        });
        res.json({
            message:"User UnBlocked",
        });
    }catch(error){
        throw new Error(error);
    }
});

const updatePassword = asyncHandler(async(req,res)=>{
    const {_id} = req.user;
    const password = req.bdoy;
    validateMonngoDBId(_id);
    const user = await User.findById(_id);
    if(password){
        user.password = password;
        const updatedPassword = await user.save();
        res.json(updatedPassword);
    }else{
        res.json(user);
    }
});

const forgotPasswordToken = asyncHandler(async (req, res)=>{
    const {email} = req.body;
    const user = await User.findOne({email});
    if(!user) throw new Error("User not found with this email");
    try{
        const token = await user.createPasswordResetToken();
        await user.save();
        const resetURL = `Hi, Please follow this link to reset Your Password. This link is valid till 10 minutes from now. <a href='http://localhost:5000/api/user/reset-password/${token}'>Click Here</>`;
        const data = {
            to:email,
            text:"Hey User",
            subject:"Forgot Password Link",
            htm:resetURL,
        };
        sendEmail(data);
        res.json(token);
    }catch(error){
        throw new Error(error);
    }
});

const resetPassword = asyncHandler(async (req, res)=>{
    const {password} = req.body;
    const {token} = req.params;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
        passwordResetToken:hashedToken,
        passwordResetExpires:{$gt:Date.now()},
    });
    if(!user) throw new Error("Token Expired, Please try again later.");
    user.password = password;
    user.passwordResetToken = undefined,
    user.passwordResetExpires = undefined;
    await user.save();
    res.json(user);
});

const getWishList = asyncHandler(async(req, res)=>{
    const {_id} = req.user;
    try{
        const findUser = await User.findById(_id).populate('wishList');
        res.json(findUser);
    }catch(error){
        throw new Error(error);
    }
});

const userCart = asyncHandler(async (req, res) => {
    const { cart } = req.body;
    const { _id } = req.user;
    validateMonngoDBId(_id);
    try {
      let products = [];
      const user = await User.findById(_id);
      const alreadyExistCart = await Cart.findOne({ orderby: user._id });
      if (alreadyExistCart) {
        alreadyExistCart.deleteOne({ _id: alreadyExistCart._id });
      }
      for (let i = 0; i < cart.length; i++) {
        let object = {};
        object.product = cart[i]._id;
        object.count = cart[i].count;
        let getPrice = await Product.findById(cart[i]._id).select("price").exec();
        object.price = getPrice.price;
        products.push(object);
      }
      let cartTotal = 0;
      for (let i = 0; i < products.length; i++) {
        cartTotal = cartTotal + products[i].price * products[i].count;
      }
      console.log('Podaci koji se spremaju u bazu:', {
        products,
        cartTotal,
        orderby: user?._id,
    });
      let newCart = await new Cart({
        products,
        cartTotal,
        orderby: user?._id,
      }).save();
      console.log('Spremljeno u bazu:', newCart);
      res.json(newCart);
    } catch (error) {
        console.error('Greška prilikom spremanja košarice:', error);
      throw new Error(error);
    }
  });

  const getUserCart = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    validateMongoDBId(_id);
    try {
      const cart = await Cart.findOne({ orderby: _id }).populate(
        "products.product"
      );
      res.json(cart);
    } catch (error) {
      throw new Error(error);
    }
  });

module.exports = {
    createUser, 
    loginUserController,
    getAllUsers,
    getaUser,
    deleteaUser,
    updateaUser,
    blockUser,
    unblockUser,
    handleRefreshToken,
    logout,
    updatePassword,
    forgotPasswordToken,
    resetPassword,
    loginAdmin,
    getWishList,
    saveAddress,
    userCart,
    getUserCart,
}