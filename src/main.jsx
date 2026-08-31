import React,{useEffect,useMemo,useState} from "react";
import {createRoot} from "react-dom/client";
import {supabase} from "./lib/supabase";
import "./styles.css";

const blank={name:"",set_name:"",set_code:"",card_number:"",language:"English",variant:"Normal",rarity:"",quantity:1,condition:"NM",cost_per_card:"0",status:"available",location_id:""};
const demo=[{id:"d1",name:"Bidoof",set_name:"Brilliant Stars",card_number:"111/172",language:"English",variant:"Normal",quantity:14,status:"available"}];

function nav(path){history.pushState({}, "", path);dispatchEvent(new PopStateEvent("popstate"))}

function App(){
 const [admin,setAdmin]=useState(location.pathname.startsWith("/admin"));
 const [session,setSession]=useState(null);
 useEffect(()=>{const f=()=>setAdmin(location.pathname.startsWith("/admin"));addEventListener("popstate",f);return()=>removeEventListener("popstate",f)},[]);
 useEffect(()=>{if(!supabase)return;supabase.auth.getSession().then(({data})=>setSession(data.session));const {data:l}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));return()=>l.subscription.unsubscribe()},[]);
 return admin?<Admin session={session} publicSite={()=>nav("/")}/>:<Public admin={()=>nav("/admin")}/>;
}

function Public({admin}){
 const [q,setQ]=useState(""),[cards,setCards]=useState([]),[busy,setBusy]=useState(false),[err,setErr]=useState("");
 async function search(v=q){
  setBusy(true);setErr("");
  if(!supabase){setCards(demo);setBusy(false);return}
  let b=supabase.from("inventory").select("id,quantity,status,cards(id,name,set_name,card_number,language,variant,image_url)").in("status",["available","listed"]).gt("quantity",0).order("created_at",{ascending:false});
  const {data,error}=await b;
  if(error){setErr(error.message);setCards([])}else{
   let a=(data||[]).map(r=>({...r,...(r.cards||{})}));
   if(v.trim())a=a.filter(c=>[c.name,c.set_name,c.card_number,c.language,c.variant].filter(Boolean).join(" ").toLowerCase().includes(v.toLowerCase()));
   setCards(a);
  } setBusy(false)
 }
 useEffect(()=>{search("")},[]);
 return <div className="shell"><Header admin={admin}/><main className="main"><section className="hero"><span className="eyebrow">PAUL'S POKE PULLS</span><h1>Find a card.</h1><p>Search the catalogue to see what's currently available.</p><div className="search"><input value={q} onChange={e=>{setQ(e.target.value);search(e.target.value)}} placeholder="Pokémon, set, card number, language..."/><button onClick={()=>search(q)}>Search</button></div></section>{err&&<div className="alert">{err}</div>}<section><div className="heading"><div><span className="eyebrow">IN STOCK</span><h2>{q?`Results for “${q}”`:"Catalogue"}</h2></div><small>{busy?"Loading…":`${cards.length} results`}</small></div><div className="grid">{cards.map(c=><article className="tile" key={c.id}><div className="art">{c.image_url?<img src={c.image_url} alt={c.name}/>:<b>POKÉMON</b>}</div><div className="info"><h3>{c.name}</h3><p>{c.set_name} · {c.card_number||"—"}</p><div className="tags"><span>{c.language}</span><span>{c.variant}</span></div><div className="stock">● Available</div></div></article>)}</div>{!busy&&!cards.length&&<div className="empty"><b>?</b><h3>No cards found</h3><p>Try another search.</p></div>}</section></main></div>
}

