
/**
 * Module dependencies
 */

var core = require('./core')
  , Resource = core.Resource
  , onresp = core.onresp

/**
 * Expose `Location`
 *
 * @api public
 * @param {Object} `opts`
 */

module.exports = Location;
function Location (opts) {
	if (!(this instanceof Location)) return new Location(opts);
	else if ('object' !== typeof opts) throw new TypeError("expecting `object`");
	else if (!opts.id) throw new Error("expecting `.id`");
	Resource.call(this, 'locations/'+ opts.id);
	this.id = opts.id;
}

// inherit from `Resource`
Location.prototype.__proto__ = Resource.prototype;

/**
 * Search for a tag by name
 *
 * @api public
 * @param {Object} `data` - optional
 * @param {Function} `fn`
 */

Location.search = function (data, fn) {
	fn = ('function' === typeof data)? data : fn;
	data = 'string' === typeof data? {q: data} : data;
	data = 'object' === typeof data? data: {};
	return (
    Resource('locations')
		.path('search')
		.query(data || {})
		.get(onresp(fn))
  );
};

/**
 * Get basic information about a tag
 *
 * @api public
 * @param {Function} `fn`
 */

Location.prototype.info = function (fn) {
	return this.get(onresp(fn));
};

/**
 * Get a list of recent media objects from a given location.
 * May return a mix of both image and video types
 *
 * @api public
 * @param {Object} `data` - optional
 * @param {Function} `fn`
 */

Location.prototype.recent = function (data, fn) {
	fn = ('function' === typeof data)? data : fn;
	data = ('object' === typeof data)? data : {};
	return this.path('media/recent').query(data || {}).get(onresp(fn));
};
