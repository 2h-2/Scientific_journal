const connection = require("../DB/connection");
const util = require("util");
const {validationResult} = require("express-validator");
const asyncHandler = require("express-async-handler");
const appError = require("../utils/appError");
const httpStatusText = require("../utils/httpStatusText");
const path = require("path"); 
const bcrypt = require("bcrypt");

const getAllMysubmissions = asyncHandler(
    async (req, res, next) => {

        let search = "";
        if(req.query.search){
            search =  `AND (a.full_title LIKE '%${req.query.search}%' OR a.status LIKE '%${req.query.search}%' OR t.type_name LIKE '%${req.query.search}%')`;
        }
        const query = util.promisify(connection.query).bind(connection);
        const Submissions =  await query(`select a.id, a.status, a.full_title, a.submission_date, t.type_name 
                                        from articles as a
                                        join article_type as t on a.article_type_id = t.id
                                        where a.author_id =? ${search} AND !(a.status = "published" OR a.status = "rejected")`,
                                        res.locals.user.id
                                        );    
                                        
                                        for(let i = 0; i <Submissions.length; i++){
            
                                            const rounds = await query("select * from rounds where article_id =?", [Submissions[i].id]);
                                            let totalCount = await query("select COUNT(*) AS tco ,SUM(CASE WHEN status = 'complete' THEN 1 ELSE 0 END) AS cou from review where article_id =?", [Submissions[i].id]);
                                            if(rounds[0]){
                                             
                                                Submissions[i].roundId = rounds[0].id;
                                                if(totalCount[0].tco != 0) {Submissions[i].totalCount = totalCount;}
                                            }else{
                                                Submissions[i].roundId = '0';
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
            msg: "Success..."
        })
});

const authorArchive = asyncHandler(
    async (req, res, next) => {

        let search = "";
        if(req.query.search){
            search =  `AND (a.full_title LIKE '%${req.query.search}%' OR a.status LIKE '%${req.query.search}%' OR t.type_name LIKE '%${req.query.search}%')`;
        }
        const query = util.promisify(connection.query).bind(connection);
        const Submissions =  await query(`select a.id, a.status, a.full_title, a.submission_date, t.type_name
                                        from articles as a
                                        join article_type as t on a.article_type_id = t.id
                                        where a.author_id =? ${search} AND (a.status = "published" OR a.status = "rejected")`,
                                        res.locals.user.id
                                        );                           
                                        for(let i = 0; i <Submissions.length; i++){
            
                                            const rounds = await query("select * from rounds where article_id =?", [Submissions[i].id]);
                                            let totalCount = await query("select COUNT(*) AS tco ,SUM(CASE WHEN status = 'complete' THEN 1 ELSE 0 END) AS cou from review where article_id =?", [Submissions[i].id]);
                                            if(rounds[0]){
                                             
                                                Submissions[i].roundId = rounds[0].id;
                                                if(totalCount[0].tco != 0) {Submissions[i].totalCount = totalCount;}
                                            }else{
                                                Submissions[i].roundId = '0';
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
            msg: "Success..."
        })
});

const deleteSubmission = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        const Submission =  await query(`select * from articles where id =?`, req.params.id);                           
        
        if(!Submission[0]){
            res.status(404).json({
                msg: "Submission not found !",
            });
        }

        if(Submission[0].status != "incomplete" || Submission[0].status != "reject" ){
            res.status(404).json({
                msg: "Submission cannot be deleted!",
            });
        }else{
            await query("delete from articles where id =?", [req.params.id]);

            res.status(200).json({
                msg: "Success..."
            })
        }
        
});

const revisionFile = asyncHandler(
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(appError.create(400, httpStatusText.ERROR, errors.array()[0].msg));
        }

        if(!req.file){
            return next(appError.create(400, httpStatusText.ERROR, "the file name is required!"));
        }
        const query = util.promisify(connection.query).bind(connection);
        const round = await query("select id from rounds where article_id =?",req.params.id);
        const fileSizeInBytes = req.file.size;
        const fileSizeInKB = fileSizeInBytes / 1024;

        const newFile = {
            article_id: req.params.id,
            file_type: req.body.file_type,
            file_name: req.file.filename,
            origin_name: req.fileName,
            size: fileSizeInKB,
            type: "revision",
            round_id: round[0].id
        }
        
        await query("insert into files set ?", newFile);

        res.status(200).json({
            data: newFile,
            msg: "The file was added successfully."
        });
        
});

const getRevisionFiles = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        const files = await query("select * from files where type =? AND article_id =?", ["revision", req.params.id]);
        
        /*files.map((item)=>{
            item.file_name = "http://" + req.hostname + ":4000/" + item.file_name;
        })*/
        
        res.status(200).json({
        data: files,
        msg: "Success..."
        })
});

