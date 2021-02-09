const RoamApi = require("roam-research-private-api");
const NodeImap = require("node-imap");
const path = require("path");
const fs = require("fs");
const { simpleParser } = require("mailparser");

require("dotenv").config();

const {
  ROAM_GRAPH,
  ROAM_EMAIL,
  ROAM_PASSWORD,
  EMAIL_ADDRESS,
  EMAIL_PASSWORD,
  EMAIL_HOST,
} = process.env;

/** @type {1 | 2} */
let MODE = parseInt(process.env.E2R_MODE);
if (!MODE) MODE = 1;

let { ALLOWED } = process.env;

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
if (ALLOWED) ALLOWED = ALLOWED.replace(/\'/g, '"');
const allowed = ALLOWED ? JSON.parse(ALLOWED) : undefined;

const addBlock = async (data) => {
  const api = new RoamApi(ROAM_GRAPH, ROAM_EMAIL, ROAM_PASSWORD);
  const dailyNoteUid = api.dailyNoteUid();
  console.log("Adding email to notes");
  api
    .logIn()
    .then(() => {
      console.log("Logged in");
      return api.createBlock(data, dailyNoteUid);
    })
    .then((result) => {
      console.log("Added block, closing Roam API");
      api.close();
    })
    .catch((err) => {
      console.log(err.toString());
    });
};

const getMessages = (f) => {
  f.on("message", function (msg, seqno) {
    msg.on("body", function (stream, info) {
      simpleParser(stream)
        .then((data) => {
          let {
            from: { value: from },
            text,
          } = data;
          from = from.map((v) => v.address);
          if (from.some((v) => allowed.includes(v))) {
            addBlock(text);
          } else {
            console.log(
              "Email received from unauthorized address",
              from.join(", ")
            );
          }
        })
        .catch((err) => err.toString());
    });
  });
  f.on("end", () => {
    imap.end();
  });
};

imap.once("ready", () => {
  console.log("Ready");
  imap.openBox("INBOX", false, (err, box) => {
    if (err) {
      console.log(err);
      process.exit(1);
    }
    console.log("Opened main inbox");

    if (MODE === 1) {
      imap.search(["UNSEEN"], (err, results) => {
        if (!err && results.length > 0) {
          const f = imap.fetch(results, {
            // bodies: "HEADER.FIELDS (FROM TO SUBJECT DATE)",
            bodies: "",
            markSeen: true,
          });
          getMessages(f);
        } else {
          imap.end();
          return;
        }
      });
    } else {
      imap.on("mail", (num) => {
        const f = imap.seq.fetch(box.messages.total + ":*", {
          bodies: "",
          struct: true,
          markSeen: true,
        });
        getMessages(f);
        f.once("end", function () {
          console.log("Done fetching all messages!");
        });
        return null;
      });
    }
  });
});

imap.once("error", function (err) {
  console.log(err);
});

imap.once("end", function () {
  console.log("Connection ended");
});

imap.connect();
