window.Spine = window.Spine || {}
Spine.FakeServer = Backbone.Model.extend({
  initialize: function (options) {
    this.routes = new (Backbone.Collection.extend({ model: Spine.FakeServerRoute }));
    this.routes.reset(options.routes);

    this.listenTo(this.routes, 'change', function () {
      Backbone.trigger('save');
    }, this);

    this.listenTo(this.routes, 'update', function () {
      Backbone.trigger('save');
    }, this);

    this.listenTo(Backbone, 'fakeserver:route:add', this.addRoute.bind(this));
    this.listenTo(Backbone, 'fakeserver:route:remove', this.removeRoute.bind(this));
  },
  addRoute: function () {
    this.routes.add({});
  },
  removeRoute: function (route) {
    // TODO: This should be in the view, if anywhere. Should remove this constraint.
    if (this.routes.length > 1) this.routes.remove(route);
  },
  toJSON: function () {
    return _.extend({},
      this.attributes,
      { routes: this.routes.toJSON() }
    );
  }
});
