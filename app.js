const express = require('express');
const app = express();
const bodyparser = require('body-parser');
const port = process.env.PORT || 3000;
const mongoose = require('mongoose');
const dotenv = require("dotenv");
const multer = require("multer");
const userRouter = require("./router/_User")
const orderRouter = require("./router/orders")
const deliveryRouter = require("./router/delivery")
dotenv.config();
const _URI = process.env.MONGODB_URI 

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/image");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" +file.originalname) ;
  },
  
});
const fileFilter=(req, file, cb) => {
  if (
    file.mimetype == "image/png" ||
    file.mimetype == "image/jpg" ||
    file.mimetype == "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
    console.log("Only .png, .jpg and .jpeg format allowed!");
  }
}
app.use(bodyparser.urlencoded({extended: false }));
app.use(express.json())
app.use(multer().single("image"));
app.use((req, res, next) => {
    res.append("Access-Control-Allow-Origin", ["*"]);
    res.append("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
    res.append("Access-Control-Allow-Headers", "Content-Type");
    next();
  });

  app.use('/userAPI', userRouter);
  app.use('/ordersAPI', orderRouter);
  app.use('/deliveryAPI', deliveryRouter);
  app.use((req,res,next) => {
    res.status(404).send({status:"failed",statusCode:404,error:"wrong URL"})
  })
mongoose.connect(_URI)
  .then(result => {
    //  console.log(result)
   
    app.listen(port, () => {
      console.log(`listen on ${port}`);
    });
  })
  .catch(err => console.log(err))
