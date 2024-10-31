const connection = require("../../DB/connection");
const util = require("util");
const {validationResult} = require("express-validator");
const asyncHandler = require("express-async-handler");
const appError = require("../../utils/appError");
const httpStatusText = require("../../utils/httpStatusText");

const Journal = asyncHandler(
    async (req, res, next) => {
        
        const query = util.promisify(connection.query).bind(connection);
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(appError.create(400, httpStatusText.ERROR, errors.array()[0].msg));
        }

        const journal = {
            title: req.body.title,
            initials: req.body.initials,
            abbreviation: req.body.abbreviation,
            summary: req.body.summary,
            path: req.body.path,
            online_issn: req.body.online_issn,
            print_issn: req.body.print_issn,
            publisher: req.body.publisher,
            about_the_journal: req.body.about_the_journal,
            Editorial_board: req.body.Editorial_board,
            author_guidelines: req.body.author_guidelines,
            peer_review_process: req.body.peer_review_process,
            aims_scope: req.body.aims_scope,
        }

        await query("update journal set ? where id = 1", journal);
        res.status(200).json({data: journal, msg: "Modified successfully.."});
    }
);

const getJournal = asyncHandler(
    async (req, res, next) => {
        
        const query = util.promisify(connection.query).bind(connection);
        const journal = await query("select title, initials, abbreviation, summary, path, online_issn, print_issn, publisher, about_the_journal, author_guidelines, peer_review_process, aims_scope from journal where id =?", 1);
        res.status(200).json({data: journal, msg: "The Process Succeeded.."});
    }
);

const postContactInfo = asyncHandler(
    async (req, res, next) => {
        
        const query = util.promisify(connection.query).bind(connection);
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(appError.create(400, httpStatusText.ERROR, errors.array()[0].msg));
        }

        const ContactInfo = {
            Pname: req.body.name,
            Peamil: req.body.email,
            Pphone: req.body.phone,
            Paffiliation: req.body.affiliation,
            mailing_address: req.body.mailing_address,
            Tname: req.body.name,
            Teamil: req.body.email,
            Tphone: req.body.phone,
        }

        await query("update journal set ? where id = 1", ContactInfo);
        res.status(200).json({data: ContactInfo, msg: "Modified successfully.."});
    }
);

const getContacts = asyncHandler(
    async (req, res, next) => {
        
        const query = util.promisify(connection.query).bind(connection);
        const journal = await query("select Pname, Pemail, Pphone, Paffiliation, mailing_address, Tname, Temail, Tphone from journal where id =?", 1);
        res.status(200).json({data: journal, msg: "The Process Succeeded.."});
    }
);

const insertComponent = asyncHandler(
    async (req, res, next) => {


        const query = util.promisify(connection.query).bind(connection);
        await query("insert into components set ?", req.body)
        res.status(200).json({data: req.body, msg: "Insertion Success.."})
    }
);

const getAllComponents = asyncHandler(
    async (req, res, next) => {
        
        const query = util.promisify(connection.query).bind(connection);
        const Components = await query("select * from components");
        res.status(200).json({data: Components, msg: "The Process Succeeded.."});
    }
);

const insertArticleType = asyncHandler(
    async (req, res, next) => {
        

        const query = util.promisify(connection.query).bind(connection);
        await query("insert into article_type set ?", req.body)
        res.status(200).json({data: req.body, msg: "Insertion Success.."})
    }
);

const getAllArticleType = asyncHandler(
    async (req, res, next) => {
        
        const query = util.promisify(connection.query).bind(connection);
        const articleTypes = await query("select * from article_type");
        res.status(200).json({data: articleTypes, msg: "The Process Succeeded.."});
    }
);

const disableType = asyncHandler(
    async (req, res, next) => {
        const obj = {
            disable : req.body.disable
        }
        const query = util.promisify(connection.query).bind(connection);
        const ArticleType = await query("select * from article_type where id = ?", req.params.id);
        if (!ArticleType[0]){
            return next(appError.create(400, httpStatusText.ERROR, "type is not found..!"));
        }
        await query("update article_type set ? where id =?",[obj, req.params.id]);

        res.status(200).json({msg: "The Process Succeeded.."});
    }
);

const deleteArticleType = asyncHandler(
    async (req, res, next) => {
        
        const query = util.promisify(connection.query).bind(connection);
        const ArticleType = await query("select * from article_type where id = ?", req.params.id);
        if (!ArticleType[0]){
            return next(appError.create(400, httpStatusText.ERROR, "Issue is not found..!"));
        }

        await query("delete from article_type where id =?", req.params.id);

        res.status(200).json({msg: "The delete Success.."});
    }
);




module.exports = {
    Journal,
    getJournal,
    insertComponent,
    insertArticleType,
    getAllComponents,
    getAllArticleType,
    postContactInfo,
    getContacts,
    disableType,
    deleteArticleType
}