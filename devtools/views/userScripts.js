window.Spine = window.Spine || {};
Spine.UserScriptsView = Backbone.View.extend({
  className: 'spine-user-scripts-view',
  events: {
    'click .new': 'onNewScript',
    'keyup .search': 'onSearch'
  },
  initialize: function () {
    this.initializeDOM();
    this.model.each(this.insertUserScript, this);
    this.model.on('add', this.insertUserScript, this);
  },
  initializeDOM: function () {
    this.$el.html(this.template);
  },
  onNewScript: function () {
    this.model.add({
      title: 'New Script',
      text: ''
    });
  },
  onSearch: _.debounce(function () {
    this.model.trigger('view:filter', this.$('.search').val());
  }, 350),
  insertUserScript: function (model) {
    this.$el.append(
      (new Spine.UserScriptView({model: model})).render().$el
    );
  },
  render: function () {
    return this;
  },
  template: '\
    <div class="toolbar">\
      <h1>User Scripts</h1>\
      <div class="explanation">\
        Save your favorite JavaScript snippets here. Click "run" to evaluate them on the current page.\
      </div>\
      <div class="row">\
        <button class="new">New Script</button>\
        <div class="flex"></div>\
        <div>Search <input class="search" type="text" spellcheck="false"></input></div>\
      </div>\
    </div>\
  '
});
