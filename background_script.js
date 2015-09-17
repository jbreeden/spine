ports = [];
chrome.runtime.onConnect.addListener(function (port) {
  ports.push(port);
  port.onDisconnect.addListener(function () {
    ports = ports.filter(function (p) { return p != port; });
  })
});

// Just proxy all messages through all ports
chrome.runtime.onMessage.addListener(function (msg, sender) {
  ports.forEach(function (port) {
    port.postMessage(msg);
  });
});
