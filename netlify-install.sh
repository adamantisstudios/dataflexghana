#!/bin/bash
# Custom install script for Netlify to handle npm cache issues

echo "Clearing npm cache..."
npm cache clean --force

echo "Installing dependencies with legacy peer deps..."
npm install --legacy-peer-deps

echo "Installation complete!"
