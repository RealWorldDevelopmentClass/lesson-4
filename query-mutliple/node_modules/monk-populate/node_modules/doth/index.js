'use strict';

var assert = require('assert');
var _ = require('lodash');

module.exports = Doth;

function Doth() {
  /**
   * Strict mode will throw when a value of "undefined" is found
   * @type {Boolean}
   */
  this.strict = true;
}

/**
 * Get value in object at given path
 * @param  {object} object     source object
 * @param  {path} dottedPath path using dot-notation
 * @return {var}            value at path or undefined
 * @throws {Error} if root, branch or leaf do not exists or have a value of "undefined" and Doth.strict === true
 */
Doth.prototype.get = function(object, dottedPath) {
  assert(typeof object === 'object', 'First parameter to Doth.get should be an object, not ' + typeof object);
  assert(typeof dottedPath === 'string', 'Second parameter to Doth.get should be a string, not ' + typeof dottedPath);
  
  dottedPath = dottedPath.split('.');
  assert(dottedPath.length > 0, 'Path should not be empty');
  
  var ret = _rGetHelper(object, dottedPath);
  
  if (ret === undefined && this.strict) {
    throw new Error('Path branch or leaf led to undefined (and strict is true).');
  } else {
    return ret;
  }
};


Doth.prototype.get = function(object, dottedPath) {
  return this.replace(object, dottedPath, undefined);
};


Doth.prototype.replace = function(object, dottedPath, replaceFn) {
  assert(typeof object === 'object', 'First parameter to Doth.get should be an object, not ' + typeof object);
  assert(typeof dottedPath === 'string', 'Second parameter to Doth.get should be a string, not ' + typeof dottedPath);
  
  dottedPath = dottedPath.split('.');
  assert(dottedPath.length > 0, 'Path should not be empty');
  
  var ret = _rGetHelper(object, dottedPath, replaceFn);
  
  if (ret === undefined && this.strict) {
    throw new Error('Path branch or leaf led to undefined (and strict is true).');
  } else {
    return ret;
  }
};


function _rGetHelper(object, pathArray, replaceFn) {
  
  if (pathArray.length === 1) {
    var leaf = pathArray.pop();
    
    if (typeof replaceFn === 'function') {
      object[leaf] = replaceFn(object[leaf]);
    }
    
    return object[leaf];
  }
  
  var pathToken = pathArray.shift();
  var branchIsArray = false;
  
  if (pathToken.indexOf('[]') !== -1) {
    branchIsArray = true;
    pathToken = pathToken.replace('[]', '');
  }
    
  if (object.hasOwnProperty(pathToken)) {
    
    if (branchIsArray) {
      assert(Array.isArray(object[pathToken]), 'Array expected in Doth.get while evaluating rest path ' + pathArray.join('.') + ', got ' + object[pathToken]);
      
      return object[pathToken].map(function _mapper(item) {
        return _rGetHelper(item, _.clone(pathArray), replaceFn);
      });
      
    } else {
      return _rGetHelper(object[pathToken], pathArray, replaceFn);
    }
  } else {
    return undefined;
  }
}
