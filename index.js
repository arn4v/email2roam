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
let MODE = parseInt(process.env.MODE);

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
    .then((res) => api.close())
    .catch((err) => {
      console.log(err);
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
};

const repo_path = getRepoPath();
/** File that stores uidvalidity */
const uvPath = path.resolve(
  path.join(repo_path ? repo_path : path.resolve(__dirname), "uidvalidity")
);

/**
 * Credits: everruler12 https://github.com/everruler12/roam2github/blob/main/roam2github.js#L52
 */
function getRepoPath() {
  const ubuntuPath = path.join("/", "home", "runner", "work");
  const exists = fs.existsSync(ubuntuPath);

  if (exists) {
    const files = fs.readdirSync(ubuntuPath).filter((f) => !f.startsWith("_")); // filter out [ '_PipelineMapping', '_actions', '_temp', ]
    if (files.length !== 1) return false;
    repo_name = files[0];
    const files2 = fs.readdirSync(path.join(ubuntuPath, repo_name));

    if (files2.length === 1 && files2[0] === repo_name) {
      return path.join(ubuntuPath, repo_name, repo_name);
    } else {
      return false;
    }
  } else {
    return false;
  }
}

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
          return;
        }
      });
    } else {
      imap.on("mail", (num) => {
        const f = imap.seq.fetch(box.messages.total + ":*", {
          // bodies: ["1"],
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
