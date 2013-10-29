/*!
 * connect-jugglingdb
 * Copyright 2013 Jérémy Lal <kapouer@melix.org>
 * MIT Licensed, see LICENSE file
 */

/**
 * Default options
 */

var defaults = {
	collection: 'sessions',
	expiration:  1000 * 60 * 60 * 24 * 14
};

function noop() {}

module.exports = function(connect) {
	"use strict";
	var Store = connect.session.Store;

	/**
	 * Initialize JugglingStore with the given `options`.
	 * 
	 * @param {JugglingDB.Schema} schema
	 * @param {Object} options
	 * @api public
	 */

	function JugglingStore(schema, options) {
		options = options || {};
		Store.call(this, options);
		var expiration = this.expiration = options.expiration || defaults.expiration;
		var coll = this.collection = schema.define('Session', {
			sid: {
				type: String,
				index: true
			},
			expires: {
				type: Date,
				default: function () {
					return new Date();
				}
			},
			session: schema.constructor.JSON
		}, {
			table: options.collection || defaults.collection
		});
		
		coll.validatesUniquenessOf('sid');
		
		// destroy all expired sessions after each create/update
		coll.afterSave = function(next) {
			coll.iterate({where: {
				expires: {lte: new Date()}
			}}, function(obj, nexti, i) {
				obj.destroy(nexti);
			}, next);
		};
	}

	/**
	 * Inherit from `Store`.
	 */

	require('util').inherits(JugglingStore, Store);

	/**
	 * Attempt to fetch session by the given `sid`.
	 *
	 * @param {String} sid
	 * @param {Function} callback
	 * @api public
	 */
	
	JugglingStore.prototype.get = function(sid, callback) {
		var self = this;
		callback = callback || noop;
		this.collection.findOne({where: {sid: sid}}, function(err, session) {
			if (err) return callback(err);
			if (!session) return callback();
			if (!session.expires || new Date() < session.expires) {
				callback(null, session.session);
			} else {
				self.destroy(sid, callback);
			}
		});
	};

	/**
	 * Commit the given `session` object associated with the given `sid`.
	 *
	 * @param {String} sid
	 * @param {Session} session
	 * @param {Function} callback
	 * @api public
	 */

	JugglingStore.prototype.set = function(sid, session, callback) {
		callback = callback || noop;
		var s = {
			session: session
		};
		if (session && session.cookie && session.cookie.expires) {
			s.expires = new Date(session.cookie.expires);
		} else {
			// If there's no expiration date specified, it is
			// browser-session cookie or there is no cookie at all,
			// as per the connect docs.
			//
			// So we set the expiration to two-weeks from now
			// - as is common practice in the industry (e.g Django) -
			// or the default specified in the options.
			var today = new Date();
			s.expires = new Date(today.getTime() + this.expiration);
		}
		var coll = this.collection;
		coll.findOne({where: {sid: sid}}, function(err, session) {
			if (err) return callback(err);
			if (session) {
				session.updateAttributes(s, function(err) {
					callback(err);
				});
			} else {
				s.sid = sid;
				coll.create(s, function(err) {
					callback(err);
				});
			}
		});
	};

	/**
	 * Destroy the session associated with the given `sid`.
	 *
	 * @param {String} sid
	 * @param {Function} callback
	 * @api public
	 */

	JugglingStore.prototype.destroy = function(sid, callback) {
		callback = callback || noop;
		var coll = this.collection;
		coll.findOne({where: {sid: sid}}, function(err, session) {
			if (err) return callback(err);
			if (!session) return callback();
			session.destroy(callback);
		});
	};

	/**
	 * Fetch number of sessions.
	 *
	 * @param {Function} callback
	 * @api public
	 */

	JugglingStore.prototype.length = function(callback) {
		this.collection.count(callback);
	};

	/**
	 * Clear all sessions.
	 *
	 * @param {Function} callback
	 * @api public
	 */

	JugglingStore.prototype.clear = function(callback) {
		this.collection.destroyAll(callback);
	};
	
	return JugglingStore;
};
