const User = require("../model/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const DriverActions = require("../model/driveractions");
const User_Logout = require("../model/userwhitelist");
const UserImage = require("../model/userimage");
const Store = require("../model/store");
const Debug_Temp = require("../model/debugtemp")
const { validationResult } = require("express-validator");
const HereInf = require("../model/hereinf");
const Reason = require("../model/reason");
const Logged_routing_request = require("../model/loggedroutingrequests");
/**
 *   @swagger
 *   components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *       properties:
 *         _id:
 *           type: string
 *           description: the auto-generated id
 *         Language:
 *           type: integer
 *           description: prefered Language of the user
 *         UUID:
 *           type: integer
 *           description: the auto-generated UUID
 *         additional_maps:
 *           type: string
 *           description: additional_maps of the user
 *         addresses_yet_to_visit:
 *           type: number
 *           description: addresses_yet_to_visit for delivery
 *         app_version:
 *           type: string
 *           description: app_version of the user device
 *         auto_scan:
 *           type: number
 *           description: auto_scan
 *         distanceToHouses:
 *           type: number
 *           description: distanceToHouses of the delivery
 *         driver_color:
 *           type: string
 *           description: the driver_color
 *         driver_string:
 *           type: string
 *           description: driver_string of the user
 *         end_lat:
 *           type: number
 *           description: the end_lat of user
 *         end_lon:
 *           type: number
 *           description: end_lon of the user
 *         eta_to_store:
 *           type: date
 *           description: eta_to_store for delivery
 *         first_name:
 *           type: string
 *           description: first_name of the user
 *         is_delivering:
 *           type: number
 *           description: is_delivering
 *         is_segueing:
 *           type: number
 *           description: is_segueing
 *         is_manager:
 *           type: number
 *           description: is_manager
 *         is_scanning:
 *           type: number
 *           description: is_scanning or not
 *         last_location:
 *           type: array
 *           description: the alast_location of user
 *         last_name:
 *           type: string
 *           description: last_name of the user
 *         latest_action:
 *           type: string
 *           description: latest_action for delivery
 *         next_stop:
 *           type: string
 *           description: next_stop of the user
 *         no_traffic:
 *           type: number
 *           description: no_traffic or not
 *         orders_dropoff_method:
 *           type: number
 *           description: orders_dropoff_method of the delivery
 *         orders_entry_method:
 *           type: number
 *           description: the orders_entry_method
 *         original_route_started:
 *           type: string
 *           description: original_route_started of the user
 *         phone:
 *           type: number
 *           description: the phone no of user
 *         previous_stop:
 *           type: string
 *           description: previous_stop of the user
 *         returns_to_address:
 *           type: string
 *           description: returns_to_address for delivery
 *         service_time:
 *           type: number
 *           description: ervice_time of the user
 *         started_driving:
 *           type: string
 *           description: started_driving
 *         start_lat:
 *           type: number
 *           description: start_lat of the delivery
 *         store_id:
 *           type: number
 *           description: the store_id of user
 *         total_addresses_in_run:
 *           type: number
 *           description: total_addresses_in_run of the user
 *         username:
 *           type: string
 *           description: the username of user
 *         vehicle_type:
 *           type: number
 *           description: vehicle_type of the user
 *       example:
 *           _id: 56rhaj7
 *           username: sunil
 *           first_name: su
 *           Language: 1
 *           store_id: 24
 *           driver_color: #008000
 *           _hashed_password: $2a$12$ZYu6Wh.mzHzUZhAJC1rMbu.cTt2qwDkm8rGroRBp7kWr74fWHr/lW
 *           _created_at: 2017-09-18T19:37:27.608Z
 *           _updated_at: 2022-06-15T09:35:48.720Z
 *           distanceToHouses: 500
 *           service_time: 120
 *           vehicle_type: 1
 *           orders_entry_method: 3
 *           driver_string: YURA
 *           orders_dropoff_method: 2
 *           latest_action: scanning done
 *           UUID: 7E3A5094-18FE-4C33-A01F-602185822A1E
 *           previous_stop: user left the store
 *           started_driving: 2022-06-20-4:10:32.
 *           next_stop: tarn taran
 *           is_delivering: 0
 *           addresses_yet_to_visit: 0
 *           total_addresses_in_run: 8
 *           last_location: [1,1]
 *           eta_to_store: 2022-06-10T00:35:52.093Z
 *           original_route_started: 2022-06-20-4:10:32.
 *           auto_scan: 0
 *           end_lon: 1
 *           end_lat: 1
 *           is_scanning: 1
 *           app_version: 2.0.27,
 *           additional_maps: 0
 *           no_traffic: 1
 *           start_lat: 1
 *           start_lon: 1
 */

//endpoint for get user in swagger
/**
 * @swagger
 * /userdetails:
 *   get:
 *     summary: Returns logged-in user details
 *     tags: [user]
 *     responses:
 *       200:
 *         description: Returns user details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       403:
 *         description: token error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *     security:
 *       - bearerAuth: []
 */

exports.getUser = async (req, res) => {
  let userId = req.user.userId;
  let success_status, failed_status;
  try {
    // fetching user using user id
    const user = await User.findOne({ _id: userId });
    // checking for user language
    success_status =
    user.Language == 1
      ? process.env.SUCCESS_STATUS_ENGLISH
      : process.env.SUCCESS_STATUS_SPANISH;
  failed_status =
    user.Language == 1
      ? process.env.FAILED_STATUS_ENGLISH
      : process.env.FAILED_STATUS_SPANISH;
    res.status(200).send({
      status: success_status,
      statusCode: 200,
      data: user,
    });
  } catch (err) {
    res
      .status(400)
      .send({ status: failed_status, statusCode: 400, error: err });
  }
};

exports.updateUser = async (req, res) => {
  let userId = req.user.userId;
  let success_status, failed_status, update_user_failed;
  try {
    // fetching user using user id
    const user = await User.findOne({ _id: userId });
    // checking for user language
    success_status =
      user.Language == 1
        ? process.env.SUCCESS_STATUS_ENGLISH
        : process.env.SUCCESS_STATUS_SPANISH;
    failed_status =
      user.Language == 1
        ? process.env.FAILED_STATUS_ENGLISH
        : process.env.FAILED_STATUS_SPANISH;
    update_user_failed =
      user.Language == 1
        ? process.env.UPDATE_USER_FAILED_ENGLISH
        : process.env.UPDATE_USER_FAILED_SPANISH;
        //updating user
    const update_User = await User.updateOne(
      { _id: userId },
      {
        previous_stop: req.body.previous_stop,
        latest_action: req.body.latest_action,
        next_stop: req.body.next_stop,
      }
    );
    if (update_User.acknowledged == true) {
      res
        .status(200)
        .send({ status: success_status, statusCode: 200, data: update_User });
    } else {
      res
        .status(400)
        .send({
          status: failed_status,
          statusCode: 400,
          error: update_user_failed,
        });
    }
  } catch (err) {
    res
      .status(400)
      .send({ status: failed_status, statusCode: 400, error: err });
  }
};
 
/**
 * @swagger
 * /reason:
 *   get:
 *     summary: get all reasons from database
 *     tags: [user]
 *     responses:
 *       200:
 *         description: all reasons fetched successfull
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *     security:
 *       - bearerAuth: []
 */

exports.getReason = async(req,res) => {
  let userId = req.user.userId;
  let success_status, failed_status;
  try {
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
    const reason = await Reason.find()
    res.status(200).send({
      status: success_status,
      statusCode: 200,
      data: reason,
    });
  } catch (err) {
    res
      .status(400)
      .send({ status: failed_status, statusCode: 400, error: err });
  }
}

/**
 * @swagger
 * /hereinf:
 *   get:
 *     summary: get hereInf data from database
 *     tags: [user]
 *     responses:
 *       200:
 *         description: get hereInf data from database
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *     security:
 *       - bearerAuth: []
 */

exports.getHereInf = async(req,res) => {
  let userId = req.user.userId;
  let success_status, failed_status;
  try {
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
    const hereInf = await HereInf.find({AppID:{$ne:55}})
    res.status(200).send({
      status: success_status,
      statusCode: 200,
      data: hereInf,
    });
  } catch (err) {
    res
      .status(400)
      .send({ status: failed_status, statusCode: 400, error: err });
  }
}

/**
 * @swagger
 * /store:
 *   get:
 *     summary: getting logged in user's store details from database
 *     tags: [user]
 *     responses:
 *       200:
 *         description: store details fetched successfull
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *     security:
 *       - bearerAuth: []
 */

exports.get_store_of_logined_user = async (req, res) => {
  let userId = req.user.userId;
  let success_status, failed_status;
  let store;
  try {
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
    store = await Store.findOne({ store_id: user.store_id });
    res.status(201).send({
      status: success_status,
      statusCode: 201,
      data: store,
    });
  } catch (err) {
    console.log(err);
    res
      .status(400)
      .send({ status: failed_status, statusCode: 400, error: err });
  }
};
exports.post_Logged_routing_request = async(req,res) => {
  let userId = req.user.userId;
  let success_status, failed_status;
  try {
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
    const logged_routing_request = new Logged_routing_request({
      store_id:user.store_id,
      driver_name:user.username,
      route_started:req.body.route_started,
      the_url:req.body.the_url,
      the_result:req.body.the_result,
      url_date:new Date(),
      createdAt:new Date(),
      updatedAt:new Date()
    });
    logged_routing_request.save();
    res.status(200).send({
      status: success_status,
      statusCode: 200,
      data: logged_routing_request,
    });
  } catch (err) {
    res
      .status(400)
      .send({ status: failed_status, statusCode: 400, error: err });
  }
}
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
      userImage.Image = req.file.buffer.toString("base64");
      userImage.save();
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
      data: user_action_message,
    });
  } catch (err) {
    res
      .status(400)
      .send({ status: failed_status, statusCode: 400, error: err });
  }
};

