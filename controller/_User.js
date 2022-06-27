const User = require("../model/_User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const DriverActions = require("../model/driver_actions");
const User_Logout = require("../model/user_white_list");
const UserImage = require("../model/user_image");

exports.getUser = async (req, res) => {
  let userId = req.user.userId;
  let success_status, failed_status;
  try {
    let ip = req.socket.remoteAddress
    console.log(ip);
    // fetching user using user id
    const user = await User.findOne({ _id: userId });
    // checking for user language
    if (user.Language == 1) {
      success_status = process.env.SUCCESS_STATUS_ENGLISH;
      failed_status = process.env.FAILED_STATUS_ENGLISH;
    } else if (user.Language == 2) {
      success_status = process.env.SUCCESS_STATUS_SPANISH;
      failed_status = process.env.FAILED_STATUS_SPANISH;
    } else {
      success_status = process.env.SUCCESS_STATUS_ENGLISH;
      failed_status = process.env.FAILED_STATUS_ENGLISH;
    }
    res.status(201).send({
      status: success_status,
      statusCode: 201,
      data: user,
      ip:ip
    });
  } catch (err) {
    res
      .status(400)
      .send({ status: failed_status, statusCode: 400, error: err });
  }
};

exports.add_user_image = async (req, res) => {
  let success_status, failed_status, image_err, image_size_err;
  try {
    // fetching user using user id
    const user = await User.findOne({ _id: req.user.userId });
    // checking for user language
    if (user.Language == 1) {
      success_status = process.env.SUCCESS_STATUS_ENGLISH;
      failed_status = process.env.FAILED_STATUS_ENGLISH;
      image_err = process.env.IMAGE_ERR_ENGLISH;
      image_size_err = process.env.IMAGE_SIZE_ERR_ENGLISH;
    } else if (user.Language == 2) {
      success_status = process.env.SUCCESS_STATUS_SPANISH;
      failed_status = process.env.FAILED_STATUS_SPANISH;
      image_err = process.env.IMAGE_ERR_SPANISH;
      image_size_err = process.env.IMAGE_SIZE_ERR_SPANISH;
    } else {
      success_status = process.env.SUCCESS_STATUS_ENGLISH;
      failed_status = process.env.FAILED_STATUS_ENGLISH;
      image_err = process.env.IMAGE_ERR_ENGLISH;
      image_size_err = process.env.IMAGE_SIZE_ERR_ENGLISH;
    }
    let userImage = await UserImage.findOne({ userId: req.user.userId });
    if (userImage == null) {
      //storing user image in new collection
       userImage = new UserImage({
        Image: req.file.buffer.toString("base64"),
        userId: req.user.userId,
        date: new Date(),
      });
      userImage.save();
    } else {
      userImage.Image = req.file.buffer.toString("base64")
      userImage.save()
    }

    res
      .status(201)
      .send({ status: success_status, statusCode: 201, data: userImage });
  } catch (err) {
    console.log(err);
    res
      .status(400)
      .send({ status: failed_status, statusCode: 400, error: err });
  }
};
//user actions
exports.user_actions = async (req, res) => {
  let { action, latitude, longitude } = req.body;
  let today = new Date();
  let currentDateAndTime = today.toISOString();
  let success_status, failed_status, user_action_message;
  let userId = req.user.userId;
  try {
    //fetching user using user id
    const user = await User.findOne({ _id: userId });
    // checking for user language
    if (user.Language == 1) {
      success_status = process.env.SUCCESS_STATUS_ENGLISH;
      failed_status = process.env.FAILED_STATUS_ENGLISH;
      user_action_message = process.env.USER_ACTION_MESSAGE_ENGLISH;
    } else if (user.Language == 2) {
      success_status = process.env.SUCCESS_STATUS_SPANISH;
      failed_status = process.env.FAILED_STATUS_SPANISH;
      user_action_message = process.env.USER_ACTION_MESSAGE_SPANISH;
    } else {
      success_status = process.env.SUCCESS_STATUS_ENGLISH;
      failed_status = process.env.FAILED_STATUS_ENGLISH;
      user_action_message = process.env.USER_ACTION_MESSAGE_ENGLISH;
    }
    const driver_action = new DriverActions({
      createdAt: new Date(),
      updatedAt: new Date(),
      action: action,
      action_location: [latitude, longitude],
      user_id: req.user.userId,
      action_date:
        currentDateAndTime.slice(0, 10) +
        "-" +
        currentDateAndTime.slice(12, 20),
    });
    driver_action.save();
    res.status(201).send({
      status: success_status,
      statusCode: 201,
      msg: user_action_message,
    });
  } catch (err) {
    res
      .status(400)
      .send({ status: failed_status, statusCode: 400, error: err });
  }
};
exports.login = async (req, res) => {
  const password = req.body.password;

  try {
    const user = await User.findOne({ username: req.body.username });

    if (user == undefined || null) {
      res.status(403).send({
        status: "failed",
        statusCode: 403,
        error: "invaild username or password",
      });
    } else {
      //comparing password using bcrypt
      bcrypt
        .compare(password.toString(), user._hashed_password)
        .then((result) => {
          if (result) {
            //creating acces s token
            let token = jwt.sign(
              { userName: user.username, userId: user._id },
              process.env.SECRET,
              { expiresIn: 60 * 5 }
            );
            //creating refresh token
            let refreshToken = jwt.sign(
              { userName: user.username, userId: user._id },
              process.env.REFRESH_TOKEN_SECRET,
              { expiresIn: "24h" }
            );
              const user_logout = new User_Logout({
                user
              })
            res.status(201).send({
              status: "success",
              statusCode: 201,
              token,
              refreshToken,
            });
          } else {
            res.status(403).send({
              status: "failed",
              statusCode: 403,
              msg: "invaild username or password",
            });
          }
        });
    }
  } catch (err) {
    res.status(400).send({ status: "failed", statusCode: 400, error: err });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const token = req.body.refreshToken;
    //checking if token is empty
    if (!token) {
      return res.status(403).send({
        status: "failed",
        statusCode: 403,
        error: "A token is required for authentication",
      });
    }
    //decoding token
    decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    let newToken = jwt.sign(
      //generating new token
      { userName: decoded.userName, userId: decoded.userId },
      process.env.SECRET,
      { expiresIn: 60 * 5 }
    );
    res.status(201).send({ status: "success", statusCode: 201, newToken });
  } catch (err) {
    res.status(403).send({ status: "failed", statusCode: 403, error: err });
  }
};

