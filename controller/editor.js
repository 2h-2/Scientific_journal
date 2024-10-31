const connection = require("../DB/connection");
const util = require("util");
const {validationResult} = require("express-validator");
const {decisionAccept, decisionReject, decisionMinorRevision, decisionMajerRevision} = require("../utils/emailTemplates");
const asyncHandler = require("express-async-handler");
const appError = require("../utils/appError");
const httpStatusText = require("../utils/httpStatusText");
const nodemailer = require("nodemailer");
const fs = require('fs');
const { promisify } = require('util');
const readdirAsync = promisify(fs.readdir);
const path = require("path"); 
const bcrypt = require("bcrypt");

//const { iterator } = require("core-js/fn/symbol");

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

//////////////////////////////////////////////////////
//Submission Stage
//////////////////////////////////////////////////////
function copyFile(sourcePath, destinationPath) {
    // Create a readable stream from the source file
    const sourceStream = fs.createReadStream(sourcePath);
  
    // Create a writable stream to the destination file
    const destinationStream = fs.createWriteStream(destinationPath);
  
    // Pipe the source stream to the destination stream
    sourceStream.pipe(destinationStream);
  
    // Handle errors
    sourceStream.on('error', (err) => {
      console.error('Error reading source file:', err);
    });
  
    destinationStream.on('error', (err) => {
      console.error('Error writing to destination file:', err);
    });
  
    // Handle finish event (copy completed)
    destinationStream.on('finish', () => {
      console.log('File copied successfully');
    });
}
const ArticleInfo = asyncHandler(
    async (req, res, next) =>{

        const query = util.promisify(connection.query).bind(connection);
        const article = await query(`select a.id, a.full_title, a.abstract, a.keywords, a.author_id, t.type_name from articles as a
                                    join article_type as t on t.id = a.article_type_id
                                    where a.id =?`, req.params.id);

        res.status(200).json({
            data: article,
            mgs: "Success..."
        })
});
const form = [
    {
        file_type: "type1",
        file_name: "fileName1.pdf"
    },
    {
        file_type: "type2",
        file_name: "fileName2.jpg"
    },
]
// (CDUR) Editor's tasks 
const showNewSubmissions = asyncHandler(
    async (req, res, next) => {
        const query = util.promisify(connection.query).bind(connection);
        const user = await query("select id, role from users where id =?", res.locals.user.id);

        let search = "";
        if(req.query.search){
            search =  `AND (a.full_title LIKE '%${req.query.search}%' OR a.status LIKE '%${req.query.search}%' OR t.type_name LIKE '%${req.query.search}%')`;
        }
        let Submissions = {};
        if(user[0].role == "chief_in_editor"){
            Submissions = await query(`select a.id, a.full_title,  t.type_name, a.abstract, a.keywords,  a.status, a.submission_date from articles as a
                                    join article_type as t on a.article_type_id = t.id
                                    where (a.status = 'submission' OR a.status = 'accepted' OR a.status = 'rejected' OR a.status = 'review')  ${search}`);
        }else{
            
            Submissions = await query(`select a.id, a.full_title,  t.type_name, a.abstract, a.keywords, a.status, a.submission_date
                                        from articles as a 
                                        join article_type as t on a.article_type_id = t.id
                                        join article_editor as e ON a.id = e.article_id
                                        where e.editor_id =? ${search} AND (a.status = 'submission' OR a.status = 'accepted' OR a.status = 'rejected' OR a.status = 'review')`, res.locals.user.id);
        }
        
        for(let i = 0; i <Submissions.length; i++){
            
            const rounds = await query("select * from rounds where article_id =?", [Submissions[i].id]);
            let totalCount = await query("select COUNT(*) AS tco ,SUM(CASE WHEN status = 'complete' THEN 1 ELSE 0 END) AS cou from review where article_id =?", [Submissions[i].id]);
            if(rounds[0]){
                
                Submissions[i].roundId = rounds[0].id;
                if(totalCount[0].tco  != 0) {Submissions[i].totalCount = totalCount;}
            }else{
                Submissions[i].roundId = 0;
                if(totalCount[0].tco  != 0) {Submissions[i].totalCount = totalCount;}
            }
            
        }
        Submissions.map((item)=>{
            const datesObject = {
                submission_date: new Date(item.submission_date),
            };
    
            for (const key in datesObject) {
                if (datesObject.hasOwnProperty(key)) {
                    const date = datesObject[key];
                    const dateWithoutTime = date.toISOString().split('T')[0]; // Extract the date part
                    datesObject[key] = dateWithoutTime;
                }
            }
            item.submission_date = datesObject.submission_date;
        });
        res.status(200).json({
            data: Submissions,
            msg: "success.."
        }) 
});

