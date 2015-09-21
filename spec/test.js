/* global describe beforeEach it fit expect spyOn Turbolinks */
describe('Turbolinks modules', function() {
  'use strict';

  var createNode = Turbolinks.createNode;
  var createBody = Turbolinks.createNewBody;

  var turbolinksModules = window.turbolinksModules;
  var initialBodyNode;

  function createModule(target) {
    var moduleDef = {
      onBeforeUnload: function() {},
      onChange: function() {},
      onLoad: function() {},
      onPartialLoad: function() {},
      onAfterRemove: function() {},
      onOpen: function() {}
    };

    spyOn(moduleDef, 'onBeforeUnload');
    spyOn(moduleDef, 'onChange');
    spyOn(moduleDef, 'onLoad');
    spyOn(moduleDef, 'onPartialLoad');
    spyOn(moduleDef, 'onAfterRemove');
    spyOn(moduleDef, 'onOpen');

    for (var k in target) {
      if (target.hasOwnProperty(k)) {
        moduleDef[k] = target[k];
      }
    }

    return moduleDef;
  }

  beforeEach(function() {
    initialBodyNode = createBody('<body></body>');
    turbolinksModules.reset();
  });

  it('should exist in global scope with public API to setup modules', function() {
    expect(turbolinksModules).not.toBe(undefined);
    expect(turbolinksModules.add).not.toBe(undefined);
    expect(turbolinksModules.remove).not.toBe(undefined);
  });

  it('shouldn\'t allow setup of invalid contextual module', function() {
    expect(function() {
      turbolinksModules.add({});
    }).toThrowError(Error);
  });

  it('should allow setup of contextual module with id, tagName, selector or attribute property', function() {
    expect(function() {
      turbolinksModules.add({
        id: 'test'
      });
    }).not.toThrowError(Error);
    expect(function() {
      turbolinksModules.add({
        tagName: 'test'
      });
    }).not.toThrowError(Error);
    expect(function() {
      turbolinksModules.add({
        selector: 'test'
      });
    }).not.toThrowError(Error);
    expect(function() {
      turbolinksModules.add({
        attribute: 'test'
      });
    }).not.toThrowError(Error);
  });

  describe('with id based module', function() {
    var idModule, newBody;

    beforeEach(function() {
      idModule = createModule({
        id: 'test'
      });

      turbolinksModules.add(idModule);
    });

    it('should run load lifecycle methods when new body matches the ID', function() {
      newBody = Turbolinks.replaceBody(initialBodyNode, '<body id="test"></body>');
      expect(idModule.onChange).toHaveBeenCalledWith(newBody);
      expect(idModule.onLoad).toHaveBeenCalledWith(newBody);
      expect(idModule.onOpen).toHaveBeenCalledWith(newBody);
    });

    it('shouldn\'t run if the new body ID doesn\'t match', function() {
      newBody = Turbolinks.replaceBody(initialBodyNode, '<body id="something"></body>');
      expect(idModule.onLoad).not.toHaveBeenCalled();
      expect(idModule.onOpen).not.toHaveBeenCalled();
      expect(idModule.onChange).not.toHaveBeenCalled();
    });

    it('should run unloading methods when the body that matches the ID is replaced', function() {
      newBody = Turbolinks.replaceBody(initialBodyNode, '<body id="test"></body>');
      Turbolinks.replaceBody(newBody, '<body id="test2"></body>');
      expect(idModule.onBeforeUnload).toHaveBeenCalledWith(newBody);
      expect(idModule.onAfterRemove).toHaveBeenCalledWith(newBody);
    });

    it('should run partial lifecycle methods on partial replacemenents when node matches the ID', function() {
      var oldNodes = [createNode('<li></li>'), createNode('<div id="test"></div>')];

      var newNodes = Turbolinks.replaceNodes([{
        node: oldNodes[0],
        html: '<li id="test"></li>'
      }, {
        node: oldNodes[1],
        html: '<div></div>'
      }]);

      expect(newNodes[0].id).toBe('test');
      expect(idModule.onBeforeUnload).toHaveBeenCalledWith(oldNodes[1]);
      expect(idModule.onAfterRemove).toHaveBeenCalledWith(oldNodes[1]);
      expect(idModule.onPartialLoad).toHaveBeenCalledWith(newNodes[0]);
      expect(idModule.onOpen).toHaveBeenCalledWith(newNodes[0]);
      expect(idModule.onLoad).not.toHaveBeenCalled();
    });
  });

  describe('with tagName based module', function() {
    var tagNameModule;

    beforeEach(function() {
      tagNameModule = createModule({
        tagName: 'div'
      });

      turbolinksModules.add(tagNameModule);
    });

    it('shouldn\'t call onLoad and onBeforeUnload method when "body" changes', function() {
      Turbolinks.replaceBody(initialBodyNode, '<body></body>');
      expect(tagNameModule.onLoad).not.toHaveBeenCalled();
      expect(tagNameModule.onOpen).not.toHaveBeenCalled();
      expect(tagNameModule.onBeforeUnload).not.toHaveBeenCalled();
    });

    it('should call onPartialLoad and onBeforeUnload method when any "div" changes', function() {
      var oldNodes = [createNode('<li></li>'), createNode('<div id="test"></div>')];

      var newNodes = Turbolinks.replaceNodes([{
        node: oldNodes[0],
        html: '<div id="test"></div>'
      }, {
        node: oldNodes[1],
        html: '<li></li>'
      }]);

      expect(tagNameModule.onPartialLoad).toHaveBeenCalledWith(newNodes[0]);
      expect(tagNameModule.onBeforeUnload).toHaveBeenCalledWith(oldNodes[1]);
      expect(tagNameModule.onAfterRemove).toHaveBeenCalledWith(oldNodes[1]);
    });
  });

  describe('with attribute based module', function() {
    var attributeModule;

    beforeEach(function() {
      attributeModule = createModule({
        attribute: ['data-page', 'test']
      });

      turbolinksModules.add(attributeModule);
    });

    it('should run for [data-page="test"] nodes', function() {
      var newBody = Turbolinks.replaceBody(initialBodyNode, '<body data-page="test"></body>');
      expect(attributeModule.onLoad).toHaveBeenCalledWith(newBody);
      expect(attributeModule.onOpen).toHaveBeenCalledWith(newBody);
      expect(attributeModule.onBeforeUnload).not.toHaveBeenCalled();
    });

    it('shouldn\'t run for non [data-page="test"] nodes', function() {
      Turbolinks.replaceBody(initialBodyNode, '<body data-page="test2"></body>');
      expect(attributeModule.onLoad).not.toHaveBeenCalledWith();
      expect(attributeModule.onOpen).not.toHaveBeenCalledWith();
      expect(attributeModule.onBeforeUnload).not.toHaveBeenCalled();
    });

    it('should call onPartialLoad and onBeforeUnload method when any node with [data-page="test"] changes', function() {
      var oldNodes = [createNode('<li></li>'), createNode('<div data-page="test"></div>')];

      var newNodes = Turbolinks.replaceNodes([{
        node: oldNodes[0],
        html: '<div data-page="test"></div>'
      }, {
        node: oldNodes[1],
        html: '<li></li>'
      }]);

      expect(attributeModule.onPartialLoad).toHaveBeenCalledWith(newNodes[0]);
      expect(attributeModule.onOpen).toHaveBeenCalledWith(newNodes[0]);
      expect(attributeModule.onBeforeUnload).toHaveBeenCalledWith(oldNodes[1]);
      expect(attributeModule.onAfterRemove).toHaveBeenCalledWith(oldNodes[1]);
    });
  });

  describe('with "attribute with multiple values" based module', function() {
    var attributeModule;

    beforeEach(function() {
      initialBodyNode = createBody('<body data-page="test"></body>');
      attributeModule = createModule({
        attribute: ['data-page', ['test', 'test2']]
      });

      turbolinksModules.add(attributeModule);
    });

    it('should run for all body nodes matching attribute values', function() {
      var newBody = Turbolinks.replaceBody(initialBodyNode, '<body data-page="test2"></body>');
      expect(attributeModule.onLoad).toHaveBeenCalledWith(newBody);
      expect(attributeModule.onOpen).toHaveBeenCalledWith(newBody);
      expect(attributeModule.onBeforeUnload).toHaveBeenCalledWith(initialBodyNode);
    });

    it('shouldn\'t run for nodes with non matching attribute values', function() {
      Turbolinks.replaceBody(initialBodyNode, '<body data-page="test3"></body>');
      expect(attributeModule.onLoad).not.toHaveBeenCalled();
      expect(attributeModule.onOpen).not.toHaveBeenCalled();
      expect(attributeModule.onBeforeUnload).toHaveBeenCalledWith(initialBodyNode);
    });

    it('should run for any partial replacement node with matching attributes', function() {
      var oldNodes = [createNode('<div></div>'), createNode('<div data-page="test"></div>'), createNode('<div data-page="test2"></div>')];

      var newNodes = Turbolinks.replaceNodes([{
        node: oldNodes[0],
        html: '<div data-page="test2"></div>'
      }, {
        node: oldNodes[1],
        html: '<div data-page="test3"></div>'
      }, {
        node: oldNodes[2],
        html: '<div data-page="test"></div>'
      }]);

      expect(attributeModule.onPartialLoad).toHaveBeenCalledWith(newNodes[0]);
      expect(attributeModule.onPartialLoad).toHaveBeenCalledWith(newNodes[2]);
      expect(attributeModule.onOpen).toHaveBeenCalledWith(newNodes[2]);
      expect(attributeModule.onOpen).toHaveBeenCalledWith(newNodes[2]);
      expect(attributeModule.onBeforeUnload).toHaveBeenCalledWith(oldNodes[1]);
      expect(attributeModule.onBeforeUnload).toHaveBeenCalledWith(oldNodes[2]);
      expect(attributeModule.onAfterRemove).toHaveBeenCalledWith(oldNodes[1]);
      expect(attributeModule.onAfterRemove).toHaveBeenCalledWith(oldNodes[2]);
    });
  });
});
