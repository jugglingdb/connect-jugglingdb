connect-jugglingdb
==================

JugglingDB session store for Connect

Usage
-----

```
var JugglingDB = require('jugglingdb');
var JugglingStore = require('connect-jugglingdb');

// create JugglingDB schema object - can be any supported adapter
var schema = new JugglingDB.Schema('postgres', {
  database: 'mydbname'
});

app.use(express.session({
	store: new JugglingStore(schema, {
		collection: 'sessions',						// collection name in DB
		expiration: 1000 * 60 * 60 * 24		// 14 days
	})
}));
```

Features
--------

Automatic cleanup of expired sessions
