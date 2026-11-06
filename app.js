'use strict';
// Cost2Profit: all calculations happen locally. No analytics, network APIs, or accounts.
const STORE_KEY = 'cost2profit-state-v1';
const SAVED_KEY = 'cost2profit-scenarios-v1';
const templates = {
  product: [['Product / materials', 25, 'fixed'], ['Packaging', 3, 'fixed'], ['Delivery', 5, 'fixed'], ['Advertising per sale', 2, 'fixed'], ['Payment processing', 3, 'percent']],
  service: [['Labor per job', 40, 'fixed'], ['Supplies / tools', 5, 'fixed'], ['Other direct costs', 5, 'fixed'], ['Platform / payment fee', 3, 'percent']],
  digital: [['Production allocation', 8, 'fixed'], ['Marketing per sale', 2, 'fixed'], ['Marketplace fee', 10, 'percent'], ['Payment fee', 3, 'percent']],
  custom: [['Direct cost', 25, 'fixed'], ['Other expenses', 5, 'fixed'], ['Transaction fee', 3, 'percent']]
};
function costsFor(type) {return (templates[type] || templates.custom).map(([name,amount,kind])=>({id:uid(),name,amount,kind}));}
function uid(){return Math.random().toString(36).slice(2,11);}
const initial = {businessType:'product',currency:'USD',costs:costsFor('product'),targetMargin:30,currentPrice:65,quantity:100};
function parseStorage(key,fallback){try {const data=JSON.parse(localStorage.getItem(key));return data ?? fallback;}catch{return fallback;}}
function normalNum(n, fallback=0){const x=Number(n);return Number.isFinite(x)?x:fallback;}
function cleanState(raw){
  if(!raw || typeof raw!=='object')return structuredClone(initial);
  const allowedCurrency=['USD','MAD','EUR','GBP','SAR','AED','QAR','CAD','INR','JPY','OTHER'];
  return {
    businessType:templates[raw.businessType]?raw.businessType:'product',
    currency:allowedCurrency.includes(raw.currency)?raw.currency:'USD',
    costs:Array.isArray(raw.costs)?raw.costs.slice(0,60).map(c=>({id:uid(),name:String(c.name??'Expense').slice(0,80),amount:Math.max(0,normalNum(c.amount)),kind:c.kind==='percent'?'percent':'fixed'})):costsFor('product'),
    targetMargin:Math.max(0,Math.min(99.9,normalNum(raw.targetMargin,30))),
    currentPrice:Math.max(0,normalNum(raw.currentPrice,65)),
    quantity:Math.max(1,Math.floor(normalNum(raw.quantity,100)))
  };
}
let state=cleanState(parseStorage(STORE_KEY,initial));
let saved=parseStorage(SAVED_KEY,[]);
if(!Array.isArray(saved))saved=[];
const $=id=>document.getElementById(id);
const money = n => Number.isFinite(n) ? new Intl.NumberFormat('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n) : '—';
const priceLabel = n => state.currency==='OTHER' ? money(n) : `${state.currency} ${money(n)}`;
const pct = n => Number.isFinite(n) ? `${Number(n.toFixed(2)).toLocaleString('en-US')}%` : '—';
const writeText=(id,value)=>{$(id).textContent=value;};
function compute(s){
 const fixed=s.costs.filter(c=>c.kind==='fixed').reduce((a,c)=>a+Math.max(0,normalNum(c.amount)),0);
 const rate=s.costs.filter(c=>c.kind==='percent').reduce((a,c)=>a+Math.max(0,normalNum(c.amount)),0)/100;
 const margin=s.targetMargin/100;
 const denom=1-rate-margin;
 const viable=denom>0;
 const recommended=viable?fixed/denom:NaN;
 const recommendedProfit=viable?recommended*margin:NaN;
 const breakEven=rate<1?fixed/(1-rate):NaN;
 const current=s.currentPrice;
 const fees=current*rate;
 const actualProfit=current-fixed-fees;
 const actualMargin=current>0?100*actualProfit/current:NaN;
 const markup=fixed>0?actualProfit/fixed*100:NaN;
 const projection=actualProfit*s.quantity;
 return {fixed,rate,margin,denom,viable,recommended,recommendedProfit,breakEven,fees,actualProfit,actualMargin,markup,projection};
}
function saveCurrent(){try{localStorage.setItem(STORE_KEY,JSON.stringify(state));}catch{showFeedback('Local storage unavailable. Changes may not be kept.',true);}}
function showFeedback(message,error=false){const el=$('feedback');el.textContent=message;el.style.color=error?'#b44a41':'#17856f';}
function makeInput(value,aria,handler,type='text'){
 const el=document.createElement('input');el.type=type;el.value=String(value);el.setAttribute('aria-label',aria);
 if(type==='number'){el.min='0';el.step='0.01';el.inputMode='decimal';}
 el.addEventListener('input',()=>handler(el.value));return el;
}
function renderCosts(){
 const wrapper=$('costRows');wrapper.replaceChildren();
 state.costs.forEach(cost=>{
  const row=document.createElement('div');row.className='cost-row';
  const name=makeInput(cost.name,'Expense name',v=>{cost.name=v.slice(0,80);saveCurrent();});name.maxLength=80;
  const val=document.createElement('div');val.className='cost-value';
  const kind=document.createElement('select');kind.setAttribute('aria-label','Expense type');
  [['fixed','Amount'],['percent','Percent']].forEach(([v,label])=>{const opt=document.createElement('option');opt.value=v;opt.textContent=label;kind.append(opt);});kind.value=cost.kind;
  kind.addEventListener('change',()=>{cost.kind=kind.value;refresh();});
  const amt=makeInput(cost.amount,'Expense value',v=>{cost.amount=Math.max(0,normalNum(v));refresh(false);},'number');
  const del=document.createElement('button');del.type='button';del.className='delete';del.textContent='×';del.setAttribute('aria-label',`Remove ${cost.name||'expense'}`);del.addEventListener('click',()=>{state.costs=state.costs.filter(c=>c.id!==cost.id);refresh();});
  val.append(kind,amt);row.append(name,val,del);wrapper.append(row);
 });
}
function renderResults(){
 const c=compute(state);
 writeText('fixedTotal',priceLabel(c.fixed));writeText('rateTotal',pct(c.rate*100));
 writeText('recommendedPrice',c.viable?priceLabel(c.recommended):'Not possible');
 writeText('recommendProfit',c.viable?priceLabel(c.recommendedProfit):'—');
 writeText('recommendMargin',pct(state.targetMargin));
 writeText('recommendationSub',c.viable?'Price needed to reach your target net margin.':'Lower your margin target or percentage fees.');
 writeText('actualProfit',priceLabel(c.actualProfit));writeText('actualMargin',pct(c.actualMargin));
 writeText('breakEven',priceLabel(c.breakEven));writeText('markup',pct(c.markup));
 writeText('quantityLabel',state.quantity.toLocaleString('en-US'));writeText('projection',priceLabel(c.projection));
 const status=$('profitStatus');status.classList.toggle('bad',c.actualProfit<0);status.textContent=c.actualProfit<0?'Selling at a loss':c.actualProfit===0?'Breaking even':c.actualMargin>=state.targetMargin?'Target reached':'Profitable · Below target';
 const warn=$('warning');
 let warning='';
 if(c.rate>=1)warning='Percentage-based fees reach or exceed 100% of your selling price. There is no viable break-even price.';
 else if(!c.viable)warning='Your desired profit margin plus percentage-based fees is 100% or more. Reduce either value to calculate a recommended price.';
 else if(c.fixed===0)warning='No fixed costs entered. Add direct costs to make the recommendation useful.';
 if(state.currentPrice===0)warning+=(warning?' ':'')+'Enter a selling price above zero to calculate your actual profit margin.';
 warn.hidden=!warning;warn.textContent=warning;
 const p=state.currentPrice;
 const percent=n=>p>0?Math.max(0,Math.min(100,100*n/p)):0;
 const fixedPart=percent(c.fixed),feePart=percent(c.fees),profitPart=p>0?Math.max(0,Math.min(100-fixedPart-feePart,percent(c.actualProfit))):0;
 $('fixedBar').style.width=fixedPart+'%';$('feeBar').style.width=Math.max(0,Math.min(100-fixedPart,feePart))+'%';$('profitBar').style.width=profitPart+'%';
}
function refresh(rebuild=true){if(rebuild)renderCosts();renderResults();saveCurrent();}
function setMainInputs(){
 $('businessType').value=state.businessType;$('currency').value=state.currency;
 $('targetMargin').value=state.targetMargin;$('marginSlider').value=Math.min(80,state.targetMargin);
 $('currentPrice').value=state.currentPrice;$('quantity').value=state.quantity;
 writeText('currencySymbol',state.currency);
}
function bindInputs(){
 $('businessType').addEventListener('change',e=>{state.businessType=e.target.value;state.costs=costsFor(state.businessType);refresh();});
 $('currency').addEventListener('change',e=>{state.currency=e.target.value;writeText('currencySymbol',state.currency);refresh(false);});
 $('resetPreset').addEventListener('click',()=>{if(confirm('Replace all expenses with this business type’s starter template?')){state.costs=costsFor(state.businessType);refresh();}});
 $('addCost').addEventListener('click',()=>{if(state.costs.length>=60){showFeedback('Maximum of 60 expenses.',true);return;}state.costs.push({id:uid(),name:'New expense',amount:0,kind:'fixed'});refresh();const inputs=$('costRows').querySelectorAll('.cost-row input');if(inputs.length>1)inputs[inputs.length-2].focus();});
 $('targetMargin').addEventListener('input',e=>{state.targetMargin=Math.max(0,Math.min(99.9,normalNum(e.target.value)));$('marginSlider').value=Math.min(80,state.targetMargin);refresh(false);});
 $('targetMargin').addEventListener('change',e=>e.target.value=state.targetMargin);
 $('marginSlider').addEventListener('input',e=>{state.targetMargin=Number(e.target.value);$('targetMargin').value=state.targetMargin;refresh(false);});
 $('currentPrice').addEventListener('input',e=>{state.currentPrice=Math.max(0,normalNum(e.target.value));refresh(false);});
 $('quantity').addEventListener('input',e=>{state.quantity=Math.max(1,Math.floor(normalNum(e.target.value,1)));refresh(false);});
 $('quantity').addEventListener('change',e=>e.target.value=state.quantity);
 $('saveScenario').addEventListener('click',saveScenario);
 $('scenarioName').addEventListener('keydown',e=>{if(e.key==='Enter')saveScenario();});
 $('copySummary').addEventListener('click',copySummary);
}
function saveScenario(){
 const name=$('scenarioName').value.trim()||`${state.businessType} calculation`;
 if(saved.length>=30){showFeedback('Maximum 30 saved calculations. Delete one first.',true);return;}
 saved.unshift({id:uid(),name:name.slice(0,60),state:structuredClone(state),created:new Date().toISOString()});
 try{localStorage.setItem(SAVED_KEY,JSON.stringify(saved));showFeedback('Calculation saved on this device.');$('scenarioName').value='';renderSaved();}catch{saved.shift();showFeedback('Unable to save. Check your browser’s storage settings.',true);}
}
function renderSaved(){
 const wrap=$('savedList');wrap.replaceChildren();
 if(!saved.length){const p=document.createElement('div');p.className='empty-save';p.textContent='No saved calculations yet.';wrap.append(p);return;}
 saved.forEach(item=>{
  if(!item||typeof item!=='object')return;
  const row=document.createElement('div');row.className='saved-item';
  const load=document.createElement('button');load.type='button';load.className='saved-load';load.textContent=item.name||'Untitled';load.title='Load this calculation';
  load.addEventListener('click',()=>{state=cleanState(item.state);setMainInputs();refresh();showFeedback('Saved calculation loaded.');window.scrollTo({top:0,behavior:'smooth'});});
  const del=document.createElement('button');del.type='button';del.className='saved-delete';del.textContent='×';del.setAttribute('aria-label',`Delete ${item.name||'calculation'}`);
  del.addEventListener('click',()=>{saved=saved.filter(s=>s.id!==item.id);try{localStorage.setItem(SAVED_KEY,JSON.stringify(saved));}catch{}renderSaved();showFeedback('Saved calculation deleted.');});
  row.append(load,del);wrap.append(row);
 });
}
async function copySummary(){
 const c=compute(state);
 const lines=[`Cost2Profit — ${state.businessType} pricing summary`,`Fixed costs per sale: ${priceLabel(c.fixed)}`,`Fees based on selling price: ${pct(c.rate*100)}`,`Desired profit margin: ${pct(state.targetMargin)}`,`Recommended selling price: ${c.viable?priceLabel(c.recommended):'Not possible with these settings'}`,`Profit at recommended price: ${c.viable?priceLabel(c.recommendedProfit):'—'}`,`Current selling price: ${priceLabel(state.currentPrice)}`,`Actual net profit per sale: ${priceLabel(c.actualProfit)}`,`Actual net profit margin: ${pct(c.actualMargin)}`,`Projected profit (${state.quantity} sales): ${priceLabel(c.projection)}`];
 try {await navigator.clipboard.writeText(lines.join('\n'));showFeedback('Summary copied to clipboard.');}
 catch {const t=document.createElement('textarea');t.value=lines.join('\n');document.body.append(t);t.select();try{document.execCommand('copy');showFeedback('Summary copied to clipboard.');}catch{showFeedback('Could not copy. Try on HTTPS.',true);}t.remove();}
}
let installPrompt;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('installBtn').hidden=false;});
$('installBtn').addEventListener('click',async()=>{if(!installPrompt)return;installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$('installBtn').hidden=true;});
window.addEventListener('appinstalled',()=>{$('installBtn').hidden=true;});
$('year').textContent=new Date().getFullYear();
setMainInputs();bindInputs();renderSaved();refresh();
if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){
 window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
}
