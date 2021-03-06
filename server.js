// load .env data into process.env
require("dotenv").config();

// Web server config
const PORT = process.env.PORT || 8080;
const ENV = process.env.ENV || "development";
const express = require("express");
const bodyParser = require("body-parser");
const sass = require("node-sass-middleware");
const app = express();
const morgan = require("morgan");
const cookieSession = require("cookie-session");
const databaseFuncs = require("./databaseFuncs");
const auth = require("./middleware/auth");
const userPreferences = require("./middleware/usersPreferences");

app.use(
  cookieSession({
    name: "session",
    keys: ["key1"]
  })
);

// PG database client/connection setup
const { Pool } = require("pg");
const dbParams = require("./lib/dbParams.js");
const db = new Pool(dbParams);
db.connect();

// Load the logger first so all (static) HTTP requests are logged to STDOUT
// 'dev' = Concise output colored by response status for development use.
//         The :status token will be colored red for server error codes, yellow for client error codes, cyan for redirection codes, and uncolored for all other codes.
app.use(morgan("dev"));

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  "/styles",
  sass({
    src: __dirname + "/styles",
    dest: __dirname + "/public/styles",
    debug: true,
    outputStyle: "expanded"
  })
);
app.use(express.static("public"));

// Separated Routes for each Resource
// Note: Feel free to replace the example routes below with your own
const usersRoutes = require("./routes/users");
const resourcesRoutes = require("./routes/resources");

// Mount all resource routes
// Note: Feel free to replace the example routes below with your own
app.use("/api/users", usersRoutes(db));
app.use("/api/resources", resourcesRoutes(db));
// Note: mount other resources here, using the same pattern above

// Home page
// Warning: avoid creating more routes in this file!
// Separate them into separate routes files (see above).
app.get("/", auth, userPreferences, (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    res.redirect("/api/users/login");
  }

  const options = {};

  databaseFuncs.getAllResources(db, options, 60).then(data => {
    const user = res.locals.user;
    res.render("index", { data, user });
    res.status(200);
  });
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
