const Q=[
{id:"EXT-01",dimension:"Clarté & efficacité",text:"Comprenez-vous facilement les offres, services et informations communiqués par ce commerce ?",type:"mirror"},
{id:"EXT-02",dimension:"Image & cohérence",text:"L'image donnée par ce commerce vous paraît-elle claire, cohérente et professionnelle ?",type:"mirror"},
{id:"EXT-03",dimension:"Accueil & relation client",text:"Percevez-vous positivement l'accueil et la qualité de la relation avec ce commerce ?",type:"mirror"},
{id:"EXT-04",dimension:"Écoute & réactivité",text:"Vous sentez-vous écouté(e) et obtenez-vous une réponse satisfaisante lorsque vous sollicitez ce commerce ?",type:"mirror"},
{id:"EXT-05",dimension:"Ancrage local",text:"L'implication de ce commerce dans la vie locale vous paraît-elle visible ?",type:"mirror"},
{id:"EXT-06",dimension:"Attractivité & fidélisation",text:"L'image et la communication de ce commerce vous donnent-elles envie d'y revenir et de le recommander ?",type:"mirror"},
{id:"NPS-01",dimension:"Recommandation",text:"Sur une échelle de 0 à 10, quelle est la probabilité que vous recommandiez ce commerce à un proche ?",type:"nps"},
{id:"QUAL-01",dimension:"Votre expérience",text:"Qu'appréciez-vous particulièrement dans la manière dont ce commerce communique avec vous ?",type:"text",optional:true},
{id:"QUAL-02",dimension:"Votre expérience",text:"Quelle serait selon vous la principale chose que ce commerce pourrait améliorer dans sa communication avec ses clients ?",type:"text",optional:true}
];
const cfg=window.PEKAHELLIX_CLIENT_CONFIG||{};
const sb=(cfg.supabaseUrl&&cfg.supabasePublishableKey&&!cfg.supabaseUrl.startsWith("A_REMPLACER"))?window.supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}):null;
const $=id=>document.getElementById(id); const screens=["loading","invalid","intro","survey","sending","thanks","error"];
const show=id=>screens.forEach(x=>$(x).classList.toggle("hidden",x!==id));
let code="",campaign=null,i=0,answers={};
function scrollToNextButton(){setTimeout(()=>$("nextBtn").scrollIntoView({behavior:"smooth",block:"center"}),120);}
function scrollToQuestion(){setTimeout(()=>$("dimension").scrollIntoView({behavior:"smooth",block:"start"}),80);}
function selected(v){answers[Q[i].id]=v;render();scrollToNextButton();}
function render(){const q=Q[i],v=answers[q.id];$("stepLabel").textContent=`Question ${i+1} sur ${Q.length}`;$("pct").textContent=`${Math.round((i/Q.length)*100)} %`;$("bar").style.width=`${Math.round((i/Q.length)*100)}%`;$("dimension").textContent=q.dimension;$("question").textContent=q.text;$("answers").className="answers";$("answers").innerHTML="";
 if(q.type==="mirror"){["Pas du tout","Plutôt non","Plutôt oui","Tout à fait","Je ne sais pas / Non concerné"].forEach((t,n)=>{const val=n<4?n+1:null,b=document.createElement("button");b.className="answer"+(Object.prototype.hasOwnProperty.call(answers,q.id)&&v===val?" selected":"");b.textContent=t;b.onclick=()=>selected(val);$("answers").appendChild(b);});}
 if(q.type==="nps"){
  $("answers").classList.add("nps-slider-wrap");
  const hasValue=Object.prototype.hasOwnProperty.call(answers,q.id);
  const current=hasValue?Number(v):5;
  const labels=["Pas du tout probable","Très peu probable","Peu probable","Plutôt peu probable","Mitigé","Neutre","Plutôt probable","Probablement oui","Probablement oui","Très probable","Tout à fait probable"];
  const box=document.createElement("div");box.className="nps-value"+(hasValue?"":" is-empty");
  box.innerHTML=`<strong>${hasValue?current:"—"}</strong><span>${hasValue?labels[current]:"Déplacez le curseur"}</span>`;
  const slider=document.createElement("input");slider.type="range";slider.min="0";slider.max="10";slider.step="1";slider.value=current;slider.className="nps-slider";slider.setAttribute("aria-label","Probabilité de recommandation de 0 à 10");
  const update=(commit)=>{const n=Number(slider.value);box.classList.remove("is-empty");box.innerHTML=`<strong>${n}</strong><span>${labels[n]}</span>`;slider.style.setProperty("--nps-pos",`${n*10}%`);if(commit){answers[q.id]=n;$("nextBtn").disabled=false;scrollToNextButton();}};
  slider.style.setProperty("--nps-pos",`${current*10}%`);slider.addEventListener("input",()=>update(true));
  const scale=document.createElement("div");scale.className="nps-scale";scale.innerHTML='<span><b>0</b><small>Pas du tout probable</small></span><span><b>10</b><small>Tout à fait probable</small></span>';
  $("answers").append(box,slider,scale);
 }
 if(q.type==="text"){const ta=document.createElement("textarea");ta.className="textarea";ta.maxLength=1000;ta.placeholder="Votre réponse (facultative)";ta.value=v||"";ta.oninput=e=>{answers[q.id]=e.target.value};$("answers").appendChild(ta);}
 $("prevBtn").style.visibility=i?"visible":"hidden";$("nextBtn").textContent=i===Q.length-1?"Envoyer mes réponses":"Question suivante";$("nextBtn").disabled=!q.optional&&!Object.prototype.hasOwnProperty.call(answers,q.id);
}
async function submit(){show("sending");try{const payload={};Q.forEach(q=>payload[q.id]={dimension:q.dimension,type:q.type,value:answers[q.id]??null});const {error}=await sb.rpc("submit_communication_customer_response",{p_public_code:code,p_responses:payload,p_nps:answers["NPS-01"]});if(error)throw error;sessionStorage.setItem(`peka_client_done_${code}`,"1");show("thanks");}catch(e){$("errorText").textContent="Vos réponses n'ont pas pu être envoyées. Vérifiez votre connexion puis réessayez.";show("error");}}
$("startBtn").onclick=()=>{i=0;show("survey");render()};$("prevBtn").onclick=()=>{if(i>0){i--;render()}};$("nextBtn").onclick=()=>{const q=Q[i];if(!q.optional&&!Object.prototype.hasOwnProperty.call(answers,q.id))return;if(i<Q.length-1){i++;render();scrollToQuestion()}else submit()};$("retryBtn").onclick=submit;
(async()=>{code=(new URLSearchParams(location.search).get("c")||"").trim();if(!sb||!code){show("invalid");return}if(sessionStorage.getItem(`peka_client_done_${code}`)){show("thanks");return}try{const {data,error}=await sb.rpc("get_communication_customer_campaign",{p_public_code:code});if(error||!data||!data.length){show("invalid");return}campaign=data[0];$("merchantName").textContent=campaign.organization_name||"Questionnaire client";show("intro");}catch{show("invalid")}})();
if("serviceWorker" in navigator)window.addEventListener("load",async()=>{
  try{
    const reg=await navigator.serviceWorker.register("./sw.js?v=0.1.2",{updateViaCache:"none"});
    await reg.update();
    let refreshing=false;
    navigator.serviceWorker.addEventListener("controllerchange",()=>{if(!refreshing){refreshing=true;location.reload();}});
  }catch(e){console.warn("Service Worker non disponible",e);}
});
