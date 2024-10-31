const connection = require("../DB/connection");
const util = require("util");
const {validationResult} = require("express-validator");
const asyncHandler = require("express-async-handler");
const appError = require("../utils/appError");
const httpStatusText = require("../utils/httpStatusText");

const getAllVolumes = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        const volumes = await query(`SELECT * from issues where status = "published"`);
        
        const result = [];

  // Group issues by year
  const issuesByYear = volumes.reduce((acc, issue) => {
    const { year, id, number, volume, cover_image, date_published } = issue;
    if (!acc[year]) {
      acc[year] = [];
    }
    var dateString = date_published;

// Create a Date object from the input string
var date = new Date(dateString);

// Extract day and month
var day = date.getDate(); // Get the day of the month (1-31)
var monthIndex = date.getMonth(); // Get the month (0-11)

// Array of month names
var monthNames = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

// Format the date as "DD Month"
var formattedDate = day + " " + monthNames[monthIndex];
    acc[year].push({ id, issueNum: number, volumeNum: volume, cover_image: "http://" + req.hostname + ":4000/" + cover_image, formattedDate});
    return acc;
  }, {});

  // Convert grouped issues into the desired format
  for (const [year, items] of Object.entries(issuesByYear)) {
    result.push({
      year: parseInt(year),
      items: items
    });
  }
        
        res.status(200).json({
        data: result,
        msg: "Success..."
        });
});

const getCurrentIssue = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        const issue = await query(`SELECT * from issues where current = '1'`);


        if(issue[0]){
            if(issue[0].cover_image){
                issue[0].cover_image = "http://" + req.hostname + ":4000/" + issue[0].cover_image
            }
            const articles = await query(`SELECT a.id, a.abstract, CONCAT_WS(':', a.full_title, a.short_title) as title , a.galley , CONCAT_WS( ' ', u.first_name, u.last_name) as author 
                                    from articles as a
                                    join users as u on u.id = a.author_id
                                    where a.issue_id =?`, issue[0].id);
            if(articles[0]){
                const articleIds = articles.map(article => article.id);
                const coAuthors = await query(`
                SELECT ca.article_id, CONCAT_WS(' ', ca.first_name, ca.last_name) as co_author
                FROM co_author AS ca
                WHERE ca.article_id IN (?)
                `, [articleIds]);
    
                const coAuthorsByArticleId = coAuthors.reduce((acc, coAuthor) => {
                if (!acc[coAuthor.article_id]) {
                    acc[coAuthor.article_id] = [];
                }
                    acc[coAuthor.article_id].push(coAuthor.co_author);
                    return acc;
                }, {});
                const articlesWithCoAuthors = articles.map(article => ({
                ...article,
                co_authors: coAuthorsByArticleId[article.id] ? coAuthorsByArticleId[article.id].join(', ') : ''
                }));
    
                const obj = {
                issue: issue[0],
                articles: articlesWithCoAuthors
                }
    
                res.status(200).json({
                    data: obj,
                    msg: "Success..."
                });
            }else{
                const obj = {
                    issue: issue[0],
                    articles: []
                    }
                res.status(200).json({
                    data: obj,
                    msg: "Success..."
                    });
            }
        }else{
            res.status(200).json({
                data: [],
                msg: "Success..."
                });
        }
});

const getIssueById = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        const issue = await query(`SELECT * from issues where id = ?`, req.params.id);
        

        if(issue[0]){
            if(issue[0].cover_image){
                issue[0].cover_image = "http://" + req.hostname + ":4000/" + issue[0].cover_image
            }
            const articles = await query(`SELECT a.id, a.abstract, CONCAT_WS(':', a.full_title, a.short_title) as title , a.galley , CONCAT_WS( ' ', u.first_name, u.last_name) as author 
                                    from articles as a
                                    join users as u on u.id = a.author_id
                                    where a.issue_id =?`, req.params.id);
            if(articles[0]){
                const articleIds = articles.map(article => article.id);
                const coAuthors = await query(`
                SELECT ca.article_id, CONCAT_WS(' ', ca.first_name, ca.last_name) as co_author
                FROM co_author AS ca
                WHERE ca.article_id IN (?)
                `, [articleIds]);
    
                const coAuthorsByArticleId = coAuthors.reduce((acc, coAuthor) => {
                if (!acc[coAuthor.article_id]) {
                    acc[coAuthor.article_id] = [];
                }
                    acc[coAuthor.article_id].push(coAuthor.co_author);
                    return acc;
                }, {});
                const articlesWithCoAuthors = articles.map(article => ({
                ...article,
                co_authors: coAuthorsByArticleId[article.id] ? coAuthorsByArticleId[article.id].join(', ') : ''
                }));
    
                const obj = {
                issue: issue[0],
                articles: articlesWithCoAuthors
                }
    
                res.status(200).json({
                    data: obj,
                    msg: "Success..."
                });
            }else{
                const obj = {
                    issue: issue[0],
                    articles: []
                    }
                res.status(200).json({
                    data: obj,
                    msg: "Success..."
                    });
            }
        }else{
            res.status(200).json({
                data: [],
                msg: "Success..."
                });
        }
        
});

