@echo off
cd frontend
if not exist .env.local copy .env.example .env.local
npm.cmd install
npm.cmd run clean
npm.cmd run dev:safe
