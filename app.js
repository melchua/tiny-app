// creating first express server with routing
const express = require("express");
const app = express(); // does this run it here?
const PORT = process.env.PORT || 8080; // default 8080
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // debug statement to see POST parameters
  var shortRandomURL = generateRandomString(6);
  if (req.body.longURL.slice(7) === 'http://') {
    urlDatabase[shortRandomURL] = req.body.longURL;
  } else {
    urlDatabase[shortRandomURL] = 'http://' + req.body.longURL;
  }
  console.log(urlDatabase);
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
app.post("/urls/:shortURL", (req, res) => {
  // 1. Find target you want to edit
  targetURL = req.params.shortURL;
  // 2. Save long URL from body
  repURL = req.body.longURL;
  // 3. replace
  urlDatabase[targetURL] = repURL;
  // 4. Send response to redirect to the listing page
  res.redirect("/urls");

});


app.listen(PORT, () => {
  console.log(`Example app listening on ${PORT}!`);
});