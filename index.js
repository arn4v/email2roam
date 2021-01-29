const RoamApi = require("roam-research-private-api");
const NodeImap = require("node-imap");
const fs = require("fs");
const { inspect } = require("util");
const { simpleParser } = require("mailparser");
const TurndownService = require("turndown");

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
const turndownService = new TurndownService();

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
        // bodies: ["1"],
        bodies: "",
        struct: true,
        markSeen: true,
      });

      f.on("message", function (msg, seqno) {
        console.log("Got an email");
        msg.on("body", function (stream, info) {
          simpleParser(stream)
            .then((data) => {
              console.log("Parsed email");
              data.textAsMarkdown = turndownService.turndown(data.textAsHtml);
              let {
                from: { value: from },
                text,
                textAsMarkdown,
              } = data;
              from = from.map((v) => v.address);
              const dailyNoteUid = api.dailyNoteUid();
              api
                .logIn()
                .then(() => {
                  console.log("Adding block");
                  return api.createBlock(text, dailyNoteUid);
                })
                .then((result) => {
                  console.log("Added block, closing Roam API");
                  api.close();
                })
                .catch((err) => {
                  console.log("Unable to add block, error:");
                  console.log(err.toString());
                });
            })
            .catch((err) => err.toString());
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
