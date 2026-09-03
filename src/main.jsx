import React,{useEffect,useMemo,useState} from "react";
import {createRoot} from "react-dom/client";
import {supabase} from "./lib/supabase";
import "./styles.css";

const API="https://api.tcgdex.net/v2/en/sets";
const blank={name:"",english_name:"",set_name:"",set_code:"",set_id:"",set_symbol_url:"",card_number:"",language:"English",variant:"Normal",rarity:"",quantity:1,condition:"NM",cost_per_card:"0",status:"available",location_id:"",cardmarket_product_id:"",cardmarket_name:"",cardmarket_expansion:"",cardmarket_language:"",cardmarket_url:""};
const demo=[{id:"d1",name:"Bidoof",set_name:"Brilliant Stars",card_number:"111/172",language:"English",variant:"Normal",quantity:14,status:"available"}];

function nav(path){history.pushState({}, "", path);dispatchEvent(new PopStateEvent("popstate"))}

function App(){
 const [admin,setAdmin]=useState(location.pathname.startsWith("/admin")), [session,setSession]=useState(null);
 useEffect(()=>{const f=()=>setAdmin(location.pathname.startsWith("/admin"));addEventListener("popstate",f);return()=>removeEventListener("popstate",f)},[]);
 useEffect(()=>{if(!supabase)return;supabase.auth.getSession().then(({data})=>setSession(data.session));const {data:l}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));return()=>l.subscription.unsubscribe()},[]);
 return admin?<Admin session={session} publicSite={()=>nav("/")}/>:<Public admin={()=>nav("/admin")}/>;
}

function Public({admin}){
 const [q,setQ]=useState(""),[cards,setCards]=useState([]),[busy,setBusy]=useState(false),[err,setErr]=useState(""); const [filters,setFilters]=useState({language:"",set:"",rarity:"",sort:"name"}),[showFilters,setShowFilters]=useState(false);
 async function search(v=q){
  setBusy(true);setErr("");
  if(!supabase){setCards(demo);setBusy(false);return}
  const {data,error}=await supabase.from("inventory").select("id,quantity,status,cards(id,name,english_name,set_name,card_number,language,variant,rarity,image_url,set_symbol_url)").in("status",["available","listed"]).gt("quantity",0).order("created_at",{ascending:false});
  if(error){setErr(error.message);setCards([])}else{
   let a=(data||[]).map(r=>{const c={...r,...(r.cards||{})};return {...c,display_name:(c.english_name||c.name||"").trim()}});
   if(v.trim())a=a.filter(c=>[c.display_name,c.name,c.set_name,c.card_number,c.language,c.variant,c.set_code].filter(Boolean).join(" ").toLowerCase().includes(v.toLowerCase()));
   if(filters.language)a=a.filter(c=>c.language===filters.language);
   if(filters.set)a=a.filter(c=>c.set_name===filters.set);
   if(filters.rarity)a=a.filter(c=>(c.rarity||"")===filters.rarity);
   if(filters.sort==="name")a.sort((x,y)=>(x.display_name||"").localeCompare(y.display_name||""));
   if(filters.sort==="set")a.sort((x,y)=>(x.set_name||"").localeCompare(y.set_name||"")||(x.card_number||"").localeCompare(y.card_number||"",undefined,{numeric:true}));
   if(filters.sort==="number")a.sort((x,y)=>(x.card_number||"").localeCompare(y.card_number||"",undefined,{numeric:true}));
   if(filters.sort==="quantity")a.sort((x,y)=>Number(y.quantity||0)-Number(x.quantity||0));
   setCards(a);
  }
  setBusy(false);
 }
 useEffect(()=>{search("")},[]); useEffect(()=>{search(q)},[filters]);
 return <div className="shell"><header><div className="brand"><strong>PP</strong><div><b>Paul's Poke Pulls</b><small>Pokémon TCG Business</small></div></div><button className="ghost" onClick={admin}>Admin</button></header><main className="main"><section className="hero"><span className="eyebrow">PAUL'S POKE PULLS</span><h1>Find a card.</h1><p>Search the catalogue to see what's currently available.</p><div className="search"><input value={q} onChange={e=>{setQ(e.target.value);search(e.target.value)}} placeholder="Pokémon, set, card number, language..."/><button onClick={()=>search(q)}>Search</button></div><div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:10}}>
 <button className="ghost" onClick={()=>setShowFilters(x=>!x)}>{showFilters?"Hide filters":"Filters"}</button>
 {(filters.language||filters.set||filters.rarity)&&<button className="ghost" onClick={()=>setFilters({language:"",set:"",rarity:"",sort:"name"})}>Clear filters</button>}
 {showFilters&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:8,width:"100%"}}>
  <select value={filters.language} onChange={e=>setFilters(f=>({...f,language:e.target.value}))}><option value="">All languages</option>{[...new Set(cards.map(c=>c.language).filter(Boolean))].sort().map(x=><option key={x}>{x}</option>)}</select>
  <select value={filters.set} onChange={e=>setFilters(f=>({...f,set:e.target.value}))}><option value="">All sets</option>{[...new Set(cards.map(c=>c.set_name).filter(Boolean))].sort().map(x=><option key={x}>{x}</option>)}</select>
  <select value={filters.rarity} onChange={e=>setFilters(f=>({...f,rarity:e.target.value}))}><option value="">All rarities</option>{[...new Set(cards.map(c=>c.rarity).filter(Boolean))].sort().map(x=><option key={x}>{x}</option>)}</select>
  <select value={filters.sort} onChange={e=>setFilters(f=>({...f,sort:e.target.value}))}><option value="name">Sort: Pokémon</option><option value="set">Sort: Set</option><option value="number">Sort: Card number</option><option value="quantity">Sort: Quantity</option></select>
 </div>}
</div></section>{err&&<div className="alert">{err}</div>}<section><div className="heading"><div><span className="eyebrow">IN STOCK</span><h2>{q?`Results for “${q}”`:"Catalogue"}</h2></div><small>{busy?"Loading…":`${cards.length} results`}</small></div><div className="grid">{cards.map(c=><article className="tile" key={c.id}><div className="art">{c.image_url?<img src={c.image_url} alt={c.name}/>:<b>POKÉMON</b>}</div><div className="info"><h3>{c.display_name||c.name}</h3><p>{c.set_name} · {c.card_number||"—"}</p><div className="tags"><span>{c.language}</span><span>{c.variant}</span></div><div className="stock">● Available</div></div></article>)}</div>{!busy&&!cards.length&&<div className="empty"><b>?</b><h3>No cards found</h3><p>Try another search.</p></div>}</section></main></div>
}

