chrome.storage.local.get(function (storage) {
  var spine = {};
  spine.model = new Spine.Model(storage);
  spine.enableView = new Spine.EnableView({model: spine.model});
  spine.ajaxView = new Spine.AjaxView({model: spine.model});

  var content = document.getElementById('content');
  content.appendChild(spine.enableView.render());
  content.appendChild(spine.ajaxView.render());

  spine.model.on('change:enabled', function () {
    chrome.storage.local.set(spine.model.attributes);
  });

  spine.model.on('change:ajaxTraces', function (model, ajaxTraces) {
    if (ajaxTraces.length == 0) {
      chrome.devtools.inspectedWindow.eval('spine.traceAjax(false)');
    } else {
      chrome.devtools.inspectedWindow.eval('spine.traceAjax.apply(spine, ' + JSON.stringify(ajaxTraces) + ')');
    }
  });
});
