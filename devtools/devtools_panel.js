// Setup the Panel
// ---------------

var app = {};

chrome.storage.local.get(function (storage) {
  app.model = new Spine.Model(storage);
  app.views = {};
  app.views.layout = new Spine.DevtoolsLayout();
  app.views.enable = new Spine.EnableView({model: app.model});
  app.views.actions = new Spine.ActionsView({model: app.model});
  app.views.ajax = new Spine.AjaxView({model: app.model});
  app.views.backbone = new Spine.BackboneView({model: app.model});
  app.views.fakeServer = new Spine.FakeServerView({model: app.model.fakeServer});
  app.views.userScripts = new Spine.UserScriptsView({model: app.model.userScripts});

  document.body.appendChild(app.views.layout.el);
  app.views.layout.addPanel('Spine', app.views.enable.render().$el);

  // Hacky inline view definition
  (function () {
    var $traceView = $('<div class="column align-stretch"></div>');
    $traceView.append(app.views.actions.render().$el);
    $traceView.append(app.views.ajax.render().$el);
    $traceView.append(app.views.backbone.render().$el);
    $(document).on('resize', function () {
      if ($(document).height() < 500) {
        $traceView.removeClass('column');
        $traceView.addClass('row');
      } else {
        $traceView.removeClass('row');
        $traceView.addClass('column');
      }
    });

    app.views.layout.addPanel('Tracing', $traceView);
  }());

  app.views.layout.addPanel('Fake Server', app.views.fakeServer.render().$el);
  app.views.layout.addPanel('User Scripts', app.views.userScripts.render().$el);

  // TODO: More granular saves
  app.model.on('change', saveState);
  app.model.fakeServer.on('change', saveState);
  app.model.fakeServer.routes.on('change', saveState);
  app.model.fakeServer.routes.on('update', saveState);
  app.model.userScripts.on('change', saveState);
  app.model.userScripts.on('update', saveState);

  app.model.on('change:enabled', setEnabled);
  app.model.on('change:verbose', setVerbose);
  app.model.on('change:traceActions', setActionTracing);
  app.model.on('change:ajaxTraces', setAjaxTracing);
  app.model.on('change:backboneTraces', setBackboneTracing);
  app.model.on('change:backboneEventFilter', setBackboneTracing);
  app.model.fakeServer.routes.on('add', function (model) { if (model.get('applied')) setFakeServer(); });
  app.model.fakeServer.routes.on('remove', function (model) { if (model.get('applied')) setFakeServer(); });
  app.model.fakeServer.routes.on('change:applied', setFakeServer);
  app.model.fakeServer.on('change:recording', function (model, recording) {
    if (recording) startRecordingAjax();
    else stopRecordingAjax();
  });

  app.model.userScripts.each(listenForEval);
  app.model.userScripts.on('add', listenForEval);
  function listenForEval(model) {
    model.on('eval', function () { evalUserScript(model.get('text')); } );
  }
});

function saveState() {
  chrome.storage.local.set(app.model.toJSON());
}

var port = chrome.runtime.connect();

port.onMessage.addListener(function (msg) {
  if (msg == 'page:load') {
    app.model.trigger('page:load')
  }

  if (msg.indexOf('spine:ajax:response') == 0) {
    var response = msg.slice('spine:ajax:response'.length, msg.length);
    Backbone.trigger('ajax:response', JSON.parse(response));
  }
});

// Transport Messages to the Page
// ------------------------------

function setEnabled() {
  if (app.model.get('enabled')) {
    applySettings();
  } else {
    disable();
  }
}

function applySettings() {
  setActionTracing();
  setAjaxTracing();
  setBackboneTracing();
  setFakeServer();
  if (app.model.fakeServer.get('recording')) {
    startRecordingAjax();
  }
}

function disable() {
  chrome.devtools.inspectedWindow.eval('spine.traceActions(false)');
  chrome.devtools.inspectedWindow.eval('spine.traceAjax(false)');
  chrome.devtools.inspectedWindow.eval('spine.traceEvents(false)');
  restoreFakeServer();
  stopRecordingAjax();
}

function setVerbose() {
  if (app.model.get('verbose')) {
    chrome.devtools.inspectedWindow.eval('spine = window.spine || {}; spine.verbose = true;');
  } else {
    chrome.devtools.inspectedWindow.eval('spine = window.spine || {}; spine.verbose = false;');
  }
}

function setActionTracing() {
  var traceActions = app.model.get('traceActions');
  if (traceActions) {
    chrome.devtools.inspectedWindow.eval('spine.traceActions()');
  } else {
    chrome.devtools.inspectedWindow.eval('spine.traceActions(false)');
  }
}

function setAjaxTracing() {
  var ajaxTraces = app.model.get('ajaxTraces');
  if (ajaxTraces.length == 0) {
    chrome.devtools.inspectedWindow.eval('spine.traceAjax(false);');
  } else {
    chrome.devtools.inspectedWindow.eval('spine.traceAjax.apply(spine, ' + JSON.stringify(ajaxTraces) + ');');
  }
}

function setBackboneTracing() {
  var backboneTraces = app.model.get('backboneTraces');
  var filter = app.model.get('backboneEventFilter');
  if (backboneTraces.length == 0) {
    chrome.devtools.inspectedWindow.eval('spine.traceEvents(false);');
  } else {
    chrome.devtools.inspectedWindow.eval('spine.traceEvents.apply(spine, ' + JSON.stringify(backboneTraces.concat({ filter: filter })) + ');');
  }
}

function setFakeServer() {
  setFakeServer = _.debounce(function () {
    var fakeServer = app.model.fakeServer;
    restoreFakeServer();
    fakeServer.routes.each(function (route) {
      if (!route.get('applied')) return;

      ['HEAD', 'GET', 'POST', 'PUT', 'DELETE'].forEach(function (method) {
        var pattern;
        try { pattern = new RegExp(route.get('method')); } catch (ex) { /* Not a valid regex. Oh well. */ };
        if (pattern && method.match(pattern)) {
          chrome.devtools.inspectedWindow.eval(
            'spine.onAjax("' + method + '", \
              new RegExp(' + JSON.stringify(route.get('url')) + ', "i"),' +
              JSON.stringify([parseInt(route.get('status')), route.get('headers'), route.get('content')]) +
            ');'
          );
        }
      });
    });
  });
  setFakeServer.apply(this, arguments);
}

function restoreFakeServer() {
  chrome.devtools.inspectedWindow.eval('spine.restoreAjax();');
}

function startRecordingAjax() {
  chrome.devtools.inspectedWindow.eval('spine.postAjaxResponses();');
}

function stopRecordingAjax() {
  chrome.devtools.inspectedWindow.eval('spine.postAjaxResponses(false);');
}

function evalUserScript(script) {
  try {
    chrome.devtools.inspectedWindow.eval("try { " + script + " } catch (ex) { console.error('User Script Raised: ', ex); }");
  } catch (ex) {
    chrome.devtools.inspectedWindow.eval("console.log('Error evaluating user script: '" + JSON.stringify(ex.toString())+ ");")
  }
}
