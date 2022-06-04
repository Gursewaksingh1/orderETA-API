const Drivers = require("../model/driverModel");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
    try {
        
        //checking if user email and password is correct
        const user = await Drivers.findOne({username:req.body.username,password:req.body.password})
        if (user !== null) {
            //creating acces s token
            let token = jwt.sign(
              { userName: user.username, userPassword: user.password },
              process.env.SECRET,
              { expiresIn: "1h" }
            );
      
            //creating refresh token
            let refreshToken = jwt.sign(
              { userName: user.username, userPassword: user.password },
              process.env.SECRET,
              { expiresIn: "24h" }
            );
            res.send({ status: "success", token, refreshToken });
          } else {
            res.send({ status: "failed", msg: "invaild email or password" });
          }
        } catch (err) {
          console.log(err);
          res.send({ status: "failed", error: err });
        }
};


exports.refreshToken = async (req, res) => {
        try {
          const token = req.body.refreshToken;
          //checking if token is empty
          if (!token) {
            return res.status(403).send("A token is required for authentication");
          }
          //decoding token
          decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
          let newToken = jwt.sign(
            //generating new token
            { userName: decoded.userName, userPassword: decoded.userPassword },
            process.env.SECRET,
            { expiresIn: "1h" }
          );
          res.send({ status: "success", newToken });
        } catch (error) {
          res.send({ status: "failed", error: err });
        }
};