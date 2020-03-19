
/**
 * Module dependencies
 */

var core = require('./core')
  , Resource = core.Resource
  , onresp = core.onresp

/**
 * Expose `User'
 *
 * @api public
 * @param {Object} `opts'
 */

module.exports = User;
function User (opts) {
  if (!(this instanceof User)) { return new User(opts); }
  else if ('object' !== typeof opts) {
    throw new TypeError("expecting `object`");
  } else if (!opts.id) {
    throw new Error("expecting `.id`");
  }

  Resource.call(this, 'users/'+ opts.id);

  this.id = opts.id;
  this.media = UserMedia(opts);
}

// inherit from `Resource'
User.prototype.__proto__ = Resource.prototype;

/**
 * Retrieve information from the authenticated users feed
 *
 * @api public
 * @param {Object} `data' - optional
 * @param {Function} `fn'
 */

User.feed = function (data, fn) {
  fn = ('function' === typeof data) ? data : fn;
  data = ('object' === typeof data) ? data : {};
  return (
    Resource('users')
    .path('self/feed')
    .query(data || {})
    .get(onresp(fn))
  );
};

/**
 * Retrieve information from the authenticated users liked media
 *
 * @api public
 * @param {Object} `data' - optional
 * @param {Function} `fn'
 */

User.likedMedia = function (data, fn) {
  fn = ('function' === typeof data) ? data : fn;
  data = ('object' === typeof data) ? data : {};
  return (
    Resource('users')
    .path('self/media/liked')
    .query(data || {})
    .get(onresp(fn))
  );
};

/**
 * Search for a user by name
 *
 * @api public
 * @param {Object} `data' - optional
 * @param {Function} `fn'
 */

User.search = function (data, fn) {
  fn = ('function' === typeof data)? data : fn;
  data = 'string' === typeof data? {user: data} : data;
  data = 'object' === typeof data? data: {};
  data.q = data.q || data.user;
  return (
    Resource('users')
    .path('search')
    .query(data || {})
    .get(onresp(fn))
  );
};

/**
 * Get the users who have requested this user's permission to follow
 *
 * @api public
 * @param {Function} `fn'
 */

User.requestedBy = function (fn) {
  return (
    Resource('users/self')
    .path('requested-by')
    .get(onresp(fn))
  );
};

/**
 * Get information about a relationship to another user
 *
 * @api public
 * @param {Object} `opts'
 * @param {Function} `fn'
 */

User.relationship = function (opts, fn) {
  if ('object' !== typeof opts) { throw new TypeError("expecting `object`"); }
  else if (!opts.id) { throw new Error("missing `.id` in `opts` object"); }
  return (
    User({id: opts.id})
    .path('relationship')
    .get(onresp(fn))
  );
};

/**
 * Follow a given user
 *
 * @api public
 * @param {Object} `opts'
 * @param {Function} `fn'
 */

User.follow = function (opts, fn) {
  if ('object' !== typeof opts) { throw new TypeError("expecting `object`"); }
  else if (!opts.id) { throw new Error("missing `.id` in `opts` object"); }
  return (
    User({id: opts.id})
    .path('relationship')
    .post({action: 'follow'}, onresp(fn))
  );
};

/**
 * Un-follow a given user
 *
 * @api public
 * @param {Object} `opts'
 * @param {Function} `fn'
 */

User.unfollow = function (opts, fn) {
  if ('object' !== typeof opts) { throw new TypeError("expecting `object`"); }
  else if (!opts.id) { throw new Error("missing `.id` in `opts` object"); }
  return (
    User({id: opts.id})
    .path('relationship')
    .post({action: 'unfollow'}, onresp(fn))
  );
};

/**
 * Blocks a given user
 *
 * @api public
 * @param {Object} `opts'
 * @param {Function} `fn'
 */

User.block = function (opts, fn) {
  if ('object' !== typeof opts) { throw new TypeError("expecting `object`"); }
  else if (!opts.id) { throw new Error("missing `.id` in `opts` object"); }
  return (
    User({id: opts.id})
    .path('relationship')
    .post({action: 'block'}, onresp(fn))
  )
};

/**
 * Un-blocks a given user
 *
 * @api public
 * @param {Object} `opts`
 * @param {Function} `fn`
 */

User.unblock = function (opts, fn) {
  if ('object' !== typeof opts) { throw new TypeError("expecting `object`"); }
  else if (!opts.id) { throw new Error("missing `.id` in `opts` object"); }
  return (
    User({id: opts.id})
    .path('relationship')
    .post({action: 'unblock'}, onresp(fn))
  );
};

/**
 * Approves a given user
 *
 * @api public
 * @param {Object} `opts'
 * @param {Function} `fn'
 */

User.approve = function (opts, fn) {
  if ('object' !== typeof opts) { throw new TypeError("expecting `object`"); }
  else if (!opts.id) { throw new Error("missing `.id` in `opts` object"); }
  return (
    User({id: opts.id})
    .path('relationship')
    .post({action: 'approve'}, onresp(fn))
  );
};

/**
 * Denies a given user
 *
 * @api public
 * @param {Object} `opts'
 * @param {Function} `fn'
 */

User.deny = function (opts, fn) {
  if ('object' !== typeof opts) { throw new TypeError("expecting `object`"); }
  else if (!opts.id) { throw new Error("missing `.id` in `opts` object"); }
  return (
    User({id: opts.id})
    .path('relationship')
    .post({action: 'deny'}, onresp(fn))
  );
};

/**
 * Get basic information about a user
 *
 * @api public
 * @param {Object} `data' - optional
 * @param {Function} `fn'
 */

User.prototype.info = function (fn) {
  return this.get(onresp(fn));
};

/**
 * Get the list of users this user follows
 *
 * @api public
 * @param {Object} `data' - optional
 * @param {Function} `fn'
 */

User.prototype.follows = function (fn) {
  return this.path('follows').get(onresp(fn));
};

/**
 * Get the list of users this user is followed by
 *
 * @api public
 * @param {Object} `data' - optional
 * @param {Function} `fn'
 */

User.prototype.followedBy = function (fn) {
  return this.path('followed-by').get(onresp(fn));
};

/**
 * Expose `UserMedia'
 *
 * @api public
 * @param {Object} `opts'
 */

module.exports.UserMedia = UserMedia;
function UserMedia (opts) {
  if (!(this instanceof UserMedia)) { return new UserMedia(opts); }
  else if ('object' !== typeof opts) {
    throw new TypeError("expecting `object`");
  } else if (!opts.id) {
    throw new Error("expecting `.id`");
  }

  Resource.call(this, 'users/'+ opts.id +'/media');
  this.id = opts.id;
}

// inherit from `Resource`
UserMedia.prototype.__proto__ = Resource.prototype;

/**
 * Get the most recent media published by a user.
 * May return a mix of both image and video types
 *
 * @api public
 * @param {Object} `data' - optional
 * @param {Function} `fn'
 */

UserMedia.prototype.recent = function (data, fn) {
  fn = ('function' === typeof data) ? data : fn;
  data = ('object' === typeof data) ? data : {};
  return (
    this.path('recent')
    .query(data || {})
    .get(onresp(fn))
  );
};

