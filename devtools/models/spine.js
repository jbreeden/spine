Spine = window.Spine || {};
Spine.Model = Backbone.Model.extend({
  defaults: function () {
    return {
      enabled: false,
      traceActions: false,
      ajaxTraces: [],
      backboneTraces: [],
      backboneEventFilter: ""
    };
  },
  toJSON: function () {
    return _.extend({},
      this.attributes,
      { fakeServer: this.fakeServer.toJSON(),
        userScripts: this.userScripts.toJSON() }
    );
  },
  initialize: function (options) {
    this.fakeServer = new Spine.FakeServer(options.fakeServer || []);

    this.fakeServer.set('enabled', this.get('enabled'));
    this.on('change:enabled', function (model, enabled) {
      this.fakeServer.set('enabled', enabled);
    }, this);

    this.userScripts = new Backbone.Collection();
    this.userScripts.reset(options.userScripts || []);
  }
});
