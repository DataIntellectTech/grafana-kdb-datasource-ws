//Simple single-line WebSocket handler for if no other WebSocket functionality is needed
.z.ws:{ds:-9!x;q:ds[`GRAF_AQUAQ_KDB_DS];neg[.z.w] -8! `o`ID!(@[value;q[`i];{`$"'",x}];q[`ID])}

//Wrapper for if .z.ws is already defined
.z.ws:{[f;x]
  f[x];
  if[4=type x;
    ds:-9!x;
    if[99=type ds;
      if[enlist[`GRAF_AQUAQ_KDB_DS] ~ key ds;
        q:ds[`GRAF_AQUAQ_KDB_DS];
        neg[.z.w] -8! `o`ID!(@[value;q[`i];{`$"'",x}];q[`ID])
        ]
      ]
    ]
  }[.z.ws;];

//Single line with wrapper
// .z.ws:{[f;x] f[x];if[4=type x;ds:-9!x;if[99=type ds;if[enlist[`GRAF_AQUAQ_KDB_DS] ~ key ds;q:ds[`GRAF_AQUAQ_KDB_DS];neg[.z.w] -8! `o`ID!(@[value;q[`i];{`$"'",x}];q[`ID])]]]}[.z.ws;];