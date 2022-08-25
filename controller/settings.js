const User = require("../model/user");
const Language = require("../model/language");
/**
 *   @swagger
 *   components:
 *   schemas:
 *     user_language:
 *       type: object
 *       required:
 *         - language
 *       properties:
 *         language:
 *           type: number
 *           description: language of user
 *       example:
 *          language: 1
 */

/**
 * @swagger
 * /settings/language:
 *   put:
 *     summary: update user language and language one is equal to english and two is equal to spanish
 *     tags: [settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/user_language'
 *     responses:
 *       200:
 *         description: user language updated successfull
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               items:
 *                 $ref: '#/components/schemas/user_language'
 *       403:
 *         description: token error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               items:
 *                 $ref: '#/components/schemas/user_language'
 *       422:
 *         description: validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               items:
 *                 $ref: '#/components/schemas/user_language'
 *     security:
 *       - bearerAuth: []
 */

exports.updateLanguage = async (req, res) => {
  let userId = req.user.userId;
  let failedStatus, update_user_failed;
  try {
    // fetching user using user id
    const user = await User.findOne({ _id: userId });

    //updating user language
    const update_User = await User.updateOne(
      { _id: userId },
      {
        Language: req.body.language,
      }
    );

    const language = await Language.findOne({ language_id: user.Language });
    const langObj = JSON.parse(language.language_translation);
    failedStatus = langObj.failed_status;
    if (update_User.acknowledged == true) {
      res
        .status(200)
        .send({
          status: langObj.success_status,
          statusCode: 200,
          data: req.body.language,
        });
    } else {
      res.status(400).send({
        status: failedStatus,
        statusCode: 400,
        error: langObj.update_user_failed,
      });
    }
  } catch (err) {
    res
      .status(400)
      .send({ status: failedStatus, statusCode: 400, error: err });
  }
};