/**
 *   @swagger
 *   components:
 *   schemas:
 *     debugtemp:
 *       type: object
 *       required:
 *         - temp_desc_string
 *       properties:
 *         temp_desc_string:
 *           type: string
 *           description: temp_desc_string is error msg
 *       example:
 *           temp_desc_string: catch 5catch number 5  catch 1catch 3waypoints_tester contains:Schwartz3 Sears Rd, waypoints_tester2 contains:Schwartz3 Sears Rd, waypoint contains:Schwartz3 Sears Rd, 
 */ 
/**
 * @swagger
 * /debugtemp:
 *   post:
 *     summary: this endpoint is used when after login app got crashed and to inform the reason to deveploer
 *     tags: [user]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/debugtemp'
 *     responses:
 *       200:
 *         description: Report sent to developer
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       422:
 *         description: validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               items:
 *                 $ref: '#/components/schemas/debugtemp'
 *     security:
 *       - bearerAuth: []
 */

exports.debug_temp = async(req,res) => {
  let temp_desc_string = req.body.temp_desc_string
  let debug_temp_msg,success_status,failed_status;
  try {

     //fetching user using user id
     const user = await User.findOne({ _id: req.user.userId });
     // checking for user language
     if (user.Language == 1) {
       success_status = process.env.SUCCESS_STATUS_ENGLISH;
       failed_status = process.env.FAILED_STATUS_ENGLISH;
       debug_temp_msg = process.env.DEBUG_TEMP_ENGLISH;;
     } else if (user.Language == 2) {
       success_status = process.env.SUCCESS_STATUS_SPANISH;
       failed_status = process.env.FAILED_STATUS_SPANISH;
       debug_temp_msg = process.env.DEBUG_TEMP_SPANISH;
     } else {
       success_status = process.env.SUCCESS_STATUS_ENGLISH;
       failed_status = process.env.FAILED_STATUS_ENGLISH;
       debug_temp_msg = process.env.DEBUG_TEMP_ENGLISH;;
     }
    debug_temp = new Debug_Temp({
      userId: req.user.userId,
      temp_desc:temp_desc_string,
      _createdAt: new Date(),
      _updatedAt: new Date()
    })
    debug_temp.save()
    res.status(201).send({
      status: success_status,
      statusCode: 201,
      data: debug_temp_msg,
    });
  } catch (err) {
    console.log(err);
    res
    .status(400)
    .send({ status: failed_status, statusCode: 400, error: err });
  }
}