const getArticleById = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        const article = await query(`SELECT full_title, abstract, keywords, publication_date, cover_image from articles where id =?`, req.params.id);
       const array = [];
        const Author = await query(`select  CONCAT_WS(' ', u.first_name, u.last_name) as co_author, u.affiliation from articles as a
            join users as u on u.id = a.author_id
            where a.id =?`,[req.params.id]);
        const coAuthors = await query(`
                SELECT  CONCAT_WS(' ', ca.first_name, ca.last_name) as co_author ,ca.affiliation 
                FROM co_author AS ca
                WHERE ca.article_id =?
                `, [req.params.id]);

            if(article[0].cover_image){
                article[0].cover_image = "http://" + req.hostname + ":4000/" + article[0].cover_image;
            }
            array.push(Author[0])
            array.push(...coAuthors)

        const obj = {
            articleInfo : article[0],
            coAuthors: array
        }

        res.status(200).json({
            data: obj,
            msg: "Success..."
        });
});

const EditorialBoard = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        const Editorial = await query(`SELECT Editorial_board from journal where id = '1'`);
    
        res.status(200).json({
            data: Editorial[0],
            msg: "Success..."
        });
});

const AboutJournal = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        const about_the_journal = await query(`SELECT about_the_journal from journal where id = '1'`);
    
        res.status(200).json({
            data: about_the_journal[0],
            msg: "Success..."
        });
});

const aimsScope = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        const aims_scope = await query(`SELECT aims_scope from journal where id = '1'`);
    
        res.status(200).json({
            data: aims_scope[0],
            msg: "Success..."
        });
});

const authorGuidelines = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        const author_guidelines = await query(`SELECT author_guidelines from journal where id = '1'`);
    
        res.status(200).json({
            data: author_guidelines[0],
            msg: "Success..."
        });
});

const peerReviewProcess = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        const peer_review_process = await query(`SELECT peer_review_process from journal where id = '1'`);
    
        res.status(200).json({
            data: peer_review_process[0],
            msg: "Success..."
        });
});

const licences = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        const licences = await query(`SELECT online_issn, print_issn from journal where id = '1'`);
    
        res.status(200).json({
            data: licences[0],
            msg: "Success..."
        });
});

const contactInfo = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        const licences = await query(`SELECT Pname, Pemail, Pphone, Paffiliation, mailing_address, Tname, Temail, Tphone from journal where id = '1'`);

        const PrincipalContact = {
            name: licences[0].Pname,
            email: licences[0].Pemail,
            phone: licences[0].Pphone,
            affiliation: licences[0].Paffiliation,
            mailing_address: licences[0].mailing_address,
        }

        const TechnicalSupportContact = {
            name: licences[0].Tname,
            email: licences[0].Temail,
            phone: licences[0].Tphone,
        }
        const obj = {
            PrincipalContact,
            TechnicalSupportContact
        }
    
        res.status(200).json({
            data: obj,
            msg: "Success..."
        });
});

