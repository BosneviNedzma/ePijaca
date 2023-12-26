const User = require('../Models/UserModel');
const {generateToken} = require('../Config/jwtToken');
const asyncHandler = require("express-async-handler");
const validateMonngoDBId = require('../Utils/ValidateMongodbid');
const {generateRefreshToken} = require('../Config/refreshtoken');
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const sendEmail = require('./EmailController');
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
})

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
}