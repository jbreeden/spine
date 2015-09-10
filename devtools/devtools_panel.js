chrome.storage.local.get(function (storage) {
  var spine = new Spine(storage);
  spine.view = new Spine.View({model: spine});
  var content = document.getElementById('content');
  content.appendChild(spine.view.render());

  spine.on('change', function () {
    chrome.storage.local.set(spine.attributes);
  });
});
