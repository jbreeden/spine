Spine = window.Spine || {};
Spine.FakeServerView = Backbone.View.extend({
  className: 'spine-fake-server-view inline-column align-start',
  events: {
    'change .record': 'setAjaxRecording',
    'click .new': 'onClickNew',
    'click .clear': 'clearRoutes',
    'click .startRoutes': 'startRoutes',
    'click .stopRoutes': 'stopRoutes'
  },
  template: '\
    <div class="toolbar">\
      <h1>Fake Server</h1>\
      <label><input class="record" type="checkbox"></input>Record</label>\
      <div class="explanation">\
        While `record` is enabled, a new route will be created for each AJAX response the application receives.<br/>\
        Note: After recording, you may need to escape the captured URL pattern to make sure it\'s a valid RegExp.\
      </div>\
      <button class="new">New</button>\
      <button class="clear">Clear</button>\
      <button class="startRoutes">Start All</button>\
      <button class="stopRoutes">Stop All</button>\
    </div>\
    <div class="routes inline-row wrap align-start flex"></div>\
  ',
  initialize: function () {
    this.$el.html(this.template);
    if (!this.model.get('enabled')) this.disable();

    this.model.on('change:enabled', function (model, enabled) {
      if (enabled) {
        this.enable();
      } else {
        this.disable();
      }
    }.bind(this));

    this.children = {};
    this.children.routes = [];

    this.model.routes.each(this.insertViewForRoute, this);
    this.model.routes.on('add', this.insertViewForRoute, this);

    this.listenTo(Backbone, 'ajax:response', this.addAjaxRecording.bind(this));
  },
  startRoutes: function () {
    this.model.routes.each(function (r) { r.set('applied', true); });
  },
  stopRoutes: function () {
    this.model.routes.each(function (r) { r.set('applied', false); });
  },
  setAjaxRecording: function () {
    this.model.set('recording', this.$('.record').prop('checked'));
  },
  addAjaxRecording: function (response) {
    this.model.routes.add(response);
  },
  disable: function () {
    this.$('input').attr('disabled', 'disabled');
    this.$('textarea').attr('disabled', 'disabled');
    this.$('button').attr('disabled', 'disabled');
    this.$el.addClass('disabled');
  },
  enable: function () {
    this.$('input').removeAttr('disabled');
    this.$('textarea').removeAttr('disabled');
    this.$('button').removeAttr('disabled');
    this.$el.removeClass('disabled');
  },
  insertViewForRoute: function (route) {
    var routeView = new Spine.FakeServerRouteView({ model: route });
    this.$('.routes').append(routeView.render().el);
  },
  clearRoutes: function () {
    this.model.routes.set([]);
  },
  onClickNew: function () {
    this.model.routes.add(new Spine.FakeServerRoute());
  },
  render: function () {
    return this;
  }
});
