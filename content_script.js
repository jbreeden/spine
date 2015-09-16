chrome.storage.local.get(function (model) {
  if (model.enabled) {
    var spineScript = document.createElement('script');
    spineScript.setAttribute('src', chrome.extension.getURL('spine.js'));

    var sinonScript = document.createElement('script');
    sinonScript.setAttribute('src', chrome.extension.getURL('sinon.js'));

    var initScript = document.createElement('script');
    initScript.textContent =
      (model.verbose ? 'console.log("Spline Model: ", ' + JSON.stringify(model) + '); ' : '') +
      'window.spine = window.spine || {};' +
      'spine.verbose = ' + (model.verbose ? 'true; ' : 'false; ') +
      'spine.init = function () {' +
      '  spine.traceActions(' + (model.traceActions ? "" : "false") + ');' +
      (model.ajaxTraces.length > 0
        ? '  spine.traceAjax.apply(spine, ' + JSON.stringify(model.ajaxTraces) + ');'
        : '') +
      (model.backboneTraces.length > 0
        ? '  spine.traceEvents.apply(spine, ' + JSON.stringify(model.backboneTraces) + ');'
        : '') +
      (model.fakeServer.recording
        ? '  spine.postAjaxResponses();'
        : '') +
      '};';

    var scriptParent = (document.head||document.documentElement);
    scriptParent.appendChild(sinonScript);
    scriptParent.appendChild(spineScript);
    scriptParent.appendChild(initScript);
  }
});

chrome.runtime.sendMessage('page:load');

window.addEventListener('message', function (msg) {
  if (msg.data
      && typeof(msg.data.match) == 'function'
      && msg.data.match(/^spine:/)
    ) chrome.runtime.sendMessage(msg.data);
});
