Spine = window.Spine || {};
Spine.FakeServerView = Backbone.View.extend({
  className: 'spine-fake-server-view inline-column align-start',
  events: {
    'click .apply' : 'toggleFakeServer',
    'change .record': 'setAjaxRecording'
  },
  initialize: function () {
    this.model.on('change:enabled', function (model, enabled) {
      if (enabled) {
        this.enable();
      } else {
        this.restoreFakeServer();
        this.disable();
      }
    }.bind(this));

    this.model.on('page:load', this.restoreFakeServer, this);
    this.model.routes.on('change', this.setFakeServer, this);

    this.children = {};
    this.children.routes = [];

    this.listenTo(this.model.routes, 'update', function () {
      this.render();
    }.bind(this));

    this.listenTo(Backbone, 'ajax:response', this.addAjaxRecording.bind(this));

    this.$el.html(this.template);
  },
  toggleFakeServer: function () {
    if (!this.applied) {
      this.setFakeServer();
    } else {
      this.restoreFakeServer();
    }
  },
  setAjaxRecording: function () {
    this.model.set('recording', this.$('.record').prop('checked'));
  },
  addAjaxRecording: function (response) {
    this.model.routes.add(response);
  },
  setFakeServer: function () {
    this.restoreFakeServer();
    Backbone.trigger('setFakeServer');
  },
  restoreFakeServer: function () {
    Backbone.trigger('restoreFakeServer');
  },
  disable: function () {
    this.restoreFakeServer();
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
  render: function () {
    if (!this.model.get('enabled')) this.disable();

    _.each(this.children.routes, function (routeView) {
      routeView.remove();
    }, this);

    this.children.routes = [];

    this.model.routes.each(function (route) {
      var routeView = new Spine.FakeServerRouteView({ model: route });
      this.children.routes.push(routeView);
      this.$('.routes').append(routeView.render().el);
    }, this);

    if (this.model.get('enabled')) {
      this.enable();
    } else {
      this.disable();
    }

    return this;
  },
  template: '\
    <div class="toolbar">\
      <label><input class="record" type="checkbox"></input>Record</label>\
      <div class="explanation">\
        While `record` is enabled, a new route will be created for each AJAX response the application receives.<br/>\
        Note: After recording, you may need to escape the captured URL pattern to make sure it\'s a valid RegExp.\
      </div>\
    </div>\
    <div class="routes inline-row wrap align-start flex"></div>\
  '
});