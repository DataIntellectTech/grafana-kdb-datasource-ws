
// WebSocket handler for use with debug mode (no protected evaluation)
.z.ws:{[x]
  .grafaquaq.i:ds:-9!x;
  .grafaquaq.q:q:ds[`GRAF_AQUAQ_KDB_DS];
  neg[.z.w] .grafaquaq.o:-8! `o`ID!(
    .grafaquaq.r:value q[`i];
    .grafaquaq.id:q[`ID]
    )
  };

// .grafaquaq.i : Full deserialised inbound dictionary
// .grafaquaq.q : Contents of .grafaquaq.i
// .grafaquaq.d : Query request
// .grafaquaq.r : Query result
// .grafaquaq.id : Query ID

// Single line:
//.z.ws:{[x] .grafaquaq.i:ds:-9!x;.grafaquaq.q:q:ds[`GRAF_AQUAQ_KDB_DS];neg[.z.w] .grafaquaq.o:-8! `o`ID!(.grafaquaq.r:value q[`i];.grafaquaq.id:q[`ID])};