const connection = require("../DB/connection");
const util = require("util");
const {validationResult} = require("express-validator");
const asyncHandler = require("express-async-handler");
const appError = require("../utils/appError");
const httpStatusText = require("../utils/httpStatusText");
const nodemailer = require("nodemailer");

const getAllMyAssigned = asyncHandler(
    async (req, res, next) => {

        let search = "";
        if(req.query.search){
            search =  `AND (a.full_title LIKE '%${req.query.search}%' OR r.status LIKE '%${req.query.search}%')`;
        }
        const query = util.promisify(connection.query).bind(connection);
        const myAssigned =  await query(`select r.id, r.status, r.response_date, r.review_date, r.send_date, r.round_id, a.full_title, r.article_id
                                        from review as r
                                        join articles as a ON r.article_id = a.id
                                        where reviewer_id =? ${search} AND (r.status = "pending" OR r.status = "review")`,
                                        res.locals.user.id
                                        );

        myAssigned.map((item)=>{
            const datesObject = {
                response_date: new Date(item.response_date),
                review_date: new Date(item.review_date),
                send_date: new Date(item.send_date)
            };
    
            for (const key in datesObject) {
                if (datesObject.hasOwnProperty(key)) {
                    const date = datesObject[key];
                    const dateWithoutTime = date.toISOString().split('T')[0]; // Extract the date part
                    datesObject[key] = dateWithoutTime;
                }
            }
            item.response_date = datesObject.response_date;
            item.review_date = datesObject.review_date;
            item.send_date = datesObject.send_date;
        });

        if(!myAssigned[0]){
            res.status(200).json({
                msg: "No matching results found..!"
            })
        } 

        res.status(200).json({
            data: myAssigned,
            msg: "Success..."
        })
});

const getReviewById = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        const review =  await query(`select r.id, r.status, r.response_date, r.review_date, r.send_date, r.round_id, r.article_id, a.full_title, a.abstract, a.keywords, a.submission_date, a.related_subject, a.article_type_id, t.type_name
                                    from review as r
                                    join articles as a ON r.article_id = a.id
                                    join article_type as t ON a.article_type_id = t.id
                                    where r.id =?`, req.params.id);
        

        const datesObject = {
            response_date: new Date(review[0].response_date),
            review_date: new Date(review[0].review_date),
            send_date: new Date(review[0].send_date)
        };

        for (const key in datesObject) {
            if (datesObject.hasOwnProperty(key)) {
                const date = datesObject[key];
                const dateWithoutTime = date.toISOString().split('T')[0]; // Extract the date part
                datesObject[key] = dateWithoutTime;
            }
        };

        review[0].response_date = datesObject.response_date;
        review[0].review_date = datesObject.review_date;
        review[0].send_date = datesObject.send_date;
        
        res.status(200).json({
            data: review[0],
            msg: "Success..."
        })
});

const archive = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);

        let search = "";
        if(req.query.search){
            search =  `AND (a.full_title LIKE '%${req.query.search}%' OR r.status LIKE '%${req.query.search}%')`;
        }

        const archive =  await query(`select r.id, r.status, r.response_date, r.review_date, r.send_date, a.full_title, r.article_id
                                        from review as r
                                        join articles as a ON r.article_id = a.id
                                        where r.reviewer_id =? ${search} AND (r.status = "complete" OR r.status = "reject")`,
                                        res.locals.user.id
                                        );

        if(!archive[0]){
            res.status(200).json({
                msg: "No matching results found..!"
            })
        }

        archive.map((item)=>{
            const datesObject = {
                response_date: new Date(item.response_date),
                review_date: new Date(item.review_date),
                send_date: new Date(item.send_date)
            };
    
            for (const key in datesObject) {
                if (datesObject.hasOwnProperty(key)) {
                    const date = datesObject[key];
                    const dateWithoutTime = date.toISOString().split('T')[0]; // Extract the date part
                    datesObject[key] = dateWithoutTime;
                }
            }
            item.response_date = datesObject.response_date;
            item.review_date = datesObject.review_date;
            item.send_date = datesObject.send_date;
        });
        
        res.status(200).json({
            data:archive,
            msg: "Success..."
        })
});

const review = asyncHandler(
    async (req, res, next) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(appError.create(400, httpStatusText.ERROR, errors.array()[0].msg));
        }

        const query = util.promisify(connection.query).bind(connection);
        
        const reviewContent = {
            note_author: req.body.note_author,
            note_editor: req.body.note_editor,
            recommendation: req.body.recommendation,
            status: "complete"     
        }

        if(req.file){
            reviewContent.file_name = req.file.filename,
            reviewContent.origin_name = req.fileName
        }
        
        await query("update review set ? where id =?", [reviewContent, req.params.id]);

        res.status(200).json({
        data: reviewContent,
        msg: "Review Success..."
        })
});