const Shearch = asyncHandler(
    async (req, res, next) => {

        const query = util.promisify(connection.query).bind(connection);
        //const issue = await query(`SELECT * from issues where id = ?`, req.params.id);
        const { title, articleType, yearPublished, authorName } = req.query;
        
        let search = "";
        if (title) {
            search = search +  ` AND (a.full_title LIKE '%${title}%' OR a.short_title LIKE '%${title}%')`;
        }
        if (yearPublished) {
            search = search + ` AND a.publication_date LIKE '%${yearPublished}%'`;
        }
        if (authorName) {
            search = search +  ` AND (u.first_name LIKE '%${authorName}%' OR u.last_name LIKE '%${authorName}%' OR ca.first_name LIKE '%${authorName}%' OR ca.last_name LIKE '%${authorName}%') `;
        }
        
        
            const articles = await query(`SELECT a.id, a.full_title, a.short_title, a.abstract, CONCAT_WS(':', a.full_title, a.short_title) as title , publication_date, a.galley , CONCAT_WS( ' ', u.first_name, u.last_name) as author ,ca.article_id, ca.first_name, ca.last_name, CONCAT_WS(' ', ca.first_name, ca.last_name) as co_author
                                    from articles as a
                                    join users as u on u.id = a.author_id
                                    left join co_author AS ca on ca.article_id = a.id
                                    where a.status =? ${search}`, ["published"]);


                                    const combinedData = {};

                                    articles.forEach(item => {
                    if (!combinedData[item.article_id]) {
                        
                            combinedData[item.article_id] = {
                                ...item,
                                co_authors: [item.co_author]
                            };
                    
                        
                    } else {
                        
                            combinedData[item.article_id].co_authors.push(item.co_author);
                        
                    }
                });
                let obj = {

                };
            let result = Object.values(combinedData);
            result = result.map(((item)=>{
                let obj = {};
                obj.id = item.id;
                obj.title = item.title;
                obj.abstract = item.abstract;
                obj.publication_date = item.publication_date;
                obj.galley = item.galley;
                obj.author = item.author;
                obj.co_authors = item.co_authors;
                return obj
            }))

            /*if(articles[0]){
                const articleIds = articles.map(article => article.id);
                const coAuthors = await query(`
                SELECT ca.article_id, CONCAT_WS(' ', ca.first_name, ca.last_name) as co_author
                FROM co_author AS ca
                WHERE ca.article_id IN (?)
                `, [articleIds]);
    
                const coAuthorsByArticleId = coAuthors.reduce((acc, coAuthor) => {
                if (!acc[coAuthor.article_id]) {
                    acc[coAuthor.article_id] = [];
                }
                    acc[coAuthor.article_id].push(coAuthor.co_author);
                    return acc;
                }, {});
                const articlesWithCoAuthors = articles.map(article => ({
                ...article,
                co_authors: coAuthorsByArticleId[article.id] ? coAuthorsByArticleId[article.id].join(', ') : ''
                }));
    
                const obj = {
                issue: issue[0],
                articles: articlesWithCoAuthors
                }
    
                res.status(200).json({
                    data: obj,
                    msg: "Success..."
                });
            }else{
                const obj = {
                    issue: issue[0],
                    articles: []
                    }
                res.status(200).json({
                    data: obj,
                    msg: "Success..."
                    });
            }*/
    
    
            res.status(200).json({
                data: result,
                msg: "Success..."
                });
        
});

module.exports = {
    getAllVolumes,
    getCurrentIssue,
    getIssueById,
    getArticleById,
    EditorialBoard,
    AboutJournal,
    aimsScope,
    authorGuidelines,
    peerReviewProcess,
    licences,
    contactInfo,
    Shearch
}

/*
"data": {
        "issue": {
            "id": 4,
            "volume": 1,
            "number": 1,
            "year": 2023,
            "title": "new title for issue1",
            "cover_image": "http://localhost:4000/1713941047088.jpg",
            "status": "published",
            "current": "1",
            "item": 0,
            "date_published": "2024-05-30T22:00:00.000Z"
        },
        "articles": [
            {
                "id": 21,
                "title": "Please do not use Back Button of your browser.:Please do not use Back Button of your browser.",
                "galley": "sheet#2.pdf",
                "author": "hasnaa mohamed",
                "co_authors": "hasnaa mohamed, ahmed khater"
            },
            {
                "id": 26,
                "title": "Please do not use Back Button of your browser.:Please do not use Back Button of your browser.",
                "galley": "",
                "author": "hasnaa mohamed",
                "co_authors": ""
            }
        ]
    },
*/ 
