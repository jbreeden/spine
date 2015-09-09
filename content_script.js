var spineScript = document.createElement('script');
spineScript.setAttribute('src', chrome.extension.getURL('spine.js'));

var sinonScript = document.createElement('script');
sinonScript.setAttribute('src', chrome.extension.getURL('sinon.js'));

var scriptParent = (document.head||document.documentElement);
scriptParent.appendChild(sinonScript);
scriptParent.appendChild(spineScript);
