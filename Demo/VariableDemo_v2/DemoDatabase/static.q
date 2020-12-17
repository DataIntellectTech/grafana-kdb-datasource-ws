statictab:update time:(2020.12.09-6)+time,sym:10080?`AAPL`MSFT`GOOG`VOD , price:(count time)?100.00+til 50, bid:(count time)?38+til 4, ask:(count time)?36+til 4, size: (count time)?50 100 150 200 250, side:(count time)?`buy`sell from ([]time:`timespan$00:00 + til 10080);

statictab:update bid: price-(count time)?4, ask: price+(count time)?4 from statictab;

pnl:select time,sym,bid,ask,price,side,size,position,dcost,pnl,tot_pnl from update tot_pnl:sums r from update r:deltas pnl by sym from update pnl:(position*mid)+dcost from update mid: 0.5 * bid+ask, dcost:sums price*size*?[side=`buy;-1;1], position:sums size*?[side=`buy;1;-1] by sym from select from statictab