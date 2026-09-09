import{createClient,createAccount}from'../frontend/node_modules/genlayer-js/dist/index.js';
import{studionet}from'../frontend/node_modules/genlayer-js/dist/chains/index.js';
import{readFileSync,writeFileSync,existsSync,mkdirSync}from'node:fs';import{createHash}from'node:crypto';
const address=process.env.ASSET_RECALL_ADDRESS??'0x4A35338757456fB4287ca77e4344B87b7ceDf4b9';
const A='0xFeD97e2aE1A8C1983b7cA206B3545e6A2c685E43',B='0xc67532aeF9D2879cBA9375a02E6217A3524657B8';
const metadata=JSON.stringify({standard:'ASSET_RECALL_V1',vin:'1HGCM82633A004352',make:'HONDA',model:'ACCORD',model_year:2003,market:'US'});const digest=createHash('sha256').update(metadata).digest('hex');
const stateDir=new URL('./.state/',import.meta.url);mkdirSync(stateDir,{recursive:true});const stateFile=new URL('./.state/studionet.json',import.meta.url);const enc=x=>JSON.stringify(x,(_,v)=>typeof v==='bigint'?String(v):v,2);let state=existsSync(stateFile)?JSON.parse(readFileSync(stateFile)):{address,fixture:{metadata,digest},actions:{}};const save=()=>writeFileSync(stateFile,enc(state));
function env(){const rows=Object.fromEntries(readFileSync(new URL('../../secrets/genlayer-test-wallets.env',import.meta.url),'utf8').split(/\r?\n/).filter(x=>x.includes('=')).map(x=>{const i=x.indexOf('=');return[x.slice(0,i),x.slice(i+1).replace(/^<|>$/g,'').trim()]}));return rows}
function signer(which){const key=env()['SERVICE_LEDGER_KEY_'+which],account=createAccount(key.startsWith('0x')?key:'0x'+key),expected=which==='A'?A:B;if(account.address.toLowerCase()!==expected.toLowerCase())throw Error('WRONG_TEST_WALLET');return createClient({chain:studionet,account})}
const reader=createClient({chain:studionet}),read=(fn,args=[])=>reader.readContract({address,functionName:fn,args});
async function receipt(hash,allowError=false){for(let i=0;i<100;i++){const tx=await reader.getTransaction({hash}),status=String(tx.statusName??'').toUpperCase();if(status==='UNDETERMINED')return{status,execution:'UNDETERMINED'};if(['ACCEPTED','FINALIZED'].includes(status)){const rs=(tx.consensus_data?.leader_receipt??[]).filter(x=>x.result?.payload!=='idle'),success=rs.length>0&&rs.every(x=>x.execution_result==='SUCCESS');if(!success&&!allowError)throw Error('GENVM_ERROR '+hash);return{status,execution:success?'SUCCESS':'ERROR',consensus:'Accepted',result:rs[0]?.result?.payload};}await new Promise(r=>setTimeout(r,3000))}throw Error('PENDING_NO_RESUBMIT')}
async function snapshot(){let asset=null,scan=null,refreshed_scan=null;try{asset=await read('get_asset',[0n])}catch{}try{scan=await read('get_scan',[0n])}catch{}try{refreshed_scan=await read('get_scan',[1n])}catch{}return{config:await read('get_config'),asset,scan,refreshed_scan}}
async function send(name,which,fn,args=[],allowError=false){if(state.actions[name]?.hash){state.actions[name].receipt=await receipt(state.actions[name].hash,allowError);state.actions[name].after=await snapshot();state.actions[name].phase='VERIFIED';save();return state.actions[name]}if(state.actions[name])throw Error('AMBIGUOUS_NO_RESUBMIT '+name);state.actions[name]={fn,args,phase:'SENDING',at:new Date().toISOString()};save();const hash=await signer(which).writeContract({address,functionName:fn,args});state.actions[name].hash=hash;state.actions[name].phase='SUBMITTED';save();state.actions[name].receipt=await receipt(hash,allowError);state.actions[name].after=await snapshot();state.actions[name].phase='VERIFIED';save();console.log(enc({name,hash,receipt:state.actions[name].receipt,after:state.actions[name].after}));return state.actions[name]}
const action=process.argv[2]??'read',initial=await snapshot();if(initial.config.version!=='ASSET_RECALL_SENTINEL_V1')throw Error('WRONG_VERSION');
if(action==='read'){const schema=await reader.getContractSchema(address);console.log(enc({...initial,methods:Object.keys(schema.methods??{})}))}
else if(action==='register')await send('register','A','register_asset',['1HGCM82633A004352','HONDA','ACCORD',2003n,'US',digest]);
else if(action==='request')await send('request','B','request_scan',[0n,'frontal air bag inflator rupture']);
else if(action==='evaluate')await send('evaluate','B','evaluate_scan',[0n]);
else if(action==='evaluate-refresh')await send('evaluate-refresh','A','evaluate_scan',[1n]);
else if(action==='unauthorized-retire')await send('unauthorized-retire','B','retire_asset',[0n],true);
else if(action==='terminal-replay')await send('terminal-replay','B','evaluate_scan',[0n],true);
else if(action==='refresh')await send('refresh','A','refresh_scan',[0n]);
else throw Error('UNKNOWN_ACTION');
