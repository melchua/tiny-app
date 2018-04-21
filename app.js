const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
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

function makeHTTP(address) {
  // check if http:// or https://
  // if missing, then add
  let httpAddress = "";
  if (address.slice(0,7) == "http://" || address.slice(0,8) == "https://") {
    httpAddress = address;
  } else {
    httpAddress = "http://" + address;
  }
  return httpAddress;
}

/********************************* End Helper Functions ***************************/


/********************************* Route Definitions **************************/
app.get("/", (req, res) => {
  if (IsLoggedIn(req.session.user_id)) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});


/***** URL ROUTES *****/
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    theUser: users[req.session.user_id],
    urlsF: urlsForUser(req.session.user_id)
  };
  if (!IsLoggedIn(req.session.user_id)) {
    res.render("notloggedin", templateVars);
  } else {
    res.render("urls_index", templateVars);
  }
});

app.post("/urls", (req, res) => {
  var shortRandomURL = generateRandomString(6);
  const httpAddress = makeHTTP(req.body.longURL);
   urlDatabase[shortRandomURL] = {
     shortURL: shortRandomURL,
     longURL: httpAddress,
     createdBy: req.session.user_id
   };
  res.redirect(302, `/urls/${shortRandomURL}`);
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

    function checkIfinURLDatabase(url) {
      if(urlDatabase[url] === undefined) {
        res.status(404).send("404: Link doesn't exist");
      }
      if(urlDatabase[url].createdBy === req.session.user_id) {
        return true;
      } else {
        return false;
      }
    }

  if (!IsLoggedIn(req.session.user_id)) {
    res.render("notloggedin", {theUser: users[req.session.user_id]});
  } else if(!urlDatabase[req.params.id]){
    res.status(404).send('404: Link Doesnt Exist');
  } else if(urlDatabase[req.params.id].createdBy !== req.session.user_id) {
    res.status(403).send("403: Not allowed, you are not the owner");
  } else {
      let templateVars = { urlsF: urlsForUser(req.session.user_id),
                      theUser: users[req.session.user_id],
                      shortURL: req.params.id,
                      longURL: urlDatabase[req.params.id].longURL
                    };
    res.render("urls_show", templateVars);
  }
});

// DELETE
app.post("/urls/:shortURL/delete", (req, res) => {
  targetURL = req.params.shortURL;
  if (urlDatabase[targetURL].createdBy === req.session.user_id) {
    delete urlDatabase[targetURL];
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
  const httpAddress = makeHTTP(req.body.longURL);
  if (urlDatabase[targetURL].createdBy === req.session.user_id) {
    repURL = httpAddress;
    urlDatabase[targetURL].longURL = repURL;
    res.redirect("/urls");
  } else {
    res.status(400).send("400: Not allowed as you are not the owner");
    return;
  }

});
/***** END URL ROUTES *****/

/******* LOGIN LOGOUT ROUTES*****/
app.get("/login", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    theUser: users[req.session.user_id],
    urlsF: urlsForUser(req.session.user_id)
   };

  if (!IsLoggedIn(req.session.user_id)) {
    res.render("usr_login", templateVars);
  } else {
    res.render("urls_index", templateVars);
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
/********* END LOGIN/LOGOUT ROUTES ********/

/********* REGISTER ROUTES ******************/

app.get("/register", (req, res) => {


  if (!IsLoggedIn(req.session.user_id)) {
    res.render("usr_registration");
  } else {
    let templateVars = {
    urls: urlDatabase,
    theUser: users[req.session.user_id],
    urlsF: urlsForUser(req.session.user_id)
    };
    res.render("urls_index", templateVars);
  }

});

app.post("/register", (req, res) => {
  if (!req.body.email) {
    res.status(400).send("Error 400: Email can't be empty.");
    return;
  }
  if (!req.body.password) {
    res.status(400).send("Error 400: Password can't be empty.");
    return;
  }

  const email = req.body.email;
  const password = bcrypt.hashSync(req.body.password, 10);

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
  req.session.user_id = users[randomUserID].id;
  res.redirect("/urls");
});

/********* END REGISTER ROUTES ******************/

app.get("/u/:shortURL", (req, res) => {
  let url = urlDatabase[req.params.shortURL];
  if (url === undefined) {
    res.status(400).send("Link does not exist");
    return;
  }

  res.redirect(url.longURL);
});

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}!`);
});