function Admin({session,publicSite}){
 const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[msg,setMsg]=useState(""),[tab,setTab]=useState("dashboard");
 const [inv,setInv]=useState([]),[locations,setLocations]=useState([]),[sets,setSets]=useState([]),[setSearchValue,setSetSearchValue]=useState("");
 const [q,setQ]=useState(""),[busy,setBusy]=useState(false),[form,setForm]=useState(blank),[editing,setEditing]=useState(null),[showForm,setShowForm]=useState(false);
 const [marketValue,setMarketValue]=useState(0),[marketValueEur,setMarketValueEur]=useState(0),[eurToGbp,setEurToGbp]=useState(null),[pricedCount,setPricedCount]=useState(0),[priceCardCount,setPriceCardCount]=useState(0);

 async function login(e){e.preventDefault();setBusy(true);setMsg("");if(!supabase){setMsg("Supabase is not connected.");setBusy(false);return}const {error}=await supabase.auth.signInWithPassword({email,password});if(error)setMsg(error.message);setBusy(false)}

 async function load(){
  if(!supabase)return;
  const [i,l]=await Promise.all([
   supabase.from("inventory").select("id,quantity,condition,status,cost_per_card,location_id,cards(id,name,english_name,set_name,set_code,set_id,set_symbol_url,card_number,language,variant,rarity,cardmarket_product_id,cardmarket_name,cardmarket_expansion,cardmarket_language,cardmarket_url)").order("created_at",{ascending:false}),
   supabase.from("locations").select("id,name").order("name")
  ]);
  if(i.error){setMsg(i.error.message);return}
  const inventory=i.data||[];
  setInv(inventory);
  if(!l.error)setLocations(l.data||[]);

  const ids=[...new Set(inventory.map(r=>String(r.cards?.cardmarket_product_id||"").trim()).filter(Boolean))];
  if(!ids.length){setMarketValue(0);setPricedCount(0);setPriceCardCount(0);return}
  const prices={};
  for(let n=0;n<ids.length;n+=100){
   const {data,error}=await supabase.from("cardmarket_price_guide").select("id_product,trend").in("id_product",ids.slice(n,n+100).map(Number));
   if(error){setMsg(error.message);break}
   for(const row of data||[]){prices[String(row.id_product)] = Number(row.trend||0)}
  }
  let value=0,priced=0,physicalPriced=0;
  for(const row of inventory){
   const id=String(row.cards?.cardmarket_product_id||"").trim();
   const trend=prices[id];
   if(id && Number.isFinite(trend)){
    priced++;
    const qty=Number(row.quantity||0);
    physicalPriced+=qty;
    value+=trend*qty;
   }
  }
  setMarketValueEur(value);setPricedCount(priced);setPriceCardCount(physicalPriced);
  try{
   const fx=await fetch("https://data-api.ecb.europa.eu/service/data/EXR/D.GBP.EUR.SP00.A?format=jsondata");
   if(!fx.ok)throw new Error("FX unavailable");
   const json=await fx.json();
   const rate=Number(json?.dataSets?.[0]?.series?.["0:0:0:0:0"]?.observations?.[Object.keys(json?.dataSets?.[0]?.series?.["0:0:0:0:0"]?.observations||{}).pop()]?.[0]);
   if(Number.isFinite(rate)&&rate>0){setEurToGbp(rate);setMarketValue(value*rate)}else throw new Error("Invalid FX rate");
  }catch(e){setEurToGbp(null);setMarketValue(value)}
 }
 async function loadSets(){
  try{const r=await fetch(API);if(!r.ok)throw new Error("Set database unavailable");const data=await r.json();setSets(data||[])}
  catch(e){setMsg("Could not load the Pokémon set list. You can still enter a set manually.");setSets([])}
 }
 useEffect(()=>{if(session){load();loadSets()}},[session]);

 async function saveCard(e){
  e.preventDefault();setBusy(true);setMsg("");
  const cardPayload={name:form.name.trim(),english_name:(form.english_name||form.name||"").trim(),set_name:form.set_name.trim(),set_code:form.set_code||null,set_id:form.set_id||null,set_symbol_url:form.set_symbol_url||null,card_number:form.card_number||null,language:form.language,variant:form.variant,rarity:form.rarity||null,cardmarket_product_id:form.cardmarket_product_id||null,cardmarket_name:form.cardmarket_name||null,cardmarket_expansion:form.cardmarket_expansion||null,cardmarket_language:form.cardmarket_language||null,cardmarket_url:form.cardmarket_url||null};
  if(editing){
   const {error:ce}=await supabase.from("cards").update(cardPayload).eq("id",editing.cards.id);
   if(ce){setMsg(ce.message);setBusy(false);return}
   const {error:ie}=await supabase.from("inventory").update({quantity:Number(form.quantity),condition:form.condition,cost_per_card:Number(form.cost_per_card||0),status:form.status,location_id:form.location_id||null}).eq("id",editing.id);
   if(ie)setMsg(ie.message);else{setMsg("Card updated successfully.");closeForm();await load()}
  }else{
   const {data:card,error:ce}=await supabase.from("cards").insert(cardPayload).select().single();
   if(ce){setMsg(ce.code==="23505"?"That exact card already exists. Use Edit on the existing inventory row or add stock through the batch tools.":ce.message);setBusy(false);return}
   const {error:ie}=await supabase.from("inventory").insert({card_id:card.id,quantity:Number(form.quantity),condition:form.condition,cost_per_card:Number(form.cost_per_card||0),status:form.status,location_id:form.location_id||null});
   if(ie)setMsg(ie.message);else{setMsg("Card added successfully.");closeForm();await load()}
  }
  setBusy(false)
 }
 async function deleteCard(row){
  if(!row?.id)return;
  const label=`${row.cards?.name||"this card"}${row.cards?.set_name?` — ${row.cards.set_name}`:""}`;
  if(!window.confirm(`Delete ${label} from your inventory? This cannot be undone.`))return;
  setBusy(true);setMsg("");
  const cardId=row.cards?.id||row.card_id;
  const {error}=await supabase.from("inventory").delete().eq("id",row.id);
  if(error){setMsg(error.message);setBusy(false);return}
  if(cardId){
   const {data:remaining,error:re}=await supabase.from("inventory").select("id").eq("card_id",cardId).limit(1);
   if(re){setMsg(re.message);setBusy(false);return}
   if(!remaining?.length){
    const {error:de}=await supabase.from("cards").delete().eq("id",cardId);
    if(de){setMsg(de.message);setBusy(false);return}
   }
  }
  await load();
  setMsg("Inventory row deleted.");
  setBusy(false);
 }
 function openAdd(){setEditing(null);setForm(blank);setSetSearchValue("");setMsg("");setShowForm(true)}
 function openEdit(row){
  const c=row.cards||{};
  setEditing(row);
  setForm({name:c.name||"",english_name:c.english_name||c.name||"",set_name:c.set_name||"",set_code:c.set_code||"",set_id:c.set_id||"",set_symbol_url:c.set_symbol_url||"",card_number:c.card_number||"",language:c.language||"English",variant:c.variant||"Normal",rarity:c.rarity||"",quantity:row.quantity||1,condition:row.condition||"NM",cost_per_card:row.cost_per_card||"0",status:row.status||"available",location_id:row.location_id||"",cardmarket_product_id:c.cardmarket_product_id||"",cardmarket_name:c.cardmarket_name||"",cardmarket_expansion:c.cardmarket_expansion||"",cardmarket_language:c.cardmarket_language||"",cardmarket_url:c.cardmarket_url||""});
  setSetSearchValue(c.set_name||"");setMsg("");setShowForm(true)
 }
 function closeForm(){setShowForm(false);setEditing(null);setForm(blank);setSetSearchValue("");setMsg("")}
 const filtered=useMemo(()=>{const x=q.toLowerCase().trim();return inv.filter(r=>!x||[r.cards?.name,r.cards?.set_name,r.cards?.card_number,r.cards?.language,r.cards?.variant,r.cards?.set_code].filter(Boolean).join(" ").toLowerCase().includes(x))},[inv,q]);
 const filteredSets=useMemo(()=>{const x=(setSearchValue||"").toLowerCase().trim();return (x?sets.filter(s=>`${s.name||""} ${s.id||""}`.toLowerCase().includes(x)):sets).slice(0,200)},[sets,setSearchValue]);

 if(!session)return <div className="login"><button className="back" onClick={publicSite}>← Public catalogue</button><div className="loginbox"><strong className="mark">PP</strong><span className="eyebrow">PRIVATE AREA</span><h1>Admin login</h1><p>Manage your Pokémon TCG business.</p><form onSubmit={login}><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>{msg&&<div className="alert">{msg}</div>}<button disabled={busy}>{busy?"Signing in…":"Sign in"}</button></form></div></div>;

 return <div className={tab==="scanner"?"admin scanner-mode":"admin"}><header><div className="brand"><strong>PP</strong><div><b>Paul's Poke Pulls</b><small>Business Manager</small></div></div><div className="actions"><button className="ghost" onClick={publicSite}>Public site</button><button className="ghost" onClick={()=>supabase.auth.signOut()}>Sign out</button></div></header><main className="adminmain"><div className="admintitle"><div><span className="eyebrow">PRIVATE DASHBOARD</span><h1>Business command centre.</h1></div><button onClick={load}>Refresh</button></div>{msg&&<div className="alert">{msg}</div>}<nav className="tabs">{["dashboard","inventory","batch","cardmarket","scanner","locations"].map(t=><button className={tab===t?"active":""} onClick={()=>setTab(t)} key={t}>{t==="dashboard"?"Dashboard":t==="inventory"?"Inventory":t==="batch"?"Batch tools":t==="cardmarket"?"Cardmarket":t==="scanner"?"Scanner":"Locations"}</button>)}</nav>
 {tab==="dashboard"&&<><div className="stats"><div><small>Unique inventory</small><b>{inv.length.toLocaleString()}</b></div><div><small>Physical cards</small><b>{inv.reduce((s,r)=>s+Number(r.quantity||0),0).toLocaleString()}</b></div><div><small>Market value</small><b>£{marketValue.toFixed(2)}</b><small style={{display:"block",marginTop:4}}>{pricedCount.toLocaleString()} / {inv.length.toLocaleString()} priced · {priceCardCount.toLocaleString()} physical{eurToGbp?` · €${marketValueEur.toFixed(2)} @ £${eurToGbp.toFixed(4)}/€`:""}</small></div><div><small>ACE grading</small><b>Coming next</b></div></div><div className="panel"><span className="eyebrow">NEXT UP</span><h2>Automation roadmap</h2><p>Set selection, Cardmarket matching and market pricing are now live. Next we'll expand batch import, scanning, sales, ACE grading and accounting.</p></div></>}
 {tab==="inventory"&&<><div className="toolbar"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search your full inventory..."/><button onClick={openAdd}>＋ Add card</button></div><div className="panel"><div className="list">{filtered.slice(0,200).map(r=><div className="row" key={r.id}><div className="rowmain">{r.cards?.set_symbol_url?<img className="setmini" src={r.cards.set_symbol_url} alt=""/>:null}<div><b>{r.cards?.name}</b><small>{r.cards?.set_name} · {r.cards?.card_number}</small></div></div><div className="rowright"><span>{r.cards?.language} · {r.cards?.variant} · ×{r.quantity} · {r.status}</span><button className="editbtn" onClick={()=>openEdit(r)} disabled={busy}>Edit</button><button className="deletebtn" onClick={()=>deleteCard(r)} disabled={busy}>Delete</button></div></div>)}</div></div></>}
 {tab==="batch"&&<BatchTool inventory={inv} onDone={load}/>} {tab==="cardmarket"&&<CardmarketMatcher inventory={inv} onDone={load}/>}
 {tab==="scanner"&&<CardScanner/>}
 {tab==="locations"&&<Locations locations={locations} onDone={load}/>}
 </main>{showForm&&<CardModal form={form} setForm={setForm} locations={locations} sets={sets} setSearch={setSetSearchValue} setSearchValue={setSearchValue} editing={editing} busy={busy} msg={msg} close={closeForm} submit={saveCard}/>}</div>
}

const TCG_LANGS={English:"en",Japanese:"ja",Chinese:"zh-tw",Korean:"ko",German:"de",French:"fr",Spanish:"es",Portuguese:"pt",Polish:"pl",Russian:"ru",Italian:"it",Indonesian:"id",Thai:"th"};
const TCG_LANGUAGE_OPTIONS=Object.keys(TCG_LANGS);

function CardModal({form,setForm,locations,sets,setSearch,setSearchValue,editing,busy,msg,close,submit}){
 const [setOpen,setSetOpen]=useState(false);
 const [cardOpen,setCardOpen]=useState(false);
 const [cardQuery,setCardQuery]=useState(form.card_number||"");
 const [cards,setCards]=useState([]);
 const [cardBusy,setCardBusy]=useState(false);
 const [languageSets,setLanguageSets]=useState(sets||[]);
 const [setBusy,setSetBusy]=useState(false);
 const set=(k,v)=>setForm(f=>({...f,[k]:v}));
 const apiLang=TCG_LANGS[form.language]||"en";
 const [englishCards,setEnglishCards]=useState([]);
 const [englishCardBusy,setEnglishCardBusy]=useState(false);

 async function getEnglishPokemonName(card){
   if(apiLang==="en")return card?.name||"";
   const dexId=Array.isArray(card?.dexId)?card.dexId[0]:card?.dexId;
   if(dexId){
    try{
     const r=await fetch(`https://pokeapi.co/api/v2/pokemon-species/${encodeURIComponent(dexId)}`);
     if(r.ok){
      const species=await r.json();
      const en=(species.names||[]).find(n=>n.language?.name==="en");
      if(en?.name)return en.name;
      if(species.name)return species.name.replace(/-/g," ");
     }
    }catch(e){}
   }
   return card?.name||"";
 }

 useEffect(()=>{setLanguageSets(sets||[])},[sets]);

 async function fetchSetsForLanguage(lang){
   try{
     const r=await fetch(`https://api.tcgdex.net/v2/${lang}/sets`);
     if(!r.ok)throw new Error("set list failed");
     const data=await r.json();
     return Array.isArray(data)?data:[];
   }catch(e){return []}
 }

 // Load the selected language's set list when the modal opens.
 useEffect(()=>{
   let cancelled=false;
   const lang=TCG_LANGS[form.language]||"en";
   setSetBusy(true);
   fetchSetsForLanguage(lang).then(list=>{
     if(!cancelled&&list.length)setLanguageSets(list);
   }).finally(()=>{if(!cancelled)setSetBusy(false)});
   return()=>{cancelled=true};
 },[form.language]);

 const filteredSets=useMemo(()=>{
   const q=(setSearchValue||"").toLowerCase().trim();
   return (q?languageSets.filter(x=>`${x.name||""} ${x.id||""}`.toLowerCase().includes(q)):languageSets).slice(0,30);
 },[languageSets,setSearchValue]);

 async function chooseSet(x){
   setSetOpen(false);
   setCardQuery("");
   setCards([]);
   let full=x;
   try{
     const r=await fetch(`https://api.tcgdex.net/v2/${apiLang}/sets/${encodeURIComponent(x.id)}`);
     if(r.ok)full=await r.json();
   }catch(e){}
   setForm(f=>({...f,
     set_id:full.id||x.id||"",
     set_code:full.id||x.id||"",
     set_name:full.name||x.name||"",
     set_symbol_url:full.symbol||x.symbol||"",
     tcgdex_language:apiLang
   }));
   setSearch(full.name||x.name||"");
 }

 async function changeLanguage(e){
   const language=e.target.value;
   set("language",language);
   setSetOpen(false);
   setCardOpen(false);
   setCards([]);
   setSearch("");
 }

 async function searchCards(value){
   setCardQuery(value);
   set("card_number",value);
   if(!form.set_id||!value.trim()){setCards([]);return}
   setCardBusy(true);
   try{
    const r=await fetch(`https://api.tcgdex.net/v2/${apiLang}/sets/${encodeURIComponent(form.set_id)}`);
    if(!r.ok)throw new Error("card lookup failed");
    const data=await r.json();
    const q=value.toLowerCase().trim();
    const langCards=(data.cards||[]).slice(0,200);
    if(apiLang==="en"){
     setCards(langCards.filter(c=>`${c.localId||""} ${c.name||""}`.toLowerCase().includes(q)).slice(0,20));
    }else{
     const enriched=await Promise.all(langCards.map(async c=>{
      const dexId=Array.isArray(c.dexId)?c.dexId[0]:c.dexId;
      if(!dexId)return {...c,englishName:""};
      try{
       const sr=await fetch(`https://pokeapi.co/api/v2/pokemon-species/${encodeURIComponent(dexId)}`);
       if(sr.ok){
        const species=await sr.json();
        const en=(species.names||[]).find(n=>n.language?.name==="en");
        return {...c,englishName:en?.name||species.name||""};
       }
      }catch(e){}
      return {...c,englishName:""};
     }));
     setCards(enriched.filter(c=>`${c.localId||""} ${c.name||""} ${c.englishName||""}`.toLowerCase().includes(q)).slice(0,20));
    }
   }catch(e){setCards([])}
   finally{setCardBusy(false)}
 }

 async function chooseCard(c){
   let full=c;
   try{
     const r=await fetch(`https://api.tcgdex.net/v2/${apiLang}/cards/${encodeURIComponent(c.id)}`);
     if(r.ok)full=await r.json();
   }catch(e){}
   const englishName=await getEnglishPokemonName(full);
   setForm(f=>({...f,
     name:englishName||full.name||f.name,
     english_name:englishName||full.name||f.english_name||f.name,
     card_number:full.localId||f.card_number,
     rarity:full.rarity||f.rarity,
     set_id:full.set?.id||f.set_id,
     set_code:full.set?.id||f.set_code,
     set_name:full.set?.name||f.set_name,
     set_symbol_url:full.set?.symbol||f.set_symbol_url,
     image_url:full.image||f.image_url||"",
     tcgdex_language:apiLang
   }));
   setCardQuery(full.localId||"");
   setCards([]);
   setCardOpen(false);
 }

 return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}>
  <div className="modal" onMouseDown={e=>e.stopPropagation()}>
   <div className="modalhead"><div><span className="eyebrow">{editing?"EDIT INVENTORY":"NEW STOCK"}</span><h2>{editing?"Edit card":"Add card"}</h2></div><button type="button" className="x" onClick={close}>×</button></div>
   <form onSubmit={submit}>
    <label>Language
      <select value={form.language||"English"} onChange={changeLanguage}>
       {TCG_LANGUAGE_OPTIONS.map(x=><option key={x}>{x}</option>)}
      </select>
    </label>

    <div className="autocomplete">
     <label>Set name or set ID</label>
     <input value={setSearchValue||""} onFocus={()=>setSetOpen(true)} onChange={e=>{setSearch(e.target.value);setSetOpen(true)}} placeholder={form.language==="Japanese"?"e.g. sv1V or バイオレットex":"Search set name or code — e.g. Jungle, sv06"}/>
     {setOpen&&<div className="suggestions">
      {setBusy&&<div className="noresults">Loading {form.language||"English"} sets…</div>}
      {!setBusy&&filteredSets.map(x=><button type="button" className="suggestion" key={`${x.id}-${x.name}`} onClick={()=>chooseSet(x)}>
       {x.symbol?<img src={`${x.symbol}.webp`} alt="" onError={e=>{if(e.currentTarget.src!==x.symbol)e.currentTarget.src=x.symbol}}/>:<span className="symbolplaceholder">◈</span>}
       <span><b>{x.name}</b><small>{x.id}</small></span>
      </button>)}
      {!setBusy&&!filteredSets.length&&<div className="noresults">No matching set. Try the exact set ID.</div>}
     </div>}
    </div>

    {form.set_id&&<div className="setpreview">
     {form.set_symbol_url?<img src={`${form.set_symbol_url}.webp`} alt="Set symbol" onError={e=>{if(e.currentTarget.src!==form.set_symbol_url)e.currentTarget.src=form.set_symbol_url;else e.currentTarget.style.display="none"}}/>:<span className="symbolplaceholder">◈</span>}
     <span><b>{form.set_name}</b><small>{form.set_code} · {form.language||"English"}</small></span>
    </div>}

    <div className="autocomplete">
     <label>Card number / Pokémon</label>
     <input value={cardQuery} onFocus={()=>setCardOpen(true)} onChange={e=>{setCardOpen(true);searchCards(e.target.value)}} placeholder={form.set_id?"e.g. 32 or Pokémon name":"Select a set first"} disabled={!form.set_id}/>
     {cardOpen&&form.set_id&&cardQuery.trim()&&<div className="suggestions">
      {cardBusy&&<div className="noresults">Searching {form.language||"English"} cards…</div>}
      {!cardBusy&&cards.map(c=><button type="button" className="suggestion" key={c.id} onClick={()=>chooseCard(c)}>
       {c.image?<img className="cardthumb" src={c.image} alt=""/>:null}
       <span><b>#{c.localId} {c.englishName||c.name}</b><small>{c.englishName&&c.englishName!==c.name?`${c.name} · ${c.rarity||"Card"}`:(c.rarity||"Card")}</small></span>
      </button>)}
      {!cardBusy&&!cards.length&&<div className="noresults">No matching card. You can enter it manually below.</div>}
     </div>}
    </div>

    {form.image_url&&<div className="selected-card-preview"><img src={form.image_url} alt={form.name||"Card"}/><div><b>{form.name||"Selected card"}</b><small>{form.set_name} · #{form.card_number}</small></div></div>}

    <div className="two">
     <label>Card name<input required value={form.name||""} onChange={e=>set("name",e.target.value)}/></label>
     <label>Card number<input value={form.card_number||""} onChange={e=>{set("card_number",e.target.value);setCardQuery(e.target.value)}}/></label>
     <label>Variant<input value={form.variant||"Normal"} onChange={e=>set("variant",e.target.value)}/></label>
     <label>Condition<input value={form.condition||"NM"} onChange={e=>set("condition",e.target.value)}/></label>
     <label>Quantity<input type="number" min="1" value={form.quantity||1} onChange={e=>set("quantity",e.target.value)}/></label>
     <label>Cost / card (£)<input type="number" step="0.0001" min="0" value={form.cost_per_card||0} onChange={e=>set("cost_per_card",e.target.value)}/></label>
     <label>Rarity<input value={form.rarity||""} onChange={e=>set("rarity",e.target.value)}/></label>
    </div>
    <label>Storage location<select value={form.location_id||""} onChange={e=>set("location_id",e.target.value)}><option value="">No location yet</option>{locations.map(l=><option value={l.id} key={l.id}>{l.name}</option>)}</select></label>
    <div className="panel" style={{marginTop:12}}>
     <span className="eyebrow">CARDMARKET MATCH</span>
     <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center"}}><div><b>{form.cardmarket_product_id?`Matched · Product ${form.cardmarket_product_id}`:"Not matched yet"}</b><small style={{display:"block",marginTop:3}}>{form.cardmarket_name||"Match the exact Cardmarket product before pricing is imported."}</small></div><a href="https://www.cardmarket.com/en/Pokemon/Products/Singles" target="_blank" rel="noreferrer">Open Cardmarket</a></div>
     <div className="two" style={{marginTop:10}}>
      <label>Product ID<input value={form.cardmarket_product_id||""} onChange={e=>set("cardmarket_product_id",e.target.value.trim())} placeholder="e.g. 123456"/></label>
      <label>Cardmarket name<input value={form.cardmarket_name||""} onChange={e=>set("cardmarket_name",e.target.value)} placeholder="Exact product name"/></label>
      <label>Expansion<input value={form.cardmarket_expansion||""} onChange={e=>set("cardmarket_expansion",e.target.value)} placeholder="Cardmarket expansion"/></label>
      <label>Language<input value={form.cardmarket_language||""} onChange={e=>set("cardmarket_language",e.target.value)} placeholder="English / Japanese / etc."/></label>
      <label>Product URL<input value={form.cardmarket_url||""} onChange={e=>set("cardmarket_url",e.target.value)} placeholder="Exact product URL"/></label>
     </div>
    </div>
    {msg&&<div className="alert">{msg}</div>}
    <div className="modalactions"><button type="button" className="ghost" onClick={close}>Cancel</button><button type="submit" disabled={busy}>{busy?(editing?"Saving…":"Adding…"):(editing?"Save changes":"Add to inventory")}</button></div>
   </form>
  </div>
 </div>
}
function CardmarketMatcher({inventory,onDone}){
 const [q,setQ]=useState(""),[selected,setSelected]=useState(null),[busy,setBusy]=useState(false),[msg,setMsg]=useState(""),[matches,setMatches]=useState([]);
 const [prices,setPrices]=useState({}),[autoBusy,setAutoBusy]=useState(false),[autoResult,setAutoResult]=useState(null);

 const rows=inventory.filter(r=>{
  const c=r.cards||{},x=q.toLowerCase().trim();
  return !x||[c.english_name,c.name,c.set_name,c.card_number,c.language,c.cardmarket_product_id,c.set_code].filter(Boolean).join(" ").toLowerCase().includes(x)
 });

 async function loadPrices(rows){
  const ids=[...new Set(rows.map(r=>String(r.cards?.cardmarket_product_id||"").trim()).filter(Boolean))].map(Number).filter(Number.isFinite);
  if(!ids.length){setPrices({});return}
  const out={};
  for(let i=0;i<ids.length;i+=100){
   const {data,error}=await supabase.from("cardmarket_price_guide").select("id_product,low,trend,avg,avg1,avg7,avg30,low_holo,trend_holo,avg_holo").in("id_product",ids.slice(i,i+100));
   if(!error)(data||[]).forEach(x=>{out[String(x.id_product)]=x});
  }
  setPrices(out);
 }
 const rowsForPricing=inventory.filter(r=>{
  const c=r.cards||{},x=q.toLowerCase().trim();
  return !x||[c.english_name,c.name,c.set_name,c.card_number,c.language,c.cardmarket_product_id,c.set_code].filter(Boolean).join(" ").toLowerCase().includes(x)
 });
 useEffect(()=>{loadPrices(rowsForPricing)},[inventory,q]);

 function norm(v){return String(v||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim()}

 function tcgdexLanguage(c){
  const raw=String(c?.language||"").trim().toLowerCase();
  const map={english:"en",en:"en",french:"fr",fr:"fr",spanish:"es",es:"es",italian:"it",it:"it",portuguese:"pt",pt:"pt",
   "brazilian portuguese":"pt-br","portuguese (brazil)":"pt-br","pt-br":"pt-br",german:"de",de:"de",dutch:"nl",nl:"nl",
   polish:"pl",pl:"pl",russian:"ru",ru:"ru",japanese:"ja",ja:"ja",korean:"ko",ko:"ko",chinese:"zh-tw",
   "traditional chinese":"zh-tw","simplified chinese":"zh-cn","chinese traditional":"zh-tw","chinese simplified":"zh-cn",
   "zh-tw":"zh-tw","zh-cn":"zh-cn",indonesian:"id",id:"id",thai:"th",th:"th"};
  return map[raw]||"en";
 }

 async function getTcgdexCard(c){
  const setKey=String(c.set_id||c.set_code||"").trim();
  if(!setKey)return null;
  const lang=tcgdexLanguage(c);
  try{
   const sr=await fetch(`https://api.tcgdex.net/v2/${encodeURIComponent(lang)}/sets/${encodeURIComponent(setKey)}`);
   if(!sr.ok)return null;
   const setData=await sr.json();
   const local=String(c.card_number||"").split("/")[0].replace(/^0+/g,"")||"";
   const cards=setData.cards||[];
   let summary=cards.find(x=>String(x.localId||"").replace(/^0+/g,"")===local);
   if(!summary && c.english_name)summary=cards.find(x=>norm(x.name)===norm(c.english_name));
   if(!summary)return {setData,summary:null,detail:null,lang};
   let detail=summary;
   const cardId=summary.id||`${setKey}-${summary.localId}`;
   const cr=await fetch(`https://api.tcgdex.net/v2/${encodeURIComponent(lang)}/cards/${encodeURIComponent(cardId)}`);
   if(cr.ok)detail=await cr.json();
   return {setData,summary,detail,lang};
  }catch(_){return null}
 }

 async function searchCardmarketMatches(r){
  const c=r.cards||{},wanted=String(c.english_name||c.name||"").trim().replace(/[%_]/g,"");
  if(!wanted)return [];
  const tcg=await getTcgdexCard(c);
  // Prefer TCGdex's exact Cardmarket product mapping. This avoids ambiguous
  // name/metacard matching (e.g. Minun 061 vs Minun 194).
  const detailed=Array.isArray(tcg?.detail?.variants_detailed)?tcg.detail.variants_detailed:[];
  const wantedVariant=String(c.variant||"Normal").toLowerCase();
  const preferred=wantedVariant.includes("reverse")?["reverse"]:["normal"];
  const exactVariant=detailed.find(v=>preferred.includes(String(v?.type||"").toLowerCase())&&v?.pricing?.cardmarket?.idProduct)
    || detailed.find(v=>v?.pricing?.cardmarket?.idProduct);
  const exactId=exactVariant?.pricing?.cardmarket?.idProduct;
  if(exactId){
   const {data,error}=await supabase.from("cardmarket_catalogue")
    .select("id_product,name,category_id,category_name,expansion_id,metacard_id,date_added")
    .eq("id_product",String(exactId)).maybeSingle();
   if(error)throw error;
   let price=prices[String(exactId)]||null;
   if(!price){
    const {data:priceData,error:priceError}=await supabase.from("cardmarket_price_guide").select("id_product,low,trend,avg,avg1,avg7,avg30,low_holo,trend_holo,avg_holo").eq("id_product",Number(exactId)).maybeSingle();
    if(priceError)throw priceError;
    price=priceData||null;
    if(price)setPrices(prev=>({...prev,[String(exactId)]:price}));
   }
   if(data)return [{...data,score:1000,exact_tcgdex_match:true,price,
    expansion_distance_days:null,tcg_set:tcg?.setData?.name||c.set_name||"",
    tcg_attacks:(tcg?.detail?.attacks||[]).map(a=>norm(a.name)).filter(Boolean)}];
   // Local Cardmarket catalogue may be stale, but TCGdex still gives us the
   // exact product ID. Return it so manual/auto matching can use the exact ID.
   return [{id_product:String(exactId),name:null,category_id:"51",category_name:"Pokemon Singles",
    expansion_id:null,metacard_id:null,date_added:null,score:1000,exact_tcgdex_match:true,price,
    expansion_distance_days:null,tcg_set:tcg?.setData?.name||c.set_name||"",
    tcg_attacks:(tcg?.detail?.attacks||[]).map(a=>norm(a.name)).filter(Boolean)}];
  }
  const releaseDate=tcg?.setData?.releaseDate?new Date(tcg.setData.releaseDate):null;
  const tcgAttacks=(tcg?.detail?.attacks||[]).map(a=>norm(a.name)).filter(Boolean);
  const terms=[wanted,c.name].map(x=>String(x||"").trim().replace(/[%_]/g,"")).filter(Boolean);
  const all=new Map();
  for(const term of [...new Set(terms.map(norm))]){
   // Cardmarket names contain the Pokémon name followed by bracketed
   // attack/ability text, e.g. "Pikachu [Attack | Attack]".
   // Search the name first, then filter to Pokémon Singles in JavaScript.
   // This avoids category_id type/schema differences causing valid searches
   // to return zero rows.
   const {data,error}=await supabase.from("cardmarket_catalogue")
    .select("id_product,name,category_id,category_name,expansion_id,metacard_id,date_added")
    .ilike("name",`%${term}%`).limit(500);
   if(error)throw error;
   for(const x of (data||[])){
    if(String(x.category_id)==="51")all.set(String(x.id_product),x);
   }
  }
  const data=[...all.values()],groups=new Map();
  for(const x of data){const k=String(x.expansion_id||"");if(!groups.has(k))groups.set(k,[]);groups.get(k).push(x)}
  const expansionDistance=new Map();
  for(const [k,items] of groups){
   const dates=items.map(x=>x.date_added&&x.date_added!=="0000-00-00 00:00:00"?new Date(String(x.date_added).replace(" ","T")):null).filter(d=>d&&!Number.isNaN(d.getTime()));
   const dist=releaseDate&&dates.length?Math.min(...dates.map(d=>Math.abs(d-releaseDate)/86400000)):Infinity;
   expansionDistance.set(k,dist);
  }
  const wn=norm(wanted);
  return data.map(x=>{
   // Ignore Cardmarket's bracketed attack/ability suffix for the main name
   // comparison, while still using the full name for attack matching below.
   const rawName=String(x.name||"");
   const baseName=rawName.split("[")[0].trim();
   const pn=norm(baseName),fullPn=norm(rawName);let score=0;
   if(pn===wn)score+=120;else if(pn.startsWith(wn+" "))score+=95;else if(fullPn.includes(wn))score+=55;
   const dist=expansionDistance.get(String(x.expansion_id));
   if(Number.isFinite(dist))score+=Math.max(0,70-Math.min(70,dist*1.5));
   if(tcgAttacks.length){const hay=norm(x.name),hits=tcgAttacks.filter(a=>hay.includes(a)).length;score+=hits*35;if(hits===tcgAttacks.length)score+=30}
   return {...x,score,expansion_distance_days:Number.isFinite(dist)?Math.round(dist*10)/10:null,tcg_set:tcg?.setData?.name||c.set_name||"",tcg_attacks:tcgAttacks};
  }).sort((a,b)=>b.score-a.score);
 }

 async function findMatches(r){
  setSelected(r);setBusy(true);setMsg("");setMatches([]);
  const c=r.cards||{};
  if(!String(c.english_name||c.name||"").trim()){setMsg("This card has no English Pokémon name to search for.");setBusy(false);return}
  try{
   const ranked=await searchCardmarketMatches(r);setMatches(ranked);
   if(!ranked.length)setMsg("No products with that Pokémon name were found.");
  }catch(error){setMsg(error.code==="42P01"?"Cardmarket catalogue table is not installed yet.":error.message||String(error))}
  finally{setBusy(false)}
 }

 async function autoMatch(){
  const targets=rowsForPricing.filter(r=>!r.cards?.cardmarket_product_id);
  if(!targets.length){setAutoResult({matched:0,skipped:0,total:0});return}
  setAutoBusy(true);setAutoResult(null);setMsg("");
  let matched=0,skipped=0,firstError="";
  for(const r of targets){
   try{
    const ranked=await searchCardmarketMatches(r),top=ranked[0],second=ranked[1];
    const confident=!!top&&(top.exact_tcgdex_match||top.score>=140&&(!second||top.score-second.score>=15));
    if(!confident){skipped++;continue}
    const {error}=await supabase.from("cards").update({cardmarket_product_id:String(top.id_product),cardmarket_name:top.name||null,cardmarket_expansion:String(top.expansion_id||""),cardmarket_language:r.cards?.language||null,cardmarket_url:null}).eq("id",r.cards.id);
    if(error){skipped++;if(!firstError)firstError=error.message}else matched++;
   }catch(error){skipped++;if(!firstError)firstError=error.message||String(error)}
  }
  setAutoResult({matched,skipped,total:targets.length});
  if(firstError)setMsg(`Auto-match completed with an error: ${firstError}`);
  await onDone?.();setAutoBusy(false);
 }

 async function saveMatch(m){
  if(!selected)return;setBusy(true);setMsg("");
  const {error}=await supabase.from("cards").update({
   cardmarket_product_id:String(m.id_product),cardmarket_name:m.name||null,
   cardmarket_expansion:String(m.expansion_id||""),cardmarket_language:selected.cards?.language||null,cardmarket_url:null
  }).eq("id",selected.cards.id);
  if(error)setMsg(error.message);else{setSelected(null);setMatches([]);setMsg("Cardmarket match saved.");await onDone?.()}
  setBusy(false);
 }

 const matchedCount=rows.filter(r=>r.cards?.cardmarket_product_id).length;
 const pricedCount=rows.filter(r=>r.cards?.cardmarket_product_id&&prices[String(r.cards.cardmarket_product_id)]).length;
 const marketTotal=rows.reduce((sum,r)=>{const p=prices[String(r.cards?.cardmarket_product_id||"")];return sum+(p?.trend!=null?Number(p.trend)*Number(r.quantity||0):0)},0);

 return <div className="panel">
  <div className="heading" style={{marginTop:0}}><div><span className="eyebrow">CARDMARKET</span><h2>Product matching & pricing</h2><p>Match the exact Cardmarket product, then use the imported daily price guide to value your stock.</p></div></div>
  <div className="toolbar"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search Pokémon, set, number or language..."/><button onClick={autoMatch} disabled={autoBusy||!rows.some(r=>!r.cards?.cardmarket_product_id)}>{autoBusy?"Auto-matching…":"Auto-match high confidence"}</button><small>{matchedCount}/{rows.length} matched · {pricedCount} priced · Trend stock value £{marketTotal.toFixed(2)}</small></div>
  {autoResult&&<div className="alert" style={{marginTop:10}}>Auto-match: {autoResult.matched} matched, {autoResult.skipped} skipped out of {autoResult.total}. Skipped cards are left for manual review.</div>}
  <div className="list">{rows.slice(0,200).map(r=><div className="row" key={r.id}><div className="rowmain"><div><b>{r.cards?.english_name||r.cards?.name}</b><small>{r.cards?.set_name} · {r.cards?.card_number} · {r.cards?.language}</small></div></div><div className="rowright"><span>{r.cards?.cardmarket_product_id?(()=>{const p=prices[String(r.cards.cardmarket_product_id)];return p?`CM ${r.cards.cardmarket_product_id} · Trend £${Number(p.trend||0).toFixed(2)}`:`CM ${r.cards.cardmarket_product_id}`})():"Not matched"}</span><button className="editbtn" onClick={()=>findMatches(r)} disabled={busy||autoBusy}>{r.cards?.cardmarket_product_id?"Find again":"Find match"}</button></div></div>)}</div>
  {selected&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget){setSelected(null);setMatches([])}}}><div className="modal" onMouseDown={e=>e.stopPropagation()}>
   <div className="modalhead"><div><span className="eyebrow">CARDMARKET SEARCH</span><h2>{selected.cards?.english_name||selected.cards?.name}</h2><small>{selected.cards?.set_name} · {selected.cards?.card_number} · {selected.cards?.language}</small></div><button className="x" onClick={()=>{setSelected(null);setMatches([])}}>×</button></div>
   <p>Results combine TCGdex set/card data with Cardmarket's product ID, expansion ID, metacard ID and product name. Cardmarket's catalogue does not directly expose language or collector number.</p>
   {busy&&<div className="noresults">Resolving set/card and searching Cardmarket catalogue…</div>}
   {!busy&&!matches.length&&!msg&&<div className="noresults">No products with that Pokémon name were found.</div>}
   {!busy&&matches.slice(0,30).map((m,i)=>{const p=m.price||prices[String(m.id_product)];return <div className="row" key={`${m.id_product}-${i}`} style={{marginTop:8}}><div className="rowmain"><div><b>{m.name||"Exact TCGdex Cardmarket match"}</b><small>{m.exact_tcgdex_match?"Exact TCGdex mapping · ":""}Product {m.id_product} · {m.expansion_id?`Expansion ${m.expansion_id} · `:""}{m.metacard_id?`Metacard ${m.metacard_id} · `:""}{m.expansion_distance_days!=null?`${m.expansion_distance_days}d from set release`:""}{p?` · Trend £${Number(p.trend||0).toFixed(2)} · Low £${Number(p.low||0).toFixed(2)}`:" · No price guide record"}</small></div></div><div className="rowright"><span>{m.exact_tcgdex_match?"EXACT":`${Math.round(m.score)} match`}</span><button onClick={()=>saveMatch(m)} disabled={busy}>Use this match</button></div></div>})}
   {msg&&<div className="alert">{msg}</div>}
   <div className="modalactions"><button className="ghost" onClick={()=>{setSelected(null);setMatches([])}}>Close</button><a href="https://www.cardmarket.com/en/Pokemon/Products/Singles" target="_blank" rel="noreferrer">Open Cardmarket</a></div>
  </div></div>}
 </div>
}
function BatchTool({inventory,onDone}){
 const [mode,setMode]=useState("remove"),[text,setText]=useState(""),[result,setResult]=useState(null),[busy,setBusy]=useState(false),[msg,setMsg]=useState("");
 function parse(){
  const rows=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(line=>{const p=line.split(",").map(x=>x.trim());return{name:p[0]||"",set_name:p[1]||"",card_number:p[2]||"",quantity:Math.max(1,Number(p[3]||1))}});
  const matched=[],missing=[];
  for(const r of rows){
   const hit=inventory.find(i=>{const c=i.cards||{};return String(c.name||"").toLowerCase()===r.name.toLowerCase()&&String(c.set_name||"").toLowerCase()===r.set_name.toLowerCase()&&String(c.card_number||"").toLowerCase()===r.card_number.toLowerCase()});
   if(hit)matched.push({...r,row:hit,available:Number(hit.quantity||0)});else missing.push(r);
  }
  setResult({matched,missing});setMsg("");
 }
 async function apply(){
  if(!result?.matched.length)return;setBusy(true);let changed=0,firstError="";
  for(const r of result.matched){
   const current=Number(r.available||0),next=mode==="remove"?Math.max(0,current-r.quantity):current+r.quantity;
   const {error}=await supabase.from("inventory").update({quantity:next}).eq("id",r.row.id);
   if(error&&!firstError)firstError=error.message;else if(!error)changed++;
  }
  setMsg(firstError?`${changed} updated, but one or more failed: ${firstError}`:`${changed} inventory row${changed===1?"":"s"} updated.`);
  await onDone?.();setBusy(false);if(!firstError)setResult(null);
 }
 return <div className="panel">
  <div className="heading" style={{marginTop:0}}><div><span className="eyebrow">BULK STOCK</span><h2>Batch inventory</h2><p>Paste one card per line and adjust stock in one go.</p></div></div>
  <div className="two">
   <label>Action<select value={mode} onChange={e=>setMode(e.target.value)}><option value="remove">Remove stock (sale)</option><option value="add">Add stock</option></select></label>
   <label>Format<input readOnly value="Name, Set, Card Number, Quantity"/></label>
  </div>
  <label>Cards<textarea rows="10" value={text} onChange={e=>{setText(e.target.value);setResult(null)}} placeholder={"Bidoof, Brilliant Stars, 111/172, 3\nPikachu, Paldea Evolved, 062/193, 2"}/></label>
  <div className="modalactions" style={{marginTop:12}}><button onClick={parse} disabled={!text.trim()}>Check matches</button><button className="ghost" onClick={()=>{setText("");setResult(null);setMsg("")}}>Clear</button></div>
  {result&&<div className="batchresult" style={{marginTop:14}}><b>{result.matched.length} matched · {result.missing.length} not found</b>
   {result.matched.length>0&&<div className="batchlist">{result.matched.map((r,i)=><div key={i}>✅ {r.name} — {r.set_name} — #{r.card_number} · {mode==="remove"?`-${r.quantity}`:`+${r.quantity}`} (currently {r.available})</div>)}</div>}
   {result.missing.length>0&&<div className="batchlist">{result.missing.map((r,i)=><div key={i}>❌ {r.name} — {r.set_name} — #{r.card_number}</div>)}</div>}
   {result.matched.length>0&&<button style={{marginTop:12}} onClick={apply} disabled={busy}>{busy?"Applying…":mode==="remove"?"Apply stock removal":"Apply stock additions"}</button>}
  </div>}
  {msg&&<div className="alert" style={{marginTop:12}}>{msg}</div>}
 </div>
}

let tesseractPromise = null;

async function loadTesseract(){
  if(window.Tesseract) return window.Tesseract;
  if(tesseractPromise) return tesseractPromise;
  tesseractPromise = new Promise((resolve,reject)=>{
    const existing=document.querySelector('script[data-tesseract="1"]');
    if(existing){
      existing.addEventListener("load",()=>resolve(window.Tesseract),{once:true});
      existing.addEventListener("error",()=>reject(new Error("Could not load the OCR engine.")),{once:true});
      return;
    }
    const s=document.createElement("script");
    s.src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
    s.async=true;
    s.dataset.tesseract="1";
    s.onload=()=>window.Tesseract?resolve(window.Tesseract):reject(new Error("OCR engine loaded but was not available."));
    s.onerror=()=>reject(new Error("Could not load the OCR engine. Check your internet connection."));
    document.head.appendChild(s);
  });
  return tesseractPromise;
}

function scannerNormalizeText(v){
  return String(v||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
}

function scannerNameTokens(v){
  return scannerNormalizeText(v).split(/\s+/).filter(Boolean);
}

function scannerNameSimilarity(a,b){
  const aa=scannerNormalizeText(a),bb=scannerNormalizeText(b);
  if(!aa||!bb)return 0;
  if(aa===bb)return 1;
  if(aa.includes(bb)||bb.includes(aa))return Math.min(0.95,Math.min(aa.length,bb.length)/Math.max(aa.length,bb.length)+0.2);
  const at=new Set(scannerNameTokens(aa)),bt=new Set(scannerNameTokens(bb));
  const inter=[...at].filter(x=>bt.has(x)).length;
  const union=new Set([...at,...bt]).size;
  return union?inter/union:0;
}

function scannerExtractNumber(text){
  const s=String(text||"").replace(/\s+/g," ");
  const digitFriendly=s.replace(/[Oo]/g,"0").replace(/[Il|]/g,"1");
  const patterns=[
    /\b([A-Z]{1,5})\s*[- ]?\s*(\d{1,3})\s*\/\s*(\d{1,3})\b/i,
    /\b(\d{1,3})\s*\/\s*(\d{1,3})\b/,
    /\b([A-Z]{1,5})\s*[- ]?\s*(\d{1,3})\b/i,
    /\b(\d{1,3})\s*[-–]\s*(\d{1,3})\b/
  ];
  for(const re of patterns){
    const m=s.match(re);
    if(m){
      if(m.length===4)return `${m[1].toUpperCase()}${m[2]}/${m[3]}`;
      if(m.length===3)return `${m[1]}/${m[2]}`;
    }
  }
  for(const re of patterns.slice(1)){
    const m=digitFriendly.match(re);
    if(m){
      if(m.length===3)return `${m[1]}/${m[2]}`;
      if(m.length===4)return `${m[1].toUpperCase()}${m[2]}/${m[3]}`;
    }
  }
  return "";
}

function scannerExtractName(text){
  const lines=String(text||"").split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  const blocked=/^(stage|basic|item|trainer|supporter|stadium|pokemon|pok[eé]mon|hp|weakness|resistance|retreat|evolves|ability|attack|rule|illustrator|illus|©|no\.?\s*\d|\d+\s*\/\s*\d)/i;
  const candidates=lines
    .map(x=>x.replace(/[^A-Za-zÀ-ÿ0-9' .&-]/g," ").replace(/\s+/g," ").trim())
    .filter(x=>x.length>=3&&x.length<=32&&!blocked.test(x))
    .filter(x=>/[A-Za-z]/.test(x))
    .filter(x=>!/^\d+$/.test(x));
  // Pokémon names are normally the first prominent text line in the top-left.
  // Prefer lines with title-like capitalization and fewer punctuation marks.
  candidates.sort((a,b)=>{
    const ap=/^[A-ZÀ-Ý][A-Za-zÀ-ÿ0-9' .&-]*$/.test(a)?1:0;
    const bp=/^[A-ZÀ-Ý][A-Za-zÀ-ÿ0-9' .&-]*$/.test(b)?1:0;
    return bp-ap||a.length-b.length;
  });
  return candidates[0]||"";
}

function scannerObjectFitSourceCrop(rawW,rawH,containerW,containerH){
  const scale=Math.max(containerW/rawW,containerH/rawH);
  const displayedW=rawW*scale,displayedH=rawH*scale;
  return {
    x:(displayedW-containerW)/(2*scale),
    y:(displayedH-containerH)/(2*scale),
    w:containerW/scale,
    h:containerH/scale
  };
}

async function scannerMakeRegion(dataUrl,region="name"){
  return new Promise((resolve,reject)=>{
    const img=new Image();
    img.onload=()=>{
      const rawW=img.naturalWidth,rawH=img.naturalHeight;
      if(!rawW||!rawH)return reject(new Error("Captured image has no usable dimensions."));
      // Match the camera's CSS object-fit: cover crop so OCR works on the same
      // area the user saw inside the on-screen card guide.
      const mobile=window.innerWidth<=750;
      const targetAspect=mobile?3/4:4/3;
      const containerW=1000,containerH=containerW/targetAspect;
      const fit=scannerObjectFitSourceCrop(rawW,rawH,containerW,containerH);
      // The guide is centred. On mobile it is 62% wide; desktop 56%.
      const guideW=(mobile?.62:.56)*containerW;
      const guideH=guideW*(7/5);
      const gx=fit.x+(fit.w-guideW)/2;
      const gy=fit.y+(fit.h-guideH)/2;
      let rx=gx+guideW*.06, ry=gy, rw=guideW*.88, rh=guideH;
      if(region==="name"){
        // Name/HP band only. Exclude the artwork and most background.
        ry=gy+guideH*.045; rh=guideH*.205;
      }else if(region==="number"){
        // Collector number / set marker band near the bottom-right.
        rx=gx+guideW*.42; ry=gy+guideH*.82; rw=guideW*.54; rh=guideH*.15;
      }else if(region==="card"){
        rx=gx;ry=gy;rw=guideW;rh=guideH;
      }
      rx=Math.max(0,Math.min(rawW-1,rx));ry=Math.max(0,Math.min(rawH-1,ry));
      rw=Math.max(1,Math.min(rawW-rx,rw));rh=Math.max(1,Math.min(rawH-ry,rh));
      const scale=region==="card"?1.5:3;
      const c=document.createElement("canvas");c.width=Math.max(1,Math.round(rw*scale));c.height=Math.max(1,Math.round(rh*scale));
      const ctx=c.getContext("2d");if(!ctx)return reject(new Error("Could not prepare the image for OCR."));
      ctx.imageSmoothingEnabled=true;
      ctx.drawImage(img,rx,ry,rw,rh,0,0,c.width,c.height);
      resolve(c.toDataURL("image/jpeg",.96));
    };
    img.onerror=()=>reject(new Error("Could not prepare the captured image for OCR."));
    img.src=dataUrl;
  });
}

function scannerPreprocessForOcr(dataUrl,mode="name"){
  return new Promise((resolve,reject)=>{
    const img=new Image();
    img.onload=()=>{
      const c=document.createElement("canvas");c.width=img.naturalWidth;c.height=img.naturalHeight;
      const ctx=c.getContext("2d");if(!ctx)return reject(new Error("Could not preprocess the OCR image."));
      ctx.drawImage(img,0,0);
      const im=ctx.getImageData(0,0,c.width,c.height),d=im.data;
      // Light grayscale + contrast boost. Avoid hard thresholding because card
      // names are printed over coloured backgrounds and gradients.
      const contrast=mode==="number"?1.55:1.35;
      const mid=128;
      for(let i=0;i<d.length;i+=4){
        const g=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2];
        let v=(g-mid)*contrast+mid;
        if(mode==="number"&&v>220)v=255;
        d[i]=d[i+1]=d[i+2]=Math.max(0,Math.min(255,v));
      }
      ctx.putImageData(im,0,0);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror=()=>reject(new Error("Could not preprocess the OCR image."));
    img.src=dataUrl;
  });
}

function CardScanner(){
  const videoRef=React.useRef(null),streamRef=React.useRef(null),workerRef=React.useRef(null);
  const [cameraOn,setCameraOn]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(""),[shot,setShot]=useState(null);
  const [ocrBusy,setOcrBusy]=useState(false),[ocrProgress,setOcrProgress]=useState(0),[ocrText,setOcrText]=useState("");
  const [identified,setIdentified]=useState(null),[candidates,setCandidates]=useState([]);

  async function startCamera(){
    setError("");setShot(null);setIdentified(null);setCandidates([]);setOcrText("");setBusy(true);
    try{
      if(!navigator.mediaDevices?.getUserMedia)throw new Error("Camera access is not available in this browser.");
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"},width:{ideal:1280},height:{ideal:720}},audio:false});
      streamRef.current=stream;setCameraOn(true);
    }catch(e){
      setError(e?.name==="NotAllowedError"?"Camera permission was denied. Allow camera access and try again.":e?.message||"Could not open the camera.");
      setCameraOn(false);
    }finally{setBusy(false)}
  }

  useEffect(()=>{
    if(!cameraOn||!streamRef.current)return;
    const v=videoRef.current;if(!v)return;
    v.srcObject=streamRef.current;
    const play=()=>v.play().catch(()=>{});
    if(v.readyState>=1)play();else v.onloadedmetadata=play;
    return()=>{v.onloadedmetadata=null};
  },[cameraOn]);

  function stopCamera(){
    if(streamRef.current){streamRef.current.getTracks().forEach(t=>t.stop());streamRef.current=null}
    if(videoRef.current){videoRef.current.pause();videoRef.current.srcObject=null}
    setCameraOn(false);
  }

  async function capture(){
    const v=videoRef.current;
    if(!v){setError("Camera preview is not ready yet. Try again in a second.");return}
    setError("");setIdentified(null);setCandidates([]);setOcrText("");
    try{
      if(v.paused)await v.play();
      await new Promise(r=>requestAnimationFrame(r));
      const w=v.videoWidth,h=v.videoHeight;
      if(!w||!h)throw new Error("Camera image is not ready yet. Wait a second and try again.");
      const c=document.createElement("canvas");c.width=w;c.height=h;
      const ctx=c.getContext("2d");if(!ctx)throw new Error("Could not create the capture canvas.");
      ctx.drawImage(v,0,0,w,h);
      const data=c.toDataURL("image/jpeg",.92);
      if(!data||data.length<100)throw new Error("The camera returned an empty image. Try again.");
      setShot(data);
    }catch(e){setError(e?.message||"Could not capture the camera image.")}
  }

  async function identifyCard(){
    if(!shot||ocrBusy)return;
    setError("");setIdentified(null);setCandidates([]);setOcrText("");setOcrProgress(0);setOcrBusy(true);
    let worker=null;
    try{
      const Tesseract=await loadTesseract();
      worker=await Tesseract.createWorker("eng",1,{
        logger:m=>{if(m?.status==="recognizing text"&&typeof m.progress==="number")setOcrProgress(Math.round(m.progress*100));}
      });
      workerRef.current=worker;

      // Use the same central guide the camera shows the user, then OCR only the
      // two regions that identify a Pokémon TCG printing: name and collector number.
      const [nameRegion,numberRegion,wholeCard]=await Promise.all([
        scannerMakeRegion(shot,"name"),
        scannerMakeRegion(shot,"number"),
        scannerMakeRegion(shot,"card")
      ]);
      const nameImage=await scannerPreprocessForOcr(nameRegion,"name");
      const numberImage=await scannerPreprocessForOcr(numberRegion,"number");

      await worker.setParameters({tessedit_pageseg_mode:"7",preserve_interword_spaces:"1"});
      const nameResult=await worker.recognize(nameImage);
      setOcrProgress(45);
      const rawName=scannerExtractName(nameResult?.data?.text||"");

      await worker.setParameters({tessedit_pageseg_mode:"7",tessedit_char_whitelist:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789/-",preserve_interword_spaces:"1"});
      const numberResult=await worker.recognize(numberImage);
      setOcrProgress(75);
      const rawNumber=scannerExtractNumber(numberResult?.data?.text||"");

      // One broad fallback pass catches cards where the guide was slightly off,
      // while remaining isolated to the card rather than the surrounding screen.
      let fallbackText="";
      if(!rawName||!rawNumber){
        await worker.setParameters({tessedit_pageseg_mode:"11",preserve_interword_spaces:"1"});
        const fallback=await worker.recognize(wholeCard);
        fallbackText=fallback?.data?.text||"";
      }
      const fallbackName=!rawName?scannerExtractName(fallbackText):rawName;
      const fallbackNumber=!rawNumber?scannerExtractNumber(fallbackText):rawNumber;
      const combined=`NAME: ${fallbackName}\nNUMBER: ${fallbackNumber}\nRAW NAME OCR:\n${nameResult?.data?.text||""}\nRAW NUMBER OCR:\n${numberResult?.data?.text||""}${fallbackText?`\nRAW CARD OCR:\n${fallbackText}`:""}`;
      setOcrText(combined);

      const cleanedName=fallbackName.trim();
      if(!cleanedName&&!fallbackNumber)throw new Error("I couldn't read the card name or collector number. Try Retake with the card larger in frame.");

      // TCGdex is the source of truth. Search by the OCR name first, then score
      // exact name and collector-number agreement. We deliberately avoid showing
      // unrelated cards caused by random OCR fragments.
      let pool=[];
      if(cleanedName){
        const params=new URLSearchParams();
        params.set("name",cleanedName);
        params.set("pagination:page","1");
        params.set("pagination:itemsPerPage","100");
        const r=await fetch(`https://api.tcgdex.net/v2/en/cards?${params.toString()}`);
        if(!r.ok)throw new Error("TCGdex card search failed. Try again.");
        const list=await r.json();pool=Array.isArray(list)?list:[];
      }

      const numberOnly=fallbackNumber?fallbackNumber.split("/")[0].replace(/^0+/,""):"";
      const numberPrefix=fallbackNumber?fallbackNumber.match(/^([A-Z]{1,5})/i)?.[1]?.toUpperCase():"";
      if(numberOnly){
        const numbered=pool.filter(x=>{
          const local=String(x.localId||"").replace(/^0+/ ,"");
          return local===numberOnly || local.toUpperCase()===fallbackNumber.toUpperCase() || (numberPrefix&&local.toUpperCase()===`${numberPrefix}${numberOnly}`);
        });
        if(numbered.length)pool=numbered;
      }

      if(!pool.length&&cleanedName){
        const firstWord=cleanedName.split(" ").filter(Boolean)[0]||cleanedName;
        const fallback=await fetch(`https://api.tcgdex.net/v2/en/cards?name=${encodeURIComponent(firstWord)}&pagination:page=1&pagination:itemsPerPage=100`);
        if(fallback.ok){const fb=await fallback.json();pool=Array.isArray(fb)?fb:[];}
        if(numberOnly){
          const numbered=pool.filter(x=>String(x.localId||"").replace(/^0+/ ,"")===numberOnly);
          if(numbered.length)pool=numbered;
        }
      }

      if(!pool.length)throw new Error(`No TCGdex cards matched "${cleanedName||"the scanned text"}"${fallbackNumber?` (${fallbackNumber})`:""}. Try Retake with the card larger in frame.`);

      const detailed=await Promise.all(pool.slice(0,20).map(async x=>{
        try{const dr=await fetch(`https://api.tcgdex.net/v2/en/cards/${encodeURIComponent(x.id)}`);if(dr.ok)return await dr.json();}catch(_){}
        return x;
      }));
      const scored=detailed.map(x=>{
        let score=0;
        const xn=scannerNormalizeText(x.name),cn=scannerNormalizeText(cleanedName),sim=scannerNameSimilarity(x.name,cleanedName);
        if(cn&&xn===cn)score+=180;
        else if(cn&&xn.includes(cn))score+=110;
        else if(cn&&cn.includes(xn))score+=80;
        else score+=Math.round(sim*60);
        if(numberOnly&&String(x.localId||"").replace(/^0+/ ,"")===numberOnly)score+=160;
        if(numberPrefix&&String(x.localId||"").toUpperCase()===`${numberPrefix}${numberOnly}`)score+=160;
        return {...x,scannerScore:score,scannerNameSimilarity:sim};
      }).sort((a,b)=>b.scannerScore-a.scannerScore);

      // Never surface a pile of unrelated cards just because OCR returned a
      // generic word such as "Unknown". Candidates must have either a useful
      // name relationship or an exact collector-number relationship.
      const relevant=scored.filter(x=>x.scannerNameSimilarity>=0.45||(
        numberOnly&&String(x.localId||"").replace(/^0+/ ,"")===numberOnly
      ));
      if(!relevant.length){
        throw new Error(`I couldn't confidently match "${cleanedName||"the scanned card"}"${fallbackNumber?` (${fallbackNumber})`:""}. Try Retake with the card a little closer and flatter.`);
      }

      setCandidates(relevant.slice(0,8));
      if(relevant.length===1||relevant[0]?.scannerScore>=300&&(relevant.length===1||relevant[0].scannerScore>=(relevant[1]?.scannerScore||0)+80))setIdentified(relevant[0]);
    }catch(e){setError(e?.message||"Could not identify the card.");}
    finally{
      setOcrBusy(false);setOcrProgress(100);
      if(workerRef.current){try{await workerRef.current.terminate()}catch(_){}workerRef.current=null;}
    }
  }

  function chooseCandidate(card){
    setIdentified(card);setCandidates([card]);
  }

  function clearCapture(){
    setShot(null);setIdentified(null);setCandidates([]);setOcrText("");setError("");setOcrProgress(0);
  }

  useEffect(()=>()=>{if(workerRef.current){workerRef.current.terminate().catch(()=>{});workerRef.current=null}stopCamera()},[]);

  return <div className="scanner-page">
    <div className="scanner-topbar">
      <button className="ghost scanner-back" onClick={()=>nav("/admin")}>← Admin</button>
      <div className="scanner-title"><span className="eyebrow">CARD SCANNER</span><b>Scan a card</b></div>
      <span className="scanner-step">{identified?"3 / 3":shot?"2 / 3":"1 / 3"}</span>
    </div>

    {error&&<div className="alert scanner-alert">{error}</div>}

    <div className="scanner-content">
      <div className="scanner-camera-wrap">
        <div className="scanner-camera">
          {cameraOn ? <div className="scanner-video-layer">
            <video ref={videoRef} playsInline muted autoPlay className="scanner-video"/>
            {shot&&<div className="scanner-captured-overlay"><img src={shot} alt="Captured card"/><span>✓ CARD CAPTURED</span></div>}
          </div> : <div className="scanner-off"><span>📷</span><b>Camera is off</b><small>Use your phone's rear camera and place one card inside the frame.</small></div>}
          {cameraOn&&<div className="scanner-frame" aria-hidden="true"><span className="corner tl"/><span className="corner tr"/><span className="corner bl"/><span className="corner br"/><div className="scanner-guide">FIT CARD INSIDE FRAME</div></div>}
        </div>

        <div className="scanner-controls">
          {!cameraOn
            ?<button className="scanner-primary" onClick={startCamera} disabled={busy}>{busy?"Opening camera…":"Open camera"}</button>
            :<><button type="button" className="scanner-capture" onClick={capture} aria-label="Capture card"><span>●</span><b>{shot?"Retake":"Capture"}</b></button><button className="ghost" onClick={stopCamera}>Stop</button></>
          }
        </div>

        {shot&&<div className="scanner-identify-actions">
          <button className="scanner-primary" onClick={identifyCard} disabled={ocrBusy}>{ocrBusy?`Identifying… ${ocrProgress}%`:"Identify card"}</button>
          <button className="ghost" onClick={clearCapture} disabled={ocrBusy}>Clear</button>
        </div>}

        <p className="scanner-hint">{cameraOn?"Hold the card flat, keep all four corners visible and avoid glare.":"Camera capture is ready — next we'll identify the card from the captured image."}</p>
      </div>

      <div className="scanner-result">
        <div className="scanner-result-head"><span className="eyebrow">{identified?"IDENTIFIED":candidates.length?"MATCHES":"CAPTURE"}</span>{shot&&<button className="ghost" onClick={clearCapture}>Clear</button>}</div>

        {ocrBusy&&<div className="scanner-empty"><span>🔎</span><b>Reading card…</b><small>OCR is reading the card name and collector number.</small></div>}

        {!ocrBusy&&!shot&&<div className="scanner-empty"><span>📸</span><b>No card captured</b><small>Your captured card will appear here.</small></div>}

        {!ocrBusy&&shot&&identified&&<div className="scanner-identification">
          {identified.image?<img src={identified.image} alt={identified.name||"Identified card"}/>:null}
          <div className="scanner-identification-info">
            <b>{identified.name}</b>
            <small>{identified.set?.name||"Set not available"} · #{identified.localId}</small>
            <small>{identified.rarity||"Rarity not available"}</small>
            <strong>✓ Exact candidate</strong>
          </div>
        </div>}

        {!ocrBusy&&shot&&!identified&&candidates.length>1&&<div className="scanner-candidates">
          <b>Choose the matching card</b>
          <small>OCR found multiple cards. We won't guess between different printings.</small>
          {candidates.map(c=><button type="button" className="scanner-candidate" key={c.id} onClick={()=>chooseCandidate(c)}>
            {c.image?<img src={c.image} alt=""/>:null}
            <span><b>{c.name} · #{c.localId}</b><small>{c.set?.name||"Unknown set"} · {c.rarity||"Card"}</small></span>
          </button>)}
        </div>}

        {!ocrBusy&&shot&&!identified&&!candidates.length&&!error&&<div className="scanner-empty"><span>🔎</span><b>Ready to identify</b><small>Tap Identify card to read the captured image.</small></div>}

        {!ocrBusy&&shot&&ocrText&&<details className="scanner-ocr-details"><summary>OCR text</summary><pre>{ocrText}</pre></details>}
      </div>
    </div>
  </div>
}

function Locations({locations,onDone}){
 const [name,setName]=useState(""),[desc,setDesc]=useState("");
 async function add(){if(!name.trim())return;await supabase.from("locations").insert({name:name.trim(),description:desc||null});setName("");setDesc("");await onDone()}
 return <div className="panel"><span className="eyebrow">STORAGE</span><h2>Locations</h2><div className="two inline"><input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. B04-12"/><input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Description (optional)"/><button onClick={add}>Add location</button></div><div className="locationgrid">{locations.map(l=><div className="location" key={l.id}><b>{l.name}</b><small>{l.description||"No description"}</small></div>)}</div></div>
}

createRoot(document.getElementById("root")).render(<App/>);
