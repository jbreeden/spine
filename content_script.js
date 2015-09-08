var script = document.createElement('script');
script.setAttribute('src', chrome.extension.getURL('spine.js'));
var scriptParent = (document.head||document.documentElement);
scriptParent.appendChild(script);
