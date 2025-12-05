#!/bin/bash
sudo pm2 stop all || true
sudo rm -rf /home/ec2-user/backend
sudo mkdir -p /home/ec2-user/backend
