// creating first express server with routing
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default 8080
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const cookieSession = require("cookie-session");

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": {
    shortURL: "b2xVn2",
    longURL: "http://www.lighthouselabs.ca",
    createdBy: "jsmith"
  },
  "9sm5xK": {
    shortURL: "9sm5xK",
    longURL: "http://www.google.com",
    createdBy: "joefresh"
  }
};

const users = {
  "jsmith": {
    id: "jsmith",
    email: "jsmith@example.com",
    password: bcrypt.hashSync("purple", 10)
  },
 "joefresh": {
    id: "joefresh",
    email: "joe@fresh.com",
    password: bcrypt.hashSync("fresh", 10)
  }
};

/********************************* Helper functions ***************************/


function authenticate(user, emailfeed, passwordfeed) {


    const hashedPass = users[user].password;



    if (users[user].email !== emailfeed) {
      return false;
    }

    if (!bcrypt.compareSync(passwordfeed, hashedPass)) {
      return false;
    }
    return true;
}

function IsLoggedIn(id) {
  if (id) {
    return true;
  }
}

function urlsForUser(id) {
  const urlDatabaseFiltered = {};

  for (var url in urlDatabase) {
    if (urlDatabase[url].createdBy === id) {
      urlDatabaseFiltered[url] = (urlDatabase[url]);
    }
  }
  return urlDatabaseFiltered;
}

function generateRandomString(numberOfChars) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

  for (var i = 0; i < numberOfChars; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return `${text}`;
}

/********************************* End Helper Functions ***************************/


/********************************* GET Route Definitions **************************/
app.get("/", (req, res) => {
  res.end("You have reached Tiny URL!");
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


app.get("/urls", (req, res) => {

  let templateVars = { urls: urlDatabase, theUser: users[req.session.user_id], urlsF: urlsForUser(req.session.user_id) };

  if (!IsLoggedIn(req.session.user_id)) {
    res.status(400).send("Please login first.");
  } else {
    res.render("urls_index", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  let templateVars = { theUser: users[req.session.user_id]};
  // only registeredf users can shorten urls
  if (!req.session.user_id) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { urlsF: urlsForUser(req.session.user_id),
                      theUser: users[req.session.user_id],
                      shortURL: req.params.id,
                      longURL: urlDatabase[req.params.id].longURL
                    };

  function checkIfinURLDatabase(url) {
    if(urlDatabase[url].createdBy === req.session.user_id) {
      return true;
    } else {
      return false;
    }
  }


  if (!IsLoggedIn(req.session.user_id)) {
    res.status(400).send("400: Please login first.");
  } else if(!checkIfinURLDatabase(req.params.id)) {
    res.status(400).send("400: Not allowed, you are not the owner");
  } else {
    res.render("urls_show", templateVars);
  }


});


app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// LOGIN
app.get("/login", (req, res) => {
  let templateVars = { theUser: users[req.session.user_id] };

  res.render("usr_login", templateVars);
});


app.get("/register", (req, res) => {
  res.render("usr_registration");
});


/********************************* END GET Route Definitions **************************/


app.post("/urls", (req, res) => {
  var shortRandomURL = generateRandomString(6);

  if (req.body.longURL.slice(0, 7) === 'http://') {
    urlDatabase[shortRandomURL] = {
      shortURL: shortRandomURL,
      longURL: req.body.longURL,
      createdBy: req.session.user_id
    };
  } else {
    urlDatabase[shortRandomURL] = {
      shortURL: shortRandomURL,
      longURL: 'http://' + req.body.longURL,
      createdBy: req.session.user_id
    };
  }

  res.redirect(302, `/urls/${shortRandomURL}`);
});

// DELETE
app.post("/urls/:shortURL/delete", (req, res) => {

  // 1. a. Find target you want to delete
  targetURL = req.params.shortURL;
  // b. adding logic to this endpoint so that only the creator can delete
  if (urlDatabase[targetURL].createdBy === req.session.user_id) {
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
  targetURL = req.params.shortURL;
  if (urlDatabase[targetURL].createdBy === req.session.user_id) {
    repURL = req.body.longURL;
    urlDatabase[targetURL].longURL = repURL;
    res.redirect("/urls");
  } else {
      res.status(400).send("400: Not allowed as you are not the owner");
      return;
  }

});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  for (let user in users) {
    if (authenticate(user, email, password)) {
      req.session.user_id = users[user].id;
      res.redirect("/");
      return;
    }
  }
  res.status(403).send("Error 403: Email or password incorrect");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
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
  if (authenticate(req.session.user_id, email, password)) {
    res.status(400).send("Error 400: Password can't be empty.");
  }
  // b. If someone tries to register with an existing user's email, send back a response with the 400 status code.
  for (var user in users) {
    if (users[user].email === email) {
      res.status(400).send("Error 400: Can't use same email address.");
      return;
    }
  }

  const randomUserID = generateRandomString(7);
  const newUser = {
    id: randomUserID,
    email: email,
    password: password
  };

  users[randomUserID] = newUser;
  let userid = randomUserID;
  req.session.user_id = users[user].id;
  redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on ${PORT}!`);
});