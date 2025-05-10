const fs = require("fs");
const path = require("path");
const multer = require("multer");
const filepath = path.join(__dirname, "../public/uploads");


if(!fs.existsSync(filepath)) {
    fs.mkdirSync(filepath, { recursive: true });
}
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, filepath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now()+ Math.floor(Math.random()*10000)+file.originalname);
    }
});

const upload = multer({ storage: storage }).fields([
    { name: "profileImag", maxCount: 1 },
    { name: "idImag" }
]);

const uploadsetting = multer({ storage: storage }).fields([
    { name: "lightlogo", maxCount: 1 },
    { name: "darklogo",maxCount:1 }
]);

const UploadRosone = multer({ storage: storage }).fields([
    {name: "attachment"}
]);

module.exports = {upload,uploadsetting,UploadRosone};