const Archive = asyncHandler(
    async (req, res, next) => {
        const query = util.promisify(connection.query).bind(connection);
        const user = await query("select role from users where id =?", res.locals.user.id);

        let search = "";
        if(req.query.search){
            search =  `AND (a.full_title LIKE '%${req.query.search}%' OR a.status LIKE '%${req.query.search}%' OR t.type_name LIKE '%${req.query.search}%')`;
        }
        let Submissions = {};
        if(user[0].role == "chief_in_editor"){
            Submissions = await query(`select a.id, a.full_title,  t.type_name, a.abstract, a.keywords,  a.status, a.submission_date from articles as a
                                    join article_type as t on a.article_type_id = t.id
                                    where (a.status = 'rejected' OR a.status = 'published') ${search} `);
        }else{
            
            Submissions = await query(`select a.id, a.full_title,  t.type_name, a.abstract, a.keywords, a.status, a.submission_date
                                        from articles as a 
                                        join article_type as t on a.article_type_id = t.id
                                        join article_editor as e ON a.id = e.article_id
                                        where e.editor_id =? ${search} AND (a.status = 'rejected' OR a.status = 'published' )`, res.locals.user.id);
        }

        for(let i = 0; i <Submissions.length; i++){
            
            const rounds = await query("select * from rounds where article_id =?", [Submissions[i].id]);
            let totalCount = await query("select COUNT(*) AS tco ,SUM(CASE WHEN status = 'complete' THEN 1 ELSE 0 END) AS cou from review where article_id =?", [Submissions[i].id]);
            if(rounds[0]){
             
                Submissions[i].roundId = rounds[0].id;
                if(totalCount[0].tco  != 0) {Submissions[i].totalCount = totalCount;}
            }else{
                Submissions[i].roundId = 0;
                if(totalCount[0].tco  != 0) {Submissions[i].totalCount = totalCount;}
            }
            
        }
        Submissions.map((item)=>{
            const datesObject = {
                submission_date: new Date(item.submission_date),
            };
    
            for (const key in datesObject) {
                if (datesObject.hasOwnProperty(key)) {
                    const date = datesObject[key];
                    const dateWithoutTime = date.toISOString().split('T')[0]; // Extract the date part
                    datesObject[key] = dateWithoutTime;
                }
            }
            item.submission_date = datesObject.submission_date;
        });
       
        res.status(200).json({
            data: Submissions,
            msg: "success.."
        }) 
});

const assignArticleToEditor = asyncHandler(
    async (req, res, next) => {
        const query = util.promisify(connection.query).bind(connection);
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(appError.create(400, httpStatusText.ERROR, errors.array()[0].msg));
        }

        const ed_article = await query("select * from article_editor where editor_id=? AND article_id=? AND from_id=?", [req.body.editor_id,req.body.article_id,res.locals.user.id]);
        if(ed_article[0]) {
            return next(appError.create(400, httpStatusText.ERROR, "This editor has already been assigned to this article"));
        }
        const obj = {
            editor_id: req.body.editor_id,
            article_id: req.body.article_id,
            from_id: res.locals.user.id,
            message: req.body.message
        }
        
        await query("insert into article_editor set ?", obj);
        
        const disc = {
            subject: "Editorial assignment",
            to_user_id: req.body.editor_id,
            from_user_id: res.locals.user.id,
            article_id: req.body.article_id,
            message: req.body.message,
            type: "submission"
        }
        await query("insert into discussions set ?", disc);

        
        
        // send email for new assign
        
        /*
        if(req.body.checkEmail){
            
        }
        const articleObj = await query(`select a.author_id, a.full_title, u.first_name, u.last_name 
                                    from articles as a
                                    join users as u on u.id = a.author_id
                                    where a.id =?`, 
                                    req.body.article_id);


        const chief_in_editor = await query("select first_name, middle_name, last_name, email from users where id =?", res.locals.user.id);
        const editor = await query("select first_name, middle_name, last_name, email from users where id =?", req.body.editor_id);

        let usernameCheif = "";
        if(chief_in_editor[0].middle_name){
            usernameCheif = `${chief_in_editor[0].first_name} ${chief_in_editor[0].middle_name} ${chief_in_editor[0].last_name}`;
        }else{
            usernameCheif = `${chief_in_editor[0].first_name} ${chief_in_editor[0].last_name}`;
        }
        
        const authorName = `${articleObj[0].first_name} ${articleObj[0].last_name}`;
        
        let usernameEditor = "";
        if(editor[0].middle_name){
            usernameEditor = `${editor[0].first_name} ${editor[0].middle_name} ${editor[0].last_name}`;
        }else{
            usernameEditor = `${editor[0].first_name} ${editor[0].last_name}`;
        }
        
        const senderInfo = {
            userName: usernameCheif,
            email: chief_in_editor[0].email
        }
        const receiverInfo = {
            userName: usernameEditor,
            email: editor[0].email
        }

        const body = emailTemplates.editorialAssignment(articleObj[0].title, authorName)
        emailTemplates.emailTemplate("Editorial Assignment", body, senderInfo, receiverInfo);*/

        res.status(200).json({
            data: req.body,
            msg: "Assign Successfully..."
        })
});

const unAssignEditor = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        const checkEditor = await query("select * from article_editor where id = ?", [req.params.id]);
        
        if (!checkEditor[0]){
            res.status(404).json({
                msg: "assignation not found !",
            });
        }
    
        await query("delete from article_editor where id =?", [req.params.id]);

        res.status(200).json({
            msg: "unAssign Successfully..."
        })
});

const getAllEditors = asyncHandler(
    async (req, res, next) => {

        let search = "";
        if(req.query.search){
            search =  `AND (field_of_study LIKE '%${req.query.search}% OR affiliation LIKE '%${req.query.search}%)'`;
        } 

        const query = util.promisify(connection.query).bind(connection);
        const Editors =  await query(`select id, title, first_name, middle_name, last_name , field_of_study from users where role =? AND Not id =?`, ["editor", res.locals.user.id])
        
        
        let Obj = Editors.map((item)=>{
            let editor = {};
            editor.id = item.id
            if(item.middle_name){
                editor.specialty = item.field_of_study;
                editor.userName  = `${item.title}/ ${item.first_name} ${item.middle_name} ${item.last_name}`
                return editor; 
            }else{
                editor.specialty = item.field_of_study;
                editor.userName = `${item.title}/ ${item.first_name} ${item.last_name}`
                return editor;
            }
        })
        
        res.status(200).json({
            data: Obj
        })
});

