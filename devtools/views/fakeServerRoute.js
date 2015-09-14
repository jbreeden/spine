Spine = window.Spine || {};
Spine.FakeServerRouteView = Backbone.View.extend({
  className: 'spine-fake-server-route-view inline-column',
  events: {
    'click .apply' : 'toggleApplied',
    'click .add' : 'onAdd',
    'click .remove': 'onRemove'
  },
  initialize: function () {
    this.model.on('change', this.render, this);
    this.$el.html(this.template);
    this.$('*').on('change', this.onChange.bind(this));
    this.errors = new Backbone.Model();
    this.listenTo(this.errors, 'change', this.setValidationErrors.bind(this));

    this.listenTo(this.model, 'remove', function (model, collection) {
      if (collection == this.model.collection) {
        this.remove();
        Backbone.trigger('setFakeServer');
      }
    }.bind(this));

    _.each(['textarea', 'input'], function (tag) {
      this.$el.on('change', tag, function () {
        if (this.model.get('applied')) {
          this.$el.addClass('tainted-route');
        }
      }.bind(this));
    }, this);

    this.model.on('change:applied', function (model, applied) {
      if (!applied) this.$el.removeClass('tainted-route');
    }, this);
  },
  toggleApplied: function () {
    // Don't apply a route with invalid input
    if (!this.model.get('applied') && _.keys(this.errors.attributes).length > 0) return;
    this.model.set('applied', !this.model.get('applied'));
  },
  onChange: function () {
    this.errors.clear();

    var newAttrs = {
      url: this.$('.url').val(),
      status: this.$('.status').val(),
      content: this.$('.content').val(),
      method: this.$('.method').val(),
    };

    try {
      var headers = this.$('.headers').val();
      if (headers == '') {
        newAttrs.headers = {};
      } else {
        newAttrs.headers = JSON.parse(headers);
      }
    } catch (ex) {
      this.errors.set('headers', ex.toString());
      return;
    }

    this.model.set(newAttrs);
  },
  setValidationErrors: function () {
    // Error object from model should have the same keys as model.attributes
    this.$('.headers-error').text(this.errors.get('headers') || '');
  },
  clearValidationErrors: function () {
    this.$('.error').text('');
  },
  onAdd: function () {
    Backbone.trigger('fakeserver:route:add');
  },
  onRemove: function () {
    Backbone.trigger('fakeserver:route:remove', this.model);
  },
  render: function () {
    this.$('.url').val(this.model.get('url'));
    this.$('.status').val(this.model.get('status'));
    this.$('.headers').val(JSON.stringify(this.model.get('headers'), null, '  '));
    this.$('.content').val(this.model.get('content'));
    this.$('.method').val(this.model.get('method'));
    if (this.model.get('applied')) {
      this.$('.apply').html('x');
      this.$el.addClass('applied-route');
    } else {
      this.$('.apply').html('&#10003;');
      this.$el.removeClass('applied-route');
    }
    return this;
  },
  template: '\
    <div class="inline-row align-stretch">\
      <div class="inline-column align-stretch grow">\
        URL Pattern\
        <input class="url" type="text"></input>\
      </div>\
      <div class="inline-row align-end">\
        <button class="apply">&#10003;</button>\
        <button class="remove">-</button>\
        <button class="add">+</button>\
      </div>\
    </div>\
    <div class="inline-row align-stretch">\
      <div class="inline-column align-stretch grow">\
        Method\
        <input class="method" type="text"></input>\
      </div>\
      <div class="inline-column align-stetch grow">\
        Status\
        <input class="status" type="number"></input>\
      </div>\
    </div>\
    Headers <span class="error headers-error"></span>\
    <textarea class="headers" spellcheck="false"></textarea>\
    Content\
    <textarea class="content" spellcheck="false"></textarea>\
  '
});
