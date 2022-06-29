const jwt = require("jsonwebtoken");
const User_Logout = require("../model/user_white_list");

isAuth = async (req, res, next) => {
  const auth = req.headers["authorization"];
  const token = auth && auth.split(" ")[1];

  if (!token) {
    return res
      .status(403)
      .send({
        status: "failed",statusCode:403,
        error: "A token is required for authentication",
      });
  }
  try {
    data = jwt.verify(token, process.env.SECRET);
 //comparing token with db's  token with userId
    user = await User_Logout.findOne({userId:data.userId,token:token});
    if (user == null) {
      return res
        .status(403)
        .send({ status: "failed",statusCode:403, error: "the owner of this token has logout please re-login" });
    } else {

      req.user = data;
      next();
    }
  } catch (err) {
    return res.status(403).send({ status: "failed",statusCode:403, error: err });
  }
};

module.exports = isAuth;
