import React,{useEffect,useMemo,useState} from "react";
import {createRoot} from "react-dom/client";
import {createClient} from "@supabase/supabase-js";
import "./styles.css";

const url=import.meta.env.VITE_SUPABASE_URL;
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase=url&&key?createClient(url,key):null;
const demo=[{id:"d1",name:"Bidoof",set_name:"Brilliant Stars",card_number:"111/172",language:"English",variant:"Normal",quantity:14,status:"available"},{id:"d2",name:"Bidoof",set_name:"Crown Zenith",card_number:"GG29/GG70",language:"English",variant:"Holo",quantity:2,status:"available"},{id:"d3",name:"Bidoof",set_name:"VSTAR Universe",card_number:"204/172",language:"Japanese",variant:"Art Rare",quantity:1,status:"available"}];

function nav(path){history.pushState({}, "", path);window.dispatchEvent(new PopStateEvent("popstate"))}

function App(){
 const [session,setSession]=useState(null),[admin,setAdmin]=useState(location.pathname.startsWith("/admin"));
 const [cards,setCards]=useState([]),[q,setQ]=useState(""),[loading,setLoading]=useState(false),[error,setError]=useState("");
 useEffect(()=>{const f=()=>setAdmin(location.pathname.startsWith("/admin"));addEventListener("popstate",f);return()=>removeEventListener("popstate",f)},[]);
 useEffect(()=>{if(supabase){supabase.auth.getSession().then(({data})=>setSession(data.session));const {data:l}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));return()=>l.subscription.unsubscribe()}},[]);
 useEffect(()=>{if(!admin)load()},[admin]);
 async function load(search=""){
  setLoading(true);setError("");
  if(!supabase){setCards(demo);setLoading(false);return}
  const {data,error:e}=await supabase.from("inventory").select("id,quantity,status,cards(id,name,set_name,card_number,language,variant,image_url)").in("status",["available","listed"]).gt("quantity",0).order("created_at",{ascending:false});
  if(e){setError(e.message);setCards([])}else{let a=(data||[]).map(r=>({...r,...(r.cards||{})}));if(search.trim())a=a.filter(c=>[c.name,c.set_name,c.card_number,c.language,c.variant].filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase()));setCards(a)}
  setLoading(false)
 }
 if(admin)return <Admin session={session} onPublic={()=>nav("/")} />;
 return <div className="shell"><Header onAdmin={()=>nav("/admin")}/><main className="main"><section className="hero"><span className="eyebrow">COLLECTOR CATALOGUE</span><h1>Find a card.</h1><p>Search the collection to see what's currently available.</p><div className="search"><input value={q} onChange={e=>{setQ(e.target.value);load(e.target.value)}} placeholder="Search Pokémon, set, number, language..."/><button onClick={()=>load(q)}>Search</button></div></section>{error&&<div className="alert">{error}</div>}{!supabase&&<div className="notice">Demo mode — connect the Supabase environment variables to use your real catalogue.</div>}<section><div className="heading"><div><span className="eyebrow">IN STOCK</span><h2>{q?`Results for “${q}”`:"Catalogue"}</h2></div><small>{loading?"Loading…":`${cards.length} results`}</small></div><div className="grid">{cards.map(c=><article className="tile" key={c.id}><div className="art">{c.image_url?<img src={c.image_url} alt={c.name}/>:<b>POKÉMON</b>}</div><div className="info"><h3>{c.name}</h3><p>{c.set_name} · {c.card_number||"—"}</p><div className="tags"><span>{c.language}</span><span>{c.variant}</span></div><div className="stock">● Available</div></div></article>)}</div>{!loading&&!cards.length&&<div className="empty"><b>?</b><h3>No cards found</h3><p>Try a Pokémon name, set, number or language.</p></div>}</section></main><footer>Paul's Poke Pulls · Collector catalogue</footer></div>
}

function Header({onAdmin}){return <header><div className="brand"><strong>PP</strong><div><b>Paul's Poke Pulls</b><small>Pokémon TCG Catalogue</small></div></div><button className="ghost" onClick={onAdmin}>Admin</button></header>}

function Admin({session,onPublic}){
 const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[msg,setMsg]=useState(""),[inv,setInv]=useState([]),[q,setQ]=useState(""),[busy,setBusy]=useState(false);
 async function login(e){e.preventDefault();setBusy(true);setMsg("");if(!supabase){setMsg("Supabase is not connected.");setBusy(false);return}const {error}=await supabase.auth.signInWithPassword({email,password});if(error)setMsg(error.message);setBusy(false)}
 async function load(){if(!supabase)return;const {data,error}=await supabase.from("inventory").select("id,quantity,condition,status,cost_per_card,cards(name,set_name,card_number,language,variant)").order("created_at",{ascending:false});if(error)setMsg(error.message);else setInv(data||[])}
 useEffect(()=>{if(session)load()},[session]);
 const filtered=useMemo(()=>{const x=q.toLowerCase();return inv.filter(r=>!x||[r.cards?.name,r.cards?.set_name,r.cards?.card_number,r.cards?.language,r.cards?.variant].filter(Boolean).join(" ").toLowerCase().includes(x))},[inv,q]);
 if(!session)return <div className="login"><button className="back" onClick={onPublic}>← Public catalogue</button><div className="loginbox"><strong className="mark">PP</strong><span className="eyebrow">PRIVATE AREA</span><h1>Admin login</h1><p>Manage your Pokémon TCG business.</p><form onSubmit={login}><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>{msg&&<div className="alert">{msg}</div>}<button disabled={busy}>{busy?"Signing in…":"Sign in"}</button></form></div></div>
 return <div className="admin"><header><div className="brand"><strong>PP</strong><div><b>Paul's Poke Pulls</b><small>Business Manager</small></div></div><div className="actions"><button className="ghost" onClick={onPublic}>Public site</button><button className="ghost" onClick={()=>supabase.auth.signOut()}>Sign out</button></div></header><main className="adminmain"><div className="admintitle"><div><span className="eyebrow">PRIVATE DASHBOARD</span><h1>Good to see you.</h1></div><button onClick={load}>Refresh</button></div>{msg&&<div className="alert">{msg}</div>}<div className="stats"><div><small>Unique inventory</small><b>{inv.length.toLocaleString()}</b></div><div><small>Physical cards</small><b>{inv.reduce((s,r)=>s+Number(r.quantity||0),0).toLocaleString()}</b></div><div><small>Market pricing</small><b>Next</b></div><div><small>ACE grading</small><b>Next</b></div></div><section className="panel"><div className="heading"><div><span className="eyebrow">INVENTORY</span><h2>Cards</h2></div></div><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search your full inventory..."/><div className="list">{filtered.slice(0,100).map(r=><div className="row" key={r.id}><div><b>{r.cards?.name}</b><small>{r.cards?.set_name} · {r.cards?.card_number}</small></div><span>{r.cards?.language} · {r.cards?.variant} · ×{r.quantity}</span></div>)}</div></section></main></div>
}
createRoot(document.getElementById("root")).render(<App/>);
