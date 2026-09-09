import test from'node:test';import assert from'node:assert/strict';import{normalizeHash,receiptState,readable,saveJournal,loadJournal}from'./src/transactions.js';
test('reject ambiguous hash',()=>assert.throws(()=>normalizeHash({}),/Ambiguous/));
test('execution error is failure despite finality',()=>assert.equal(receiptState({statusName:'FINALIZED',consensus_data:{leader_receipt:[{execution_result:'ERROR',result:{status:'rollback'}}]}}).accepted,false));
test('final successful receipt is accepted',()=>assert.equal(receiptState({statusName:'FINALIZED',consensus_data:{leader_receipt:[{execution_result:'SUCCESS',result:{status:'return'}}]}}).accepted,true));
test('return id is decoded',()=>assert.equal(readable({consensus_data:{leader_receipt:[{execution_result:'SUCCESS',result:{payload:{readable:'3'}}}]}}),3));
test('journal survives reload',()=>{const m=new Map(),s={getItem:k=>m.get(k),setItem:(k,v)=>m.set(k,v)};saveJournal(s,[{hash:'x',phase:'PENDING'}]);assert.equal(loadJournal(s)[0].phase,'PENDING');});
