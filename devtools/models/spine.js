Spine = window.Spine || {};
Spine.Model = Backbone.Model.extend({
  defaults: function () {
    return {
      enabled: false,
      traceActions: false,
      ajaxTraces: [],
      backboneTraces: []
    };
  },
  toJSON: function () {
    return _.extend({},
      this.attributes,
      { fakeServer: this.fakeServer.toJSON(),
        userScripts: this.userScripts.toJSON() }
    );
  },
  save: function () {
    Backbone.trigger('save');
  },
  initialize: function (options) {
      this.fakeServer = new Spine.FakeServer(options.fakeServer || []);

      this.fakeServer.set('enabled', this.get('enabled'));
      this.on('change:enabled', function (model, enabled) {
        this.fakeServer.set('enabled', enabled);
      }, this);

      this.userScripts = new Backbone.Collection();
      this.userScripts.reset(options.userScripts || []);

      this.on('change', this.save, this);
      this.listenTo(this.userScripts, 'change', this.save);
      this.listenTo(this.userScripts, 'update', this.save);

      this.listenTo(this.fakeServer, 'change:recording', function (fakeServer, recording) {
        if (recording) {
          Backbone.trigger('ajax:record:start');
        } else {
          Backbone.trigger('ajax:record:stop');
        }
      });
  }
});
