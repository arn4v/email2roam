const RoamApi = require("roam-research-private-api");
const NodeImap = require("node-imap");
const fs = require("fs");
const { inspect } = require("util");

require("dotenv-safe").config();

const {
  ROAM_GRAPH,
  ROAM_EMAIL,
  ROAM_PASSWORD,
  EMAIL_ADDRESS,
  EMAIL_PASSWORD,
  EMAIL_HOST,
} = process.env;

const config = {
  imap: {
    user: EMAIL_ADDRESS,
    password: EMAIL_PASSWORD,
    host: EMAIL_HOST,
    port: 993,
    tls: true,
  },
};

const imap = new NodeImap(config.imap);
const api = new RoamApi(ROAM_GRAPH, ROAM_EMAIL, ROAM_PASSWORD);

function streamToString(stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => {
      chunks.push(chunk);
    });
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

imap.once("ready", () => {
  console.log("Ready");
  imap.openBox("INBOX", true, (err, box) => {
    if (err) {
      console.log(err);
      process.exit(1);
    }
    console.log("Opened main inbox");

    imap.on("mail", (num) => {
      const f = imap.seq.fetch(box.messages.total + ":*", {
        bodies: ["1"],
        struct: true,
        markSeen: true,
      });

      f.on("message", function (msg, seqno) {
        msg.on("body", function (stream, info) {
          streamToString(stream).then((data) => {
            const dailyNoteUid = api.dailyNoteUid();
            api.createBlock(msg, dailyNoteUid);
          });
        });
      });
      f.once("end", function () {
        console.log("Done fetching all messages!");
      });
      return null;
    });
  });
});

imap.once("error", function (err) {
  console.log(err);
});

imap.once("end", function () {
  console.log("Connection ended");
});

imap.connect();
