
/**
 * Module dependencies
 */

var define = Object.defineProperty
  , isArray = Array.isArray
  , through = require('through')
  , request = require('request')
  , qs = require('querystring')
  , EventEmitter = require('events').EventEmitter

/**
 * Expose `core`
 */

var core = exports;

/**
 * Instagram API version
 */

var VERSION = 1;

/**
 * Global user access token
 */

var ACCESS_TOKEN;

/**
 * Global client ID
 */

var CLIENT_ID;

/**
 * Global client secret
 */

var CLIENT_SECRET;

/**
 * Instagram end point
 */

var END_POINT = 'https://api.instagram.com';

/**
 * Global options object
 */

var OPTS = {};

/**
 * Sets a config parameter
 *
 * @api public
 * @paam {String|Number} `key`
 * @paam {Mixed} `value`
 */

core.set = function (key, value) {
  if ('string' === typeof key || 'number' === typeof key && undefined !== value) {
    switch (key) {
      case 'access token':
        case 'accesstoken':
        case 'token':
        ACCESS_TOKEN = value;
      break;

      case 'end point':
        case 'endpoint':
        END_POINT = value;
      break;

      case 'client id':
        case 'clientid':
        CLIENT_ID = value;
      break;

      case 'client secret':
        case 'clientsecret':
        CLIENT_SECRET = value;
      break;

      default:
        OPTS[key] = value;
    }
  }

  return this;
};

/**
 * Gets a config parameter
 *
 * @api public
 * @paam {String|Number} `key`
 * @paam {Mixed} `value`
 */

core.get = function (key) {
  if ('string' === typeof key || 'number' === typeof key) {
    switch (key) {
      case 'access token':
      case 'accesstoken':
      case 'token':
        return ACCESS_TOKEN;

      case 'end point':
      case 'endpoint':
        return END_POINT;

      case 'client id':
      case 'clientid':
        return CLIENT_ID;

      case 'client secret':
      case 'clientsecret':
        return CLIENT_SECRET;

      default: return OPTS[key];
    }
  }
};

/**
 * Sets the API version
 *
 * @api public
 * @param {Number} `v`
 */

core.version = function (v) {
  if (v && 'number' !== typeof v) {
    throw new TypeError("`.version(v)` expects a number as an argument");
  } else if (v && v !== v) {
    throw new TypeError("`.version(v) cannot accept `NaN`");
  } else if (undefined === v) {
    return VERSION;
  }
  VERSION = v;
  return this;
};

/**
 * Builds the API URL with an optional
 * provided path
 *
 * @api public
 * @param {String} `path` - optional
 * @param {Boolean} `omitVersion` - optional (default: `true`)
 */

core.url = function (path, omitVersion) {
  if (path && 'string' !== typeof path) {
    throw new TypeError("`.url(path)` expects a string or undefined");
  } else {
    return [
      END_POINT,
      (false === omitVersion ? '' : 'v'+ VERSION), (path || '')
    ].join('/').trim().replace('\n', '');
  }
};

/**
 * `Resource` constructor - generic Resource
 *
 * @api public
 */

core.Resource = Resource;
function Resource (base) {
  if (!(this instanceof Resource)) { return new Resource(base); }
  EventEmitter.call(this);

  this.stream = through(write, end);
  this._path = core.url();
  this.base = base || '';
  this._query = '';
  this._scope = [];
  this._accessToken = core.get('token');
  this.path('');

  function write (data) { }
  function end () { }
}

// inherit from `EventEmitter`
Resource.prototype.__proto__ = EventEmitter.prototype;

/**
 * Sets/gets the resource path
 *
 * @api public
 * @param {String} path - optional
 */

Resource.prototype.path = function (path, omitVersion) {
  if (undefined === path) { return this._path; }
  else { this._path = core.url(this.base +'/'+ path, omitVersion); }
  return this;
};

/**
 * Generates the request url for the resource
 *
 * @api public
 */

Resource.prototype.url = function () {
  var url = (
    this.path()+'?'+
    'access_token='+ this.token() +
    '&client_id='+ core.get('client id') +'&'+
    this.query(true) +'&'+
    this.scope(true)
  );
  return url;
};

/**
 * Sets/gets the query string to be
 * appended to the request url
 *
 * @api pulic
 * @param {String|Object} `query`
 */

Resource.prototype.query = function (query) {
  if ('string' === typeof query) {
    this._query += query;
    return this;
  } else if ('object' === typeof query) {
    this._query += qs.stringify(query);
    return this;
  } else if (undefined === query) {
    return qs.parse(this._query);
  } else if (true === query) {
    return qs.unescape(this._query);
  } else {
    return this;
  }
};

/**
 * Sets/gets scope
 *
 * @api public
 * @param {String|Array} `scope` - optional
 */

Resource.prototype.scope = function (scope) {
  if (undefined === scope) {
    return this._scope.length? this._scope : '';
  } else if ('string' === typeof scope) {
    this._scope.push(scope);
  } else if (isArray(scope)) {
    this._scope = this._scope.concat(scope);
  } else if (true === scope) {
    return 'scope='+ this._scope.join('+');
  }

  return this;
};

/**
 * Sets/gets the access token for this
 * resource
 *
 * @api public
 * @param {String} `token`
 */

Resource.prototype.token = function (token) {
  if (token && 'string' !== typeof token) {
    throw new TypeError("expecting string or undefined");
  } else if (undefined === token) {
    return this._accessToken;
  } else {
    _accessToken = token;
  }
  return this;
};

/**
 * Makes a request to the resource
 *
 * @api public
 * @param {String} `method`
 * @param {Function} `fn`
 */

Resource.prototype.request = function (method, data, fn) {
  var self = this
    , req = null
    , url = this.url()
    , stream = through()

  fn = ('function' === typeof data)? data : fn;
  data = ('object' === typeof data)? data : {};
  fn = ('function' === typeof fn)? fn : function () {};

  request(url, {method: method.toUpperCase(), form: data || {}}, function (err, res) {
    if (err) {
      return fn(err), stream.emit('error', err);
    } else if (!res.body) {
      fn(null);
      stream.emit('end');
    }

    try {
      var body = JSON.parse(res.body);
      var data = body.data || null;
      fn(null, res, data);
      stream.emit('end', data);
    } catch (e) {
      fn(e, res, null);
      stream.emit('error', e);
    }
  });

  return stream;
};

/**
 * Makes a `GET` request to the resource
 *
 * @api public
 * @param {Function} `fn`
 */

Resource.prototype.get = function (fn) {
  return this.request('GET', fn);
};

/**
 * Makes a `POST` request to the resource
 *
 * @api public
 * @param {Object} `data`
 * @param {Function} `fn`
 */

Resource.prototype.post = function (data, fn) {
  return this.request('POST', data, fn);
};

/**
 * Makes a `DELETE` request to the resource
 *
 * @api public
 * @param {Object} `data`
 * @param {Function} `fn`
 */

Resource.prototype.delete =
Resource.prototype.del = function (data, fn) {
  return this.request('DELETE', data, fn);
};


/**
 * Makes a `PUT` request to the resource
 *
 * @api public
 * @param {Object} `data`
 * @param {Function} `fn`
 */

Resource.prototype.put = function (data, fn) {
  return this.request('PUT', data, fn);
};


/**
 * Handle all responses
 *
 * @api private
 * @param {Function} fn
 */

exports.onresp = onresp;
function onresp (fn) {
  return function (err, res, data) {
    fn(err, data);
  };
}