const editorParticipants = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        

        const Editors =  await query(`select DISTINCT users.id, first_name, middle_name, last_name, role 
                                        from users
                                        join article_editor on users.id = article_editor.editor_id
                                        where article_id =? AND NOT users.id =?`,[req.params.id, res.locals.user.id]
                                        );

        if(res.locals.user.role != "chief_in_editor"){
            const chief_in_editor = await query(`select id, first_name, middle_name, last_name, role from users where role =?`, ["chief_in_editor"]);
            Editors.push(chief_in_editor[0]);
        }

        

        const Author = await query(`select a.id, a.author_id, u.id, u.first_name, u.middle_name, u.last_name, u.role from articles as a
                                join users as u on u.id = a.author_id
                                where a.id =?`,[req.params.id]);

        //const Author =  await query(`select users.id, first_name, middle_name, last_name, role from users where id =?`,[req.body.author_id]);
        let authorObj = {};
        authorObj.id = Author[0].id;
        authorObj.role = Author[0].role;
        authorObj.userName = `${Author[0].first_name} ${Author[0].last_name}`;
                    
            const Obj = Editors.map((item)=>{
            let editor = {};
            editor.id = item.id;
            editor.role = item.role;
            if(item.middle_name){
                editor.userName = item = `${item.first_name} ${item.middle_name} ${item.last_name}`;
                return editor; 
            }else{
                editor.userName = item = `${item.first_name} ${item.last_name}`;
                return editor;
            }
        })
        let dataObj = new Array();
        dataObj.push(authorObj); 
        dataObj.push(...Obj); 

        res.status(200).json({
            data:{
                dataObj
            },
            msg: "Success..."
        })
});

const deleteSubmission = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        const Submission =  await query(`select * from articles where id =?`, req.params.id);                           
        const files =  await query(`select * from files where article_id =?`, req.params.id);      
        if(!Submission[0]){
            res.status(404).json({
                msg: "Submission not found !",
            });
        }else{
            await query("delete from articles where id =?", [req.params.id]);
            files.map((item)=>{
                const filePath =  path.join(__dirname, '../uploads/submissions/', item.file_name); // Adjust the file path as needed
                if(filePath){
                    fs.unlinkSync("uploads/submissions/" + item.file_name);
                }    
            })
        res.status(200).json({
                msg: "Success..."
        })
        }
        
        
});

// (CDUR) Discussion
const addDiscussionSub = asyncHandler(
    async (req, res, next) => {
        
        const query = util.promisify(connection.query).bind(connection);
        const author = await query("select * from users where id =?", req.body.to_user_id);
        if (!author[0]) {
            return next(appError.create(404, httpStatusText.ERROR, "user not exist"));
        }

        const dissObj = {
            subject: req.body.subject,
            from_user_id: res.locals.user.id,
            to_user_id: req.body.to_user_id,
            article_id: req.params.id,
            message: req.body.message,  
            type: "submission"
        }


        const disscussion = await query("insert into discussions set ?", dissObj);
        const disscussionId = disscussion.insertId;

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
            console.log(fileObj);
            await query("insert into sec_files set ?", fileObj);
        });
        
        res.status(200).json({
            msg: "Success..."
        })
});

const getAllDiscussionsub = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);

        const discussions =  await query(`SELECT d.*, file_id, f.file_name, f.origin_name, f.size, CONCAT (sender.first_name, ' ',sender.last_name) AS sender_username, CONCAT ( receiver.first_name, ' ', receiver.last_name) AS receiver_username
                                        FROM discussions d
                                        left JOIN sec_files f ON d.id = f.disc_id
                                        JOIN users AS sender ON d.from_user_id = sender.id
                                        JOIN users AS receiver ON d.to_user_id = receiver.id
                                        WHERE d.article_id =? AND d.type = "submission" AND (d.to_user_id =? OR d.from_user_id =?)
                                        order by d.id DESC`, [req.params.id, res.locals.user.id, res.locals.user.id])                 
        
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
                                        
        const discussion = {};
        discussions.forEach(row => {
            let { message, subject, article_id, from_user_id, to_user_id, id, date_created, sender_username, receiver_username, file_id, file_name, origin_name,size } = row;
            if (!discussion[id]) {
                    discussion[id] = { id: id, subject, message, article_id, date_created, sender_username, receiver_username, files: [] };
            }
            if(row.file_id){
                
                discussion[id].files.push({ file_id ,file_name, origin_name, size });
            }                         
        });
        
        const discussionObj = [];
        for(key in discussion) {
            discussionObj.push(discussion[key]);
        }
        
        //const users = await query("select first_name, middle_name, last_name from users where id =? OR id =?", [discussions[0].from_user_id, discussions[0].to_user_id])
        res.status(200).json({
            data: discussionObj,
            msg: "Assign Successfully..."
        })
});

const addDiscussionPro= asyncHandler(
    async (req, res, next) => {
        
        const query = util.promisify(connection.query).bind(connection);
        const author = await query("select * from users where id =?", req.body.to_user_id);
        if (!author[0]) {
            return next(appError.create(404, httpStatusText.ERROR, "user not exist"));
        }

        const dissObj = {
            subject: req.body.subject,
            from_user_id: res.locals.user.id,
            to_user_id: req.body.to_user_id,
            article_id: req.params.id,
            message: req.body.message,  
            type: "production"
        }


        const disscussion = await query("insert into discussions set ?", dissObj);
        const disscussionId = disscussion.insertId;

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
            console.log(fileObj);
            await query("insert into sec_files set ?", fileObj);
        });
        
        res.status(200).json({
            msg: "Success..."
        })
});

