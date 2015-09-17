Spine = window.Spine || {};
Spine.FakeServerRouteView = Backbone.View.extend({
  className: 'spine-fake-server-route-view inline-column',
  events: {
    'click .applied' : 'toggleApplied',
    'click .remove': 'removeRoute'
  },
  template: '\
    <div class="row align-end">\
      <span>URL Pattern</span>\
      <div class="flex"></div>\
      <button class="remove">x</button>\
    </div>\
    <div class="column align-stretch">\
      <input class="url" type="text"></input>\
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
    <div class="row justify-end">\
      <button class="applied">Start</button>\
    </div>\
  ',
  initialize: function () {
    this.model.on('change', this.render, this);
    this.$el.html(this.template);
    this.$('*').on('change', this.onInputChange.bind(this));
    this.errors = new Backbone.Model();
    this.listenTo(this.errors, 'change', this.setValidationErrors.bind(this));

    this.listenTo(this.model, 'remove', function (model, collection) {
      if (collection == this.model.collection) {
        this.remove();
      }
    }.bind(this));

    _.each(['textarea', 'input'], function (tag) {
      this.$el.on('change', tag, function () {
        if (this.model.get('applied')) {
          this.$el.addClass('tainted-route');
        }
      }.bind(this));
    }, this);
  },
  toggleApplied: function () {
    this.model.set('applied', !this.model.get('applied'))
  },
  onInputChange: function () {
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
    this.$('.headers-error').text(this.errors.get('headers') || '');
  },
  clearValidationErrors: function () {
    this.$('.error').text('');
  },
  removeRoute: function () {
    this.model.collection.remove(this.model);
  },
  render: function () {
    this.$('.url').val(this.model.get('url'));
    this.$('.status').val(this.model.get('status'));
    this.$('.headers').val(JSON.stringify(this.model.get('headers'), null, '  '));
    this.$('.content').val(this.model.get('content'));
    this.$('.method').val(this.model.get('method'));

    if (this.model.get('applied')) {
      this.$el.addClass('applied-route');
      this.$('.applied').text('Stop');
    } else {
      this.$el.removeClass('applied-route');
      this.$('.applied').text('Start');
    }

    if (this.model.get('tainted'))
      this.$el.addClass('tainted-route');
    else
      this.$el.removeClass('tainted-route');

    this.$('.hit-count').text(this.model.get('hitCount'));

    return this;
  }
});
