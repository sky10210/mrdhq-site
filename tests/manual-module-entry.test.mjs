import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const paths=['pfm/unit-3/index.html','business-101/unit-1/index.html','business-101/unit-2/index.html','business-101/unit-3/index.html','ap-business/unit-2/index.html'];
function page(path,reply={success:true},fail=false){
 const html=fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
 const nodes=new Map();const element=id=>{if(!nodes.has(id))nodes.set(id,{value:id==='first'?'Test':id==='last'?'Student':id==='period'?'1':'',textContent:'',style:{},innerHTML:'',hidden:false,disabled:false,classList:{add(){},remove(){},contains(){return false}},querySelectorAll(){return []}});return nodes.get(id)};
 let payload;const context=vm.createContext({document:{getElementById:element,body:{classList:{add(){}}}},window:{},location:{search:''},URLSearchParams,Date,Math,JSON,setTimeout(){},clearTimeout(){},setInterval(){},console,fetch:async(url,options)=>{payload={url,options};if(fail)throw new Error('offline');return {json:async()=>reply}}});
 for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(match[1]).runInContext(context);
 return {html,context,element,get payload(){return payload}};
}
for(const path of paths){
 test(path+' starts without an account and submits typed identity with acknowledgement',async()=>{
  const p=page(path);assert.doesNotMatch(p.html,/firebase|googleLogin|id="authGate"/i);assert.match(p.html,/<section class="card" id="start">/);
  vm.runInContext('begin()',p.context);assert.equal(vm.runInContext('started',p.context),true);
  assert.equal(p.element('first').disabled,true);
  await vm.runInContext("endTime=new Date();submit('A meaningful student reflection with enough detail for this exercise.',75)",p.context);
  assert.equal(p.payload.options.method,'POST');assert.equal(p.payload.options.body.get('manualEntry'),'1');assert.equal(p.payload.options.body.get('firstName'),'Test');assert.equal(p.payload.options.body.has('idToken'),false);
  assert.equal(p.element('saveStatus').textContent,'Score saved to Mr. D. Keep your certificate.');
 });
 test(path+' preserves certificate and allows retries when save fails',async()=>{
  const p=page(path,{},true);vm.runInContext('begin();endTime=new Date()',p.context);await vm.runInContext("submit('Reflection',50)",p.context);
  assert.equal(p.element('retrySave').hidden,false);assert.equal(vm.runInContext('submitted',p.context),false);assert.match(p.element('saveStatus').textContent,/could not be confirmed/);
 });
 test(path+' treats an already-saved session as successful',async()=>{
  const p=page(path,{success:false,error:'This completion was already submitted.'});vm.runInContext('begin();endTime=new Date()',p.context);await vm.runInContext("submit('Reflection',50)",p.context);assert.equal(p.element('retrySave').hidden,true);assert.match(p.element('saveStatus').textContent,/Score saved/);
 });
}
