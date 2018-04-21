
function makeHTTP(address) {
  // check if http:// or https://
  // if missing, then add
  let httpAddress = "";
  if (address.slice(0,7) == "http://" || address.slice(0,8) == "https://") {
    httpAddress = address;
  } else {
    httpAddress = "http://" + address;
  }
  // console.log(address.slice(0,7));
  return httpAddress;
}


console.log(makeHTTP('blah.com'));