const getAllDiscussionsPro = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);

        const discussions =  await query(`SELECT d.*, file_id, f.file_name, f.origin_name, f.size, CONCAT (sender.first_name, ' ',sender.last_name) AS sender_username, CONCAT ( receiver.first_name, ' ', receiver.last_name) AS receiver_username
                                        FROM discussions d
                                        left JOIN sec_files f ON d.id = f.disc_id
                                        JOIN users AS sender ON d.from_user_id = sender.id
                                        JOIN users AS receiver ON d.to_user_id = receiver.id
                                        WHERE d.article_id =? AND d.type = "production" AND (d.to_user_id =? OR d.from_user_id =?)
                                        order by d.id DESC`, [req.params.id, res.locals.user.id, res.locals.user.id])                 
        
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
                                        
        const discussion = {};
        discussions.forEach(row => {
            let { message, subject, article_id, from_user_id, to_user_id, id, date_created, sender_username, receiver_username, file_id, file_name, origin_name,size } = row;
            if (!discussion[id]) {
                    discussion[id] = { id: id, subject, message, article_id, date_created, sender_username, receiver_username, files: [] };
            }
            if(row.file_id){
                discussion[id].files.push({ file_id, file_name ,origin_name, size });
            }                         
        });
        
        const discussionObj = [];
        for(key in discussion) {
            discussionObj.push(discussion[key]);
        }
        
        //const users = await query("select first_name, middle_name, last_name from users where id =? OR id =?", [discussions[0].from_user_id, discussions[0].to_user_id])
        res.status(200).json({
            data: discussionObj,
            msg: "Assign Successfully..."
        })
});

const getSubmissionFiles = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        const files = await query(`select f.id, f.file_name, f.origin_name, f.size, c.name from files as f
                                join components as c on f.file_type = c.id
                                where type =? AND article_id =?`, ["submission", req.params.id]);
        
        /*files.map((item)=>{
            item.file_name = "http://" + req.hostname + ":4000/" + item.file_name;
        })*/
        res.status(200).json({
        data: files,
        msg: "Success..."
        })
});

const getRevisionFiles = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        const files = await query(`select f.id, f.file_name, f.origin_name, f.size, c.name from files as f
                                join components as c on f.file_type = c.id 
                                where type =? AND round_id =?`, ["revision", req.params.id]);
        
        res.status(200).json({
        data: files,
        msg: "Success..."
        })
});

const deleteRevision = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        const revision =  await query(`select * from files where id =?`, req.params.id);                           
        
        if(!revision[0]){
            res.status(404).json({
                msg: "revision not found !",
            });
        }
        
        fs.unlinkSync("uploads/submissions/" + revision[0].file_name);
        await query("delete from files where id =?", [req.params.id]);

        res.status(200).json({
                msg: "Success..."
        })
        
});

const deleteDiscussion = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        const disc =  await query(`select * from discussions where id =?`, req.params.id); 
        const files =  await query(`select * from sec_files where disc_id =?`, req.params.id);                           
        
        if(!disc[0]){
            res.status(404).json({
                msg: "disc not found !",
            });
        }else{
            files.map(async(item)=>{
                fs.unlinkSync("uploads/discussions/" + item.file_name);
                await query("delete from sec_files where disc_id =?", req.params.id);
            })
            await query("delete from discussions where id =?",req.params.id);
    
            res.status(200).json({
                    msg: "Success..."
            })
        }
        
        
});

const getEReviewFiles = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        const files = await query(`select f.id, f.file_name, f.origin_name, f.size, c.name from files as f
                                join components as c on f.file_type = c.id 
                                where type =? AND round_id =?`, ["review", req.params.id]);
        
        res.status(200).json({
        data: files,
        msg: "Success..."
        })
});

const acceptArticle = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        const status = {
            status: "accepted"
        }
        await query("update articles set ? where id=?", [status, req.params.id]);
        
        
        if(req.body.checkBox=="true"){
            const article = await query(`select full_title, CONCAT(first_name, ' ', last_name) AS userName, email from articles as a
                                        join users as u on u.id = a.author_id
                                        where a.id=?`, req.params.id);

            const editor = await query("select CONCAT(first_name, ' ', last_name) AS userName, email from users where id =?", res.locals.user.id);
            const body = req.body.message;
            const files = req.files;
            
            let fileArr = [];
            files.map((item)=>{
                let obj = {
                    filename: item.originalname,
                    content: item.buffer
                }
                fileArr.push(obj);
            });
            
            decisionAccept(article[0].full_title, body, fileArr,  editor[0], article[0]);
        }

        res.status(200).json({
            msg: "Success..."
        })
        
});

const rejectArticle = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        const status = {
            status: "rejected"
        }
        await query("update articles set ? where id=?", [status, req.params.id]);
        
        //console.log(req.body.checkBox)
        if(req.body.checkBox=="true"){
            const article = await query(`select full_title, CONCAT(first_name, ' ', last_name) AS userName, email from articles as a
                                        join users as u on u.id = a.author_id
                                        where a.id=?`, req.params.id);

            const editor = await query("select CONCAT(first_name, ' ', last_name) AS userName, email from users where id =?", res.locals.user.id);
            const body = req.body.message;
            const files = req.files;
            
            let fileArr = [];
            files.map((item)=>{
                let obj = {
                    filename: item.originalname,
                    content: item.buffer
                }
                fileArr.push(obj);
            });
            
            decisionReject(article[0].full_title, body, fileArr,  editor[0], article[0]);
        }

        res.status(200).json({
            msg: "Success..."
        })

});

//////////////////////////////////////////////////////
//Review Stage
//////////////////////////////////////////////////////

