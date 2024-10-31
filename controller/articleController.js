const connection = require("../DB/connection");
const util = require("util");
const {validationResult} = require("express-validator");
const asyncHandler = require("express-async-handler");
const appError = require("../utils/appError");
const httpStatusText = require("../utils/httpStatusText");
const nodemailer = require("nodemailer");
const { type } = require("os");
const fs = require('fs');
const zip = require('express-zip');
const { query } = require("express");

const articlecreation = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(appError.create(400, httpStatusText.ERROR, errors.array()[0].msg));
        }

        const newArticle = req.body;
        const  co_Author  = req.body.co_author;
        delete newArticle.co_author;
        newArticle.author_id = res.locals.user.id;
        

        const keysArray = newArticle.keywords;
        newArticle.keywords = keysArray.join(', ');    
        
        const articleResult = await query("insert into articles set ?", newArticle);
        const article_id = articleResult.insertId;
        
        for (const coAuthor of co_Author) {
            coAuthor.article_id = article_id;
            await query("insert into co_author set ?", coAuthor);
        }

        res.json({
            data: {article_id: article_id},
            msg: "The Process Succeeded.."
        });

        
});

const test = asyncHandler(
    async (req, res, next) => {
        

        /*const file_name2 = "1713328748376.pdf";
        const file_name1 = "1713328748351.pdf";
        const filePath1 = 'uploads/discussions/'+ file_name1; 
        const fileName1 = "file1.pdf";
        const filePath2 = 'uploads/discussions/'+ file_name2; 
        const fileName2 = "file2.pdf";
        // Check if the file exists
        let obj = {
            filename: fileName1,
            path: "http://" + req.hostname + ":4000/" + file_name1
        }
        res.json(obj)
        res.download(filePath1, fileName1,function(err){
        if (err) {
        console.log(err);
        } else {
    //  a download credit etc
        }

        });*/
        
        const filename = req.params.filename;
        const file = await query("select * from sec_files where origin_name =?", filename)
        
        const filePath = 'uploads/discussions/'+ file[0].file_name;

  // Check if the file exists
        if (fs.existsSync(filePath)) {
    // Set the content disposition to 'attachment' to force download
            res.download(filePath, filename, (err) => {
        if (err) {
        // Handle errors if any
            console.error('Error downloading file:', err);
            res.status(500).send(' file not found');
        }
        });
        } else {
    // If the file doesn't exist, send a 404 response
            res.status(404).send('File not found');
        }


    }
);

const articleFile = asyncHandler(
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(appError.create(400, httpStatusText.ERROR, errors.array()[0].msg));
        }

        if(!req.file){
            return next(appError.create(400, httpStatusText.ERROR, "the file name is required!"));
        }
        const fileSizeInBytes = req.file.size;
        const fileSizeInKB = fileSizeInBytes / 1024;
        const newFile = {
            article_id: req.params.id,
            file_type: req.body.file_type,
            file_name: req.file.filename,
            origin_name: req.fileName,
            size: fileSizeInKB,
            type: "submission"
        }

        const query = util.promisify(connection.query).bind(connection);
        await query("insert into files set ?", newFile);

        res.status(200).json({
            data: newFile,
            msg: "The file was added successfully."
        });
        
});

const suggestReviewer = asyncHandler(
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(appError.create(400, httpStatusText.ERROR, errors.array()[0].msg));
        }
        const query = util.promisify(connection.query).bind(connection);
        
        for (const sug_reviewer of req.body.sug_reviewers) {
            sug_reviewer.article_id = req.params.id;
            //console.log(sug_reviewer)
            await query("insert into sug_reviewer set ?", sug_reviewer);
        }

        res.status(200).json("The reviewer was added successfully.")
        
});

const getArticleInfo = asyncHandler(
    async (req, res, next) =>{

        let articleInfo = {}
        const query = util.promisify(connection.query).bind(connection);
        const article = await query(`select a.id, a.status, a.full_title, a.short_title, a.abstract, a.keywords, a.related_subject,  a.submission_date, t.type_name 
                                    from articles as a
                                    join article_type as t on a.article_type_id = t.id where a.id =?`, 
                                    req.params.id);

        const coAuthors = await query("select * from  co_author where article_id =?", req.params.id);
        const files = await query("select * from  files where article_id =?", req.params.id);
        const reviewers = await query("select * from  sug_reviewer where article_id =?", req.params.id);

        articleInfo.article = article;
        articleInfo.coAuthors = coAuthors;
        articleInfo.files = files;
        articleInfo.reviewers = reviewers;

        res.status(200).json({
            data: articleInfo,
            mgs: "Success..."
        })
});

