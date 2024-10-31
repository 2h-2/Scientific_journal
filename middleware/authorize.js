const connection = require("../DB/connection");
const util = require("util");
const appError = require("../utils/appError");
const httpStatusText = require("../utils/httpStatusText");
const jwt = require("jsonwebtoken")
const asyncHandler = require("express-async-handler");

const authorized = asyncHandler(
    async (req, res, next) => {
    let token;

    if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")){
        token = req.headers.authorization.split(" ")[1];
        if(!token){
            return next(appError.create(401, httpStatusText.ERROR, "You are not authorized!"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        
        const query = util.promisify(connection.query).bind(connection);
        const user = await query("select * from users where id = ?",[decoded.userId]);

        if(user){
            res.locals.user = user[0];
            next();
        }else{
            return next(appError.create(401, httpStatusText.ERROR, "You are not authorized. please login again.."));
        }

        
    }
});

const editor = asyncHandler(
    async (req, res, next) => {
    let token;
    //console.log("token: "+ req.headers);
    if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")){
        token = req.headers.authorization.split(" ")[1];
        if(!token){
            return next(appError.create(401, httpStatusText.ERROR, "You are not authorized!"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        
        const query = util.promisify(connection.query).bind(connection);
        const user = await query("select * from users where id = ?",[decoded.userId]);

        if(user && (user[0].role == "editor" || user[0].role == "chief_in_editor")){
            res.locals.user = user[0];
            next();
        }else{
            return next(appError.create(401, httpStatusText.ERROR, "You are not authorized!"));
        }

        
    }
});

const reviewer = asyncHandler(
    async (req, res, next) => {
    let token;
    //console.log("token: "+ req.headers);
    if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")){
        token = req.headers.authorization.split(" ")[1];
        if(!token){
            return next(appError.create(401, httpStatusText.ERROR, "You are not authorized!"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        
        const query = util.promisify(connection.query).bind(connection);
        const user = await query("select * from users where id = ?",[decoded.userId]);

        if(user && (user[0].role == "reviewer")){
            res.locals.user = user[0];
            next();
        }else{
            return next(appError.create(401, httpStatusText.ERROR, "You are not authorized!"));
        }

        
    }
});

const editorInChief = asyncHandler(
    async (req, res, next) => {
    let token;
    //console.log("token: "+ req.headers);
    if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")){
        token = req.headers.authorization.split(" ")[1];
        if(!token){
            return next(appError.create(401, httpStatusText.ERROR, "You are not authorized!"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        
        const query = util.promisify(connection.query).bind(connection);
        const user = await query("select * from users where id = ?",[decoded.userId]);

        if(user && (user[0].role == "editor" || user[0].role == "chief_in_editor")){
            res.locals.user = user[0];
            next();
        }else{
            return next(appError.create(401, httpStatusText.ERROR, "You are not authorized!"));
        }

        
    }
});
module.exports = {
    authorized,
    editor,
    reviewer,
    editorInChief
};