const assignReviewer = asyncHandler(
    async (req, res, next) => {
        const query = util.promisify(connection.query).bind(connection);
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(appError.create(400, httpStatusText.ERROR, errors.array()[0].msg));
        }
        console.log(req.body)
        const reviewer = await query("select * from review where reviewer_id =? AND article_id =?", [req.body.reviewer_id, req.body.article_id])
        const checkUser = await query("select * from users where id = ? ", [req.body.reviewer_id]);
        if(reviewer[0]){
            res.status(200).json({
                msg: "please open a new round!"
            });
        }else{
            delete req.body.checkBox;
        const Obj = {
            ...req.body,
            editor_id: res.locals.user.id,
            round_id: req.params.id
        }
        
        await query("insert into review set?", Obj);

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

            const mailOptions = {
                from: journalEmail,  // Replace with your Gmail email address
                to: checkUser[0].email,
                subject: `Welcome to [${journalTitle}] - Registration Confirmation `,
                text: `
Dear ${checkUser[0].first_name} ${checkUser[0].last_name},
    
We would be grateful if you could confirm your availability to review this manuscript. Please find the manuscript attached for your reference. If you agree to review, we request that you complete your review by [due date, typically 2-3 weeks from the date of invitation].

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
        
        
        res.status(200).json({
            data: Obj ,
            msg: "Done Successfully..."
        });
        }
        
});


const unAssignReviewer = asyncHandler(
    async (req, res, next) => {
        const query = util.promisify(connection.query).bind(connection);
        const review = await query("select * from review where id =?", req.params.id)
       
        if(!review[0]){
            res.status(200).json({
                msg: "review not found!"
            });
        }else{
            await query("delete from review where id =?", [req.params.id]);
        
            res.status(200).json({
                msg: "Delete Successfully..."
            });
        }
        
});

const getAllReviewers = asyncHandler(
    async (req, res, next) => {

        let search = "";
        if(req.query.search){
            search =  `AND (first_name LIKE '%${req.query.search}% OR last_name LIKE '%${req.query.search}% OR field_of_study LIKE '%${req.query.search}% OR affiliation LIKE '%${req.query.search}%)'`;
        } 

        const query = util.promisify(connection.query).bind(connection);
        const Reviewers =  await query(`select id, title, first_name, middle_name, last_name , field_of_study from users where role =?`, ["reviewer"]);
        
        
        let Obj = Reviewers.map((item)=>{
            let editor = {};
            editor.id = item.id
            if(item.middle_name){
                editor.specialty = item.field_of_study;
                editor.userName  = `${item.title}/ ${item.first_name} ${item.middle_name} ${item.last_name}`
                return editor; 
            }else{
                editor.specialty = item.field_of_study;
                editor.userName = `${item.title}/ ${item.first_name} ${item.last_name}`
                return editor;
            }
        })
        
        res.status(200).json({
            data: Obj
        })
});

const roundParticipants = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        

        const Reviewers =  await query(`select users.id, first_name, middle_name, last_name, role 
                                        from users
                                        join review on users.id = review.reviewer_id
                                        where round_id =? AND NOT users.id =?`,[req.params.id, res.locals.user.id]
                                        );

        if(res.locals.user.role != "chief_in_editor"){
            const chief_in_editor = await query(`select id, first_name, middle_name, last_name, role from users where role =?`, ["chief_in_editor"]);
            Reviewers.push(chief_in_editor[0]);
        }

        
            const Obj = Reviewers.map((item)=>{
            let reviewer = {};
            reviewer.id = item.id;
            reviewer.role = item.role;
            if(item.middle_name){
                reviewer.userName = item = `${item.first_name} ${item.middle_name} ${item.last_name}`;
                return reviewer; 
            }else{
                reviewer.userName = item = `${item.first_name} ${item.last_name}`;
                return reviewer;
            }
        })

        res.status(200).json({
            data:{
                Obj
            },
            msg: "Success..."
        })
});

const addDiscussionRound = asyncHandler(
    async (req, res, next) => {
        
        const query = util.promisify(connection.query).bind(connection);
        const round = await query("select * from rounds where id =?", req.params.id);
        if (!round[0]) {
            return next(appError.create(404, httpStatusText.ERROR, "round not exist"));
        }

        const dissObj = {
            subject: req.body.subject,
            from_user_id: res.locals.user.id,
            to_user_id: req.body.to_user_id,
            article_id: round[0].article_id,
            message: req.body.message,  
            type: "review",
            round_id: req.params.id
        }

        const disscussion = await query("insert into discussions set ?", dissObj);
        const disscussionId = disscussion.insertId;

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
        
        res.status(200).json({
            msg: "Success..."
        })
});

const getAllDiscussionRound = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);

        const discussions =  await query(`SELECT d.*, file_id, f.file_name, origin_name, f.size, CONCAT (sender.first_name, ' ',sender.last_name) AS sender_username, CONCAT ( receiver.first_name, ' ', receiver.last_name) AS receiver_username
                                        FROM discussions d
                                        left JOIN sec_files f ON d.id = f.disc_id
                                        JOIN users AS sender ON d.from_user_id = sender.id
                                        JOIN users AS receiver ON d.to_user_id = receiver.id
                                        WHERE d.round_id =? AND d.type = "review" AND (d.to_user_id =? OR d.from_user_id =?)
                                        order by date_created ASC`, [req.params.id, res.locals.user.id, res.locals.user.id]);                 
        
        

                             
                                        
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
        const discussion = {};
        discussions.forEach(row => {
            
            let { message, subject, article_id, from_user_id, to_user_id, id, date_created, sender_username, receiver_username, file_id, file_name,origin_name, size } = row;
            if (!discussion[id]) {
                    discussion[id] = { id: id, subject, message, article_id, date_created, sender_username, receiver_username, files: [] };
            }
            if(row.file_id){
                discussion[id].files.push({ file_id ,origin_name, file_name, size });
            }                         
        });

        const discussionObj = [];
        for(key in discussion) {
            discussionObj.push(discussion[key]);
        }

        
        //const users = await query("select first_name, middle_name, last_name from users where id =? OR id =?", [discussions[0].from_user_id, discussions[0].to_user_id])
        res.status(200).json({
            data: discussionObj,
            msg: "Assign Successfully..."
        })
});

