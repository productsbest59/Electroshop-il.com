import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../shop-api.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'').replace(/export /g,'').replace(/^\{SUPABASE_URL,PUBLISHABLE_KEY,request\};\r?\n/gm,'');
const key='electroshop_admin_session_v1';
function setup({expired=true,refreshStatus=200,unauthorized=false,network=false}={}){
  const initial={accessToken:'old',refreshToken:'refresh-old',expiresAt:Date.now()+(expired?-1000:3600000)},stored=new Map([[key,JSON.stringify(initial)],['article-draft','keep me']]),calls=[];
  const context=vm.createContext({config:{databaseReady:true,supabaseUrl:'https://test.invalid',publishableKey:'public'},localStorage:{getItem:k=>stored.get(k),setItem:(k,v)=>stored.set(k,v),removeItem:k=>stored.delete(k)},prepareImageBlob:async f=>f,localImagePath:v=>v,supplierImageMap:{},Date,crypto,console,fetch:async(url,options)=>{
    calls.push({url,options});
    if(url.includes('grant_type=refresh_token')){if(network)throw Error('offline');await Promise.resolve();return {ok:refreshStatus===200,status:refreshStatus,json:async()=>refreshStatus===200?{access_token:'new',refresh_token:'refresh-new',expires_in:3600}: {message:'refresh rejected'}}}
    const fail=unauthorized&&options.headers.Authorization==='Bearer old';return {ok:!fail,status:fail?401:200,json:async()=>url.includes('/storage/')?{}:[{id:'saved'}]};
  }});
  vm.runInContext(source+'\nglobalThis.api={getSession,request,saveArticle,uploadArticleImage,signOut};',context);
  return {api:context.api,stored,calls,initial};
}
{
 const {api,calls,initial,stored}=setup();
 await Promise.all([api.saveArticle(initial,{id:'article',slug:'test',title_he:'test'}),api.uploadArticleImage(initial,{type:'image/webp',name:'test.webp'})]);
 assert.equal(calls.filter(c=>c.url.includes('refresh_token')).length,1);
 for(const call of calls.filter(c=>!c.url.includes('refresh_token')))assert.equal(call.options.headers.Authorization,'Bearer new');
 assert.equal(stored.get('article-draft'),'keep me');
}
{
 const {api,calls,initial}=setup({expired:false,unauthorized:true});await api.saveArticle(initial,{id:'article'});
 assert.equal(calls.filter(c=>c.url.includes('refresh_token')).length,1);
 assert.equal(calls.filter(c=>c.url.includes('/rest/')).length,2);
}
{
 const {api,stored,initial}=setup({refreshStatus:400});await assert.rejects(()=>api.saveArticle(initial,{id:'article'}),/להתחבר מחדש/);
 assert.equal(stored.has(key),false);assert.equal(stored.get('article-draft'),'keep me');
}
for(const options of [{refreshStatus:503},{network:true}]){
 const {api,stored,initial,calls}=setup(options);await assert.rejects(()=>api.saveArticle(initial,{id:'article'}));
 assert(stored.has(key));assert.equal(stored.get('article-draft'),'keep me');assert.equal(calls.length,1);
}
{
 const {api,calls}=setup();await api.request('/rest/v1/electroshop_articles?select=id');
 assert.equal(calls.length,1);assert.equal(calls[0].options.headers.Authorization,'Bearer public');
}
{
 const {api,calls,initial}=setup({expired:false});await api.uploadArticleImage(initial,{type:'image/webp',name:'test.webp'});
 assert.equal(calls.length,1);assert.equal(calls[0].options.headers.Authorization,'Bearer old');
}
assert(fs.readFileSync(new URL('../shop-articles-admin.html',import.meta.url),'utf8').includes('shop-articles-admin.js?v=auth-refresh-2'));
assert(fs.readFileSync(new URL('../shop-articles-admin.js',import.meta.url),'utf8').includes('shop-api.js?v=auth-refresh-2'));
console.log('PASS: expired session save/upload, concurrent refresh, 401 retry, invalid refresh, network recovery, draft preservation and public requests. All requests mocked.');
