connect-jugglingdb
==================

JugglingDB session store for Connect

Usage
-----

```
const session = require('express-session');
const JugglingDB = require('jugglingdb');
const JugglingStore = require('connect-jugglingdb')(session);
const JugglingStore = require('connect-jugglingdb')(express);//send express as a parameter here

// create JugglingDB schema object - can be any supported adapter
const schema = new JugglingDB.Schema('postgres', {
    database: 'mydbname'
});

app.use(express.session({
    store: new JugglingStore(schema, {
        table: 'sessions',                // juggling adapter table name
        maxAge: 1000 * 60 * 60 * 24 * 14  // default duration in milliseconds
    })
}));

schema.autoupdate(function(err) {
    if (err) console.error(err);
});
```

Note that maxAge can also be set in session.cookie.maxAge, see
http://www.senchalabs.org/connect/session.html

Features
--------

Automatic cleanup of expired sessions

