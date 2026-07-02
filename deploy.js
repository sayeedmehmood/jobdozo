const { Client } = require('ssh2');

const conn = new Client();
const HOST = '187.127.157.192';
const USER = 'root';
const fs = require('fs');
const PASS = 'Naamilmoney@1jammu';
const PRIVATE_KEY = fs.readFileSync('C:\\Users\\ACER\\.ssh\\id_ed25519');

const commands = [
  'apt-get update -y',
  'curl -fsSL https://deb.nodesource.com/setup_20.x | bash -',
  'apt-get install -y nodejs git',
  'npm install -g pm2',
  'rm -rf /opt/jobdozo',
  'git clone https://github.com/sayeedmehmood/jobdozo.git /opt/jobdozo',
  'cd /opt/jobdozo && npm install',
  'cd /opt/jobdozo && npm run build:portals',
  'pm2 delete jobdozo || true',
  'cd /opt/jobdozo && pm2 start server/index.js --name "jobdozo" --update-env',
  'pm2 save',
  'env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root || true'
];

conn.on('ready', () => {
  console.log('Client :: ready');
  
  let i = 0;
  function executeNext() {
    if (i >= commands.length) {
      console.log('All commands executed successfully!');
      conn.end();
      return;
    }
    const cmd = commands[i];
    console.log(`\nExecuting: ${cmd}`);
    conn.exec(cmd, (err, stream) => {
      if (err) throw err;
      stream.on('close', (code, signal) => {
        console.log(`[Closed] Code: ${code}`);
        i++;
        executeNext();
      }).on('data', (data) => {
        process.stdout.write(data);
      }).stderr.on('data', (data) => {
        process.stderr.write(data);
      });
    });
  }
  executeNext();

}).connect({
  host: HOST,
  port: 22,
  username: USER,
  password: PASS,
  tryKeyboard: true,
  readyTimeout: 99999
});

conn.on('keyboard-interactive', (name, instructions, instructionsLang, prompts, finish) => {
  console.log('Server prompted for keyboard-interactive:', prompts);
  finish([PASS]);
});
