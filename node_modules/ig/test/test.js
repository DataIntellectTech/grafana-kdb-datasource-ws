/**
 * Module dependencies
 */

var ig = require('../')
  , assert = require('assert')
  , qs = require('querystring')
  , isArray = Array.isArray

var clientid = process.env.INSTAGRAM_CLIENT_ID
  , clientsecret = process.env.INSTAGRAM_CLIENT_SECRET
  , token = process.env.INSTAGRAM_CLIENT_TOKEN
  , id = 225592026
  , fid = 13582298
  , mid = '483178086954225017_235142610'
  , lat = 40.741007499999995
  , lng = 73.9912112
  , data = {}

describe('ig', function () {
  this.timeout(Infinity);

  assert(token);

  ig
  .set('token', token)
  .set('client id', clientid)
  .set('client secrect', clientsecret)

  describe('User(opts)', function () {
    var user = ig.User({ id: id });
    assert.ok(ig.get('token'));

    describe('.feed(opts, fn)', function () {
      it('should retrieve information from the authenticated users feed', function (done) {
        ig.User.feed(function (err, data) {
          if (err) { return done(err); }
          assert(data);
          assert(isArray(data));
          done();
        });
      });
    });

    describe('.likedMedia(opts, fn)', function () {
      it('should retrieve information from the authenticated users liked media', function (done) {
        ig.User.likedMedia(function (err, data) {
          if (err) { return done(err); }
          assert(data);
          assert(isArray(data));
          done();
        });
      });
    });

    describe('.search(opts, fn)', function () {
      it('should search for a user by name', function (done) {
        var user = 'josephwerle';
        ig.User.search({user: user}, function (err, data) {
          if (err) { return done(err); }
          assert(data);
          assert(isArray(data));
          assert(user === data[0].username); // first match
          done();
        });
      });
    });

    describe('.requestedBy(fn)', function () {
      it('should get the users who have requested this users permission to follow', function (done) {
        ig.User.requestedBy(function (err, data) {
          assert(data);
          assert(isArray(data));
          done();
        });
      });
    });

    describe('.relationship(opts, fn)', function () {
      it('should get information about a relationship to another user', function (done) {
        ig.User.relationship({id: fid}, function (err, data) {
          assert(data);
          assert(undefined !== data.outgoing_status);
          assert(undefined !== data.target_user_is_private);
          assert(undefined !== data.incoming_status);
          done();
        });
      });
    });

    describe('.follow(opts, fn)', function () {
      it('should follow a given user', function (done) {
        ig.User.follow({id: fid}, function (err, data) {
          assert(data);
          assert('follows' === data.outgoing_status || 'requested' === data.outgoing_status);
          assert(undefined !== data.target_user_is_private);
          done();
        });
      });
    });

    describe('.unfollow(opts, fn)', function () {
      it('should unfollow a given user', function (done) {
        ig.User.unfollow({id: fid}, function (err, data) {
          assert(data);
          assert('none' === data.outgoing_status);
          assert(undefined !== data.target_user_is_private);
          done();
        });
      });
    });

    describe('.approve(opts, fn)', function () {
      it('should approve a given user', function (done) {
        ig.User.approve({id: fid}, function (err, data) {
          done();
        });
      });
    });

    describe('.deny(opts, fn)', function () {
      it('should deny a given user', function (done) {
        ig.User.deny({id: fid}, function (err, data) {
          done();
        });
      });
    });

    describe('.block(opts, fn)', function () {
      it('should block a given user', function (done) {
        ig.User.block({id: fid}, function (err, data) {
          assert(data);
          assert('blocked_by_you' === data.incoming_status);
          assert('none' === data.outgoing_status);
          done();
        });
      });
    });

    describe('.unblock(opts, fn)', function () {
      it('should unblock a given user', function (done) {
        ig.User.unblock({id: fid}, function (err, data) {
          assert(data);
          assert('none' === data.incoming_status);
          done();
        });
      });
    });

    describe('#info(fn)', function () {
      it('should retrieve user data from the api', function (done) {
        user.info(function (err, data) {
          assert(data);
          assert(data.username);
          assert(id === Number(data.id));
          done();
        });
      });
    });

    describe('#follows(fn)', function () {
      it('should get the list of users this user follows', function (done) {
        user.follows(function (err, data) {
          assert(data);
          assert(isArray(data));
          assert(data.length);
          done();
        });
      });
    });

    describe('#follwedBy(fn)', function () {
      it('should get the list of users this user is followed by', function (done) {
        user.follows(function (err, data) {
          assert(data);
          assert(isArray(data));
          assert(data.length);
          done();
        });
      });
    });

    describe('.media', function () {
      describe('#recent(opts, fn)', function () {
        it('should retrieve recent media', function (done) {
          user.media.recent(function (err, data) {
            assert(data);
            assert(isArray(data));
            assert(data.length);
            done();
          });
        });
      });
    });

  }); // end `User` test

  describe('Media(opts)', function () {
    var media = ig.Media({ id: mid });
    assert.ok(ig.get('token'));

    describe('.search(opts, fn)', function () {
      it('should return media based on a query', function (done) {
        ig.Media.search({lat: lat, lng: lng, distance: 500}, function (err, data) {
          assert(data);
          assert(isArray(data));
          assert(data.length);
          done();
        });
      });
    });

    describe('.popular(fn)', function () {
      it('should return popoular media', function (done) {
        ig.Media.popular(function (err, data) {
          assert(data);
          assert(isArray(data));
          assert(data.length);
          done();
        });
      });
    });

    describe('#info(fn)', function () {
      it('should retrieve data about the current media instance', function (done) {
        media.info(function (err, data) {
          assert(data);
          assert(media.id === data.id);
          done();
        });
      });
    });

    describe('#comments(fn)', function () {
      it('should retrieve comments on the current media instance', function (done) {
        media.comments(function (err, data) {
          assert(data);
          assert(isArray(data));
          done();
        });
      });
    });

    describe('#comment(fn)', function () {
      it('should comment on a media', function (done) {
        // @TODO- need auth for comments on ig
        done();
      });
    });
  }); // end `Media(opts)`

  describe('Tag(opts)', function () {
    var tag = ig.Tag({name: 'brooklyn'});
    assert.ok(ig.get('token'));

    describe('.search(opts, fn)', function () {
      it('should return tags based on a query', function (done) {
        ig.Tag.search({q: 'nyc'}, function (err, data) {
          assert(data);
          assert(isArray(data));
          assert(data.length);
          done();
        });
      });
    });

    describe('#info(fn)', function () {
      it('should retrieve data the current tag instance', function (done) {
        tag.info(function (err, data) {
          assert(data);
          assert(tag.id === data.id);
          done();
        });
      });
    });

    describe('#recent(opts, fn)', function () {
      it('should retrieve recent media', function (done) {
        tag.recent(function (err, data) {
          assert(data);
          assert(isArray(data));
          assert(data.length);
          done();
        });
      });
    });

  }); // end `Tag(opts)`


  describe('Location(opts)', function () {
    assert.ok(ig.get('token'));

    describe('.search(opts, fn)', function () {
      it('should return locations based on a query', function (done) {
        ig.Location.search({lat: lat, lng: lng}, function (err, data) {
          assert(data);
          assert(data.length);
          done();
        });
      });
    });
  });

});
