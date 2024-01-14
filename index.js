const bodyParser = require('body-parser');
const express = require('express');
const dbConnect = require('./Config/dbConnect');
const { notFound, errorHandler } = require('./Middlewares/ErrorHandler');
const app = express();
const dotenv = require('dotenv').config();
const PORT = process.env.PORT || 4000;
const authRouter = require('./Routes/AuthRoute');
const cookieParser = require('cookie-parser');
const productRouter = require('./Routes/ProductRoute');
const blogRouter = require('./Routes/BlogRoute');
const productCategoryRouter = require('./Routes/ProductCategoryRoute');
const blogCategoryRouter = require('./Routes/BlogCategoryRoute');
const morgan = require('morgan');

dbConnect();

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/api/user', authRouter);
app.use('/api/product', productRouter);
app.use('/api/product', productRouter);
app.use('/api/blog', blogRouter);
app.use('/api/productcategory', productCategoryRouter);
app.use('/api/blogcategory', blogCategoryRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () =>{
    console.log(`Server is running at PORT ${PORT}`);
});