const reviewFiles = asyncHandler(
    async (req, res, next) => {
        
        const query = util.promisify(connection.query).bind(connection);
        
        const ids = req.body.file_ids;
        
        const idsString = ids.join(',');
        console.log(req.body)
        console.log(idsString)
        const files = await query(`select article_id, file_type, file_name, origin_name, size from files where id IN (${idsString})`);
        if (!files[0]) {
            return next(appError.create(404, httpStatusText.ERROR, "file not exist"));
        }
        
        // initial round
        const roundObj = {
            article_id: files[0].article_id,
            round_num : 1
        }
        const round = await query("insert into rounds set ?", roundObj);
        //console.log(round)

        files.forEach(async(row) => {
            
            row.type = "review";
            row.round_id = round.insertId;
            //row.origin_name = round.insertId;

            const file_name = row.file_name;
            const sourcePath = 'uploads/submissions/' + file_name;
            const destinationPath = 'uploads/review/' + file_name;
            copyFile(sourcePath, destinationPath);
            await query("insert into files set ?", [row]);
        }) 

        res.status(200).json({
            data:{ roundId: round.insertId },
            msg: "Done Successfully..."
        });
});

const uploadReviweFile = asyncHandler(
    async (req, res, next) => {
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(appError.create(400, httpStatusText.ERROR, errors.array()[0].msg));
        }

        const newFile = {
            article_id: req.body.article_id,
            file_type: req.body.file_type,
            file_name: req.file.filename,
            origin_name: req.fileName,
        };
        const query = util.promisify(connection.query).bind(connection);
        await query("insert into review_files set?", newFile);
        
        res.status(200).json({
            data: req.body ,
            msg: "Done Successfully..."
        });
});

const sendRivision = asyncHandler(
    async (req, res, next) => {
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(appError.create(400, httpStatusText.ERROR, errors.array()[0].msg));
        }

        const query = util.promisify(connection.query).bind(connection);
        
    
            const article = await query(`select full_title, CONCAT(first_name, ' ', last_name) AS userName, email from articles as a
                                        join users as u on u.id = a.author_id
                                        where a.id=?`, req.params.id);

            const editor = await query("select CONCAT(first_name, ' ', last_name) AS userName, email from users where id =?", res.locals.user.id);
            const body = req.body.message;
            const files = req.files;
            
            let fileArr = [];
            files.map((item)=>{
                let obj = {
                    filename: item.originalname,
                    content: item.buffer
                }
                fileArr.push(obj);
            });
            
            if(req.body.revision_type == "Minor"){
                decisionMinorRevision(article[0].full_title, body, fileArr,  editor[0], article[0], req.body.revision_date);
            }else{
                decisionMajerRevision(article[0].full_title, body, fileArr,  editor[0], article[0], req.body.revision_date);
            }
            
        
        
        
        /*const revision = {
            revision_type: req.body.revision_type,
            article_id: req.params.id,
            editor_id: res.locals.user.id,
            author_id: author_id[0].author_id,
            revision_date: req.body.revision_date,
            message: req.body.message
        };

        const revisionId =await query("insert into revision set?", revision);

        const files = req.files;

        let fileObj = {};
        files.forEach(async (file) => {
            const fileSizeInBytes = file.size;
            const fileSizeInKB = fileSizeInBytes / 1024;

            fileObj = {
                file_name: file.filename,
                revision_id: revisionId.insertId,
                size: fileSizeInKB
            }
            await query("insert into sec_files set ?", fileObj);
        });*/
        
        res.status(200).json({
            data: req.body ,
            msg: "Done Successfully..."
        });
});

const addRound = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        const round = await query("select COUNT(*) as Count, article_id  from rounds where article_id =?", [req.params.id]);
        if (!round[0]) {
            return next(appError.create(400, httpStatusText.ERROR, "round not exist"));
        }
        const round_num = round[0].Count + 1;

        const roundObj = {
            round_num: round_num,
            article_id: round[0].article_id,
        };
        await query("insert into rounds set ?", roundObj);
        
        res.status(200).json({
            data: roundObj ,
            msg: "Done Successfully..."
        });
});

const getRound = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        const rounds = await query("select * from rounds where article_id =?", [req.params.id]);
        const round_count = rounds.length;
        if (!rounds[0]) {
            return next(appError.create(400, httpStatusText.ERROR, "round not exist"));
        }
        
        res.status(200).json({
            data: {
                round_count,
                rounds
            },
            msg: "Done Successfully..."
        });
});

const getFirstRound = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        const rounds = await query("select * from rounds where article_id =?", [req.params.id]);
        if (!rounds[0]) {
            return next(appError.create(400, httpStatusText.ERROR, "round not exist"));
        }
        
        res.status(200).json(rounds[0]);
});

const getAllReviews = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        const reviews =  await query(`SELECT r.*, first_name, origin_name, middle_name, last_name
                                        FROM review r
                                        JOIN users AS u ON r.reviewer_id = u.id
                                        WHERE r.round_id =?  AND r.editor_id =?
                                        `, [req.params.id, res.locals.user.id]); 
        
                                        reviews.map((item)=>{
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
        const review = []
        reviews.map((item)=>{
            let rev = {
                id: item.id,
                response_date: item.response_date,
                review_date: item.review_date,
                status: item.status,
                round_id: item.round_id,
                note_author: item.note_author,
                note_editor: item.note_editor,
                recommendation: item.recommendation,
                file_name: item.file_name,
                origin_name: item.origin_name
            };
            if(item.middle_name){
                rev.userName = `${item.first_name} ${item.middle_name} ${item.last_name}`;
            }else{
                rev.userName = `${item.first_name} ${item.last_name}`;
            }
            review.push(rev);
        })

        res.status(200).json({
            data: review,
            msg: "Done Successfully..."
        });
});

