const multer = require("multer");
const path = require("path"); 

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/images');
    },
    filename: function (req, file, cb) {
        req.fileName = file.originalname;
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const storage1 = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/submissions');
    },
    filename: function (req, file, cb) {
        const extension = path.extname(file.originalname); // Get the file extension
        const newName = Date.now() + extension; // Set a unique filename based on the current date and time
        req.fileName = file.originalname; // Store the original filename in the request object
        cb(null, newName);
    }
});

const storage2 = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/review');
    },
    filename: function (req, file, cb) {
        req.fileName = file.originalname;
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const storage4 = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/galley');
    },
    filename: function (req, file, cb) {
        console.log(file)
        cb(null, file.originalname);
    }
});

const storage3 = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/discussions');
    },
    filename: function (req, file, cb) {
        req.fileName = file.originalname;
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const uploadForSubmissions = multer({storage:storage1});
const uploadForReviews = multer({storage:storage2});
const uploadForDiscussions = multer({storage:storage3});

const uploadForimages = multer({storage:storage});
const uploadGally = multer({storage:storage4});

module.exports = {
    uploadForSubmissions,
    uploadForReviews,
    uploadForDiscussions,
    uploadForimages,
    uploadGally
};