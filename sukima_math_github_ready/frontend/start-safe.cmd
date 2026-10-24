@echo off
IF EXIST .next rmdir /s /q .next
IF EXIST node_modules\.cache rmdir /s /q node_modules\.cache
npm.cmd run dev:safe
