var spineScript = document.createElement('script');
spineScript.setAttribute('src', chrome.extension.getURL('spine.js'));

var sinonScript = document.createElement('script');
sinonScript.setAttribute('src', 'https://cdnjs.cloudflare.com/ajax/libs/sinon.js/1.15.4/sinon.min.js');

var scriptParent = (document.head||document.documentElement);
scriptParent.appendChild(sinonScript);
scriptParent.appendChild(spineScript);
