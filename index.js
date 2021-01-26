const RoamApi = require("roam-research-private-api");
const NodeImap = require("node-imap");

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

imap.once("ready", () => {
  console.log("Ready");
  imap.openBox("INBOX", true, (err) => {
    if (err) {
      console.log(err);
      process.exit(1);
    }
    console.log("Opened main inbox");
  });
});

imap.on("message", (msg, seqno) => {
  console.log("yo");
  console.log(msg, seqno);
  const api = new RoamApi(ROAM_GRAPH, ROAM_EMAIL, ROAM_PASSWORD, {
    headless: true,
  });
  api.quickCapture(msg);
});

imap.once("error", function (err) {
  console.log(err);
});

imap.once("end", function () {
  console.log("Connection ended");
});

imap.connect();
