// creating first express server with routing
const express = require("express");
const app = express(); // does this run it here?
const PORT = process.env.PORT || 8080; // default 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };


const urlDatabase = {
  "b2xVn2": {
    shortURL: "b2xVn2",
    longURL: "http://www.lighthouselabs.ca",
    createdBy: "jsmith"
  },
  "9sm5xK": {
    shortURL: "9sm5xK",
    longURL: "http://www.google.com",
    createdBy: "jsmith"
  }
};


const users = {
  "jsmith": {
    id: "jsmith",
    email: "jsmith@example.com",
    password: "purple"
  },
 "joefresh": {
    id: "joefresh",
    email: "joe@fresh.com",
    password: "fresh"
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
});

app.get("/urls/new", (req, res) => {
  let templateVars = { user_id: req.cookies.user_id};
  // only registeredf users can shorten urls
  console.log(req.cookies.user_id);
  if (!req.cookies.user_id) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { user_id: req.cookies.user_id, shortURL: req.params.id, longURL: urlDatabase[req.params.id].longURL };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  var shortRandomURL = generateRandomString(6);
  if (req.body.longURL.slice(7) === 'http://') {
    urlDatabase[shortRandomURL] = {
      shortURL: shortRandomURL,
      longURL: req.body.longURL,
      createdBy: req.cookies.user_id
    };
  } else {
    urlDatabase[shortRandomURL] = {
      shortURL: shortRandomURL,
      longURL: 'http://' + req.body.longURL,
      createdBy: req.cookies.user_id
    };
  }

  console.log(urlDatabase);
  res.redirect(302, `/urls/${shortRandomURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[shortURL][req.params.shortURL];
  console.log(longURL);
  res.redirect(longURL);
});

// DELETE
app.post("/urls/:shortURL/delete", (req, res) => {

  // 1. a. Find target you want to delete
  targetURL = req.params.shortURL;
  // b. adding logic to this endpoint so that only the creator can delete
  if (urlDatabase[targetURL].createdBy === req.cookies.user_id) {
    // 2. Delete (use object delete operator)
    delete urlDatabase[targetURL];
    // 3. Send response to redirect to the listing page
    res.redirect("/urls");
    return;
  } else {
      res.status(400).send("400: Not allowed as you are not the owner");
      return;
  }

});

// EDIT
app.post("/urls/:shortURL/edit", (req, res) => {
  // 1. Find target you want to edit
  targetURL = req.params.shortURL;
  // 2. Save long URL from body
  repURL = req.body.longURL;
  // 3. replace
  urlDatabase[targetURL].longURL = repURL;
  // 4. Send response to redirect to the listing page
  res.redirect("/urls");
});

// LOGIN
app.get("/login", (req, res) => {
  let templateVars = { user_id: req.cookies.user_id };
  res.render("usr_login", templateVars);
});

// Updating login to use the new form data: email and password
// 1. first find a user that matches "email" submitted
// 2. if user with this email cannot be found, then return response with 403 error status code
// 3. else compare with password from existing user's password
// 4. If password and existing password do not match then response 403
// 5. else (if both checks pass), then set user_id cookie with matching user's user-id and
//    redirect to /.

function authenticate(user, emailfeed, passwordfeed) {
    if (users[user].email !== emailfeed) {
      return false;
    } else if (users[user].password !== passwordfeed) {
        return false;
    }
    else {
      return true;
    }
}

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  for (let user in users) {
    if (authenticate(user, email, password)) {
      console.log("All passed. authenticated");
      res.cookie('user_id', users[user].id);
      res.redirect("/");
      return;
    }
  }
  res.status(403).send("Error 403: Email or password incorrect");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
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

  // 3. append the new user object to the users object
  users[randomUserID] = newUser;
  // 4. add a new user id cookie and redirect
  let userid = randomUserID;
  res.cookie('user_id', userid).redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on ${PORT}!`);
});