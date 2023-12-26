const mongoose = require('mongoose'); 

var blogSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true,
        unique:true,
        index:true,
    },
    description:{
        type:String,
        required:true,
        unique:true,
    },
    category:{
        type:String,
        required:true,
    },
    numViews:{
        type:Number,
        default:0,
    },
    isLiked:[{
        type:Boolean,
        default:false,
    }],
    isDisliked:[{
        type:Boolean,
        default:false,
    }],
    likes:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    image:{
        type:String,
        default:"./Images/ePijaca-cover.png",
    },
    author:{
        type:String,
        default:"Admin",
    },
},{
    toJSON:{
        virtuals:true,
    },
    toObject:{
        virtuals:true,
    },
    timestamps:true,
});

//Export the model
module.exports = mongoose.model('Blog', blogSchema);