function Header({admin}){return <header><div className="brand"><strong>PP</strong><div><b>Paul's Poke Pulls</b><small>Pokémon TCG Business</small></div></div>{admin&&<button className="ghost" onClick={admin}>Admin</button>}</header>}

function Admin({session,publicSite}){
 const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[msg,setMsg]=useState(""),[tab,setTab]=useState("dashboard"),[inv,setInv]=useState([]),[locations,setLocations]=useState([]),[q,setQ]=useState(""),[busy,setBusy]=useState(false),[form,setForm]=useState(blank),[showAdd,setShowAdd]=useState(false);
 async function login(e){e.preventDefault();setBusy(true);setMsg("");if(!supabase){setMsg("Supabase is not connected.");setBusy(false);return}const {error}=await supabase.auth.signInWithPassword({email,password});if(error)setMsg(error.message);setBusy(false)}
 async function load(){
  if(!supabase)return;
  const [i,l]=await Promise.all([
   supabase.from("inventory").select("id,quantity,condition,status,cost_per_card,location_id,cards(id,name,set_name,card_number,language,variant)").order("created_at",{ascending:false}),
   supabase.from("locations").select("id,name").order("name")
  ]);
  if(i.error)setMsg(i.error.message);else setInv(i.data||[]);
  if(!l.error)setLocations(l.data||[]);
 }
 useEffect(()=>{if(session)load()},[session]);
 async function addCard(e){
  e.preventDefault();setBusy(true);setMsg("");
  const {data:card,error:ce}=await supabase.from("cards").insert({name:form.name.trim(),set_name:form.set_name.trim(),set_code:form.set_code||null,card_number:form.card_number||null,language:form.language,variant:form.variant,rarity:form.rarity||null}).select().single();
  if(ce){
   if(ce.code==="23505"){setMsg("That exact card already exists in the catalogue. Use the existing record or import it in the batch tools.");}
   else setMsg(ce.message);
   setBusy(false);return;
  }
  const {error:ie}=await supabase.from("inventory").insert({card_id:card.id,quantity:Number(form.quantity),condition:form.condition,cost_per_card:Number(form.cost_per_card||0),status:form.status,location_id:form.location_id||null});
  if(ie)setMsg(ie.message);else{setMsg("Card added successfully.");setForm(blank);setShowAdd(false);await load()}
  setBusy(false)
 }
 const filtered=useMemo(()=>{const x=q.toLowerCase().trim();return inv.filter(r=>!x||[r.cards?.name,r.cards?.set_name,r.cards?.card_number,r.cards?.language,r.cards?.variant].filter(Boolean).join(" ").toLowerCase().includes(x))},[inv,q]);
 if(!session)return <div className="login"><button className="back" onClick={publicSite}>← Public catalogue</button><div className="loginbox"><strong className="mark">PP</strong><span className="eyebrow">PRIVATE AREA</span><h1>Admin login</h1><p>Manage your Pokémon TCG business.</p><form onSubmit={login}><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>{msg&&<div className="alert">{msg}</div>}<button disabled={busy}>{busy?"Signing in…":"Sign in"}</button></form></div></div>;
 return <div className="admin"><header><div className="brand"><strong>PP</strong><div><b>Paul's Poke Pulls</b><small>Business Manager</small></div></div><div className="actions"><button className="ghost" onClick={publicSite}>Public site</button><button className="ghost" onClick={()=>supabase.auth.signOut()}>Sign out</button></div></header><main className="adminmain"><div className="admintitle"><div><span className="eyebrow">PRIVATE DASHBOARD</span><h1>Business command centre.</h1></div><button onClick={load}>Refresh</button></div>{msg&&<div className="alert">{msg}</div>}<nav className="tabs">{["dashboard","inventory","batch","locations"].map(t=><button className={tab===t?"active":""} onClick={()=>setTab(t)} key={t}>{t==="dashboard"?"Dashboard":t==="inventory"?"Inventory":t==="batch"?"Batch tools":"Locations"}</button>)}</nav>
 {tab==="dashboard"&&<><div className="stats"><div><small>Unique inventory</small><b>{inv.length.toLocaleString()}</b></div><div><small>Physical cards</small><b>{inv.reduce((s,r)=>s+Number(r.quantity||0),0).toLocaleString()}</b></div><div><small>Market pricing</small><b>Coming next</b></div><div><small>ACE grading</small><b>Coming next</b></div></div><div className="panel"><span className="eyebrow">NEXT UP</span><h2>Automation roadmap</h2><p>Card scanning, batch imports, Cardmarket pricing, sales, ACE grading and accounting will plug into this foundation.</p></div></>}
 {tab==="inventory"&&<><div className="toolbar"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search your full inventory..."/><button onClick={()=>setShowAdd(true)}>＋ Add card</button></div><div className="panel"><div className="list">{filtered.slice(0,200).map(r=><div className="row" key={r.id}><div><b>{r.cards?.name}</b><small>{r.cards?.set_name} · {r.cards?.card_number}</small></div><span>{r.cards?.language} · {r.cards?.variant} · ×{r.quantity} · {r.status}</span></div>)}</div></div></>}
 {tab==="batch"&&<BatchTool inventory={inv} onDone={load}/>}
 {tab==="locations"&&<Locations locations={locations} onDone={load}/>}
 </main>{showAdd&&<AddModal form={form} setForm={setForm} locations={locations} busy={busy} msg={msg} close={()=>{setShowAdd(false);setMsg("")}} submit={addCard}/>}</div>
}

function AddModal({form,setForm,locations,busy,msg,close,submit}){
 const set=(k,v)=>setForm(f=>({...f,[k]:v}));
 return <div className="modal-backdrop"><div className="modal"><div className="modalhead"><div><span className="eyebrow">NEW STOCK</span><h2>Add card</h2></div><button className="x" onClick={close}>×</button></div><form onSubmit={submit}><div className="two"><label>Card name<input required value={form.name} onChange={e=>set("name",e.target.value)}/></label><label>Set<input required value={form.set_name} onChange={e=>set("set_name",e.target.value)}/></label><label>Card number<input value={form.card_number} onChange={e=>set("card_number",e.target.value)}/></label><label>Language<select value={form.language} onChange={e=>set("language",e.target.value)}>{["English","Japanese","German","French","Spanish","Portuguese","Korean","Chinese","Polish","Russian","Other"].map(x=><option key={x}>{x}</option>)}</select></label><label>Variant<input value={form.variant} onChange={e=>set("variant",e.target.value)}/></label><label>Condition<input value={form.condition} onChange={e=>set("condition",e.target.value)}/></label><label>Quantity<input type="number" min="1" value={form.quantity} onChange={e=>set("quantity",e.target.value)}/></label><label>Cost / card (£)<input type="number" step="0.0001" min="0" value={form.cost_per_card} onChange={e=>set("cost_per_card",e.target.value)}/></label></div><label>Storage location<select value={form.location_id} onChange={e=>set("location_id",e.target.value)}><option value="">No location yet</option>{locations.map(l=><option value={l.id} key={l.id}>{l.name}</option>)}</select></label>{msg&&<div className="alert">{msg}</div>}<div className="modalactions"><button type="button" className="ghost" onClick={close}>Cancel</button><button disabled={busy}>{busy?"Adding…":"Add to inventory"}</button></div></form></div></div>
}

function BatchTool({inventory,onDone}){
 const [text,setText]=useState(""),[result,setResult]=useState(null),[busy,setBusy]=useState(false);
 function parse(){const rows=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(line=>{const p=line.split(",").map(x=>x.trim());return {name:p[0]||"",set_name:p[1]||"",card_number:p[2]||"",quantity:Number(p[3]||1)}});let matched=0,unmatched=[];rows.forEach(r=>{const hit=inventory.find(i=>i.cards?.name?.toLowerCase()===r.name.toLowerCase()&&i.cards?.set_name?.toLowerCase()===r.set_name.toLowerCase()&&String(i.cards?.card_number||"").toLowerCase()===r.card_number.toLowerCase());if(hit)matched++;else unmatched.push(r)});setResult({rows,matched,unmatched})}
 async function apply(){if(!result)return;setBusy(true);for(const r of result.rows){const hit=inventory.find(i=>i.cards?.name?.toLowerCase()===r.name.toLowerCase()&&i.cards?.set_name?.toLowerCase()===r.set_name.toLowerCase()&&String(i.cards?.card_number||"").toLowerCase()===r.card_number.toLowerCase());if(hit){await supabase.from("inventory").update({quantity:Math.max(0,Number(hit.quantity)-r.quantity),status:Number(hit.quantity)-r.quantity<=0?"sold":hit.status}).eq("id",hit.id);await supabase.from("inventory_movements").insert({inventory_id:hit.id,movement_type:"sale",quantity:r.quantity,notes:"Batch stock movement"})}}setBusy(false);setResult(null);setText("");await onDone()}
 return <div className="panel"><span className="eyebrow">BATCH TOOLS</span><h2>Process a batch sale</h2><p>Paste one card per line as <code>Name,Set,Card Number,Quantity</code>. We'll match it against your inventory before changing anything.</p><textarea value={text} onChange={e=>setText(e.target.value)} placeholder={"Bidoof,Brilliant Stars,111/172,3
Pikachu,Paldea Evolved,062/193,2"} rows="9"/><div className="modalactions"><button onClick={parse}>Check matches</button>{result&&<button disabled={busy||result.unmatched.length>0} onClick={apply}>{busy?"Processing…":`Apply ${result.matched} matched rows`}</button>}</div>{result&&<div className="batchresult"><b>{result.matched} matched</b><span>{result.unmatched.length} unmatched</span>{result.unmatched.length>0&&<div className="alert">Unmatched rows must be resolved before applying the batch.</div>}</div>}</div>
}

function Locations({locations,onDone}){
 const [name,setName]=useState(""),[desc,setDesc]=useState("");
 async function add(){if(!name.trim())return;await supabase.from("locations").insert({name:name.trim(),description:desc||null});setName("");setDesc("");await onDone()}
 return <div className="panel"><span className="eyebrow">STORAGE</span><h2>Locations</h2><div className="two inline"><input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. B04-12"/><input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Description (optional)"/><button onClick={add}>Add location</button></div><div className="locationgrid">{locations.map(l=><div className="location" key={l.id}><b>{l.name}</b><small>{l.description||"No description"}</small></div>)}</div></div>
}

createRoot(document.getElementById("root")).render(<App/>);
