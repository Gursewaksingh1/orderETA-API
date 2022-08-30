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
  let failedStatus;
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
    failedStatus = langObj.failed_status_text;
    if (update_User.acknowledged == true) {
      const newLang = await Language.findOne({
        language_id: req.body.language,
      });
      res.status(200).send({
        status: langObj.success_status_text,
        statusCode: 200,
        data: req.body.language,
        languageObj: JSON.parse(newLang.language_translation),
      });
    } else {
      res.status(400).send({
        status: failedStatus,
        statusCode: 400,
        error: langObj.update_user_failed_text,
      });
    }
  } catch (err) {
    res.status(400).send({ status: failedStatus, statusCode: 400, error: err });
  }
};

/**
 * @swagger
 * /settings/language:
 *   get:
 *     summary: get language of user
 *     tags: [settings]
 *     responses:
 *       200:
 *         description: return language of user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       403:
 *         description: token error
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
 *     security:
 *       - bearerAuth: []
 */

exports.language = async (req, res) => {
  let failedStatus;
  try {
    const user = await User.findOne({ _id: req.user.userId });
    const language = await Language.findOne({ language_id: user.Language });
    lanObj = JSON.parse(language.language_translation);
    failedStatus = lanObj.failed_status_text;
    res
      .status(200)
      .send({
        status: lanObj.success_status_text,
        statusCode: 200,
        data: lanObj,
      });
  } catch (err) {
    console.log(err);
    res.status(400).send({ status: failedStatus, statusCode: 400, error: err });
  }
};
