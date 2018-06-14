/* istanbul ignore next */
describe('Ultron', function () {
  'use strict';

  var EventEmitter = require('eventemitter3')
    , assume = require('assume')
    , EE = require('events')
    , Ultron = require('./')
    , ultron
    , ee;

  beforeEach(function () {
    ee = new EventEmitter();
    ultron = new Ultron(ee);
  });

  afterEach(function () {
    ultron.destroy();
    ee.removeAllListeners();
  });

  it('is exposed as a function', function () {
    assume(Ultron).is.a('function');
  });

  it('can be initialized without the new keyword', function () {
    assume(Ultron(ee)).is.instanceOf(Ultron);
  });

  it('assigns a unique id to every instance', function () {
    for (var i = 0; i < 100; i++) {
      assume(ultron.id).does.not.equal((new Ultron()).id);
    }
  });

  it('allows removal through the event emitter', function () {
    function foo() {}
    function bar() {}

    ultron.on('foo', foo);
    ultron.once('foo', bar);

    assume(foo.__ultron).equals(ultron.id);
    assume(bar.__ultron).equals(ultron.id);
    assume(ee.listeners('foo').length).equals(2);

    ee.removeListener('foo', foo);
    assume(ee.listeners('foo').length).equals(1);

    ee.removeListener('foo', bar);
    assume(ee.listeners('foo').length).equals(0);
  });

  describe('#on', function () {
    it('assigns a listener', function () {
      assume(ee.listeners('foo').length).equals(0);

      function foo() {}

      ultron.on('foo', foo);
      assume(ee.listeners('foo').length).equals(1);
      assume(ee.listeners('foo')[0]).equals(foo);
    });

    it('tags the assigned function', function () {
      assume(ee.listeners('foo').length).equals(0);

      ultron.on('foo', function () {});
      assume(ee.listeners('foo')[0].__ultron).equals(ultron.id);
    });

    it('also passes in the context', function (next) {
      var context = 1313;

      ultron.on('foo', function (a, b, c) {
        assume(a).equals('a');
        assume(b).equals('b');
        assume(c).equals('c');

        assume(this).equals(context);

        next();
      }, context);

      ee.emit('foo', 'a', 'b', 'c');
    });

    it('works with regular eventemitters as well', function (next) {
      var ee = new EE()
        , ultron = new Ultron(ee);

      ultron.on('foo', function (a, b, c) {
        assume(a).equals('a');
        assume(b).equals('b');
        assume(c).equals('c');

        next();
      });

      ee.emit('foo', 'a', 'b', 'c');
    });
  });

  describe('#once', function () {
    it('assigns a listener', function () {
      assume(ee.listeners('foo').length).equals(0);

      function foo() {}
      ultron.once('foo', foo);
      assume(ee.listeners('foo').length).equals(1);
      assume(ee.listeners('foo')[0]).equals(foo);
    });

    it('tags the assigned function', function () {
      assume(ee.listeners('foo').length).equals(0);

      ultron.once('foo', function () {});
      assume(ee.listeners('foo')[0].__ultron).equals(ultron.id);
    });

    it('also passes in the context', function (next) {
      var context = 1313;

      ultron.once('foo', function (a, b, c) {
        assume(a).equals('a');
        assume(b).equals('b');
        assume(c).equals('c');

        assume(this).equals(context);

        next();
      }, context);

      ee.emit('foo', 'a', 'b', 'c');
      ee.emit('foo', 'a', 'b', 'c'); // Ensure that we don't double execute
    });

    it('works with regular eventemitters as well', function (next) {
      var ee = new EE()
        , ultron = new Ultron(ee);

      ultron.once('foo', function (a, b, c) {
        assume(a).equals('a');
        assume(b).equals('b');
        assume(c).equals('c');

        next();
      });

      ee.emit('foo', 'a', 'b', 'c');
      ee.emit('foo', 'a', 'b', 'c'); // Ensure that we don't double execute
    });
  });

  describe('#remove', function () {
    it('removes only our assigned `on` listeners', function () {
      function foo() {}
      function bar() {}

      ee.on('foo', foo);
      ultron.on('foo', bar);
      assume(ee.listeners('foo').length).equals(2);

      ultron.remove('foo');
      assume(ee.listeners('foo').length).equals(1);
      assume(ee.listeners('foo')[0]).equals(foo);
    });

    it('removes only our assigned `once` listeners', function () {
      function foo() {}
      function bar() {}

      ee.once('foo', foo);
      ultron.once('foo', bar);
      assume(ee.listeners('foo').length).equals(2);

      ultron.remove('foo');
      assume(ee.listeners('foo').length).equals(1);
      assume(ee.listeners('foo')[0]).equals(foo);

      ee.removeAllListeners();
      ultron.destroy();

      ee = new EE();
      ultron = new Ultron(ee);

      ee.once('foo', foo);
      ultron.once('foo', bar);
      assume(ee.listeners('foo').length).equals(2);

      ultron.remove('foo');
      assume(ee.listeners('foo').length).equals(1);
      var actual = ee.listeners('foo')[0];
      //
      // In Node.js 8+ `EventEmitter#listeners()` returns the original listener
      // also for once listeners.
      //
      assume(actual.listener || actual).equals(foo);
    });

    it('removes all assigned events if called without args', function () {
      function foo() {}
      function bar() {}

      assume(ultron.remove()).equals(ultron);

      ultron.on('foo', foo);
      ultron.on('bar', bar);
      ultron.on('baz', bar);

      assume(ee.listeners('foo').length).equals(1);
      assume(ee.listeners('bar').length).equals(1);
      assume(ee.listeners('baz').length).equals(1);

      ultron.remove();

      assume(ee.listeners('foo').length).equals(0);
      assume(ee.listeners('bar').length).equals(0);
      assume(ee.listeners('baz').length).equals(0);

      ee.removeAllListeners();
      ultron.destroy();

      ee = new EE();
      ultron = new Ultron(ee);

      assume(ultron.remove()).equals(ultron);

      ultron.on('foo', foo);
      ultron.on('bar', bar);
      ultron.on('baz', bar);

      assume(ee.listeners('foo').length).equals(1);
      assume(ee.listeners('bar').length).equals(1);
      assume(ee.listeners('baz').length).equals(1);

      ultron.remove();

      assume(ee.listeners('foo').length).equals(0);
      assume(ee.listeners('bar').length).equals(0);
      assume(ee.listeners('baz').length).equals(0);
    });

    it('removes multiple listeners based on args', function () {
      function foo() {}
      function bar() {}
      function baz() {}

      ultron.on('foo', foo);
      ultron.on('bar', bar);
      ultron.on('baz', baz);

      assume(ee.listeners('foo').length).equals(1);
      assume(ee.listeners('bar').length).equals(1);
      assume(ee.listeners('baz').length).equals(1);

      ultron.remove('foo', 'bar');

      assume(ee.listeners('foo').length).equals(0);
      assume(ee.listeners('bar').length).equals(0);
      assume(ee.listeners('baz').length).equals(1);
    });

    it('removes multiple listeners if first arg is separated string', function () {
      function foo() {}
      function bar() {}
      function baz() {}

      ultron.on('foo', foo);
      ultron.on('bar', bar);
      ultron.on('baz', baz);

      assume(ee.listeners('foo').length).equals(1);
      assume(ee.listeners('bar').length).equals(1);
      assume(ee.listeners('baz').length).equals(1);

      ultron.remove('foo, bar');

      assume(ee.listeners('foo').length).equals(0);
      assume(ee.listeners('bar').length).equals(0);
      assume(ee.listeners('baz').length).equals(1);
    });

    if ('undefined' !== typeof Symbol) it('works with ES6 symbols', function () {
      var s = Symbol('s');

      function foo() {}
      function bar() {}
      function baz() {}

      ee.on(s, foo);
      ultron.on(s, bar);
      assume(ee.listeners(s).length).equals(2);

      ultron.remove(s);
      assume(ee.listeners(s).length).equals(1);
      assume(ee.listeners(s)[0]).equals(foo);

      ultron.once(s, bar);
      assume(ee.listeners(s).length).equals(2);

      ultron.remove(s);
      assume(ee.listeners(s).length).equals(1);
      assume(ee.listeners(s)[0]).equals(foo);

      ultron.on(s, bar);
      ultron.on(s, baz);
      assume(ee.listeners(s).length).equals(3);

      ultron.remove();
      assume(ee.listeners(s).length).equals(1);
      assume(ee.listeners(s)[0]).equals(foo);

      ee.removeAllListeners();
      ultron.destroy();

      ee = new EE();
      ultron = new Ultron(ee);

      ee.on(s, foo);
      ultron.on(s, bar);
      assume(ee.listeners(s).length).equals(2);

      ultron.remove(s);
      assume(ee.listeners(s).length).equals(1);
      assume(ee.listeners(s)[0]).equals(foo);

      ultron.once(s, bar);
      assume(ee.listeners(s).length).equals(2);

      ultron.remove(s);
      assume(ee.listeners(s).length).equals(1);
      assume(ee.listeners(s)[0]).equals(foo);

      ultron.on(s, bar);
      ultron.on(s, baz);
      assume(ee.listeners(s).length).equals(3);

      ultron.remove();
      assume(ee.listeners(s).length).equals(1);
      assume(ee.listeners(s)[0]).equals(foo);
    });
  });

  describe('#destroy', function () {
    it('removes all listeners', function () {
      function foo() {}
      function bar() {}
      function baz() {}

      ultron.on('foo', foo);
      ultron.on('bar', bar);
      ultron.on('baz', baz);

      assume(ee.listeners('foo').length).equals(1);
      assume(ee.listeners('bar').length).equals(1);
      assume(ee.listeners('baz').length).equals(1);

      ultron.destroy();

      assume(ee.listeners('foo').length).equals(0);
      assume(ee.listeners('bar').length).equals(0);
      assume(ee.listeners('baz').length).equals(0);
    });

    it('removes the .ee reference', function () {
      assume(ultron.ee).equals(ee);
      ultron.destroy();
      assume(ultron.ee).equals(null);
    });

    it('returns booleans for state indication', function () {
      assume(ultron.destroy()).is.true();
      assume(ultron.destroy()).is.false();
      assume(ultron.destroy()).is.false();
      assume(ultron.destroy()).is.false();
    });
  });
});
