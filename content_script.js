chrome.storage.local.get(function (model) {
  if (model.enabled) {
    var spineScript = document.createElement('script');
    spineScript.setAttribute('src', chrome.extension.getURL('spine.js'));

    var sinonScript = document.createElement('script');
    sinonScript.setAttribute('src', chrome.extension.getURL('sinon.js'));

    var initScript = document.createElement('script');
    initScript.textContent =
      (model.verbose ? 'console.log("Spine Model: ", ' + JSON.stringify(model) + '); ' : '') +
      'window.spine = window.spine || {};' +
      'spine.verbose = ' + (model.verbose ? 'true; ' : 'false; ') +
      'spine.init = function () {' +
        'try { ' +
        '  spine.traceActions(' + (model.traceActions ? "" : "false") + ');' +
        (model.ajaxTraces.length > 0
          ? '  spine.traceAjax.apply(spine, ' + JSON.stringify(model.ajaxTraces) + ');'
          : '') +
        (model.backboneTraces.length > 0
          ? '  spine.traceEvents.apply(spine, ' + JSON.stringify(model.backboneTraces.concat({ filter: model.backboneEventFilter })) + ');'
          : '') +
        (model.fakeServer.recording
          ? '  spine.postAjaxResponses();'
          : '') +
        (model.fakeServer.routes.map(function (r) {
            if (r.applied) {
              return ['HEAD', 'GET', 'POST', 'PUT', 'DELETE'].map(function (method) {
                var pattern;
                try { pattern = new RegExp(r.method); } catch (ex) { /* Not a valid regex. Oh well. */ };
                if (pattern && method.match(pattern)) {
                  return 'spine.onAjax("' + method + '", new RegExp(' + JSON.stringify(r.url) + ', "i"), ' + JSON.stringify([parseInt(r.status), r.headers, r.content]) + ');';
                } else {
                  return '';
                }
              }).join(' ');
            } else {
              return '';
            }
          }).join(' ')) +
        '} catch (ex) { console.log(ex); }' +
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
