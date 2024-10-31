const {body} = require("express-validator");

const registValidation =
[
    body("first_name").notEmpty().withMessage("First Name is required"),
    body("last_name").notEmpty().withMessage("Last Name is required"),
    body("email").notEmpty().withMessage("Email is required").isEmail().withMessage("Your email is not valid"), 
    body("password").notEmpty().withMessage("Password is required").isLength({min:8, max:50}).withMessage("Your password must be at least 8 characters or digits"),
    body("userName").notEmpty().withMessage("Username is required"),
    //body("degree").notEmpty().withMessage("Degree is required"),
    //body("position").notEmpty().withMessage("Position is required"),
    body("phone").notEmpty().withMessage("Phone is required"),
    body("country").notEmpty().withMessage("Country is required"),
    body("affiliation").notEmpty().withMessage("affiliation is required"),
    //body("confirm_email").notEmpty().withMessage("Confirm Email is required").custom((value, {req}) => (value === req.body.email)).withMessage("Email do not match"),
    body("confirm_password").notEmpty().withMessage("Confirm Password is required").custom((value, {req}) => (value === req.body.password)).withMessage("Password do not match"),
];

const userValidation =
[
    body("first_name").notEmpty().withMessage("First Name is required"),
    body("last_name").notEmpty().withMessage("Last Name is required"),
    body("email").notEmpty().withMessage("Email is required").isEmail().withMessage("Your email is not valid"), 
    body("password").notEmpty().withMessage("Password is required").isLength({min:8, max:50}).withMessage("Your password must be at least 8 characters or digits"),
    //body("confirm_password").notEmpty().withMessage("Confirm Password is required").custom((value, {req}) => (value === req.body.password)).withMessage("Password do not match"),
    body("userName").notEmpty().withMessage("Username is required"),
    body("country").notEmpty().withMessage("Country is required"),
    body("affiliation").notEmpty().withMessage("affiliation is required"),
];

const loginValidation = 
[
    body("email").notEmpty().withMessage("Email is required").isEmail().withMessage("Your email is not valid"), 
    body("password").notEmpty().withMessage("Password is required"),
];

const updatePasswordValidation = 
[
    body("currentPassword").notEmpty().withMessage("Current Password is required"), 
    body("newPassword").notEmpty().withMessage("New Password is required").isLength({min:8}).withMessage("New password must be at least 8 characters and digits"),
    body("confirm_newPassword").notEmpty().withMessage("Confirm Password is required").custom((value, {req}) => (value === req.body.newPassword)).withMessage("Confirm Password do not match"),
];

const articleValidation = 
[
    body("article_type_id").notEmpty().withMessage("You have to select Manuscript Type"),
    body("full_title").notEmpty().withMessage("Manuscript Type is required"),
    body("abstract").notEmpty().withMessage("Abstract is required").isLength({min:5, max:250}).withMessage("Abstract word limit is 150 to 250 words"),
    body("keywords").notEmpty().withMessage("keywords Type is required").custom((value, {req}) => (value.split(",").length >= 3 && value.split(",").length <= 5)).withMessage("The number of keywords should be 3 to 5 keywords"),
]

const filesValidation = 
[
    body("file_type").notEmpty().withMessage("You have to select File Type"),
]

const suggestReviewerValidation = 
[
    body("first_name").notEmpty().withMessage("First Name is required"),
    body("last_name").notEmpty().withMessage("Last Name is required"),
    body("email").notEmpty().withMessage("Email is required").isEmail().withMessage("Your email is not valid"), 
    body("phone").notEmpty().withMessage("Phone is required"),
    body("country").notEmpty().withMessage("Country is required"),
    body("affiliation").notEmpty().withMessage("affiliation is required"),
];

const CJournalValidation = 
[
    body("title").notEmpty().withMessage("Journal Title is Required"), 
    body("initials").notEmpty().withMessage("Journal initials is Required"),
   // body("path").notEmpty().withMessage("Path is Required"),
];

const specialtyValidation = 
[
    body("name").notEmpty().withMessage("Name of specialty is Required"), 
];

const articleTypeValidation = 
[
    body("name").notEmpty().withMessage("Name of article Type is Required"), 
];

const assignReviewerValidation = 
[
    body("reviewer_id").notEmpty().withMessage("please select reviewer"),
    body("review_date").notEmpty().withMessage("review date is required"),
    body("response_date").notEmpty().withMessage("response date is required"), 
];

const reviewValidation = 
[
    body("recommendation").notEmpty().withMessage("Recommendation is required")
];

const revisionValidation = 
[
    body("revision_type").notEmpty().withMessage("Revision Type is required"),
    body("revision_date").notEmpty().withMessage("Revision Date is required")
];

const issueValidation = 
[
    body("volume").notEmpty().withMessage("Volume is required"),
    body("number").notEmpty().withMessage("Number is required"),
    body("year").notEmpty().withMessage("Year is required"),
];

module.exports = {
    registValidation,
    loginValidation,
    updatePasswordValidation,
    articleValidation,
    filesValidation,
    CJournalValidation,
    specialtyValidation,
    articleTypeValidation,
    suggestReviewerValidation,
    assignReviewerValidation,
    reviewValidation,
    userValidation,
    revisionValidation,
    issueValidation
}