const getReviews = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        const reviews =  await query(`SELECT r.note_author
                                        FROM review as r
                                        WHERE r.round_id =? AND r.status = "complete" 
                                        `, [req.params.id]); 

                                        let i = 65;
                                        let comments = "Reviews:\n";
                                        reviews.map((item)=>{
                                        
                                            let letter = String.fromCharCode(i);
                                            i++;
                                            comments = comments.concat(letter,":\n", item.note_author,"\n\n"); ;

                                            
                                        });

        res.status(200).json({
            data: comments,
            msg: "Done Successfully..."
        });
});

const deleteReview = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        const review =  await query(`select * from files where id =?`, req.params.id);                           
        
        if(!review[0]){
            res.status(404).json({
                msg: "review not found !",
            });
        }
        
        fs.unlinkSync("uploads/review/" + review[0].file_name);
        await query("delete from files where id =?", [req.params.id]);

        res.status(200).json({
                msg: "Success..."
        })
        
});

///////////////////////////////
// Publication stages 
//////////////////////////////


const articleTitle = asyncHandler(
    async (req, res, next) => {
        const query = util.promisify(connection.query).bind(connection);

        const keysArray = req.body.keywords;
        req.body.keywords = keysArray.join(', ');
        await query("update articles set ? where id =?", [req.body, req.params.id]);

        res.status(200).json({
            data: req.body,
            msg: "success.."
        })
});

const co_Authors = asyncHandler(
    async (req, res, next) => {
        const query = util.promisify(connection.query).bind(connection);

        req.body.rows(async(item)=>{
            await query("update co_author set ? where id =?", [item, item.id]);
        })
        

        res.status(200).json({
            data: req.body.rows,
            msg: "success.."
        })
});

const galley = asyncHandler(
    async (req, res, next) => {
        const query = util.promisify(connection.query).bind(connection);
        const galley = await query("select * from articles where id = ?", req.params.id);

        //const filePath =  path.join(__dirname, '../uploads/galley/', req.file.filename);
        
        if (galley[0].galley ){
            fs.unlinkSync("uploads/galley/" + galley[0].galley);
        }

        console.log(req.file)
        console.log("req.file")
        console.log(req.file)
        const obj = {
            galley: req.file.originalname
        }
        await query("update articles set ? where id =?", [obj, req.params.id]);


        res.status(200).json({
            data: obj,
            msg: "success.."
        })
});

const getArticleTitle = asyncHandler(
    async (req, res, next) => {
        const query = util.promisify(connection.query).bind(connection);

        const article =  await query("select full_title, short_title, keywords, abstract from articles where id=?", req.params.id);
        if(article[0].keywords){
            article[0].keywords = article[0].keywords.split(',');
        }
        
        
        res.status(200).json({
            data: article[0],
            msg: "success.."
        })
});

const getCo_Authors = asyncHandler(
    async (req, res, next) => {
        const query = util.promisify(connection.query).bind(connection);

        const co_authors = await query("select * from co_author where article_id =?", [req.params.id]);

        res.status(200).json({
            data: co_authors,
            msg: "success.."
        })
});

const getGalley = asyncHandler(
    async (req, res, next) => {
        const query = util.promisify(connection.query).bind(connection);
        const galley = await query("select * from articles where id = ?", req.params.id);


        res.status(200).json({
            data: galley,
            msg: "success.."
        })
});

const getIss = asyncHandler(
    async (req, res, next) => {
        const query = util.promisify(connection.query).bind(connection);
        const issue = await query(`SELECT id, volume, number, year from issues where status = "published"`);

        const issueNumbers = issue.map(item => ({
            id: item.id,
            item: `Vol.${item.volume} No.${item.number}, ${item.year}`
        }));

        res.status(200).json({
            data: issueNumbers,
            msg: "success.."
        })
});

const publication = asyncHandler(
    async (req, res, next) => {
        const query = util.promisify(connection.query).bind(connection);
        const currentDate = new Date();

        const obj = {
            issue_id: req.body.issue_id,
            pages: req.body.pages,
            publication_date: currentDate,
            status: "published"
        };
        if(req.file){
            obj.cover_image = req.file.filename
        }
        const issue = await query("select item from issues where id =?", req.body.issue_id);
        const item = {
            item: issue[0].item + 1
        }
        await query("update issues set ? where id =?", [item, issue[0].id])

        await query("update articles set ? where id =?", [obj, req.params.id]);

        res.status(200).json({
            data: req.body,
            msg: "success.."
        })
});
/*
"data": [
        {
            "year": 2024,,
            "items": [
                    "Vol.1 No.1, 2024",
                    "Vol.1 No.2, 2024",
                    "Vol.2 No.1, 2024",
                    ]
            
        },
        {
            "year": 2023,,
            "items": [
                    "Vol.1 No.1, 2024",
                    "Vol.1 No.2, 2024",
                    "Vol.2 No.1, 2024",
                    ]
            
        },
    ]
*/

/////////////////////////////
const index = asyncHandler(
    async (req, res, next) => {
        const query = util.promisify(connection.query).bind(connection);
    
        const file = await query("select * from files where id =?", [req.params.id]);
        if(!file[0]){
            console.log(file[0])
            res.json({msg: "file not found"});
        }
        const oldFilename = file[0].file_name;
        const newFilename =  file[0].origin_name;
        const filePath =  path.join(__dirname, '../uploads/discussions/', oldFilename); // Adjust the file path as needed

    // Set the new filename in the response headers
        res.setHeader('Content-Disposition', `attachment; filename="${newFilename}"`);

    // Send the file to the client
    res.sendFile(filePath);
    
        
    //res.json(files);
        
}); 

