node-ig
=========

Simple wrapper around the v1 Instagram API

## install

```
$ npm install ig
```

## usage

### application

`ig` needs to know about your applications client ID and client secret.
You can configure it like this:

```js
ig
.set('client id', clientId)
.set('client secret', clientSecret);
```

### authentication

`ig` does not do any authentication and expects you to implement the
oAuth2 authentication flow yourself.

After getting a users access token you can configure `ig` like such:

```js
ig.set('token', accessToken);
```

## api

### User(opts)

Instagram user class wrap where `opts` is:

* `id` - ID of the user to wrap

```js
var ig = require('ig')
var user = ig.User({id: 123});
```

#### User.feed(opts, fn)

Retrieves feed for the authenticated user.

```js
ig.User.feed()
.on('error', onerror)
.on('end', function (feed) {
  // do something with `feed'
});
```

#### User.likedMedia(opts, fn)

Retrieves liked media for the authenticated user.

```js
ig.User.likedMedia()
.on('error', onerror)
.on('end', function (media) {
  // do something with `media'
});
```

#### User.search(user, fn)

Search for a user

```js
ig.User.likedMedia()
.on('error', onerror)
.on('end', function (media) {
  // do something with `media'
});
```

more to come...

## license

MIT
