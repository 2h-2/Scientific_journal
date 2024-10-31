const express = require("express");
const httpStatusText = require("./utils/httpStatusText")
const app = express();
app.use(express.json());
//app.use(express.urlencoded({extended : true}));
const cors = require("cors");
app.use(cors());
app.use(express.static("uploads/discussions"));
app.use(express.static("uploads/submissions"));
app.use(express.static("uploads/review"));
app.use(express.static("uploads/images"));
app.use(express.static("uploads/galley"));
require("dotenv").config();
const auth = require("./routes/auth");
const apis = require("./routes/apis");


app.use("/auth", auth);
app.use("/apis", apis);

app.all("*", (req, res, next) => {
    return res.status(404).json({status: httpStatusText.ERROR, message: "this resouce is not avaliable"});
});

// global error handler 
app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({status: err.statusText, message: err.message, data:null})
})

app.listen(process.env.PORT || 4000, process.env.HOSTNAME, () =>{
    console.log("SERVER IS RUNNING");
});