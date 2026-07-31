#!/bin/bash
cd "$(dirname "$0")"
npm install
npm run adse
read -p "Press Enter to close..."
