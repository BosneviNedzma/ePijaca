const mongoose = require('mongoose'); 
const bcrypt = require('bcrypt');
const crypto = require('crypto');

var userSchema = new mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    
    firstName:{
        type:String,
        required:true,
    },
    lastName:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    mobile:{
        type:String,
        required:true,
        unique:true,
    },
    password:{
        type:String,
        required:true,
    },
    role:{
        type:String, 
        default:"user",
    },
    lastActiveTime: {
        type: Date,
        default: Date.now,
      },
    isSeller:{
        type: Boolean,
        default:false,
    },
    isBlocked:{
        type: Boolean,
        default:false,
    },
    cart:{
        type:Array,
        default:[],
    },
    address:[{type: mongoose.Schema.Types.ObjectId, ref:"Address"}],
    wishList:[{type: mongoose.Schema.Types.ObjectId, ref:"Product"}],
    refreshToken:{
        type:String,
    },
    passwordChangedAt:Date,
    passwordResetToken:String,
    passwordResetExpires:Date,
},{
    timestamps: true,
});

userSchema.pre('save', async function(next){
    if(!this.isModified('password')){
        next();
    } 
    const salt = await bcrypt.genSaltSync(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.isPasswordMatched = async function(enteredPassword){
    return await bcrypt.compare(enteredPassword, this.password)
}
userSchema.methods.createPasswordResetToken = async function(){
    const resetToken = crypto.randomBytes(32).toString("hex");
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest("hex");
    this.passwordResetExpires = Date.now()+30*60*1000; //10 minutes 
    return resetToken;
}
//Export the model
module.exports = mongoose.model('User', userSchema);