(function () {
  window.spine = window.spine || {};
  // Internals
  // ---------

  spine.Backbones = [];
  spine.ajaxEvents = 'ajaxStart ajaxSend ajaxSuccess ajaxError ajaxComplete ajaxStop'.split(' ');

  var privateEvents = [
    'debug:discover',
    'debug:report',
    'debug:new',
    'debug:render'
  ];

  function isPrivateEvent(eventName) {
    if (spine.verbose) return false;
    for (var i = 0; i < privateEvents.length; i++) {
      if (eventName.indexOf(privateEvents[i]) == 0) {
        return true;
      }
    }
    return false;
  }

  function onBackboneFound(bb) {
    onBackboneFound.callbacks.forEach(function (cb) {
      cb(bb);
    });
  }
  onBackboneFound.callbacks = [];

  // Internal Types
  // --------------

  // ### Backbone Event Type

  function BackboneEvent() {};
  BackboneEvent.prototype.log = function (stack) {
    var isView = false;
    if (this.handlerContext && this.handlerContext.el) {
      isView = true;
    }
    if (isView) {
      console.groupCollapsed(this.eventName + ' (cid:' + this.handlerContext.cid + ', data-view: ' + (this.handlerContext.el ? this.handlerContext.el.getAttribute('data-view') : '') + ')');
    } else {
      console.groupCollapsed(this.eventName);
    }

    console.log(this);
    if (isView) {
      console.log(this.handlerContext.el);
    }

    if (stack) console.log(stack);
    else console.trace();
    console.groupEnd();
  };

  // ### AjaxEvent Type

  function AjaxEvent() {};
  AjaxEvent.prototype.log = function (stack) {

    this.jqxhr = this.handlerArguments[1];
    this.settings = this.handlerArguments[2];

    if (this.jqxhr && this.settings) {
      console.groupCollapsed("%s%s%s %s", this.eventName, Array(15 - this.eventName.length + 1).join(' '), this.settings.type, this.settings.url);
      console.log("jQXHR: ", this.jqxhr);
      console.log("Ajax Settings: ", this.settings);
    } else {
      console.log(this);
      console.groupCollapsed(this.eventName);
    }

    if (stack) console.log(stack);
    else console.trace();
    console.groupEnd();
  };

  // ### Action Type

  function Action() {
    this.events = [];
    this.index = Action.index++;
  }
  Action.index = 0;

  Action.prototype.eventsOfType = function (eventNamePattern) {
    console.group('Events from spine.actions[' + this.index + '] of type ' + eventNamePattern);
    this.events.filter(function (e) {
      if (eventNamePattern.constructor == RegExp) {
        return (e.data.eventName.match(eventNamePattern));
      } else {
        return (e.data.eventName.indexOf(eventNamePattern) == 0);
      }
    }).forEach(function (e) {
      e.data.log(e.stack);
    });
    console.groupEnd();
  };

  // Listen for Commands from Other Windows
  // --------------------------------------

  window.addEventListener('message', function (event) {
    if (event.data.cmd == 'eval') {
      eval(event.data.script);
    }
  });

  // Instrument the Global Object
  // ----------------------------

  spine.onGlobalDefined = function (prop, callback) {
    var oldValue = undefined;
    if (window[prop]) {
      callback(window[prop]);
      return;
    }

    Object.defineProperty(window, prop, {
      get: function () {
        return window['__' + prop + '__'];
      },
      set: function (newValue) {
        var decorated = callback(newValue) || newValue;
        window['__' + prop + '__'] = decorated;
      },
      configurable: true
    });
  };

  spine.onGlobalDefined('Backbone', function (Backbone) {
    if (isBackbone(Backbone)) {
      console.log("SPINE: Instrumenting global backbone", Backbone);
      instrumentBackbone(Backbone);
      onBackboneFound(Backbone);
    }
  });

  spine.onGlobalDefined('jQuery', function ($) {
    console.log("SPINE: Instrumenting global jQuery");
  });

  spine.onGlobalDefined('sinon', function (sinon) {
    console.log("SPINE: Found Sinon. Adding wrapper functions to spine.");
    addSinonWrappers(sinon);
  });

  spine.onGlobalDefined('define', function (define) {
    if (spine.onGlobalDefined.settingDefine) return;
    spine.onGlobalDefined.settingDefine = true;
    var wrapper = function () {
      var args = Array.prototype.slice.call(arguments);
      var result = define.apply(this, args);
      if (isBackbone(result)) {
        console.log("Instrumenting defined Backbone");
        instrumentBackbone(result);
        onBackboneFound(result);
      }
      return result;
    }

    // Make sure our wrapper really looks like the real thing.
    // (If the page manages to define the `define` function before us,
    // and we leave out this step, requirejs will fail to work.)
    Object.keys(define).forEach(function (key) {
      wrapper[key] = define[key];
    });

    window.define = wrapper;
    spine.onGlobalDefined.settingDefine = false;
  });

  // jQuery
  // ------

  // ### Trace Ajax

  (function () {
    spine.traceAjax =  function (/* event[, event...]*/) {
      var events = []
      if (arguments.length == 0) {
        events = ['start', 'send', 'success', 'error', 'complete', 'stop'];
      } else if (!(arguments[0] === false)) {
        events = Array.prototype.slice.call(arguments);
      }

      var eventMapping = {
        start: 'ajaxStart',
        send: 'ajaxSend',
        success: 'ajaxSuccess',
        error: 'ajaxError',
        complete: 'ajaxComplete',
        stop: 'ajaxStop'
      };

      Object.keys(eventMapping).forEach(function (shortName) {
        var eventName = eventMapping[shortName];
        var handler = getHandler(eventName);
        if (events.indexOf(shortName) != -1) {
          $(document).off(eventName, handler);
          $(document).on(eventName, handler);
        } else {
          $(document).off(eventName, handler);
        }
      });
    };

    var ajaxHandlers = {};
    function getHandler(event) {
      if (!ajaxHandlers[event]) {
        ajaxHandlers[event] = function () {
          var eventData = new AjaxEvent();
          eventData.eventName = event;
          eventData.handlerContext = this;
          eventData.handlerArguments = Array.prototype.slice.call(arguments);
          eventData.handlerArguments.forEach(function (arg) {
            if (arg.url) eventData.url = arg.url;
          });
          eventData.log();
        }
      }
      return ajaxHandlers[event];
    };
  }());

  // ### Post Ajax Reponses on Window. (Added for the GUI client, not CLI)

  (function () {
    spine.postAjaxResponses = function () {
      if (arguments.length == 0 || arguments[0]) {
        $(document).on('ajaxComplete', postAjaxResponse);
      }
      else {
        $(document).off('ajaxComplete', postAjaxResponse);
      }
    };

    function postAjaxResponse(event, jqxhr, settings) {
      var response = {};
      response.url = settings.url;
      response.method = settings.type;
      response.status = jqxhr.status;

      response.headers = {};
      jqxhr.getAllResponseHeaders().split("\n").forEach(function (h) {
        var key = h.slice(0, h.indexOf(':'));
        var value = jqxhr.getResponseHeader(key);
        if (value !== null) response.headers[key] = value;
      });

      if (jqxhr.getResponseHeader('Content-Type').match(/json/i)) {
          response.content = JSON.stringify(JSON.parse(jqxhr.responseText), null, '  ');
      } else {
        response.content = jqxhr.responseText;
      }


      window.postMessage("spine:ajax:response " + JSON.stringify(response), '*');
    }
  }());

  // Sinon
  // -----

  function addSinonWrappers(sinon) {
    var fakeServer, fakeUrls = [];
    setupFakeServer();

    spine.restoreAjax = function () {
      // Restore ajax by restoring the fake server.
      // However, recreate the fake server immediately in case onAjax is called again.
      // The empty "fakeUrls" list will ensure requestFilter instructs the
      // fake server to send all URLs to the server in the meantime.
      fakeServer.restore();
      setupFakeServer();
    };

    spine.server = {};

    spine.onAjax = function () {
      var url, method;

      if (!(arguments.length == 2 || arguments.length == 3)) {
        throw "onAjax requires 2 or 3 arguments";
      }

      if (arguments.length == 2) {
        url = arguments[0];
      } else {
        url = arguments[1];
      }

      if (arguments.length == 3) {
        method = arguments[0];
      }

      fakeUrls.push({url: url, method: method});
      fakeServer.respondWith.apply(fakeServer, arguments);
    };

    function setupFakeServer() {
      fakeUrls = [];
      sinon.FakeXMLHttpRequest.useFilters = true;
      sinon.FakeXMLHttpRequest.addFilter(requestFilter);
      fakeServer = sinon.fakeServer.create();
      fakeServer.autoRespond = true;
    }

    function requestFilter(method, url, async, uname, pword) {
      var SEND_TO_SERVER = true;
      var INTERCEPT_REQUEST = false;

      for (var i = 0; i < fakeUrls.length; i++) {
        if (fakeUrls[i].method.toLowerCase() != method.toLowerCase()) continue;
        if (fakeUrls[i].url.constructor == RegExp) {
          if (url.match(fakeUrls[i].url)) return INTERCEPT_REQUEST;
        } else {
          if (url == fakeUrls[i].url) return INTERCEPT_REQUEST;
        }
      }
      // No match in fakeUrls, return true to send to actual server
      return SEND_TO_SERVER;
    }
  }

  // Backbone
  // --------

  function isBackbone(backboneCandidate) {
    if (backboneCandidate
        && backboneCandidate.View
        && backboneCandidate.Model
        && backboneCandidate.Router) {
      return true;
    }
    return false;
  };

  spine.discovery = {
    events: {
      discover: {
        models: 'debug:discover:models',
        collections: 'debug:discover:collections',
        views: 'debug:discover:views',
        routers: 'debug:discover:routers'
      },
      report: {
        models: 'debug:report:model',
        collections: 'debug:report:collection',
        views: 'debug:report:view',
        routers: 'debug:report:router'
      }
    },
    allDiscoverableObjects: function () {
      return spine.models
        .concat(spine.collections)
        .concat(spine.views)
        .concat(spine.routers)
        .concat(spine.Backbones);
    }
  };

  function discoveryProperty(name) {
    Object.defineProperty(spine, name, {
      get: function () {
        var result = [];
        spine.Backbones.forEach(function (bb) {
          function reporter(item) {
            if (result.indexOf(item) == -1) result.push(item);
          }
          bb.on(spine.discovery.events.report[name] , reporter);
          bb.trigger(spine.discovery.events.discover[name]);
          bb.off(spine.discovery.events.report[name])
        });
        return result;
      }
    });
  }
  discoveryProperty('models');
  discoveryProperty('collections');
  discoveryProperty('views');
  discoveryProperty('routers');

  Object.defineProperty(spine, 'domViews', {
    get: function () {
      var domViews = [];
      var elements = document.getElementsByTagName('*');
      elements = Array.prototype.slice.call(elements);
      elements.forEach(function (el) {
        if (el._debug_view) {
          if (domViews.indexOf(el._debug_view) == -1) domViews.push(el._debug_view);
        }
      });
      return domViews;
    }
  });

  spine.listViews = function (views) {
    if (!views) views = spine.views;
    console.group("Views List");
    views.forEach(function (view) {
      console.group("View (cid:" + view.cid + ", data-view: " + view.el.getAttribute('data-view') + ")");
      console.log(view)
      console.log(view.el);
      console.groupEnd();
    });
    console.groupEnd();
  };

  spine.markViews = function (views) {
    if (!views) views = spine.views;
    views.forEach(function (view) {
      view._debug_marked = true;
    });
  };

  spine.unmarkViews = function (views) {
    if (!views) views = spine.views;
    views.forEach(function (view) {
      view._debug_marked = false;
    });
  };

  spine.markedViews = function (views) {
    if (!views) views = spine.views;
    return views.filter(function (v) { return v._debug_marked; });
  };

  spine.unmarkedViews = function (views) {
    if (!views) views = spine.views;
    return views.filter(function (v) { return !v._debug_marked; });
  };

  // Backbone Event Tracing
  // ----------------------

  (function () {

    var eventTracer = function (event/* , trigger args... */) {
      if (isPrivateEvent(event)) return;
      var data = new BackboneEvent();
      data.eventName = event;
      data.handlerContext = this;
      data.handlerArguments = Array.prototype.slice.call(arguments);
      data.log();
    };

    var newItemBinder = function (item) {
      item.off('all', eventTracer);
      item.on('all', eventTracer);
    };

    // arguments => 'models', 'collections', 'views', 'routers' /* Or any subset as positional arguments*/
    spine.traceEvents = function () {
      var eventEmitters,
          types = Array.prototype.slice.call(arguments),
          allDiscoverableEmitters = spine.discovery.allDiscoverableObjects();

      // Each new call resets the value, so remove existing listeners
      allDiscoverableEmitters.forEach(function (emitter) {
        if (emitter.off) emitter.off('all', eventTracer);
      });
      spine.Backbones.forEach(function (bb) {
        ['debug:new:view', 'debug:new:model', 'debug:new:collection', 'debug:new:router'].forEach(function (e) {
          bb.off(e, newItemBinder);
        });
      });

      // Normalize arguments.
      // If none supplied, use all discoverable emitters.
      // If false is given, short-circuit, having released all listeners already.
      if (arguments.length == 0) {
        eventEmitters = allDiscoverableEmitters;
        spine.Backbones.forEach(function (bb) {
          ['debug:new:view', 'debug:new:model', 'debug:new:collection', 'debug:new:router'].forEach(function (e) {
            bb.on(e, newItemBinder);
          });
        });
      } else if (!arguments[0]) {
        return;
      } else {
        eventEmitters = [];
        types.forEach(function (type) {
          if (type.toLowerCase() == 'backbone') {
            eventEmitters = eventEmitters.concat(spine.Backbones);
          } else {
            eventEmitters = eventEmitters.concat(spine[type]);
          }
          spine.Backbones.forEach(function (bb) {
            bb.on('debug:new:' + type.slice(0, type.length - 1), newItemBinder);
          });
        });
      }

      eventEmitters.forEach(function (emitter) {
        if (!emitter.on) return;
        emitter.on('all', eventTracer);
      });
    };
  }());

  // Backbone Action Tracing
  // -----------------------

  (function () {
    var machine, states, firstStart = true;

    onBackboneFound.callbacks.push(function (bb) {
      machine.notifyNewBackbone(bb);
    });

    // Pass in a number for `enable` to specify the tolerance between actions
    // in milliseconds.
    spine.traceActions = function (enable) {
      if (firstStart) {
        machine.start();
        firstStart = false;
      }

      if (arguments.length == 0) {
        // Default action is to enable
        enable = true;
      }

      if (enable) {
        if (typeof(enable) == 'number') {
          machine.setInterval(enable);
        } else {
          machine.setInterval(200);
        }
        machine.enable();
      } else {
        machine.disable();
      }
    }

    function State(overrides) {
      this.enter = function () {};
      this.exit = function () {};
      this.tick = function () {};
      this.event = function () {};
      this.enable = function () {};
      this.disable = function () {};
      Object.keys(overrides).forEach(function (override) {
        this[override] = overrides[override];
      }.bind(this));
    }

    states = {
      // STATE: Disabled
      disabled: new State({
        enter: function () {
          spine.discovery.allDiscoverableObjects().forEach(function (obj) {
            if (obj.off) obj.off('all', this.eventHandler);
          }.bind(this));

          spine.ajaxEvents.forEach(function (event) {
            $(document).off(event, this.getAjaxHandler(event));
          }.bind(this));
        },
        exit: function () {
          spine.discovery.allDiscoverableObjects().forEach(function (obj) {
            if (obj.on) obj.on('all', this.eventHandler);
          }.bind(this));

          spine.Backbones.forEach(function (bb) {
            ['debug:new:view', 'debug:new:model', 'debug:new:collection', 'debug:new:router'].forEach(function (e) {
              bb.on(e, function (item) {
                item.off('all', this.eventHandler);
                item.on('all', this.eventHandler);
              }.bind(this));
            }.bind(this));
          }.bind(this));

          spine.ajaxEvents.forEach(function (event) {
            $(document).on(event, this.getAjaxHandler(event));
          }.bind(this));
        },
        enable: function () {
          this.goto(this.states.idle);
        },
      }),

      // STATE: Idle
      idle: new State({
        event: function (eventData) {
          this.goto(this.states.active);
          this.state.event.call(this, eventData);
        },
        disable: function () {
          this.goto(this.states.disabled);
        }
      }),

      // STATE: Active
      active: new State({
        enter: function () {
          this.startTime = (new Date()).toISOString();
          this.activitySinceLastTick = false;
          this.firstTickSinceEnter = true;
          this.events = [];
        },
        exit: function () {
          if (this.events.length > 0) {
            this.endTime = (new Date()).toISOString();
            spine.actions = spine.actions || [];
            var action = new Action();
            spine.actions[action.index] = action;

            console.groupCollapsed("spine.actions[" + action.index + '] (start: ' + this.startTime + ', end: ' + this.endTime + ')');
            this.events.forEach(function (event) {
              action.events.push(event);
              if (event.data.constructor == AjaxEvent || event.data.constructor == BackboneEvent) {
                event.data.log(event.stack);
              } else {
                console.log(event);
              }
            });
            console.groupEnd();
          }
          this.events = [];
        },
        tick: function () {
          if (this.firstTickSinceEnter || this.activitySinceLastTick) {
            this.activitySinceLastTick = false;
            this.firstTickSinceEnter = false;
          } else {
            this.goto(this.states.idle);
          }
        },
        event: function (eventData) {
          this.activitySinceLastTick = true;
          this.events.push(eventData);
        },
        disable: function () {
          this.goto(this.states.disabled);
        }
      })
    };
    machine = {
      state: states.disabled,
      states: states,
      tick: function () {
        this.state.tick.call(this);
      },
      event: function (eventData) {
        this.state.event.call(this, eventData);
      },
      enable: function () {
        this.state.enable.call(this);
      },
      disable: function () {
        this.state.disable.call(this);
      },
      goto: function (nextState) {
        this.nextState = nextState;
        if (this.state) this.state.exit.call(this);
        this.previousState = this.state;
        this.state = this.nextState;
        this.nextState = undefined;
        this.state.enter.call(this);
      },
      start: function () {
        if (!this.interval) {
          this.setInterval(200);
        }
        this.goto(this.states.disabled);
      },
      setInterval: function (delay) {
        if (this.interval) {
          window.clearInterval(this.interval);
        }
        this.interval = window.setInterval(function () {
          this.tick();
        }.bind(this), delay);
      },
      notifyNewBackbone: function (bb) {
        spine.discovery.allDiscoverableObjects().forEach(function (obj) {
          if (obj.off) obj.off('all', this.eventHandler);
          if (obj.on) obj.on('all', this.eventHandler);
        }.bind(this));
      },
      eventHandler: function (event) {
        if (isPrivateEvent(event)) return;
        // Executed in the context determine by the event trigger function.
        // Access machine via closure.
        var data = new BackboneEvent();
        data.eventName = event;
        data.handlerContext = this;
        data.handlerArguments = Array.prototype.slice.call(arguments);
        var stack = (new Error()).stack.replace("Error", "Stack Trace");
        machine.event({
          data: data,
          stack: stack
        });
      },
      getAjaxHandler: function (event) {
        this.ajaxHandlers = this.ajaxHandlers || {};

        if (!this.ajaxHandlers[event]) {
          this.ajaxHandlers[event] = function () {
            var data = new AjaxEvent();
            data.eventName = event;
            data.handlerContext = this;
            data.handlerArguments = Array.prototype.slice.call(arguments);
            data.handlerArguments.forEach(function (arg) {
             if (arg && arg.url) data.url = arg.url;
            });
            var stack = (new Error()).stack.replace("Error", "Stack Trace");
            machine.event({
              data: data,
              stack: stack
            });
          }
        }

        return this.ajaxHandlers[event];
      }
    };
  }());

  // Backbone Instrumentation
  // ------------------------

  function instrumentBackbone(Backbone) {
    if (!isBackbone(Backbone)) {
      return;
    }
    spine.Backbones.push(Backbone);
    var extend = Backbone.View.extend;
    Backbone.View.extend = function () {
      var viewClass = extend.apply(this, arguments);

      // On render, set `view` property of the DOM element to point to this view
      var render = viewClass.prototype.render;
      viewClass.prototype.render = function () {
        var args = Array.prototype.slice.call(arguments);
        this.trigger('debug:render:begin', this);
        var result = render.apply(this, args);
        this.trigger('debug:render:end', this);
        this.el._debug_view = this;
        return result;
      }

      // Report self on debug:discover:views
      var initialize = viewClass.prototype.initialize;
      viewClass.prototype.initialize = function () {
        var result = undefined;
        if (initialize) {
          result = initialize.apply(this, arguments);
        }
        Backbone.on('debug:discover:views', function () {
          Backbone.trigger('debug:report:view', this);
        }.bind(this));

        // Report the new item
        Backbone.trigger('debug:new:view', this);

        return result;
      }

      return viewClass;
    };

    extend = Backbone.Model.extend;
    Backbone.Model.extend = function () {
      var modelClass = extend.apply(this, arguments);
      var initialize = modelClass.prototype.initialize;
      modelClass.prototype.initialize = function () {
        var result = undefined;
        if (initialize) {
          result = initialize.apply(this, arguments);
        }
        Backbone.on('debug:discover:models', function () {
          Backbone.trigger('debug:report:model', this);
        }.bind(this));

        // Report the new item
        Backbone.trigger('debug:new:model', this);

        return result;
      }
      return modelClass;
    };

    extend = Backbone.Collection.extend;
    Backbone.Collection.extend = function () {
      var collectionClass = extend.apply(this, arguments);
      var initialize = collectionClass.prototype.initialize;
      collectionClass.prototype.initialize = function () {
        var result = undefined;
        if (initialize) {
          result = initialize.apply(this, arguments);
        }
        Backbone.on('debug:discover:collections', function () {
          Backbone.trigger('debug:report:collection', this);
        }.bind(this));

        // Report the new item
        Backbone.trigger('debug:new:collection', this);

        return result;
      }
      return collectionClass;
    };

    extend = Backbone.Router.extend;
    Backbone.Router.extend = function () {
      var routerClass = extend.apply(this, arguments);
      var initialize = routerClass.prototype.initialize;
      routerClass.prototype.initialize = function () {
        var result = undefined;
        if (initialize) {
          result = initialize.apply(this, arguments);
        }
        Backbone.on('debug:discover:routers', function () {
          Backbone.trigger('debug:report:router', this);
        }.bind(this));

        // Report the new item
        Backbone.trigger('debug:new:router', this);

        return result;
      }
      return routerClass;
    };
  };

  Object.defineProperty(HTMLElement.prototype, 'view', {
    get: function () {
      if (this._debug_view) {
        return this._debug_view;
      } else {
        var el = this.parentElement;
        while(el != document.body) {
          if (el._debug_view) {
            return el._debug_view;
          } else {
            el = el.parentElement;
          }
        }
        return undefined;
      }
    }
  });

  var searchTokens = window.location.search.split("&");
  searchTokens.forEach(function (token) {
    var methodMatch = token.match(/spine.([a-zA-Z0-9_]+)/);
    if (methodMatch && methodMatch[1]) {
      onBackboneFound.callbacks.push(function () {
        spine[methodMatch[1]]();
      });
    }
  });

  if (spine.init) onBackboneFound.callbacks.push(function () { spine.init(); });
}());
