/* global Turbolinks define */
(function() {
  'use strict';

  var isArray = Array.isArray;
  var Events = Turbolinks.EVENTS;
  var ElProto = Element.prototype;
  var matches = ElProto.matches || ElProto.matchesSelector || ElProto.webkitMatchesSelector || ElProto.oMatchesSelector || ElProto.msMatchesSelector || ElProto.mozMatchesSelector;

  var modules = [];
  var turbolinksModules, oldTurbolinksModules;

  function matchesSelector(m, node) {
    return matches.call(node, m.selector);
  }

  function matchesAttribute(m, node) {
    var nodeAttrVal = node.getAttribute(m.attribute[0]);
    var moduleAttrVal = m.attribute[1];
    return nodeAttrVal === moduleAttrVal || (Array.isArray(moduleAttrVal) && moduleAttrVal.indexOf(nodeAttrVal) >= 0);
  }

  function shouldModuleApplyToNode(m, node, nodeId, nodeTagName) {
    return (m.id && nodeId === m.id) ||
      (m.tagName && nodeTagName === m.tagName) ||
      (m.attribute && matchesAttribute(m, node)) ||
      (m.selector && matchesSelector(m, node));
  }

  function hasMethod(m, method) {
    return !!m[method] || isArray(method);
  }

  function runMethod(m, method, node) {
    if (typeof m[method] === 'function') {
      m[method](node);
    } else if (isArray(method)) {
      for (var i = 0; i < method.length; i++) {
        if (typeof m[method[i]] === 'function') {
          m[method[i]](node);
        }
      }
    }
  }

  function callOnNode(node, method) {
    var i, l, m;
    var nodeId = node.id;
    var nodeTagName = node.tagName.toLowerCase();

    for (i = 0, l = modules.length; i < l; i++) {
      m = modules[i];

      if (hasMethod(m, method) && shouldModuleApplyToNode(m, node, nodeId, nodeTagName)) {
        runMethod(m, method, node);
      }
    }
  }

  function callOnNodes(nodes, method, eventName) {
    for (var i = 0; i < nodes.length; i++) {
      callOnNode(nodes[i], method, eventName);
    }
  }

  document.addEventListener(Events.BEFORE_CHANGE, function() {
    callOnNode(document.body, 'onBeforeChange');
  });

  document.addEventListener(Events.BEFORE_UNLOAD, function(ev) {
    callOnNodes(ev.data, 'onBeforeUnload');
  });

  document.addEventListener(Events.CHANGE, function(ev) {
    callOnNodes(ev.data, 'onChange');
  });

  document.addEventListener(Events.LOAD, function(ev) {
    callOnNodes(ev.data, ['onLoad', 'onOpen']);
  });

  document.addEventListener(Events.PARTIAL_LOAD, function(ev) {
    callOnNodes(ev.data, ['onPartialLoad', 'onOpen']);
  });

  document.addEventListener(Events.RESTORE, function() {
    callOnNode(document.body, ['onRestore', 'onOpen']);
  });

  document.addEventListener(Events.AFTER_REMOVE, function(ev) {
    callOnNode(ev.data, 'onAfterRemove');
  });

  document.addEventListener('DOMContentLoaded', function() {
    callOnNode(document.body, ['onChange', 'onLoad', 'onOpen']);
  });

  oldTurbolinksModules = window.turbolinksModules;
  turbolinksModules = {
    add: function(m) {
      if (!m.id && !m.attribute && !m.tagName && !m.selector) {
        throw new Error('Contextual module has to have either id, tagName, attribute or selector defined!');
      }
      modules.push(m);
    },

    remove: function(m) {
      var idx = modules.indexOf(m);
      if (idx >= 0) {
        modules.splice(idx, 1);
      }
    },

    reset: function() {
      modules.length = 0;
    },

    noConflict: function() {
      window.turbolinksModules = oldTurbolinksModules;
      return turbolinksModules;
    }
  };

  if (typeof define !== 'undefined' && define.amd) {
    // AMD. Register as an anonymous module.
    define(function() {
      'use strict';
      return turbolinksModules;
    });
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = turbolinksModules;
  } else {
    window.turbolinksModules = turbolinksModules;
  }
})();
