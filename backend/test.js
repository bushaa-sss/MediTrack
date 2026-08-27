const dns = require("dns");

dns.lookup("cluster0.teqkxte.mongodb.net", (err, address) => {
  console.log(err, address);
});