const download = asyncHandler(
    async (req, res, next) => {
        const query = util.promisify(connection.query).bind(connection);
        
        const file = await query("select * from files where id =?", [req.params.id]);
        if(!file[0]){
            console.log(file[0])
            res.json({msg: "file not found"});
        }

        const oldFilename = file[0].file_name;
        const newFilename =  file[0].origin_name;
        const filePath =  path.join(__dirname, '../uploads/submissions/', oldFilename); // Adjust the file path as needed
        if(!filePath){
            res.json({msg: "file not found"});
        }
    // Set the new filename in the response headers
        res.setHeader('Content-Disposition', `attachment; filename="${newFilename}"`);
    // Send the file to the client
        res.sendFile(filePath);
        
}); 

const sdownload = asyncHandler(
    async (req, res, next) => {
        const query = util.promisify(connection.query).bind(connection);
        
        const oldFilename = req.query.filename;
        const newFilename = req.query.origin_name;
        const filePath =  path.join(__dirname, '../uploads/submissions/', oldFilename); // Adjust the file path as needed
        if(!filePath){
            res.json({msg: "file not found"});
        }
    // Set the new filename in the response headers
        res.setHeader('Content-Disposition', `attachment; filename="${newFilename}"`);
    // Send the file to the client
        res.sendFile(filePath);
        
}); 

const galleyDownload = asyncHandler(
    async (req, res, next) => {
        const query = util.promisify(connection.query).bind(connection);
        
        const Filename = req.query.origin_name;
        const filePath =  path.join(__dirname, '../uploads/galley/', Filename); // Adjust the file path as needed
        if(!filePath){
            res.json({msg: "file not found"});
        }
    // Set the new filename in the response headers
        res.setHeader('Content-Disposition', `attachment; filename="${Filename}"`);
    // Send the file to the client
        res.sendFile(filePath);
        
}); 

const reviewDownload = asyncHandler(
    async (req, res, next) => {
        const query = util.promisify(connection.query).bind(connection);
        
        const file = await query("select * from files where id =?", [req.params.id])
        if(!file[0]){
            console.log(file[0])
            res.json({msg: "file not found"});
        }

        const oldFilename = file[0].file_name;
        const newFilename =  file[0].origin_name;
        const filePath =  path.join(__dirname, '../uploads/review/', oldFilename); // Adjust the file path as needed
        if(!filePath){
            res.json({msg: "file not found"});
        }else{
            // Set the new filename in the response headers
            res.setHeader('Content-Disposition', `attachment; filename="${newFilename}"`);
        // Send the file to the client
            res.sendFile(filePath);
        }
    
        
});

const getAssignedEditors = asyncHandler(
    async (req, res, next) => {


        const query = util.promisify(connection.query).bind(connection);
        const Editors =  await query(`select a.id, u.title, u.first_name, u.middle_name, u.last_name from article_editor as a
                                    join users as u on a.editor_id = u.id
                                    where a.article_id =? AND from_id =?`, [req.params.id, res.locals.user.id])
        
        
        let Obj = Editors.map((item)=>{
            let editor = {};
            editor.id = item.id
            if(item.middle_name){
                editor.userName  = `${item.title}/ ${item.first_name} ${item.middle_name} ${item.last_name}`
                return editor; 
            }else{
                editor.specialty = item.field_of_study;
                editor.userName = `${item.title}/ ${item.first_name} ${item.last_name}`
                return editor;
            }
        })
        
        res.status(200).json({
            data: Obj
        })
});


const addNewUser = asyncHandler(
    async (req, res, next) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(appError.create(400, httpStatusText.ERROR, errors.array()[0].msg));
        }

        const query = util.promisify(connection.query).bind(connection);
        const checkUser = await query("select * from users where email = ? ", [req.body.email]);

        if(checkUser.length > 0){
            return next(appError.create(400, httpStatusText.ERROR, "User is already exist !"));
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

module.exports = {
    showNewSubmissions,
    assignArticleToEditor,
    unAssignEditor,
    getAllEditors,
    editorParticipants,
    addDiscussionSub,
    getAllDiscussionsub,
    assignReviewer,
    uploadReviweFile,
    reviewFiles,
    sendRivision,
    addRound,
    getRound,
    getFirstRound,
    roundParticipants,
    addDiscussionRound,
    getAllDiscussionRound,
    getSubmissionFiles,
    deleteSubmission,
    unAssignReviewer,
    acceptArticle,
    rejectArticle,
    getAllReviews,
    index,
    download,
    ArticleInfo,
    getEReviewFiles,
    reviewDownload,
    getRevisionFiles,
    deleteRevision,
    deleteReview,
    getAssignedEditors,
    getAllReviewers,
    sdownload,
    deleteDiscussion,
    articleTitle,
    co_Authors,
    galley,
    publication,
    getReviews,
    galleyDownload,
    addDiscussionPro,
    getAllDiscussionsPro,
    getArticleTitle,
    getCo_Authors,
    getGalley,
    getIss,
    Archive,
    addNewUser
}


/*


const query = util.promisify(connection.query).bind(connection);
        const file = await query("select * from sec_files where file_id =?", 19);
        // Query the database to get the renamed filename corresponding to the original filename (not implemented here)

  // Construct the full path to the file based on the renamed filename
        const files = await readdirAsync('uploads/submissions');
        const renamedFilename = files.find(f => f.startsWith(file[0].file_name));
        //res.json(file[0].file_name)
        if (!renamedFilename) {
        return res.status(404).send('File not found.');
        }

        const filePath = "http://" + req.hostname + ":4000/" + renamedFilename;

    // Send the file to the client
        res.json(filePath);
*/

