const jwt = require("jsonwebtoken");
const Driver = require("../model/driverModel");

isAuth = async (req, res, next) => {
  const auth = req.headers["authorization"];
  const token = auth && auth.split(" ")[1];

  if (!token) {
    return res
      .status(403)
      .send({
        status: "failed",
        error: "A token is required for authentication",
      });
  }
  try {
    data = jwt.verify(token, process.env.SECRET);

    user = await Driver.findOne({username:data.userName,passowrd:data.userPassword});
    if (user == null) {
      return res
        .status(403)
        .send({ status: "failed", error: "the owner of this token does not exist" });
    } else {
      req.user = data;
      next();
    }
  } catch (err) {
    return res.status(403).send({ status: "failed", error: err });
  }
};

module.exports = isAuth;
