const connection = require("../../DB/connection");
const util = require("util");
const {validationResult} = require("express-validator");
const asyncHandler = require("express-async-handler");
const appError = require("../../utils/appError");
const httpStatusText = require("../../utils/httpStatusText");
const fs = require("fs");


const addIssue = asyncHandler(
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(appError.create(400, httpStatusText.ERROR, errors.array()[0].msg));
        }

        const query = util.promisify(connection.query).bind(connection);
        const checkIssue = await query("select * from issues where (volume = ? AND number = ? AND year = ?)", [req.body.volume, req.body.number, req.body.year]);
        if (checkIssue[0]){
            return next(appError.create(400, httpStatusText.ERROR, "The Issue Already exists..!"));
        }
        const issue = {
            volume: req.body.volume,
            number: req.body.number,
            year: req.body.year,
            title: req.body.title,

        }

        if(req.file){
            issue.cover_image = req.file.filename
        }

        await query("insert into issues set ?", issue)
        res.status(200).json({data: issue, msg: "Insertion Success.."})
    }
);

const futureIssues = asyncHandler(
    async (req, res, next) => {
        const query = util.promisify(connection.query).bind(connection);
        let search = "";
        if(req.query.search){
            search =  `AND (volume LIKE '%${req.query.search}%' OR number LIKE '%${req.query.search}%' OR year LIKE '%${req.query.search}%')`;
        }
        
        const Issues = await query(`select id, volume, number, year, title, cover_image, item from issues where status = 'unpublished' ${search}`);


        Issues.map((item)=>{
            if(item.cover_image){
                item.cover_image = "http://" + req.hostname + ":4000/" + item.cover_image;
            }
        });    
        
        res.status(200).json({
        data: Issues,
        msg: "Success..."
        });
});

const backIssues = asyncHandler(
    async (req, res, next) => {
        const query = util.promisify(connection.query).bind(connection);
        let search = "";
        if(req.query.search){
            search =  `AND (volume LIKE '%${req.query.search}%' OR number LIKE '%${req.query.search}%' OR year LIKE '%${req.query.search}%')`;
        }

        const Issues = await query(`select id, volume, number, year, title, cover_image, item from issues where status = 'published' ${search}`);


        Issues.map((item)=>{
            if(item.cover_image){
                item.cover_image = "http://" + req.hostname + ":4000/" + item.cover_image;
            }
        });    
        
        res.status(200).json({
        data: Issues,
        msg: "Success..."
        });
});

const preview = asyncHandler(
    async (req, res, next) => {
        const query = util.promisify(connection.query).bind(connection);
        const Issue = await query("select id, volume, number, year, title, cover_image, item from issues where id = ?", req.params.id);
        if (!Issue[0]){
            return next(appError.create(400, httpStatusText.ERROR, "Issue is not found..!"));
        }


        if(Issue[0].cover_image){
            Issue[0].cover_image = "http://" + req.hostname + ":4000/" + Issue[0].cover_image;
        }
                
        
        res.status(200).json({
        data: Issue[0],
        msg: "Success..."
        })
});

const deleteIssue = asyncHandler(
    async (req, res, next) => {
        const query = util.promisify(connection.query).bind(connection);
        const checkIssue = await query("select * from issues where id = ?", req.params.id);
        if (!checkIssue[0]){
            return next(appError.create(400, httpStatusText.ERROR, "Issue is not found..!"));
        }


        if(checkIssue[0].cover_image){
            fs.unlinkSync("uploads/images/" + checkIssue[0].cover_image);
        }
        
        await query("delete from issues where id = ?", req.params.id);
        
        
        res.status(200).json({
        data: checkIssue,
        msg: "Delete Successfully..."
        })
});

const updateIssue = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        const checkIssue = await query("select * from issues where id = ?", req.params.id);
        if (!checkIssue[0]){
            return next(appError.create(400, httpStatusText.ERROR, "The Issue is not exists..!"));
        }
        const issue = {
            volume: req.body.volume,
            number: req.body.number,
            year: req.body.year,
            title: req.body.title,
        }

        if(req.file){
            issue.cover_image = req.file.filename;
            fs.unlinkSync("uploads/images/" + checkIssue[0].cover_image);
        }

        await query("update issues set ? where id =?", [issue, req.params.id])
        res.status(200).json({data: issue, msg: "update Success.."})
    }
);

const publishIssue = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        const checkIssue = await query("select * from issues where id = ?", req.params.id);
        if (!checkIssue[0]){
            return next(appError.create(400, httpStatusText.ERROR, "The Issue is not exists..!"));
        }

        const checkIssue1 = await query("select * from issues where current = '1'");
        if (checkIssue1[0]){
            checkIssue1[0].current = '0';
            await query("update issues set ? where id =?", [checkIssue1[0], checkIssue1[0].id])
        }

        const currentDate = new Date();

        const issue = {
            status: "published",
            current: "1",
            date_published: currentDate
        }

        await query("update issues set ? where id =?", [issue, req.params.id])
        res.status(200).json({data: issue, msg: "The issue has been published successfully.."})
    }
);

const unpublishIssue = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        const checkIssue = await query("select * from issues where id = ?", req.params.id);
        if (!checkIssue[0]){
            return next(appError.create(400, httpStatusText.ERROR, "The Issue is not exists..!"));
        }

        if (checkIssue[0].current == '1'){
            const volume = await query("select MAX(volume) AS LVolume from issues where (status = 'published' AND current = '0')");
            
            if(volume[0].LVolume){
                const issu = await query("select MAX(number) AS LIssue, year from issues where volume =? AND status = 'published'", volume[0].LVolume);
                const issue1 = {
                current: "1",
                }
                await query("update issues set ? where  (volume =? AND number =? AND year =?)", [issue1, volume[0].LVolume, issu[0].LIssue, issu[0].year]);
            }

        }
        
        const issue = {
            status: "unpublished",
            current: "0",
        }

        await query("update issues set ? where id =?", [issue, req.params.id])
        res.status(200).json({data: issue, msg: "The issue has been unpublished successfully.."})
    }
);

module.exports = {
    addIssue,
    deleteIssue,
    updateIssue,
    publishIssue,
    unpublishIssue,
    preview,
    futureIssues,
    backIssues
};