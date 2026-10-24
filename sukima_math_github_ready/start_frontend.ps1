cd frontend
if (!(Test-Path ".env.local")) {
  Copy-Item ".env.example" ".env.local"
}
npm.cmd install
npm.cmd run clean
npm.cmd run dev:safe
