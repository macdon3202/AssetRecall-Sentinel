export const VERSION='ASSET_RECALL_SENTINEL_V2';
export const normalizeHash=v=>{const h=typeof v==='string'?v:v?.txId||v?.hash;if(!/^0x[0-9a-f]{64}$/i.test(h||''))throw Error('Ambiguous wallet response. Inspect wallet activity; do not resend.');return h;};
export const receiptState=info=>{const status=String(info?.statusName??info?.status??'').toUpperCase();const receipts=(info?.consensus_data?.leader_receipt??[]).filter(r=>r?.result?.payload!=='idle');const failed=['UNDETERMINED','CANCELED','CANCELLED','VALIDATORS_TIMEOUT','LEADER_TIMEOUT'].includes(status)||receipts.some(r=>r.execution_result==='ERROR'||['rollback','contract_error','error'].includes(r?.result?.status));const success=receipts.length>0&&receipts.some(r=>r.execution_result==='SUCCESS'||r?.result?.status==='return');return{status,failed,accepted:status==='FINALIZED'&&!failed&&success};};
export const readable=info=>{const p=(info?.consensus_data?.leader_receipt??[]).find(r=>r.execution_result==='SUCCESS')?.result?.payload;const v=p&&typeof p==='object'?p.readable:p;try{return JSON.parse(v);}catch{return v;}};
export const JOURNAL='asset_recall_sentinel_transactions_v2';
export const loadJournal=s=>{const x=JSON.parse(s.getItem(JOURNAL)||'[]');if(!Array.isArray(x))throw Error('Invalid transaction journal.');return x;};
export const saveJournal=(s,x)=>s.setItem(JOURNAL,JSON.stringify(x));
