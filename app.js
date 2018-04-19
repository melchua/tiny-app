// creating first express server with routing
const express = require("express");
const app = express(); // does this run it here?
const PORT = process.env.PORT || 8080; // default 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

function generateRandomString(numberOfChars) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

  for (var i = 0; i < numberOfChars; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return `${text}`;
}


app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, user_id: req.cookies.user_id };
  res.render("urls_index", templateVars);

  console.log(templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { user_id: req.cookies.user_id};
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { user_id: req.cookies.user_id, shortURL: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  var shortRandomURL = generateRandomString(6);
  if (req.body.longURL.slice(7) === 'http://') {
    urlDatabase[shortRandomURL] = req.body.longURL;
  } else {
    urlDatabase[shortRandomURL] = 'http://' + req.body.longURL;
  }
  res.redirect(302, `/urls/${shortRandomURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  console.log(longURL);
  res.redirect(longURL);
});

// DELETE
app.post("/urls/:shortURL/delete", (req, res) => {
  // 1. Find target you want to delete
  targetURL = req.params.shortURL;
  // 2. Delete (use object delete operator)
  delete urlDatabase[targetURL];
  // 3. Send response to redirect to the listing page
  res.redirect("/urls");

});

// EDIT
app.post("/urls/:shortURL/edit", (req, res) => {
  // 1. Find target you want to edit
  targetURL = req.params.shortURL;
  // 2. Save long URL from body
  repURL = req.body.longURL;
  // 3. replace
  urlDatabase[targetURL] = repURL;
  // 4. Send response to redirect to the listing page
  res.redirect("/urls");
});

// LOGIN
app.get("/login", (req, res) => {
  let templateVars = { user_id: req.cookies.user_id };
  res.render("usr_login", templateVars);
});

app.post("/login", (req, res) => {
  // 1. set cookie named username to value submitted in login form (res.cookie)
  let username = req.body.username;
  res.cookie('username', username);
  // 2. redirect back to /urls
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  // let templateVars = { username: req.cookies['username']};
  res.render("usr_registration");
});

// REGISTER
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  // Add error checking logic
  // a. If the e-mail or password are empty strings, send back a response with the 400 status code.
  if (!email) {
    res.status(400).send("Error 400: Email can't be empty.");
  }
  if (!password) {
    res.status(400).send("Error 400: Password can't be empty.");
  }
  // b. If someone tries to register with an existing user's email, send back a response with the 400 status code.
  for (var user in users) {
    if (users[user].email === email) {
      res.status(400).send("Error 400: Can't use same email address.");
      return;
    }
  }

  // 1. generate random user id
  const randomUserID = generateRandomString(7);
  // 2. create a new user object
  const newUser = {
    id: randomUserID,
    email: email,
    password: password
  };

  console.log(newUser);
  // 3. append the new user object to the users object
  users[randomUserID] = newUser;
  // 4. add a new user id cookie and redirect
  let userid = randomUserID;
  res.cookie('user_id', userid).redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on ${PORT}!`);
});