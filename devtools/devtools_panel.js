var app = {};

chrome.storage.local.get(function (storage) {
  var app = {};
  app.model = new Spine.Model(storage);
  app.enableView = new Spine.EnableView({model: app.model});
  app.ajaxView = new Spine.AjaxView({model: app.model});

  var content = document.getElementById('content');
  content.appendChild(app.enableView.render());
  content.appendChild(app.ajaxView.render());

  app.model.on('change', function () {
    chrome.storage.local.set(app.model.attributes);
  });

  app.model.on('change:ajaxTraces', setAjaxTraces);
});

chrome.runtime.onMessage(function (msg, sender /*, sendResponse */) {
    if (msg == 'spineLoaded') {
      setAjaxTraces();
    }
});

function setAjaxTraces() {
  ajaxTraces = app.model.get('ajaxTraces');
  if (ajaxTraces.length == 0) {
    chrome.devtools.inspectedWindow.eval('spine.traceAjax(false)');
  } else {
    chrome.devtools.inspectedWindow.eval('spine.traceAjax.apply(spine, ' + JSON.stringify(ajaxTraces) + ')');
  }
}
