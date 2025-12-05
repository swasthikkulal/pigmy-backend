#!/bin/bash
cd /home/ec2-user/backend
npm install
sudo pm2 start server.js --name backend