const articleSubmission = asyncHandler(
    async (req, res, next) => {
        
        const query = util.promisify(connection.query).bind(connection);
        const article = await query("select * from articles  where id =?", req.params.article_id);
        
        const newArticle = {
            status: "submission",
            submission_date: new Date()
        }
   

        await query("update articles set ? where id =?", [newArticle, req.params.article_id]);

        const journal = await query("select title, path, journal_email from journal where id = 1");
        const Editor = await query("select * from users where role =?", "chief_in_editor");

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

        
        // Editor's email address
        const editorEmail = Editor[0].email;  
        
        // Article information
        const articleTitle = article[0].short_title;
        const abstract = article[0].abstract;
        const keywords = article[0].keywords;


        const mailOptions = {
            from: journalEmail,  // Replace with your Gmail email address
            to: editorEmail,
            subject: `Submission of New Article - ${articleTitle}`,
            text: `
Dear ${Editor[0].first_name} ${Editor[0].last_name},

I am writing to inform you about a new article that we would like to submit to the journal. Please find the details below:

- Title: ${articleTitle}
- Abstract: ${abstract}
- Keywords: ${keywords}

For more details, see your journal account.
Thank you for your attention to this matter. We look forward to the possibility of our article being considered for publication in the journal.

Best regards,
${journalTitle}
`,
};

          // Send email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });
        
        res.status(200).json({
            msg: "submit successfully.",
        })
});

const searchForUsers = asyncHandler(
    async(req, res) =>{
        const query = util.promisify(connection.query).bind(connection);

        let search = "";
        if(req.query.search){
            search =  `where role LIKE '%${req.query.search}%'`;
        } 

        const users = await query(`select * from users ${search}`);
        res.status(200).json(users);

});


const assignArticle = asyncHandler(
    async (req, res, next) => {
        const query = util.promisify(connection.query).bind(connection);

        let newDate = new Date();
        newDate.setDate(newDate.getDate() + req.body.specified_date);

        //date.setDate(date.getDate() + daysToAdd);
        const newReview = {
            article_id: req.params.id,
            reviewer_id: req.body.reviewer_id,
            comment: req.body.comment,
            status: "assigned",
            specified_date: newDate
        };

        await query("insert into reviews set ?", newReview);

        res.status(200).json({
            data: newReview,
            msg: "success.."
        })
});


/////////////////////////////////////////
const articleInfo = asyncHandler(
    async (req, res, next) => {
        const query = util.promisify(connection.query).bind(connection);

        let newDate = new Date();
        newDate.setDate(newDate.getDate() + req.body.specified_date);

        //date.setDate(date.getDate() + daysToAdd);
        const newReview = {
            article_id: req.params.id,
            reviewer_id: req.body.reviewer_id,
            comment: req.body.comment,
            status: "assigned",
            specified_date: newDate
        };

        await query("insert into reviews set ?", newReview);

        res.status(200).json({
            data: newReview,
            msg: "success.."
        })
});

const publish = asyncHandler(
    async (req, res, next) => {
        
        const query = util.promisify(connection.query).bind(connection);
        const article = await query("select * from articles  where id =?", req.params.article_id);
        
        const newArticle = {
            status: "Publish",
            submission_date: new Date()
        }

        await query("update articles set ? where id = ?", [newArticle, req.params.article_id]);
        
        
        const Editor = await query("select * from users where journal_id =? AND role =?", [article[0].journal_id, "editor"]);
        const journal = await query("select * from journals where id =? ", [article[0].journal_id]);

        // send email of Submission of New Article
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'hasnaamohamed804@gmail.com',    
                pass: 'osbvzykqqnuzskzj',     
            },
        });
        
        // Editor's email address
        const editorEmail = Editor[0].email;  
        
        // Article information
        const articleTitle = article[0].short_title;
        const authors = 'Author 1, Author 2';
        const abstract = article[0].abstract;
        const keywords = article[0].keywords;


        const mailOptions = {
            from: 'hasnaamohamed804@gmail.com',  // Replace with your Gmail email address
            to: editorEmail,
            subject: `Submission of New Article - ${articleTitle}`,
            text: `
            Dear ${Editor[0].userName},

            I am writing to inform you about a new article that we would like to submit to the journal. Please find the details below:

            - Title: ${articleTitle}
            - Authors: ${authors}
            - Abstract: ${abstract}
            - Keywords: ${keywords}

            For more details, see your journal account.
            Thank you for your attention to this matter. We look forward to the possibility of our article being considered for publication in the journal.

            Best regards,
            ${journal[0].name}
            `,
            };

          // Send email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });
        
        res.status(200).json({
            msg: "submit successfully.",
        })
});

module.exports = {
    articlecreation,
    articleFile,
    articleSubmission,
    getArticleInfo,
    searchForUsers,
    assignArticle,
    test,
    suggestReviewer
}