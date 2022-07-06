const express = require("express");
const userController = require("../controller/_User");
const router = express.Router();
const validate = require("../validatorSchema/validateMiddleware");

const {
  driverLoginValidationRules,
  validate_driver_actions,
  validate_user_image,
  update_user_stops,
} = require("../validatorSchema/deliveryValidationRules");

const isAuth = require("../middleware/isAuth");



router.get("/userdetails", isAuth, userController.getUser);
/**
 * @swagger
 * /userAPI/update_user_stops:
 *   put:
 *     summary: update user previous stop and next with latest action
 *     tags: [user]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: update user previous stop and next with latest action
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
 *               items:
 *                 $ref: '#/components/schemas/User'
  *       422:
 *         description: validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               items:
 *                 $ref: '#/components/schemas/User'
 *     security:
 *       - bearerAuth: []
 */
router.put(
  "/update_user_stops",
  isAuth,
  update_user_stops(),
  validate,
  userController.updateUser
);
router.get("/getStore", isAuth, userController.get_store_of_logined_user);
router.post(
  "/userAction",
  isAuth,
  validate_driver_actions(),
  validate,
  userController.user_actions
);
router.post(
  "/userImage",
  isAuth,
  validate_user_image(),
  validate,
  userController.add_user_image
);
router.post("/login", driverLoginValidationRules(), userController.login);
router.post("/logout", isAuth, userController.logout);
router.put("/refreshtoken", userController.refreshToken);

module.exports = router;
