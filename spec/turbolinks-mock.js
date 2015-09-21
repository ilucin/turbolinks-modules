(function() {
  'use strict';

  var Events = {
    BEFORE_CHANGE: 'page:before-change',
    BEFORE_UNLOAD: 'page:before-unload',
    CHANGE: 'page:change',
    LOAD: 'page:load',
    PARTIAL_LOAD: 'page:partial-load',
    PAGE_RESTORE: 'page:restore',
    AFTER_REMOVE: 'page:after-remove'
  };

  function createNewBody(newBodyHtml) {
    var htmlNode = document.createElement('html');
    htmlNode.innerHTML = newBodyHtml;
    return htmlNode.querySelector('body');
  }

  function createNode(html) {
    var divNode = document.createElement('div');
    divNode.innerHTML = html;
    return divNode.children[0];
  }

  function triggerEvent(name, data) {
    var event;

    if (typeof Prototype !== 'undefined') {
      Event.fire(document, name, data, true);
    }

    event = document.createEvent('Events');

    if (data) {
      event.data = data;
    }

    event.initEvent(name, true, true);
    document.dispatchEvent(event);
  }

  function replaceBody(body, newBodyHtml) {
    var newBody = createNewBody(newBodyHtml);

    triggerEvent(Events.BEFORE_CHANGE);
    triggerEvent(Events.BEFORE_UNLOAD, [body]);
    triggerEvent(Events.CHANGE, [newBody]);
    triggerEvent(Events.LOAD, [newBody]);
    triggerEvent(Events.AFTER_REMOVE, body);

    return newBody;
  }

  function replaceNodes(replacements) {
    triggerEvent(Events.BEFORE_UNLOAD, replacements.map(function(replacement) {
      return replacement.node;
    }));

    replacements.forEach(function(replacement) {
      triggerEvent(Events.AFTER_REMOVE, replacement.node);
    });

    triggerEvent(Events.CHANGE, replacements.map(function(replacement) {
      replacement.newNode = createNode(replacement.html);
      return replacement.newNode;
    }));

    triggerEvent(Events.PARTIAL_LOAD, replacements.map(function(replacement) {
      return replacement.newNode;
    }));

    return replacements.map(function(replacement) {
      return replacement.newNode;
    });
  }

  window.Turbolinks = {
    EVENTS: Events,

    createNewBody: createNewBody,
    createNode: createNode,
    replaceBody: replaceBody,
    replaceNodes: replaceNodes
  };
})();
