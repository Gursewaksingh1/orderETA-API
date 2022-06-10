const User = require("../model/_User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
exports.login = async (req, res) => {
  const password = req.body.password
  try {
    const user = await User.findOne({ username: req.body.username });
    if (user == undefined || null) {
      res
        .status(403)
        .send({ status: "failed", error: "invaild username or password" });
    } else {
      //comparing password using bcrypt 
      bcrypt.compare(password.toString(),user._hashed_password).then((result) => {
        if (result) {
          //creating acces s token
          let token = jwt.sign(
            { userName: user.username, userPassword: user._hashed_password },
            process.env.SECRET,
            { expiresIn: 60 * 5 }
          );

          //creating refresh token
          let refreshToken = jwt.sign(
            { userName: user.username, userPassword: user._hashed_password },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: "24h" }
          );
          res.status(201).send({ status: "success", token, refreshToken });
        } else {
          res
            .status(403)
            .send({ status: "failed", msg: "invaild username or password" });
        }
      });
    }
  } catch (err) {
    res.status(401).send({ status: "failed", error: err });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const token = req.body.refreshToken;
    //checking if token is empty
    if (!token) {
      return res.status(403).send({
        status: "failed",
        error: "A token is required for authentication",
      });
    }
    //decoding token
    decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    let newToken = jwt.sign(
      //generating new token
      { userName: decoded.userName, userPassword: decoded.userPassword },
      process.env.SECRET,
      { expiresIn: 60 * 5 }
    );
    res.status(201).send({ status: "success", newToken });
  } catch (err) {
    res.status(403).send({ status: "failed", error: err });
  }
};