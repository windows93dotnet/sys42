import service from "/42/os/network/service.js"

service.install({
  version: "0.0.0",
  vhost: "http://localhost:3000/42/os/network/client/vhost.html",
  dev: true,
})
