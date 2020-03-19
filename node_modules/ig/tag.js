
/**
 * Module dependencies
 */

var core = require('./core')
  , Resource = core.Resource
  , onresp = core.onresp

/**
 * Expose `Tag`
 *
 * @api public
 * @param {Object} `opts`
 */

module.exports = Tag;
function Tag (opts) {
	if (!(this instanceof Tag)) return new Tag(opts);
	else if ('object' !== typeof opts) throw new TypeError("expecting `object`");
	else if (!opts.name) throw new Error("expecting `.name`");
	Resource.call(this, 'tags/'+ opts.name);
	this.name = opts.name;
}

// inherit from `Resource`
Tag.prototype.__proto__ = Resource.prototype;

/**
 * Search for a tag by name
 *
 * @api public
 * @param {Object} `data` - optional
 * @param {Function} `fn`
 */

Tag.search = function (data, fn) {
	fn = ('function' === typeof data)? data : fn;
	data = 'string' === typeof data? {q: data} : data;
	data = 'object' === typeof data? data: {};
	return (
    Resource('tags')
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

Tag.prototype.info = function (fn) {
	return this.get(onresp(fn));
};


/**
 * Get a list of recently tagged media.
 * Note that this media is ordered by when
 * the media was tagged with this tag,
 * rather than the order it was posted.
 * Use the max_tag_id and min_tag_id
 * parameters in the pagination response
 * to paginate through these objects.
 * Can return a mix of image and video types
 *
 * @api public
 * @param {Object} `data` - optional
 * @param {Function} `fn`
 */

Tag.prototype.recent = function (data, fn) {
	fn = ('function' === typeof data)? data : fn;
	data = ('object' === typeof data)? data : {};
	return this.path('media/recent').query(data || {}).get(onresp(fn));
};
