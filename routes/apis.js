const express = require("express");
const {articleValidation, filesValidation, revisionValidation, issueValidation, CJournalValidation, articleTypeValidation, specialtyValidation, suggestReviewerValidation, reviewValidation, assignReviewerValidation} = require("../middleware/validationSchema");
const router = express.Router();
const articleController = require("../controller/articleController");
const emailTemplate = require("../utils/emailTemplates");
const emailTsController = require("../controller/journalController/emailsController");
const journalController = require("../controller/journalController/journalCintroller");
const editorcontroller = require("../controller/editor");
const usercontroller = require("../controller/userController");
const homeController = require("../controller/homeController");
const reviewerController = require("../controller/reviewer");
const authorController = require("../controller/authorController");
const issueController = require("../controller/journalController/issueController");
const {uploadForSubmissions, uploadForReviews, uploadForDiscussions, uploadForimages, uploadGally}= require("../middleware/uploadFiles");
const {body} = require("express-validator");
const {authorized, editor, reviewer, editorInChief} = require("../middleware/authorize");
const multer = require("multer");
const upload = multer();

// Journal routes
router.route("/Journal").
put(CJournalValidation, journalController.Journal).
get(journalController.getJournal);

router.route("/contactInfo").
put(journalController.postContactInfo).
get(journalController.getContacts);

// Emails router
router.route("/email/:id").put(emailTsController.emailCP);
router.route("/email").get(emailTsController.getEmails);
router.route("/getemail").get(emailTsController.getEmail);

// users router
router.route("/user")
.post(usercontroller.addUser)
.get(usercontroller.getAllUsers);

router.route("/user/:id")
.delete(usercontroller.deleteUser)
.put(usercontroller.updateUser);

// Setting
router.
route("/component").
post(specialtyValidation, journalController.insertComponent).
get(journalController.getAllComponents);

router.route("/ArticleType").
post(articleTypeValidation, journalController.insertArticleType).
get(journalController.getAllArticleType);
router.route("/ArticleType/:id").
delete(journalController.deleteArticleType).
put(journalController.disableType);

// Article routes
router.route("/articleInfo").post(authorized, articleController.articlecreation);
router.route("/articleInfo/:id").get( articleController.getArticleInfo);
router.route("/files/:id").post(uploadForSubmissions.single("file_name"), filesValidation, articleController.articleFile);
router.route("/sugReviewer/:id").post( articleController.suggestReviewer);
router.route("/submit/:article_id").put(articleController.articleSubmission);


//router.route("/test").get(articleController.showNewSubmissions);

router.route("/index/:id").get(editorcontroller.index);
router.route("/download/:id").get(editorcontroller.download);
router.route("/sdownload").get(editorcontroller.sdownload);
router.route("/reviewdownload/:id").get(editorcontroller.reviewDownload);
router.route("/ArticleEInfo/:id").get(editorcontroller.ArticleInfo);
router.route("/galleyDownload").get(editorcontroller.galleyDownload);

// Editor routes
//router.route("/new/:id").get(articleController.showNewSubmissions);
router.route("/search-users").get(articleController.searchForUsers);
router.route("/assign-article/:id").get(articleController.assignArticle);
router.route("/assignEditor").post(editor,body("editor_id").notEmpty().withMessage("Please select editor"), editorcontroller.assignArticleToEditor);
router.route("/unAssignEditor/:id").delete(editor, editorcontroller.unAssignEditor);
router.route("/getAllEditors").get(editor, editorcontroller.getAllEditors);
router.route("/editorParticipants/:id").get(authorized, editorcontroller.editorParticipants);
router.route("/sendRivision/:id").post(uploadForSubmissions.array('files[]'), editor, editorcontroller.sendRivision);
router.route("/delSubmission/:id").delete(editor, editorcontroller.deleteSubmission);
router.route("/newSubs").get(editor, editorcontroller.showNewSubmissions); 
router.route("/Archive").get(editor, editorcontroller.Archive); 
router.route("/Subfiles/:id").get(authorized, editorcontroller.getSubmissionFiles); 
router.route("/ReviewFiles/:id").get(editor, editorcontroller.getEReviewFiles);
router.route("/RevisionFiles/:id").get(editor, editorcontroller.getRevisionFiles);
router.route("/delrevision/:id").delete(authorized, editorcontroller.deleteRevision);
router.route("/delreview/:id").delete(editor, editorcontroller.deleteReview);
router.route("/getAssignEditors/:id").get(editor, editorcontroller.getAssignedEditors); 
router.route("/getReviews/:id").get(editorcontroller.getReviews); 
router.route("/addNewUser").post(editorcontroller.addNewUser); 

router.route("/acceptArticle/:id").post(upload.array('files'), editor, editorcontroller.acceptArticle);
router.route("/rejectArticle/:id").post(upload.array('files'), editor, editorcontroller.rejectArticle);

// (CDUR) Rounds
router.route("/round/:id").post(editor, editorcontroller.addRound);
router.route("/round/:id").get(editor, editorcontroller.getRound);
router.route("/firstRound/:id").get(editor, editorcontroller.getFirstRound);

