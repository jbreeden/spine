window.Spine = window.Spine || {}
Spine.FakeServer = Backbone.Model.extend({
  initialize: function (options) {
    this.routes = new (Backbone.Collection.extend({ model: Spine.FakeServerRoute }));
    this.routes.reset(options.routes);
  },
  toJSON: function () {
    return _.extend({},
      this.attributes,
      { routes: this.routes.toJSON() }
    );
  }
});