const addDiscussionAuther = asyncHandler(
    async (req, res, next) => {
        
        const query = util.promisify(connection.query).bind(connection);

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
        console.log(files)
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

const getAuthParticipants = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);

        const Editors =  await query(`select DISTINCT users.id, first_name, middle_name, last_name, role 
                                    from users
                                    join article_editor on users.id = article_editor.editor_id
                                    where article_id =? `,[req.params.id]
                                    );         
        
        
        
        let cheif_editor = await query("select id, first_name, middle_name, last_name, role from users where role =?", "chief_in_editor")
        Editors.push(cheif_editor[0]);

        const Obj = Editors.map((item)=>{
            let editor = {};
            editor.id = item.id;
            editor.role = item.role
            editor.userName = item = `${item.first_name} ${item.last_name}`;
            if(item.middle_name){
                editor.userName = item = `${item.first_name} ${item.middle_name} ${item.last_name}`;
            }
            return editor; 
        })
    
        res.status(200).json({
            data: Obj,
            msg: "Assign Successfully..."
        })
});

const getAllDiscussionsub = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);

        const discussions =  await query(`SELECT d.*, file_id, f.file_name, f.size, CONCAT (sender.first_name, ' ',sender.last_name) AS sender_username, CONCAT ( receiver.first_name, ' ', receiver.last_name) AS receiver_username
                                        FROM discussions d
                                        left JOIN sec_files f ON d.id = f.disc_id
                                        JOIN users AS sender ON d.from_user_id = sender.id
                                        JOIN users AS receiver ON d.to_user_id = receiver.id
                                        WHERE d.article_id =? AND d.type = "submission" AND (d.to_user_id =? OR d.from_user_id =?)
                                        order by date_created ASC`, [req.params.id, res.locals.user.id, res.locals.user.id])                 
        
        
        const discussion = {};
        discussions.forEach(row => {
            console.log(row.file_id)
            const { message, subject, article_id, from_user_id, to_user_id, id, date_created, sender_username, receiver_username, file_id, file_name, size } = row;
            if (!discussion[id]) {
                    discussion[id] = { id: id, subject, message, article_id, date_created, sender_username, receiver_username, files: [] };
            }
            if(row.file_id){
                discussion[id].files.push({ file_id ,file_name, size });
            }                         
        });
        
        
        //const users = await query("select first_name, middle_name, last_name from users where id =? OR id =?", [discussions[0].from_user_id, discussions[0].to_user_id])
        res.status(200).json({
            data: discussion,
            msg: "Assign Successfully..."
        })
});

const updateAuthor = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        const checkUser = await query("select * from users where id = ?", res.locals.user.id);
    
        
        if(checkUser.length == 0){
            console.log(checkUser.length)
            return next(appError.create(400, httpStatusText.ERROR, "user is not found..!"));
        }
        
        if(req.body.newPassword){
            
            if(!(await bcrypt.compare(req.body.currentPassword, user[0].password))){
                return next(appError.create(400, httpStatusText.ERROR, "Incorrect Current Password"))
            }
            req.body.password = await bcrypt.hash(req.body.newPassword, 10)
        }
        
        await query("update users set ? where id = ?",[req.body, res.locals.user.id]);
        
        
        res.status(200).json({
        data: null,
        msg: "Update Successfully..."
        });
});

const updateProfile = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);

        const checkUser = await query("select * from users where id = ?", res.locals.user.id);
    
        if (!checkUser[0]){
            console.log(checkUser);
            //return next(appError.create(400, httpStatusText.ERROR, "user is not found..!"));
        }

        if(req.body.newPassword){
            
            if(!(await bcrypt.compare(req.body.currentPassword, user[0].password))){
                return next(appError.create(400, httpStatusText.ERROR, "Incorrect Current Password"))
            }
            req.body.password = await bcrypt.hash(req.body.newPassword, 10)
        }
        
        await query("update users set ? where id = ?",[req.body, res.locals.user.id]);
        
        res.status(200).json({
            data: null,
            msg: "update Success..."
        })
});

module.exports = {
    getAllMysubmissions,
    authorArchive,
    deleteSubmission,
    revisionFile,
    getRevisionFiles,
    addDiscussionAuther,
    getAuthParticipants,
    updateAuthor,
    updateProfile
};


/**
 * 
 * const filePath = path.join('uploads/submissions/'+files[0].file_name); // Replace with the actual path to your file
        const fileName = 'file.txt'; // Replace with the desired file name

        // Set the Content-Disposition header to force download
        //res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  
        // Send the file
        console.log(filePath);
        //res.sendFile(filePath);
        res.download(path.resolve(filePath))
 */