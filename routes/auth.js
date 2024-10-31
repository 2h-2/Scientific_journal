const express = require("express");
const {registValidation, loginValidation, updatePasswordValidation, userValidation} = require("../middleware/validationSchema");
const router = express.Router();
const authController = require("../controller/authController");
const userController = require("../controller/userController");
const {authorized, editor} = require("../middleware/authorize")

router.route("/register").post(registValidation, authController.signUp);
router.route("/login").post(loginValidation, authController.login);

router.route("/updatePass").put(authorized, updatePasswordValidation, authController.updatePassword);
router.route("/forgetPass").put(authorized, updatePasswordValidation, authController.forgetPassword);

router.route("/user").post(editor, userValidation, userController.addUser).
get(editor, userController.getAllUsers);
router.route("/user/:id").
get(editor, userController.getUserById).
delete(editor, userController.deleteUser).
put(editor, userController.updateUser)

module.exports = router;