const acceptReview = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        const review = await query("select * from review where id =?", req.params.id);
        if (!review) {
            return next(appError.create(400, httpStatusText.ERROR, "review not found"));
        }
        const decision = {
            status: "review"
        };
        
        await query("update review set ? where id =?", [decision, req.params.id]);
       
        const article = await query("select * from articles where id =?", [review[0].article_id])
        if(article[0].status == "submitted"){
            const artStatus = {
                status: "review"
            };
            await query("update articles set ? where id =?", [artStatus, article[0].id]);
        }

        res.status(200).json({
        data: null,
        msg: "Success..."
        })
});

const rejectReview = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        
        const decision = {
            status: "reject"
        };
        
        await query("update review set ? where id =?", [decision, req.params.id]);
        
        res.status(200).json({
        data: null,
        msg: "Success..."
        })
});

const addReviewerDiscussion = asyncHandler(
    async (req, res, next) => {
        
        const query = util.promisify(connection.query).bind(connection);
        const review = await query("select * from review where id =?", req.params.id);
        if (!review[0]) {
            return next(appError.create(404, httpStatusText.ERROR, "review not exist"));
        }

        const dissObj = {
            subject: req.body.subject,
            from_user_id: res.locals.user.id,
            to_user_id: review[0].editor_id,
            article_id: review[0].article_id,
            message: req.body.message,  
            type: "review",
            round_id: review[0].round_id,
        }

        const disscussion = await query("insert into discussions set ?", dissObj);
        const disscussionId = disscussion.insertId;

        if(req.files){
            const files = req.files;

            files.forEach(async (file) => {
            let fileObj = {};
            const fileSizeInBytes = file.size;
            const fileSizeInKB = fileSizeInBytes / 1024;

            fileObj = {
                file_name: file.filename,
                origin_name: req.fileName,
                disc_id: disscussionId,
                size: fileSizeInKB
            }
            await query("insert into sec_files set ?", fileObj);
        });
        }
        
        
        res.status(200).json({
            data: dissObj,
            msg: "Success..."
        })
});

const getReviewDiscussions = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);

        const discussions =  await query(`SELECT d.*, file_id, f.file_name, f.origin_name, f.size, CONCAT (sender.first_name, ' ',sender.last_name) AS sender_username, CONCAT ( receiver.first_name, ' ', receiver.last_name) AS receiver_username
                                        FROM discussions as d
                                        left JOIN sec_files as f ON d.id = f.disc_id
                                        JOIN users AS sender ON d.from_user_id = sender.id
                                        JOIN users AS receiver ON d.to_user_id = receiver.id
                                        WHERE d.round_id =? AND (d.to_user_id =? OR d.from_user_id =?)
                                        order by date_created ASC`, [req.params.id, res.locals.user.id, res.locals.user.id])                 
        
                                        discussions.map((item)=>{
                                            const datesObject = {
                                                date_created: new Date(item.date_created),
                                            };
                                    
                                            for (const key in datesObject) {
                                                if (datesObject.hasOwnProperty(key)) {
                                                    const date = datesObject[key];
                                                    const dateWithoutTime = date.toISOString().split('T')[0]; // Extract the date part
                                                    datesObject[key] = dateWithoutTime;
                                                }
                                            }
                                            item.date_created = datesObject.date_created;
                                        });
        let discussion = {};
        discussions.forEach(row => {
            //console.log(row.file_id)
            const { message, subject, article_id, from_user_id, to_user_id, id, date_created, sender_username, receiver_username, file_id, file_name,origin_name, size } = row;
            if (!discussion[id]) {
                    discussion[id] = { id: id, subject, message, article_id, date_created, sender_username, receiver_username, files: [] };
            }
            if(row.file_id){
                //file_name = "http://" + req.hostname + ":4000/" + file_name;
                discussion[id].files.push({ file_id ,file_name, origin_name, size });
            }                         
        });
        let discussionObj = [];
        for(key in discussion) {
            discussionObj.push(discussion[key]);
        }

        res.status(200).json({
            data: discussionObj ,
            msg: "Success..."
        })
});

const getReviewFiles = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        const files = await query("select * from files where type =? AND round_id =?", ["review", req.params.id]);
        
        res.status(200).json({
        data: files,
        msg: "Success..."
        })
});

const getReviewCount = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        let totalCount = await query("select COUNT(*) AS tco ,SUM(CASE WHEN status = 'complete' THEN 1 ELSE 0 END) AS cou  from review where article_id =?", [req.params.id]);
       // let countOut = await query("select COUNT(*) AS cou from review where article_id =? AND status =?", [req.params.id, "complete"]);

       // totalCount = totalCount[0].tco;
        //countOut = countOut[0].cou;
        res.status(200).json({
        data: {totalCount},
        msg: "Success..."
        })
});

module.exports = {
    getAllMyAssigned,
    review,
    acceptReview,
    rejectReview,
    archive,
    addReviewerDiscussion,
    getReviewDiscussions,
    getReviewById,
    getReviewFiles,
    getReviewCount
};