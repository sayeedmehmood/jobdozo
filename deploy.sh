#!/bin/bash
set -e
echo "Starting deployment..."
apt-get update -y
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs git
npm install -g pm2
rm -rf /opt/jobdozo
git clone https://github.com/sayeedmehmood/jobdozo.git /opt/jobdozo
cd /opt/jobdozo
npm install
for app in seeker-app employer-app recruiter-app admin-app super-admin-app; do
  echo "Installing dependencies for $app..."
  cd $app
  npm install
  cd ..
done
npm run build:portals
pm2 delete jobdozo || true
pm2 start server/index.js --name "jobdozo" --update-env --env PORT=80
pm2 save
env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root || true
echo "Deployment successful!"
