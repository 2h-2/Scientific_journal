const connection = require("../DB/connection");
const util = require("util");
const {validationResult} = require("express-validator");
const asyncHandler = require("express-async-handler");
const appError = require("../utils/appError");
const httpStatusText = require("../utils/httpStatusText");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
function generatePass() {
    let pass = '';
    let str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
        'abcdefghijklmnopqrstuvwxyz0123456789@#$';

    for (let i = 1; i <= 8; i++) {
        let char = Math.floor(Math.random()
            * str.length + 1);

        pass += str.charAt(char)
    }

    return pass;
}

const addUser = asyncHandler(
    async (req, res, next) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(appError.create(400, httpStatusText.ERROR, errors.array()[0].msg));
        }

        const query = util.promisify(connection.query).bind(connection);
        const checkUser = await query("select * from users where email = ? ", [req.body.email]);

        if(checkUser.length > 0){
            return next(appError.create(400, httpStatusText.ERROR, "email is already exist !"));
        }

        let pass = generatePass();
        req.body.password = await bcrypt.hash(pass, 10);
        await query("insert into users set ?", req.body);

        const journal = await query("select title, path, journal_email from journal where id = 1");

        const journalTitle =  journal[0].title;
        const journalPath = journal[0].path;
        const journalEmail= journal[0].journal_email;

        const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: journalEmail,    
            pass: process.env.EMAIL_PASS,     
        },
        });

        if(req.body.role == "reviewer" || req.body.role == "Reviewer"){
            const mailOptions = {
                from: journalEmail,  // Replace with your Gmail email address
                to: req.body.email,
                subject: `Welcome to [${journalTitle}] - Registration Confirmation `,
                text: `
Dear ${req.body.first_name} ${req.body.last_name},
    
We are pleased to welcome you as a reviewer for [${journalTitle}]. Your expertise and dedication are invaluable to maintaining the high standards of our publication.

As a reviewer, you will play a crucial role in the peer review process, helping to ensure the quality and integrity of the research we publish. Our online platform provides you with easy access to manuscripts, review guidelines, and the ability to submit your reviews.
    
To begin, please visit our website and log in using the credentials you created during registration. You will find a list of manuscripts awaiting your review under the 'Review Assignments' section. If you have any questions or require assistance, our support team is here to help.
    
Thank you for your commitment to advancing scholarly research with [${journalTitle}]. We are excited to have you on board.
    
To Login for the Journal ${journalPath}, please enter your
password: ${pass}
email: ${req.body.email}

Best regards,
${journalTitle}
`,
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
        }else if(req.body.role == "editor" || req.body.role == "Editor"){
            const mailOptions = {
                from: journalEmail,  // Replace with your Gmail email address
                to: req.body.email,
                subject: `Welcome to [${journalTitle}] - Registration Confirmation`,
                text: `
Dear ${req.body.first_name} ${req.body.last_name},
    
We are thrilled to inform you that you have been successfully registered as an editor with [${journalTitle}].

As an editor, you play a pivotal role in maintaining the quality and integrity of the research we publish. Your expertise and guidance are essential in overseeing the peer review process, making editorial decisions, and ensuring that our journal continues to be a trusted source of scholarly knowledge.
    
To get started, please visit our website and log in using the credentials you created during registration. Our online platform offers a comprehensive suite of tools to manage manuscripts, communicate with authors and reviewers, and track the progress of submissions.
    
Should you need any assistance or have any questions, our support team is readily available to help you.
    
Thank you for joining our editorial team. We are confident that your contributions will be instrumental in the continued success of [${journalTitle}].
 
To Login for the Journal ${journalPath}, please enter your
password: ${pass}
email: ${req.body.email}

Best regards,
${journalTitle}
    `,
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
        }else if(req.body.role == "author" || req.body.role == "Author"){
            const mailOptions = {
                from: journalEmail,  // Replace with your Gmail email address
                to: req.body.email,
                subject: `Welcome to [${journalTitle}] - Registration Confirmation`,
                text: `
Dear ${req.body.first_name} ${req.body.last_name},
    
We are delighted to inform you that you have been successfully registered as an author with [${journalTitle}].

As an esteemed contributor to our journal, you now have access to a range of resources and tools to assist you in preparing and submitting your manuscripts. Our online platform allows you to track the progress of your submissions, interact with reviewers, and manage your publication records efficiently.
    
To get started, please visit our website and log in using the credentials you created during registration. Should you need any assistance or have any questions, our support team is readily available to help you.
    
Thank you for choosing to share your research with [${journalTitle}]. We look forward to your valuable contributions.
    
To Login for the Journal ${journalPath}, please enter your
password: ${pass}
email: ${req.body.email}

Best regards,
${journalTitle}
    `,
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
        }     
        
            res.status(200).json({
            data: req.body,
            msg: "Success..."
        })
});

const getAllUsers = asyncHandler(
    async (req, res, next) => {

        let search = "";
        if(req.query.search){
            search =  `where role LIKE '%${req.query.search}%' or email LIKE '%${req.query.search}%' or first_name LIKE '%${req.query.search}% or last_name LIKE '%${req.query.search}%'`;
        }

        const query = util.promisify(connection.query).bind(connection);
        const users = await query(`select id, title, first_name, last_name, email, country, role from users ${search}`);
        
        res.status(200).json({
        data: users,
        msg: "Success..."
        });
});

const getUserById = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        const user = await query("select id, title, first_name, last_name, email, country, role from users where id =?", req.params.id);
        
        res.status(200).json({
        data: user,
        msg: "Success..."
        });
});

const searchUser= asyncHandler(
    async (req, res, next) => {
        
        let search = "";
        if(req.query.search){
            search =  `where role LIKE '%${req.query.search}%' or email LIKE '%${req.query.search}%' or first_name LIKE '%${req.query.search}% or last_name LIKE '%${req.query.search}%'`;
        } 
        const query = util.promisify(connection.query).bind(connection);
        const user = await query(`select id, title, first_name, last_name, email, country, role from users ${search}`, req.params.id);
        
        res.status(200).json({
        data: user,
        msg: "Success..."
        });
});

const deleteUser = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        const checkUser = await query("select * from users where id = ?", req.params.id);
        if (!checkUser[0]){
            return next(appError.create(400, httpStatusText.ERROR, "user is not found..!"));
        }

        await query("delete from users where id = ?", req.params.id);
        
        
        res.status(200).json({
        data: null,
        msg: "Delete Successfully..."
        })
});

const updateUser = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        const checkUser = await query("select * from users where id = ?", req.params.id);
        if (!checkUser[0]){
            return next(appError.create(400, httpStatusText.ERROR, "user is not found..!"));
        }
        
        
        await query("update users set ? where id = ?",[req.body, req.params.id]);
        
        
        res.status(200).json({
        data: null,
        msg: "Update Successfully..."
        });
});



module.exports = {
    addUser,
    deleteUser,
    updateUser,
    getAllUsers,
    getUserById,
    
};