/**
 *   @swagger
 *   components:
 *   schemas:
 *     user_login:
 *       type: object
 *       required:
 *         - username
 *       properties:
 *         username:
 *           type: string
 *           description: username of user
 *         password:
 *           type: string
 *           description: password of user
 *       example:
 *           username: yurashm
 *           password: 123456
 */ 
/**
 * @swagger
 * /login:
 *   post:
 *     summary: do user login to get token for authorized enpoints
 *     tags: [user]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/user_login'
 *     responses:
 *       200:
 *         description: user login successfull
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       403:
 *         description: invalid username and password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               items:
 *                 $ref: '#/components/schemas/user_login'
 *       422:
 *         description: validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               items:
 *                 $ref: '#/components/schemas/user_login'
 */

exports.login = async (req, res) => {
  const password = req.body.password;

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const extractedErrors = [];
      errors
        .array()
        .map((err) => extractedErrors.push({ [err.param]: err.msg }));

      return res.status(422).json({
        status: "failed",
        statusCode: 422,
        error: extractedErrors,
      });
    }

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
              { expiresIn: 60 * 5567 }
            );
            //creating refresh token
            let refreshToken = jwt.sign(
              { userName: user.username, userId: user._id },
              process.env.REFRESH_TOKEN_SECRET,
              { expiresIn: "24h" }
            );
            //creating user-logout-token white-list
            const user_logout = new User_Logout({
              userId: user._id,
              token: token,
              refreshToken,
            });
            user_logout.save();
            res.status(200).send({
              status: "success",
              statusCode: 200,
              username:user.username,
              language:user.Language,
              token,
              refreshToken,
            });
          } else {
            res.status(403).send({
              status: "failed",
              statusCode: 403,
              error: "invaild username or password",
            });
          }
        });
    }
  } catch (err) {
    res.status(400).send({ status: "failed", statusCode: 400, error: err });
  }
};
/**
 *   @swagger
 *   components:
 *   schemas:
 *     refresh_token:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           description: refreshToken for generating new token
 *       example:
 *           refreshToken: 345gffg65gh674gfdn567h56456fg
 */ 
