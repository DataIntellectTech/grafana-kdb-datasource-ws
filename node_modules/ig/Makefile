
CWD ?= $(shell pwd)

export PATH += $(CWD)/node_modules/.bin
export INSTAGRAM_CLIENT_ID ?= $(shell cat client_id)
export INSTAGRAM_CLIENT_SECRET ?= $(shell cat client_secret)
export INSTAGRAM_CLIENT_TOKEN ?= $(shell cat client_token)

all: install test
	@:

install: clean
	@npm install

clean:
	@rm -rf node_modules/

test:
	@mocha test/test.js -R spec

.PHONY: test
