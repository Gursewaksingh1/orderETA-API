const express = require('express');
const app = express();
const bodyparser = require('body-parser');
const port = process.env.PORT || 3000;
const mongoose = require('mongoose');
const dotenv = require("dotenv");
const driverRouter = require("./router/drivers")
dotenv.config();
const _URI = process.env.MONGODB_URI 

app.use(bodyparser.urlencoded({extended: false }));
app.use(express.json())
app.use((req, res, next) => {
    res.append("Access-Control-Allow-Origin", ["*"]);
    res.append("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
    res.append("Access-Control-Allow-Headers", "Content-Type");
    next();
  });

  app.use('/api', driverRouter);

mongoose.connect(_URI)
  .then(result => {
     // console.log(result)
      
    app.listen(port, () => {
      console.log(`listen on ${port}`);
    });
  })
  .catch(err => console.log(err))