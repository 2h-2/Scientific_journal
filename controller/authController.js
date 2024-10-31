const connection = require("../DB/connection");
const util = require("util");
const {validationResult} = require("express-validator");
const asyncHandler = require("express-async-handler");
const appError = require("../utils/appError");
const httpStatusText = require("../utils/httpStatusText");
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt");


const signUp = asyncHandler(
    async (req, res, next) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const error = appError.create(400, httpStatusText.ERROR, errors.array()[0].msg);
            return next(error);
        }

        const query = util.promisify(connection.query).bind(connection);
        const checkUser = await query("select * from users where email = ? ", [req.body.email]);

        if(checkUser.length > 0){
            return next(appError.create(400, httpStatusText.ERROR, "email is already exist !"));
        }
        
        delete req.body.confirm_email;
        delete req.body.confirm_password;
        const newUser = {
            ...req.body,
            password: await bcrypt.hash(req.body.password, 10),
        };


        
        const user = await query("insert into users set ?", newUser);
        const userId = user.insertId;
        const token = jwt.sign({userId: userId}, process.env.JWT_SECRET_KEY, {expiresIn: process.env.JWT_EXPIRE});
        newUser.token = token;
        res.status(200).json({data: newUser, msg: "registration success.."});
        
        
});

const login = asyncHandler(
    async (req, res ,next) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(appError.create(400, httpStatusText.ERROR, errors.array()[0].msg));
        }

        const query = util.promisify(connection.query).bind(connection);
        const user = await query("select * from users where email = ?", [req.body.email]);    

        if(!user[0] || !(await bcrypt.compare(req.body.password, user[0].password))){
            return next(appError.create(400, httpStatusText.ERROR, "Incorrect email or password"))
        }else{
            const token = jwt.sign({userId: user[0].id}, process.env.JWT_SECRET_KEY, {expiresIn: process.env.JWT_EXPIRE});
            user[0].token = token;
            res.status(200).json({data: user, msg:"Success"});
        }

    }
);

const updatePassword = asyncHandler(
    async (req, res ,next) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(appError.create(400, httpStatusText.ERROR, errors.array()[0].msg));
        }

        const query = util.promisify(connection.query).bind(connection);
        const user = await query("select * from users where id = ?", [res.locals.user.id]);    

        if(!(await bcrypt.compare(req.body.currentPassword, user[0].password))){
            return next(appError.create(400, httpStatusText.ERROR, "Incorrect Current Password"))
        }

        const newPass = {
            password: await bcrypt.hash(req.body.newPassword, 10)
        }

        await query("update users set ? where id =?", [newPass, res.locals.user.id]);
        res.status(200).json({data: null, msg:"Password Updated Successfully.."});
    }
);

const forgetPassword = asyncHandler(
    async (req, res ,next) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(appError.create(400, httpStatusText.ERROR, errors.array()[0].msg));
        }

        const query = util.promisify(connection.query).bind(connection);
        const user = await query("select * from users where id = ?", [res.locals.user.id]);    

        if(!(await bcrypt.compare(req.body.currentPassword, user[0].password))){
            return next(appError.create(400, httpStatusText.ERROR, "Incorrect Current Password"))
        }

        const newPass = {
            password: await bcrypt.hash(req.body.newPassword, 10)
        }

        await query("update users set ? where id =?", [newPass, res.locals.user.id]);
        res.status(200).json({data: null, msg:"Password Updated Successfully.."});
    }
);

module.exports = {
    signUp,
    login,
    updatePassword,
    forgetPassword
}