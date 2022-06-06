const Drivers = require("../model/driverModel");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  try {
    //checking if user email and password is correct
    const user = await Drivers.findOne({
      username: req.body.username,
      password: req.body.password,
    });
    if (user !== null) {
      //creating acces s token
      let token = jwt.sign(
        { userName: user.username, userPassword: user.password },
        process.env.SECRET,
        { expiresIn: 60 * 5 }
      );

      //creating refresh token
      let refreshToken = jwt.sign(
        { userName: user.username, userPassword: user.password },
        process.env.SECRET,
        { expiresIn: "24h" }
      );
      res.status(201).send({ status: "success", token, refreshToken });
    } else {
      res.status(401).send({ status: "failed", msg: "invaild email or password" });
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
      return res
        .status(403)
        .send({
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
      { expiresIn: 60*5 }
    );
    res.status(201).send({ status: "success", newToken });
  } catch (error) {
    res.status(403).send({ status: "failed", error: err });
  }
};
