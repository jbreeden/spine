Spine = window.Spine || {};
Spine.Model = Backbone.Model.extend({
  defaults: function () {
    return {
      enabled: false,
      traceActions: false,
      ajaxTraces: [],
      backboneTraces: [],
      fakeServer: new Backbone.Collection()
    };
  },
  toJSON: function () {
    return _.extend({},
      this.attributes,
      { fakeServer: this.fakeServer.toJSON() }
    );
  },
  initialize: function (options) {
      this.fakeServer = new Spine.FakeServer(options.fakeServer);
      this.fakeServer.set('enabled', this.get('enabled'));
      this.on('change:enabled', function (model, enabled) {
        this.fakeServer.set('enabled', enabled);
      }, this);

      this.on('change', function () {
        Backbone.trigger('save');
      }, this);

      this.listenTo(this.fakeServer, 'change:recording', function (fakeServer, recording) {
        if (recording) {
          Backbone.trigger('ajax:record:start');
        } else {
          Backbone.trigger('ajax:record:stop');
        }
      });
  }
});
