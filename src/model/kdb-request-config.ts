//This is where the kdb Functions passed down to kdb+ to interpret a query are declared

//The default for the number 
export const defaultRowCountLimit : number = 10000;
export var defaultTimeout : number = 5000;

//Graph response type
export const graphFunction: string =  '{@[x;y;{`payload`error`success!(();"Error! - ",x;0b)}]}{[dict] \n ' +
' \n ' +
' \n ' +
' conc:{ \n ' +
` .[x;(y;z);{'\"Function:conc - Error:\",x}]}[{[d;raw] \n ` +
' \n ' +
' c:(cols raw) except $[`unkeyed in key d;key d[`unkeyed];()],raze d[`grouping`temporal_field]; \n ' +
' ca:{$[x ~ ();last;value x]}d[`conflation;`agg]; \n ' +
' :c!ca,/:c,:(); \n ' +
' }]; \n ' +
' \n ' +
' conb:{ \n ' +
` @[x;(y);{'\"Function:conb - Error:\",x}]}[{[d] \n ` +
' \n ' +
' cv: value d[`conflation;`val];cf:d[`temporal_field]; \n ' +
' :((enlist cf)!enlist(xbar;cv;cf)), \n ' +
' $[`unkeyed in key d;d[`unkeyed];()]; \n ' +
' }]; \n ' +
' \n ' +
' wbuild:{ \n ' +
` @[x;(y);{'\"Function:wbuild - Error:\",x}]}[{[d] \n ` +
' \n ' +
' wObjs:()!(); \n ' +
' wObjs[`tr]:enlist (\"within\";d[`temporal_field];enlist d[`temporal_range]); \n ' +
' wObjs[`wc]:wObjs[`tr],{[x]$[0=type first x;x;enlist x]}d[`where]; \n ' +
' wObjs[`p]:{[x]((value first x);x[1];$[11=abs[type x[2]];enlist x[2]; \n ' +
' $[10=type x[2];value x[2]; \n ' +
` $[min 10h='type each x[2]; \n ` +
' value each enlist["enlist"],x[2]; \n ' +
' x[2]]]];x[3])} each wObjs[`wc]; \n ' +
' :{$[enlist["x"]~x[3]; \n ' +
' (not;x[0 1 2]);x[0 1 2]]}each wObjs[`p]; \n ' +
' }]; \n ' +
' \n ' +
' cbuild:{ \n ' +
` .[x;(y;z);{'\"Function:cbuild - Error:\",x}]}[{[d;end] \n ` +
' \n ' +
' t:d[`temporal_field];c:d[`column]; \n ' +
' if[not t in cols d[`table]; \n ' +
` :{'x}"Time column selected (",string[t], \n ` +
' ") not present in table (",string[d[`table]],")"]; \n ' +
' t:(enlist t)!enlist(::;t); \n ' +
' c:$[0h<>first type each c;enlist c;c]; \n ' +
' :t,c:{x[;1]!x}raze each{[s;x] \n ' +
' enlist[x 1]!enlist(value $[s~0b;\"::\";x 0];x 1)}[end;]each c; \n ' +
' }]; \n ' +
' \n ' +
' bbuild:{ \n ' +
` .[x;(y;z);{'\"Function:bbuild - Error:\",x}]}[{[d;end] \n ` +
' \n ' +
' g:d[`grouping]; \n ' +
' :$[99h=type g;$[end;g;{x!x}value g];{$[x~();0b;x!x]}distinct g]; \n ' +
' }]; \n ' +
' \n ' +
' format:{ \n ' +
` .[x;(y;z);{'\"Function:format - Error:\",x}]}[{[x;gfid] \n ` +
' \n ' +
' t:$[99h=type x; \n ' +
' key[x]!([]data:flip each value x); \n ' +
' ([id:1#`x]data:`#enlist x)]; \n ' +
' :`payload`id`error`success!(t;gfid;$[(99h=type t)and(0<count x);\"OK\";\"NOT OK - Final table fault\"];1b); \n ' +
' }]; \n ' +
' \n ' +
' end:0b; \n ' +
' control:`rowlimit`gfid! \n ' +
' (dict[`queryParam;`maxRowCount];dict[`queryId]); \n ' +
' \n ' +
' d:dict`queryParam; \n ' +
' qt:d[`query;`type]; \n ' +
' funcparts:enlist[`CAST]!enlist("CAST";"AS";"MIXED LIST"); \n ' +
' gr:enlist[`CAST]!enlist("CAST";"AS";"MIXED LIST"); \n ' +
' funcparts[`b]:bbuild[d;end]; \n ' +
' funcparts[`w]:wbuild[d]; \n ' +
' \n ' +
' \n ' +
' if[qt=`select; \n ' +
' t:d[`table]; \n ' +
' gr[`grouped]:0b; \n ' +
' funcparts[`c]:cbuild[d;end]; \n ' +
' raw:.[{[t;w;b;c] ?[t;w;0b;$[b~0b;c;c,b]]}; \n ' +
' (t;funcparts[`w];funcparts[`b];funcparts[`c]); \n ' +
` {'\"Error in data selection: \",x, \n ` +
' \". Hint: check selected columns.\"}]; \n ' +
' \n ' +
' if[not (type raw[d[`temporal_field]]) in (12 15h); \n ' +
` :{'x}"Time column selected is not type timestamp or datetime"]; \n ` +
' ]; \n ' +
' \n ' +
' if[qt=`function; \n ' +
' raw:@[{?[value[x];();0b;()]};d[`query;`value]; \n ' +
` {'\"Your custom query has thrown an error - Type:\",x}]; \n ` +
' \n ' +
' if[not d[`temporal_field] in cols raw; \n ' + 
` :{'x}"Time column defined (",` + 'string[d[`temporal_field]], \n ' + 
' ") is not present in function output."];\n ' + 
' \n ' + 
' if[not (type raze (0!raw)[d[`temporal_field]]) in (12 15h); \n ' + 
` :{'x}"Time column selected is not type timestamp or datetime."]; \n ` + 
' \n ' + 
' if[enlist[d`temporal_field]~cols raw; \n ' +
` :{'x}"Must select more than just temporal column."];` +
' if[d[`temporal_field] in d[`grouping]; \n ' +
` :{'x}"Grouping Column cannot be identical to time column."]; \n ` +
' \n ' +
' if[0=count raw; \n ' +
` :{'x}` + '\"Custom function has generated no data - \", \n ' +
' \"Please inspect your query.\"]; \n ' +
' gr[`grouped]:99h=type raw; \n ' +
' \n ' +
' if[gr[`grouped]; \n ' +
' d[`unkeyed]:gr[`grby]:{x!x}cols key raw; \n ' +
' gr[`grcols]:{x!x}cols value raw; \n ' +
' \n ' +
' gr[`keyvals]:{raze{first[x]#last x} \n ' +
' each flip(count each first each value x; \n ' +
' raze value[flip key x])}raw; \n ' +
' \n ' +
' raw:flip {(cols[key x]!enlist y),cols[value x]! \n ' +
' raze each value flip value x}[raw;gr[`keyvals]]; \n ' +
' ]; \n ' +
' \n ' +
' raw:?[raw;funcparts[`w];0b;()]; \n ' +
' ]; \n ' +
' end:1b; \n ' +
' \n ' +
' \n ' +
' con:0b; \n ' +
' if[not()~d[`conflation]; \n ' +
' con:1b; \n ' +
' cb:conb[d],$[funcparts[`b]~0b;();funcparts[`b]]; \n ' +
' cc:$[qt=`select;1_cbuild[d;end];conc[d;raw]]; \n ' +
' ]; \n ' +
' \n ' +
' \n ' +
' if[con; \n ' +
' raw:.[{?[x;();y;z]};(raw;cb;cc); \n ' +
` {'"Error during conflation: ",x, \n ` +
' ". Most likely ",x, \n ' +
' " not present in selection"}]; \n ' +
' end:0b; \n ' +
' if[qt=`select; \n ' +
' raw:(cols[key raw],cc:{`$x}each count[cols value raw]#.Q.a)xcol raw]; \n ' +
' ]; \n ' +
' \n ' +
' \n ' +
' if[qt=`select; \n ' +
' funcparts[`b]:bbuild[d;end]; \n ' +
' funcparts[`c]:$[con;{x!x}d[`temporal_field],cc;cbuild[d;end]]; \n ' +
' ]; \n ' +
' \n ' +
' \n ' +
' if[control[`rowlimit]<count raw; \n ' +
` :{'x}` + '\"Row limit exceeded, limit set at \",string[control`rowlimit], \n ' +
' \" rows, result contains \",string[count raw], \n ' +
' \" rows, consider conflating your query.\"]; \n ' +
' \n ' +
' if[0=count raw; \n ' +
` :{'x}` + '\"Result table contains no data, \",\n ' +
' \"check your where clauses and time filter.\"]; \n ' +
' \n ' +
' $[gr[`grouped]; \n ' +
' [raw:?[raw;();gr[`grby];gr[`grcols]];funcparts[`c]:();]; \n ' +
' funcparts[`c]:{x!x}cols[raw]except d`grouping \n ' +
' ]; \n ' +
' final:?[raw;();funcparts[`b];funcparts[`c]]; \n ' +
' if[qt=`select; \n ' +
' final:{[t]((cols t)[0],{`$x}each count[1_cols t]#.Q.a)xcol t}final]; \n ' +
' final \n ' +
' ; \n ' +
' :format[final;control`gfid]; \n ' +
' }';

