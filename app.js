const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const PORT = process.env.PORT || 3000;
const session = require("express-session")
const cookie = require('cookie-parser')
app.use(cors());
const helmet = require('helmet')
const flash = require('connect-flash')
const {connection} = require('./config/db')
// Serve static files (fonts, images, etc.)
app.use(express.static(path.join(__dirname, "public")));

// Body parser middleware
// app.use(session({
//   secret:'message',
//   resave:false,
//   saveUninitialized:true, 
//   cookie:{
//     maxAge:60000
//   }
// }))

 app.use(
    helmet({
        noCache: true, // For older versions, now deprecated
        contentSecurityPolicy: false, // Disable CSP if not configured
    })
);

// Middleware to set no-cache headers explicitly
app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    next();
});

connection.connect((err)=>{
  if (err) throw err;
  console.log("Db Connected !!!!");
})

app.use(session({
  secret: 'message',
  resave: false,
  saveUninitialized: true,
  cookie: {maxAge: 1000 * 60 }
}))
app.use(flash());
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  next();
});

app.use(cookie());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Set view engine
app.set("view engine", "ejs");

// Set up routes
app.use("/", require("./Routes/indexRouts"));

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}/`);
});