// ####################################
// (CDUR) Submission Discussions
router.route("/DiscussionSub/:id").
post(uploadForDiscussions.array('files'), authorized, editorcontroller.addDiscussionSub).
get(authorized, editorcontroller.getAllDiscussionsub);
router.route("/delDiscussion/:id").delete(editor, editorcontroller.deleteDiscussion);

// ####################################
// (CDUR) Production Discussions
router.route("/DiscussionPro/:id").
post(uploadForDiscussions.array('files'), authorized, editorcontroller.addDiscussionPro).
get(authorized, editorcontroller.getAllDiscussionsPro);


// ####################################
// Asign Article To Reviewer
router.route("/assignReviewer/:id").post(editor, assignReviewerValidation, editorcontroller.assignReviewer);
router.route("/unAssignReviewer/:id").delete(editor, editorcontroller.unAssignReviewer);
router.route("/roundParticipants/:id").get(editor, editorcontroller.roundParticipants);
router.route("/getAllReviews/:id").get(editor, editorcontroller.getAllReviews);
router.route("/getAllReviewers").get(editor, editorcontroller.getAllReviewers);


// Editor Publication routes
router.route("/articleTtle/:id").put(editorcontroller.articleTitle).
get(editorcontroller.getArticleTitle);
router.route("/co_Authors/:id").put(editorcontroller.co_Authors).
get(editorcontroller.getCo_Authors);
router.route("/galley/:id").put(uploadGally.single("file"),editorcontroller.galley).
get(editorcontroller.getGalley);
router.route("/publication/:id").put(uploadForimages.single("image"),editorcontroller.publication);
router.route("/getIss").get(editorcontroller.getIss);;


// (CDUR) Review Discussions
router.route("/DiscussionRound/:id").
post(uploadForDiscussions.array('files'), editor, editorcontroller.addDiscussionRound).
get(editor, editorcontroller.getAllDiscussionRound);


// ####################################
// select review files
router.route("/reviewFiles").post(editor, editorcontroller.reviewFiles);
router.route("/uploadFile").post(uploadForReviews.single("file"), editor, editorcontroller.uploadReviweFile);

// ####################################
// Reviewer routes 
router.route("/getAllMyAssigned").get(reviewer, reviewerController.getAllMyAssigned);
router.route("/addDiscussionReviewer/:id").post(uploadForDiscussions.array('files'), reviewer, reviewerController.addReviewerDiscussion);
router.route("/getReviewDiscussions/:id").get(reviewer, reviewerController.getReviewDiscussions);
router.route("/getReviewById/:id").get(reviewer, reviewerController.getReviewById);
router.route("/archive").get(reviewer, reviewerController.archive);
router.route("/review/:id").put(uploadForSubmissions.single("file_name"), reviewer, reviewValidation, reviewerController.review);
router.route("/acceptReview/:id").put(reviewer, reviewerController.acceptReview);
router.route("/rejectReview/:id").put(reviewer, reviewerController.rejectReview);
router.route("/getReviewFiles/:id").get(reviewer, reviewerController.getReviewFiles);
router.route("/getReviewCount/:id").get(reviewer, reviewerController.getReviewCount);


// ####################################
// Author routes 
router.route("/getAllMysubmissions").get(authorized, authorController.getAllMysubmissions);
router.route("/authorArchive").get(authorized, authorController.authorArchive);
router.route("/deleteSubmission/:id").delete(authorized, authorController.deleteSubmission);
router.route("/revisionFile/:id").post(uploadForSubmissions.single("file_name"), filesValidation, authorized, authorController.revisionFile);
router.route("/getRevisionFiles/:id").get(authorized, authorController.getRevisionFiles);
router.route("/Discussion/:id").post(uploadForDiscussions.array('files'), authorized, authorController.addDiscussionAuther);
router.route("/getAuthParticipants/:id").get(authorized, authorController.getAuthParticipants);
router.route("/updateProfile").put(authorized, authorController.updateProfile);

// ####################################
// Issue routes 
router.route("/addIssue").post(uploadForimages.single("cover_image"), editorInChief, issueController.addIssue);

router.route("/Issue/:id").
get(editorInChief, issueController.preview).
delete(editorInChief, issueController.deleteIssue).
put(uploadForimages.single("cover_image"), editorInChief, issueController.updateIssue);

router.route("/publishIssue/:id").put(editorInChief, issueController.publishIssue);
router.route("/unpublishIssue/:id").put(editorInChief, issueController.unpublishIssue);

router.route("/futureIssues").get(editorInChief, issueController.futureIssues);
router.route("/backIssues").get(editorInChief, issueController.backIssues);


// ####################################
// Home routes 
router.route("/volumes").get(homeController.getAllVolumes);
router.route("/getCurrentIssue").get(homeController.getCurrentIssue);
router.route("/getIssueById/:id").get(homeController.getIssueById);
router.route("/getArticleById/:id").get(homeController.getArticleById);
router.route("/Shearch").get(homeController.Shearch);

// Statics
router.route("/EditorialBoard").get(homeController.EditorialBoard);
router.route("/AboutJournal").get(homeController.AboutJournal);
router.route("/aimsScope").get(homeController.aimsScope);
router.route("/authorGuidelines").get(homeController.authorGuidelines);
router.route("/peerReviewProcess").get(homeController.peerReviewProcess);
router.route("/licences").get(homeController.licences);
router.route("/contactInfo").get(homeController.contactInfo);

module.exports = router; 