# Email2Roam
Simple NodeJS script that makes use of [Roam-Research-Private-Api](https://github.com/artpi/roam-research-private-api) to add notes to your Daily Page via email.

## Setup as a GitHub Action
- Go to [arn4v/email2roam-action](https://github.com/arn4v/email2roam-action)
- Click the "Use template" button to generate a clone of the repository
- Go to Settings > Secrets and add the [required environment variables](#environment-variables) as secrets

## Setup locally
### Requirements
- Git
- NodeJS (v12+)

### Setup:
1. Clone repository
```shell
git clone git://github.com/arn4v/email2roam.git
```
2. `cd email2roam` in your terminal _**OR**_ open the cloned repo in your editor of choice
3. Copy .env.example to .env and add values to the variables
```
E2R_MODE="1"                      # 1 = Cron mode; 2 = Real time mode
ROAM_EMAIL=""                     # Roam Email
ROAM_PASSWORD=""                  # Roam Password
ROAM_GRAPH=""                     # Roam Graph Name
EMAIL_ADDRESS=""                  # Email address
EMAIL_PASSWORD=""                 # Email password
EMAIL_HOST="imap.gmail.com"       # Imap server URL
ALLOWED=["example@example.com"]   # JSON Array of allowed email addresses
```
4. Start using `npm run start`
5. Send an email to an allowed address - any text in the body will be prepended to your daily page.

### Environment variables
```
E2R_MODE="1"                      # 1 = Cron mode; 2 = Real time mode
ROAM_EMAIL=""                     # Roam Email
ROAM_PASSWORD=""                  # Roam Password
ROAM_GRAPH=""                     # Roam Graph Name
EMAIL_ADDRESS=""                  # Email address
EMAIL_PASSWORD=""                 # Email password
EMAIL_HOST="imap.gmail.com"       # Imap server URL
ALLOWED=["example@example.com"]   # JSON Array of allowed email addresses
```
### Notes:
- I recommend creating a separate email account for this
- If you're using Gmail _**AND**_ using 2FA you will need to generate an app password as explained here - https://support.google.com/accounts/answer/185833
  - Also refer to these screenshots https://imgur.com/a/PARZKQl
- If you're using Gmail _**BUT NOT**_ using 2FA you will need to enable _less secure apps_ here - https://myaccount.google.com/lesssecureapps

### If you have suggestions or have questions that are not covered in the documentation, please reach out to me via [email](mailto:arnav@arnavgosain.com) or [Twitter](https://twitter.com/arn4v)

### Run in Background
1. To make it run in the background use `pm2`
  ```
    npm install -g pm2
    pm2 start index.js --name email2roam
  ```
