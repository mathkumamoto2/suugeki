# 数隙 Neo Prime safe frontend start
if (Test-Path ".next") {
  Remove-Item -Recurse -Force ".next"
}
if (Test-Path "node_modules\.cache") {
  Remove-Item -Recurse -Force "node_modules\.cache"
}
npm.cmd run dev:safe
