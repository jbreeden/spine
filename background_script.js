// Setup first time model when extension is loaded
chrome.storage.local.get(function (model) {
  if (Object.keys(model).length == 0) {
    var model = {};
    model.enabled = false;
    chrome.storage.local.set(model);
  }
});
