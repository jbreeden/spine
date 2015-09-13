// Setup first time model when extension is loaded
var model = {};
model.enabled = false;
model.traceActions = false;
model.ajaxTraces = [];
model.backboneTraces = [];
model.verbose = false;
model.fakeServer = {
  routes: [{
    url: '.*',
    status: 200,
    headers: { "Content-Type": "application/json" },
    content: '{ "success": "true" }',
  }]
};
chrome.storage.local.set(model);


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
