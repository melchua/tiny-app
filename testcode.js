

const bcrypt = require('bcrypt');
const password = "purple-monkey-dinosaur"; // you will probably this from req.params
const hashedPassword = bcrypt.hashSync(password, 10);

console.log(hashedPassword);
console.log(bcrypt.compareSync("purple-monkey-dinosaursss", hashedPassword));
