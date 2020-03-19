
/**
 * Module dependencies
 */

var core = require('./core')
  , Resource = core.Resource
  , onresp = core.onresp

/**
 * Expose `Media`
 *
 * @api public
 * @param {Object} `opts`
 */

module.exports = Media;
function Media (opts) {
	if (!(this instanceof Media)) return new Media(opts);
	else if ('object' !== typeof opts) throw new TypeError("expecting `object`");
	else if (!opts.id) throw new Error("expecting `.id`");
	Resource.call(this, 'media/'+ opts.id);
	this.id = opts.id;
}

// inherit from `Resource`
Media.prototype.__proto__ = Resource.prototype;

/**
 *
 * @api public
 * @param {Object} `data`
 * @param {Function} `fn`
 */

Media.search = function (data, fn) {
	fn = ('function' === typeof data)? data : fn;
	data = 'string' === typeof data? {q: data} : data;
	data = 'object' === typeof data? data: {};
	return (
    Resource('media')
    .path('search')
		.query(data || {})
		.get(onresp(fn))
  );
};

/**
 *
 * @api public
 * @param {Function} `fn`
 */

Media.popular = function (fn) {
	return (
    Resource('media')
    .path('popular')
    .get(onresp(fn))
  );
};

/**
 * Get basic information about some media
 *
 * @api public
 * @param {Function} `fn`
 */

Media.prototype.info = function (fn) {
	return this.get(onresp(fn));
};

/**
 * Get a full list of comments on a media.
 *
 * @api public
 * @param {Function} `fn`
 */

Media.prototype.comments = function (fn) {
	return this.path('comments').get(onresp(fn));
};

/**
 * Creates a comment on a media
 *
 * @api public
 * @param {Object} `data`
 * @param {Function} `fn`
 */

Media.prototype.comment = function (opts, fn) {
	if ('object' !== typeof opts) throw new TypeError("expecting `object`");
	else if (!opts.id) throw new Error("missing `.id` in `opts` object");
	return this.path('comments/'+ opts.id).post(onresp(fn));
};

/**
 * Remove a comment either on the authenticated user's media or authored by the authenticated user.
 *
 * @api public
 * @param {Object} `data`
 * @param {Function} `fn`
 */

Media.prototype.deleteComment =
Media.prototype.removeComment = function (opts, fn) {
	if ('object' !== typeof opts) throw new TypeError("expecting `object`");
	else if (!opts.comment) throw new Error("missing `.comment` in `opts` object");
	return this.path('comments').del(opts, onresp(fn));
};

/**
 * Get a full list of likes on a media.
 *
 * @api public
 * @param {Function} `fn`
 */

Media.prototype.likes = function (fn) {
	return this.path('likes').get(onresp(fn));
};

/**
 * Creates a comment on a media
 *
 * @api public
 * @param {Function} `fn`
 */

Media.prototype.like = function (fn) {
	if ('object' !== typeof opts) throw new TypeError("expecting `object`");
	else if (!opts.id) throw new Error("missing `.id` in `opts` object");
	return this.path('comments/'+ opts.id).del(onresp(fn));
};

/**
 * Remove a comment either on the authenticated user's media or authored by the authenticated user.
 *
 * @api public
 * @param {Object} `data`
 * @param {Function} `fn`
 */

Media.prototype.unlike = function (fn) {
	if ('object' !== typeof opts) throw new TypeError("expecting `object`");
	else if (!opts.comment) throw new Error("missing `.comment` in `opts` object");
	return this.path('comments').post(opts, onresp(fn));
};
