const connection = require("../../DB/connection");
const util = require("util");
const {validationResult} = require("express-validator");
const asyncHandler = require("express-async-handler");
const appError = require("../../utils/appError");
const httpStatusText = require("../../utils/httpStatusText");

const emailCP = asyncHandler(
    async (req, res, next) => {
        
        const Email = {
            subject: req.body.subject,
            body: req.body.body,
            description: req.body.description,
        }
        
        const query = util.promisify(connection.query).bind(connection);
        await query("update emails set ? where id =?",[Email, req.params.id])
        res.status(200).json({data: Email, msg: "Insertion Success.."})
    }
);

const getEmails = asyncHandler(
    async (req, res, next) => {
        
        const query = util.promisify(connection.query).bind(connection);
        const Emails = await query("select * from emails")
        
        
        res.status(200).json({data: Emails, msg: "Success.."})
    }
);
const getEmail = asyncHandler(
    async (req, res, next) => {
        
        const query = util.promisify(connection.query).bind(connection);
        const Emails = await query("select * from emails where (name = 'accept article'  OR name = 'reject article' )");
        const email ={
            acceptEmail: Emails[0].body,
            rejectEmail: Emails[1].body
        }
        res.status(200).json({data: email, msg: "Success.."})
    }
);


module.exports = {
    emailCP,
    getEmails,
    getEmail
};