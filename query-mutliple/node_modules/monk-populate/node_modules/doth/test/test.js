'use strict';

var test = require('tape');
var _ = require('lodash');
var Doth = require('../');

var fixtures = {
  
  testShallow: {
    a: 'foo',
    b: [1, 2, 3]
  },
  
  testDeep: {
    a: {
      AA: 'foo'
    },
    b: {
      BB: {
        B: 'bar'
      },
      CC: 'baz'
    }
  },
  
  testDeepArray: {
    a: {
      AAs: [
        { foo: 'bar' },
        { foo: 'bar1' },
        { foo: 'bar2' }
      ],
      BB: { baz: 'bar' }
    }
  },
  
  testDeepMultipleArray: {
    a: {
      AAs: [
        { inner: [{ foo: 'bar', oof: 'bar1' }, { foo: 'bar', oof: 'bar7' }] },
        { inner: [{ foo: 'bar2', oof: 'bar3' }] },
        { inner: [{ foo: 'bar4', oof: 'bar5' }] }
      ]
    }
  }
};


test('simple path', function (t) {
  var doth = new Doth();
  doth.strict = false;
  t.equal(doth.get(fixtures.testShallow, 'a'), 'foo');
  t.equal(doth.get(fixtures.testShallow, 'b'), fixtures.testShallow.b);
  t.equal(doth.get(fixtures.testDeep, 'a'), fixtures.testDeep.a);
  t.equal(doth.get(fixtures.testDeep, 'b'), fixtures.testDeep.b);
  t.end();
});


test('deep path', function (t) {
  var doth = new Doth();
  doth.strict = false;
  t.equal(doth.get(fixtures.testDeep, 'a.AA'), fixtures.testDeep.a.AA);
  t.equal(doth.get(fixtures.testDeep, 'b.BB'), fixtures.testDeep.b.BB);
  t.equal(doth.get(fixtures.testDeep, 'b.CC'), fixtures.testDeep.b.CC);
  t.equal(doth.get(fixtures.testDeep, 'b.BB.B'), fixtures.testDeep.b.BB.B);
  t.end();
});


test('deep with array', function (t) {
  var doth = new Doth();
  doth.strict = false;
  t.equal(doth.get(fixtures.testDeepArray, 'a.AAs'), fixtures.testDeepArray.a.AAs);
  t.deepEqual(doth.get(fixtures.testDeepArray, 'a.AAs[].foo'), ['bar', 'bar1', 'bar2']);
  t.throws(function () { doth.get(fixtures.testDeepArray, 'a.BB[].baz'); }, 'throws if using [] but branch is not an array');
  t.end();
});


test('replace', function (t) {
  var doth = new Doth();
  doth.strict = false;
  
  var _testArray1 = _.clone(fixtures.testDeepArray);
  doth.replace(_testArray1, 'a.AAs[].foo', function _replacer(item) {
    return 'rrr' + item;
  });
  t.deepEqual(_testArray1, {
    a: {
      AAs: [
        { foo: 'rrrbar' },
        { foo: 'rrrbar1' },
        { foo: 'rrrbar2' }
      ],
      BB: { baz: 'bar' }
    }
  }, 'in array');
  
  var _testArray2 = _.clone(fixtures.testDeep);
  doth.replace(_testArray2, 'b.BB.B', function _replacer(item) {
    return 'rrr' + item;
  });
  t.deepEqual(_testArray2,  { a: { AA: 'foo' }, b: { BB: { B: 'rrrbar' }, CC: 'baz' } }, 'in array');
  
  t.end();
});


test('deep with multiple nested arrays', function (t) {
  var doth = new Doth();
  doth.strict = false;
  t.equal(doth.get(fixtures.testDeepMultipleArray, 'a.AAs'), fixtures.testDeepMultipleArray.a.AAs);
  t.deepEqual(doth.get(fixtures.testDeepMultipleArray, 'a.AAs[].inner[].oof'), [ [ 'bar1', 'bar7' ], [ 'bar3' ], [ 'bar5' ]]);
  t.end();
});


test('nonexistant', function (t) {
  var doth = new Doth();
  doth.strict = false;
  t.doesNotThrow(function () { doth.get(fixtures.testDeep, 'a.ZZ'); }, 'does not throw if leaf does not exist');
  t.equal(doth.get(fixtures.testDeep, 'a.ZZ'), undefined, 'and returns undefined');
  t.doesNotThrow(function () { doth.get(fixtures.testDeep, 'z.YY'); }, 'does not throw if root or branch does not exist');
  t.equal(doth.get(fixtures.testDeep, 'z.YY'), undefined, 'and returns undefined');
  t.end();
});


test('nonexistant in default strict mode', function (t) {
  var doth = new Doth();
  t.throws(function () { doth.get(fixtures.testDeep, 'a.ZZ'); }, 'throws if leaf does not exist');
  t.throws(function () { doth.get(fixtures.testDeep, 'z.YY'); }, 'throws if root or branch does not exist');
  t.end();
});
