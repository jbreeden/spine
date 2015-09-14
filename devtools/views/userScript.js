window.Spine = window.Spine || {};
Spine.UserScriptView = Backbone.View.extend({
  className: 'spine-user-script-view column align-stetch foreground',
  events: {
    'change': 'onChange',
    'click .delete': 'onDelete',
    'click .run': 'onRun'
  },
  initialize: function () {
    this.listenTo(this.model.collection, 'remove', function (model, collection) {
      if (model == this.model) this.remove();
    });

    this.listenTo(this.model.collection, 'view:filter', function (text) {
      if (!this._cssDisplay) this._cssDisplay = this.$el.css('display');

      var searchPattern = new RegExp(text, 'i');
      if (this.model.get('title').match(searchPattern)
          || this.model.get('text').match(searchPattern)) {
        this.$el.css('display', this._cssDisplay);
      } else {
        this.$el.css('display', 'none');
      }
    });
  },
  onChange: function () {
    this.model.set({
      title: this.$('.title').val(),
      text: this.$('.text').val()
    });
  },
  onDelete: function () {
    this.model.collection.remove(this.model);
  },
  onRun: function () {
    Backbone.trigger('userscript:eval', this.model.get('text'));
  },
  render: function () {
    if (!this.rendered) {
      this.$el.html(this.template);
      this.rendered = true;
    }

    this.$('.title').val(this.model.get('title'));
    this.$('.text').val(this.model.get('text'));
    return this;
  },
  template: '\
  <div class="row header">\
    <label>Name <input class="title"></input></label>\
    <div class="flex"></div>\
    <button class="run">Run</button>\
  </div>\
  <textarea class="text" spellcheck="false"></textarea>\
  <div class="footer row justify-end"><button class="delete">Delete</button></div>\
  '
});
