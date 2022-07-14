const express = require('express');
const app = express();
const bodyparser = require('body-parser');
const port = process.env.PORT || 3000;
const mongoose = require('mongoose');
const dotenv = require("dotenv");
const multer = require("multer");
const userRouter = require("./router/user")
const orderRouter = require("./router/orders")
const deliveryRouter = require("./router/delivery")
const settingRouter = require("./router/settings")
const swaggerUI = require("swagger-ui-express")
const swaggerJsdoc = require("swagger-jsdoc")
dotenv.config();
const _URI = process.env.MONGODB_URI 
const fileFilter=(req, file, cb) => {
  if (
    file.mimetype == "image/png" ||
    file.mimetype == "image/jpg" ||
    file.mimetype == "image/jpeg" 
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
}
const options = {

  definition: {
    openapi: "3.0.0",
    info: {
      title: "order-ETA",
      version: "1.0.0",
    },
    servers:[{
     //url:"http://localhost:3000/api",
     url:"https://order-eta-app.herokuapp.com/api"
    }
     
    ],
     components: {
      securitySchemes: {
        bearerAuth: {
          type: "apiKey",
          name: "Authorization",
          scheme: "Authorization",
          in: "header",
        },
      },
    },
    bearerAuth: {
      type: "https",
      scheme: "bearer",
    },

  },
  apis: ["./controller/*.js"], // files containing annotations as above
};
const swaggerSpac = swaggerJsdoc(options)

app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerSpac));
app.use(bodyparser.urlencoded({extended: false }));
app.use(express.json())
app.use(multer({fileFilter}).single("image"));
app.use((req, res, next) => {
    res.append("Access-Control-Allow-Origin", ["*"]);
    res.append("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
    res.append("Access-Control-Allow-Headers", "Content-Type");
    next();
  });

  app.use("/api", userRouter);
  app.use("/api/orders", orderRouter);
  app.use("/api/delivery", deliveryRouter);
  app.use("/api/settings", settingRouter);
  app.use((req,res,next) => {
    res.status(404).send({status:"failed",statusCode:404,error:"wrong URL please check your URL and http method"})
  })
mongoose.connect(_URI)
  .then(result => {
    //  console.log(result)
   
    app.listen(port, () => {
      console.log(`listen on ${port}`);
    });
  })
  .catch(err => console.log(err))
