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

 async function login(e){e.preventDefault();setBusy(true);setMsg("");if(!supabase){setMsg("Supabase is not connected.");setBusy(false);return}const {error}=await supabase.auth.signInWithPassword({email,password});if(error)setMsg(error.message);setBusy(false)}

 async function load(){
  if(!supabase)return;
  const [i,l]=await Promise.all([
   supabase.from("inventory").select("id,quantity,condition,status,cost_per_card,location_id,cards(id,name,english_name,set_name,set_code,set_id,set_symbol_url,card_number,language,variant,rarity,cardmarket_product_id,cardmarket_name,cardmarket_expansion,cardmarket_language,cardmarket_url)").order("created_at",{ascending:false}),
   supabase.from("locations").select("id,name").order("name")
  ]);
  if(i.error)setMsg(i.error.message);else setInv(i.data||[]);
  if(!l.error)setLocations(l.data||[]);
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
  const {error}=await supabase.from("inventory").delete().eq("id",row.id);
  if(error){setMsg(error.message);setBusy(false);return}
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

 return <div className="admin"><header><div className="brand"><strong>PP</strong><div><b>Paul's Poke Pulls</b><small>Business Manager</small></div></div><div className="actions"><button className="ghost" onClick={publicSite}>Public site</button><button className="ghost" onClick={()=>supabase.auth.signOut()}>Sign out</button></div></header><main className="adminmain"><div className="admintitle"><div><span className="eyebrow">PRIVATE DASHBOARD</span><h1>Business command centre.</h1></div><button onClick={load}>Refresh</button></div>{msg&&<div className="alert">{msg}</div>}<nav className="tabs">{["dashboard","inventory","batch","cardmarket","locations"].map(t=><button className={tab===t?"active":""} onClick={()=>setTab(t)} key={t}>{t==="dashboard"?"Dashboard":t==="inventory"?"Inventory":t==="batch"?"Batch tools":t==="cardmarket"?"Cardmarket":"Locations"}</button>)}</nav>
 {tab==="dashboard"&&<><div className="stats"><div><small>Unique inventory</small><b>{inv.length.toLocaleString()}</b></div><div><small>Physical cards</small><b>{inv.reduce((s,r)=>s+Number(r.quantity||0),0).toLocaleString()}</b></div><div><small>Market pricing</small><b>Coming next</b></div><div><small>ACE grading</small><b>Coming next</b></div></div><div className="panel"><span className="eyebrow">NEXT UP</span><h2>Automation roadmap</h2><p>Set selection and editing are now live. Next we'll expand batch import, scanning, Cardmarket pricing, sales, ACE grading and accounting.</p></div></>}
 {tab==="inventory"&&<><div className="toolbar"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search your full inventory..."/><button onClick={openAdd}>＋ Add card</button></div><div className="panel"><div className="list">{filtered.slice(0,200).map(r=><div className="row" key={r.id}><div className="rowmain">{r.cards?.set_symbol_url?<img className="setmini" src={r.cards.set_symbol_url} alt=""/>:null}<div><b>{r.cards?.name}</b><small>{r.cards?.set_name} · {r.cards?.card_number}</small></div></div><div className="rowright"><span>{r.cards?.language} · {r.cards?.variant} · ×{r.quantity} · {r.status}</span><button className="editbtn" onClick={()=>openEdit(r)} disabled={busy}>Edit</button><button className="deletebtn" onClick={()=>deleteCard(r)} disabled={busy}>Delete</button></div></div>)}</div></div></>}
 {tab==="batch"&&<BatchTool inventory={inv} onDone={load}/>} {tab==="cardmarket"&&<CardmarketMatcher inventory={inv} onDone={load}/>}
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
 const [q,setQ]=useState(""),[selected,setSelected]=useState(null),[form,setForm]=useState(null),[busy,setBusy]=useState(false),[msg,setMsg]=useState("");
 const rows=inventory.filter(r=>{const c=r.cards||{},x=q.toLowerCase().trim();return !x||[c.english_name,c.name,c.set_name,c.card_number,c.language,c.cardmarket_product_id].filter(Boolean).join(" ").toLowerCase().includes(x)});
 function open(r){const c=r.cards||{};setSelected(r);setForm({cardmarket_product_id:c.cardmarket_product_id||"",cardmarket_name:c.cardmarket_name||"",cardmarket_expansion:c.cardmarket_expansion||"",cardmarket_language:c.cardmarket_language||c.language||"",cardmarket_url:c.cardmarket_url||""});setMsg("")}
 async function save(){if(!selected||!form)return;setBusy(true);setMsg("");const {error}=await supabase.from("cards").update({cardmarket_product_id:form.cardmarket_product_id||null,cardmarket_name:form.cardmarket_name||null,cardmarket_expansion:form.cardmarket_expansion||null,cardmarket_language:form.cardmarket_language||null,cardmarket_url:form.cardmarket_url||null}).eq("id",selected.cards.id);if(error)setMsg(error.message);else{setMsg("Cardmarket match saved.");setSelected(null);setForm(null);await onDone?.()}setBusy(false)}
 return <div className="panel">
  <div className="heading" style={{marginTop:0}}><div><span className="eyebrow">CARDMARKET</span><h2>Product matching</h2><p>Match each card to the exact Cardmarket product before prices are imported.</p></div></div>
  <div className="toolbar"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search Pokémon, set, number or language..."/><small>{rows.filter(r=>r.cards?.cardmarket_product_id).length}/{rows.length} shown cards matched</small></div>
  <div className="list">{rows.slice(0,200).map(r=><div className="row" key={r.id}><div className="rowmain"><div><b>{r.cards?.english_name||r.cards?.name}</b><small>{r.cards?.set_name} · {r.cards?.card_number} · {r.cards?.language}</small></div></div><div className="rowright"><span>{r.cards?.cardmarket_product_id?`CM ${r.cards.cardmarket_product_id}`:"Not matched"}</span><button className="editbtn" onClick={()=>open(r)}>Match</button></div></div>)}</div>
  {selected&&form&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget){setSelected(null);setForm(null)}}}><div className="modal" onMouseDown={e=>e.stopPropagation()}>
   <div className="modalhead"><div><span className="eyebrow">CARDMARKET PRODUCT</span><h2>{selected.cards?.english_name||selected.cards?.name}</h2><small>{selected.cards?.set_name} · {selected.cards?.card_number} · {selected.cards?.language}</small></div><button className="x" onClick={()=>{setSelected(null);setForm(null)}}>×</button></div>
   <p>Use the exact language-specific Cardmarket product. Japanese and other Asian-language Pokémon cards have separate catalogue products.</p>
   <a href="https://www.cardmarket.com/en/Pokemon/Products/Singles" target="_blank" rel="noreferrer">Open Pokémon Singles on Cardmarket</a>
   <label>Product ID<input value={form.cardmarket_product_id} onChange={e=>setForm(f=>({...f,cardmarket_product_id:e.target.value}))} placeholder="Product ID"/></label>
   <label>Exact product name<input value={form.cardmarket_name} onChange={e=>setForm(f=>({...f,cardmarket_name:e.target.value}))}/></label>
   <label>Expansion<input value={form.cardmarket_expansion} onChange={e=>setForm(f=>({...f,cardmarket_expansion:e.target.value}))}/></label>
   <label>Cardmarket language<input value={form.cardmarket_language} onChange={e=>setForm(f=>({...f,cardmarket_language:e.target.value}))}/></label>
   <label>Exact product URL<input value={form.cardmarket_url} onChange={e=>setForm(f=>({...f,cardmarket_url:e.target.value}))}/></label>
   {msg&&<div className="alert">{msg}</div>}
   <div className="modalactions"><button className="ghost" onClick={()=>{setSelected(null);setForm(null)}}>Cancel</button><button onClick={save} disabled={busy}>{busy?"Saving…":"Save match"}</button></div>
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
function Locations({locations,onDone}){
 const [name,setName]=useState(""),[desc,setDesc]=useState("");
 async function add(){if(!name.trim())return;await supabase.from("locations").insert({name:name.trim(),description:desc||null});setName("");setDesc("");await onDone()}
 return <div className="panel"><span className="eyebrow">STORAGE</span><h2>Locations</h2><div className="two inline"><input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. B04-12"/><input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Description (optional)"/><button onClick={add}>Add location</button></div><div className="locationgrid">{locations.map(l=><div className="location" key={l.id}><b>{l.name}</b><small>{l.description||"No description"}</small></div>)}</div></div>
}

createRoot(document.getElementById("root")).render(<App/>);
