\p 5001
\l temptesttab.q
\l static.q
\l unit.q
/*.z.ws:{value -9!x};*/
/*.z.ws:{neg[.z.w].Q.s value x}*/
/*.z.ws: {show -9!x;neg[.z.w] -8! @[value;-9!x;{`$"'",x}]};
.z.ws:{ds:-9!x;neg[.z.w] -8! `o`ID!(@[value;ds[`i];{`$"'",x}];ds[`ID])};
.z.wc: {delete from `subs where handle=x};

/* table definitions */
dummytrade:flip `time`sym`price`size!"psfi"$\:();  /* This and the line below were "nsfi" */
dummyquote:flip `time`sym`bid`ask!"psff"$\:();
upd:insert;

/* subs table to keep track of current subscriptions */
subs:2!flip `handle`func`params!"is*"$\:();

/* functions to be called through WebSocket */
loadPage:{ getSyms[.z.w]; sub[`getQuotes;enlist `]; sub[`getTrades;enlist `]};
filterSyms:{ sub[`getQuotes;x];sub[`getTrades;x]};

getSyms:{ (neg[x]) .j.j `func`result!(`getSyms;distinct (dummyquote`sym),dummytrade`sym)};

getQuotes:{ 
	filter:$[all raze null x;distinct dummyquote`sym;raze x];
	res: 0!select last bid,last ask by sym,last time from dummyquote where sym in filter; 
	`func`result!(`getQuotes;res)};

getTrades:{ 
	filter:$[all raze null x;distinct dummytrade`sym;raze x];
	res: 0!select last price,last size by sym,last time from dummytrade where sym in filter;
	`func`result!(`getTrades;res)};

/*subscribe to something */
sub:{`subs upsert(.z.w;x;enlist y)};

/*publish data according to subs table */
pub:{ 
	row:(0!subs)[x]; 
	(neg row[`handle]) .j.j (value row[`func])[row[`params]]
 };

/* trigger refresh every 100ms */
.z.ts:{pub each til count subs};
\t 1000
