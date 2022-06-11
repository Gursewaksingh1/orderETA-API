const jwt = require("jsonwebtoken");
const User = require("../model/_User");

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

    user = await User.findOne({username:data.userName});
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
