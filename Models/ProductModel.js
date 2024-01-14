const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
var productSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true,
        trim:true,
    },
    price:{
        type:String,
        required:true,
    },
    category:{
        type:String,
        required:true,
    },
    quantity:{
        type: Number,
        required: true,
        select: false,
    },
    sold:{
        type: Number,
        default: 0,
        select: false,
    },
    images:{
        type:Array,
    },
    description: {
        type: String,
        required: true,
      },
    mark: {
        type: Number,
        min: 1,
        max: 5,
      },
    slug:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    ratings:[
        {
            star: Number,
            comment: String,
            postedby:{type: mongoose.Schema.Types.ObjectId, ref:"User"},
        }
    ],
    totalrating:{
        type: String,
        default: 0,
    }
},{
    timestamps:true,
});


module.exports = mongoose.model('Product', productSchema);