/**
 * @swagger
 * /refreshtoken:
 *   put:
 *     summary: when token gets expired use this endpoint to get new token
 *     tags: [user]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/refresh_token'
 *     responses:
 *       200:
 *         description: Returns new token for authorization
 *         content:
 *           application/json:
 *             schema:
 *               type: object
  *       422:
 *         description: validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       403:
 *         description: token error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *     security:
 *       - bearerAuth: []
 */

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
    //comparing refresh token with db's refresh token with userId
    user = await User_Logout.findOne({
      userId: decoded.userId,
      refreshToken: token,
    });
    if (user == null) {
      return res.status(403).send({
        status: "failed",
        error: "the owner of this token has logout please re-login",
      });
    } else {
      let newToken = jwt.sign(
        //generating new token
        { userName: decoded.userName, userId: decoded.userId },
        process.env.SECRET,
        { expiresIn: 60 * 5 }
      );
      user.token = newToken;
      user.save();
      res.status(201).send({ status: "success", statusCode: 201, newToken });
    }
  } catch (err) {
    res.status(403).send({ status: "failed", statusCode: 403, error: err });
  }
};

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: user logout to remove token from db
 *     tags: [user]
 *     responses:
 *       200:
 *         description: user logout successfull
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       403:
 *         description: invaild/empty token 
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *     security:
 *       - bearerAuth: []
 */
exports.logout = async (req, res) => {
  let success_status, failed_status;

  let userId = req.user.userId;
  try {
    let userLogout;
    // fetching user using user id
    const user = await User.findOne({ _id: req.user.userId });
    // checking for user language
    if (user.Language == 1) {
      success_status = process.env.SUCCESS_STATUS_ENGLISH;
      failed_status = process.env.FAILED_STATUS_ENGLISH;
      userLogout = process.env.USER_LOGOUT_ENGLISH;
    } else if (user.Language == 2) {
      success_status = process.env.SUCCESS_STATUS_SPANISH;
      failed_status = process.env.FAILED_STATUS_SPANISH;
      userLogout = process.env.USER_LOGOUT_SPANISH;
    } else {
      success_status = process.env.SUCCESS_STATUS_ENGLISH;
      failed_status = process.env.FAILED_STATUS_ENGLISH;
      userLogout = process.env.USER_LOGOUT_ENGLISH;
    }
    //fetching token
    const auth = req.headers["authorization"];
    const token = auth && auth.split(" ")[1];

    //removing doc after user logout
    const user_logout = await User_Logout.findOneAndRemove({
      userId: userId,
      token: token,
    });
    res
      .status(200)
      .send({ status: success_status, statusCode: 200, data: userLogout });
  } catch (err) {
    res
      .status(400)
      .send({ status: failed_status, statusCode: 400, error: err });
  }
};
