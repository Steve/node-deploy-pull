var GitHubApi = require("node-github");
var fs = require('fs');
var path = require("path");
var request = require("request");
var AdmZip = require("adm-zip");
var S = require('string');
var winston = require("winston");

var github = new GitHubApi({
  version: "3.0.0",
    timeout: 5000
});

if(!fs.existsSync("app")) {
  winston.info("app directory not found, making it");
  fs.mkdirSync("app");
}

github.gitdata.getReference({
  user: "steve",
  repo: "test-pull",
  ref: "heads/master"
}, function(err, res) {
  sha = res.object.sha;


  directory = path.join("app", sha);
  zipfile = path.join("app", sha + ".zip");
  download_url = "http://github.com/steve/test-pull/zipball/master";
  root_folder_suffix = S(sha).left(7).s + "/";

  if(!fs.existsSync(directory)) {
    winston.info("download from " + download_url + " & install to " + directory);

    readStream = request(download_url);

    readStream.pipe(fs.createWriteStream(zipfile));

    readStream.on("end", function() {

      var zip = new AdmZip(zipfile);
      zip.extractAllTo("app");

      zipEntries = zip.getEntries();

      zipEntries.forEach(function(zipEntry) {
        if(S(zipEntry.entryName).endsWith(root_folder_suffix)) {
          winston.info("rename github root folder " + zipEntry.entryName + " to " + sha);
          fs.renameSync(path.join("app", zipEntry.entryName), directory);
        }

      });
    });
  } else {
    winston.info("no change");
  }

});