//Table response type
export const tabFunction: string = '{@[x;y;{`payload`error`success!(();"Error! - ",x;0b)}]}{[dict] \n ' +
' \n ' +
' \n ' +
' conc:{ \n ' +
` .[x;(y;z);{'\"Function:conc - Error Type:\",x}]}[{[d;raw] \n ` +
' \n ' +
' c:(cols raw) except $[`unkeyed in key d;key d[`unkeyed];()],raze d[`grouping`temporal_field]; \n ' +
' ca:{$[x ~ ();last;value x]}d[`conflation;`agg]; \n ' +
' :c!ca,/:c,:(); \n ' +
' }]; \n ' +
' \n ' +
' conb:{ \n ' +
` @[x;(y);{'\"Function:conb - Error Type:\",x}]}[{[d] \n ` +
' \n ' +
' cv: value d[`conflation;`val];cf:d[`temporal_field]; \n ' +
' :((enlist cf)!enlist(xbar;cv;cf)), \n ' +
' $[`unkeyed in key d;d[`unkeyed];()]; \n ' +
' }]; \n ' +
' \n ' +
' wbuild:{ \n ' +
` @[x;(y);{'\"Function:wbuild - Error Type:\",x}]}[{[d] \n ` +
' \n ' +
' wObjs:()!(); \n ' +
' wObjs[`wc]:$[not d[`where]~(); \n ' +
' {[x]$[0=type first x;x;enlist x]}d[`where];()]; \n ' +
' wObjs[`tr]:$[not d[`temporal_field]~(); \n ' +
' enlist ("within";d[`temporal_field];enlist d[`temporal_range]);()]; \n ' +
' if[(wObjs[`wc]~()) and (wObjs[`tr]~());:()]; \n ' +
' wObjs[`p]:{[x]((value first x);x[1];$[11=abs[type x[2]];enlist x[2]; \n ' +
' $[10=type x[2];value x[2]; \n ' +
` $[min 10h='type each x[2]; \n ` +
' value each enlist["enlist"],x[2]; \n ' +
' x[2]]]];x[3])} each wObjs[`wc],wObjs[`tr]; \n ' +
' :{$[enlist["x"]~x[3]; \n ' +
' (not;x[0 1 2]);x[0 1 2]]}each wObjs[`p]; \n ' +
' }]; \n ' +
' \n ' +
' cbuild:{ \n ' +
` .[x;(y;z);{'\"Function:cbuild - Error Type:\",x}]}[{[d;end] \n ` +
' \n ' +
' t:$[not ()~d`temporal_field; \n ' +
' {enlist[x]!enlist[x]}[d`temporal_field];()]; \n ' +
' c:d[`column]; \n ' +
' c:$[0h<>first type each c;enlist c;c]; \n ' +
' :t,c:{x[;1]!x}raze each{[s;x] \n ' +
' enlist[x 1]!enlist(value $[s~0b;\"::\";x 0];x 1)}[end;]each c; \n ' +
' }]; \n ' +
' \n ' +
' bbuild:{ \n ' +
` .[x;(y;z);{'\"Function:bbuild - Error Type:\",x}]}[{[d;end] \n ` +
' \n ' +
' g:d[`grouping]; \n ' +
' :$[99h=type g;$[end;g;{x!x}value g];{$[x~();0b;x!x]}distinct g]; \n ' +
' }]; \n ' +
' \n ' +
' format:{ \n ' +
` .[x;(y;z);{'\"Function:format - Error Type:\",x}]}[{[x;gfid] \n ` +
' \n ' +
' t:0!x; \n ' +
' rows:enlist{value x}each t; \n ' +
' columns:enlist ([]text:key flip t); \n ' +
' r:`columns`rows!(columns;rows); \n ' +
' :`payload`id`error`success!(r;gfid;$[0<count x;\"OK\";\"NOT OK - Final table fault\"];1b); \n ' +
' }]; \n ' +
' \n ' +
' end:0b; \n ' +
' control:`rowlimit`gfid! \n ' +
' (dict[`queryParam;`maxRowCount];dict[`queryId]); \n ' +
' \n ' +
' d:dict`queryParam; \n ' +
' qt:d[`query;`type]; \n ' +
' funcparts:enlist[`CAST]!enlist("CAST";"AS";"MIXED LIST"); \n ' +
' gr:enlist[`CAST]!enlist("CAST";"AS";"MIXED LIST"); \n ' +
' funcparts[`b]:bbuild[d;end]; \n ' +
' funcparts[`w]:wbuild[d]; \n ' +
' \n ' +
' \n ' +
' if[qt=`select; \n ' +
' t:d[`table]; \n ' +
' gr[`grouped]:0b; \n ' +
' funcparts[`c]:cbuild[d;end]; \n ' +
' if[not ()~d[`temporal_field]; \n ' +
' funcparts[`c]:{enlist[x]!enlist[x]} \n ' + 
' [d`temporal_field],funcparts[`c]]; \n ' +
' raw:.[{[t;w;b;c] ?[t;w;0b;$[b~0b;c;c,b]]}; \n ' + 
' (t;funcparts[`w];funcparts[`b];funcparts[`c]); \n ' +
` {'\"Error in data selection: \",x, \n ` +
' \". Hint: check selected columns.\"}]; \n ' +
' ]; \n ' +
' \n ' +
' if[qt=`function; \n ' +
' raw:@[{?[value[x];();0b;()]};d[`query;`value]; \n ' +
` {'\"Your custom query has thrown an error - Type:\",x}]; \n ` +
' \n ' +
' if[0=count raw; \n ' +
` :{'x}` + '\"Custom function has generated no data - \", \n ' +
' \"Please inspect your query.\"]; \n ' +
' \n ' +
' if[gr[`grouped]:99h=type raw; \n ' +
' d[`unkeyed]:gr[`grby]:{x!x}cols key raw; \n ' +
' gr[`grcols]:{x!x}cols value raw; \n ' +
' \n ' +
' gr[`keyvals]:{raze{first[x]#last x} \n ' +
' each flip(count each first each value x; \n ' +
' raze value[flip key x])}raw; \n ' +
' \n ' +
' raw:flip {(cols[key x]!enlist y),cols[value x]! \n ' +
' raze each value flip value x}[raw;gr[`keyvals]]; \n ' +
' ]; \n ' +
' \n ' +
' if[not d[`temporal_field]~(); \n ' +
' raw:?[raw;funcparts[`w];0b;()]; \n ' +
' ]; \n ' +
' ]; \n ' +
' \n ' +
' end:1b; \n ' +
' \n ' +
' \n ' +
' con:0b; \n ' +
' if[not()~d[`conflation]; \n ' +
' con:1b; \n ' +
' cb:conb[d],$[funcparts[`b]~0b;();funcparts[`b]]; \n ' +
' cc:.[{[qt;cbuild;d;end;raw;conc] \n ' +
' $[qt=`select;1_cbuild[d;end];conc[d;raw]]}; \n ' +
' (qt;cbuild;d;end;raw;conc); \n ' +
' {:"Conflation has thrown error: ",x}] \n ' +
' ]; \n ' +
' \n ' +
' \n ' +
' if[con; \n ' +
' raw:.[{?[x;();y;z]};(raw;cb;cc); \n ' +
` {'"Error during conflation: ",x, \n ` +
' ". Most likely ",x, \n ' +
' " not present in selection"}]; \n ' +
' end:0b; \n ' +
' if[qt=`select; \n ' +
' raw:(cols[key raw],cc:{`$x}each count[cols value raw]#.Q.a)xcol raw]; \n ' +
' ]; \n ' +
' \n ' +
' \n ' +
' if[qt=`select; \n ' +
' funcparts[`b]:bbuild[d;end]; \n ' +
' funcparts[`c]:$[con;{x!x}d[`temporal_field],cc;cbuild[d;end]]; \n ' +
' ]; \n ' +
' \n ' +
' if[control[`rowlimit]<count raw; \n ' +
` :{'x}` + '\"Row limit exceeded, limit set at \",string[control`rowlimit], \n ' +
' \" rows, result contains \",string[count raw], \n ' +
' \" rows, consider conflating your query.\"]; \n ' +
' \n ' +
' if[0=count raw; \n ' +
` :{'x}` + '\"Result table contains no data, \",\n ' +
' \"check your where clauses and time filter.\"]; \n ' +
' \n ' +
' final:?[raw;();funcparts[`b];$[99h=type funcparts[`c];funcparts[`c];()!()]]; \n ' +
' if[qt=`select;final:{[t]((cols t)[0],{`$x} each count[1_cols t]#.Q.a) xcol t}final]; \n ' +
' final \n ' +
' ; \n ' +
' :format[final;control`gfid]; \n ' +
' } \n ' +
'';

export const argCounter: string = 'argcount:{v:value x;$[100h=t:type x;count v 1; \n ' +
` 104h=t;.z.s[v 0]-count[v]-1+sum v~\:(::);105h=t;.z.s last v;'"no idea"]} \n ` +
' output:{[argcount;x] \n ' +
' if[100h=type x; \n ' +
' if[1=count singleVar:(value x)[1]; \n ' +
' if[not min string[singleVar] in (value x)[9];:0]]];argcount x}[argcount;] '