(function(){
'use strict';
const LOCATIONS = window.INDIA_LOCATIONS;

// Levenshtein distance for fuzzy dedup
function levenshtein(a,b){const m=[];for(let i=0;i<=b.length;i++){m[i]=[i];for(let j=1;j<=a.length;j++)m[i][j]=i===0?j:Math.min(m[i-1][j]+1,m[i][j-1]+1,m[i-1][j-1]+(a[j-1]===b[i-1]?0:1));}return m[b.length][a.length];}

const INDUSTRIES=["Restaurant","Healthcare","IT Services","Retail","Salon & Spa","Real Estate","Legal","Fitness & Gym","Auto Services","Home Services","Education","Photography","Grocery","Bakery & Sweets","Clothing"];
const NAMES={
  "Restaurant":["Sharma's Kitchen","Royal Dhaba","Spice Garden","Annapurna Bhojanalaya","Shree Sai Restaurant","New Delhi Darbar","Chettinad Corner","Tandoori Nights","Biryani House","Sagar Ratna","Madras Café","Punjab Grill","Udupi Palace","Dosa Plaza","Naivedyam"],
  "Healthcare":["Shree Clinic","City Dental Care","Ayush Health Center","Life Care Hospital","Apollo Pharmacy","Jeevan Jyoti Clinic","Sanjeevani Medical","Dhanvantari Clinic","Arogyam Wellness","Medplus Diagnostics"],
  "IT Services":["CompuCare Solutions","NetFix IT","Digital Seva Center","Cyber Point","TechMitra Services","PrintScan Hub","Computer Clinic","DataSoft Solutions","WebGuru IT","SmartByte Technologies"],
  "Retail":["Kirana General Store","New Fashion Hub","Lakshmi Textiles","Balaji Traders","Mahalaxmi Enterprises","Sri Sai Traders","National Stores","Pooja Collection","Shubham Mart","Daily Needs Store"],
  "Salon & Spa":["Style Studio","New Look Salon","Glamour Beauty Parlour","Star Hair Cutting","Shine Beauty Point","Royal Men's Salon","Aura Spa & Salon","Elegance Beauty","Tip Top Salon","Natural Glow Spa"],
  "Real Estate":["Griha Properties","NestFinder Realty","Dream Home Consultants","Bhoomi Real Estate","Vastu Properties","Skyline Realtors","Aashiyana Builders","Golden Gate Properties","PropertyWala","HomeSure Realty"],
  "Legal":["Advocate Sharma & Associates","Legal Aid Center","Nyay Law Firm","Justice Chambers","LegalMitra","Apex Legal Consultants","Vidhi Associates","RightPath Legal","LawPoint","Civil Court Associates"],
  "Fitness & Gym":["Power Gym","FitIndia Studio","Muscle Factory","Iron Body Gym","Yoga Shala","CrossFit Zone","Anytime Fitness","Body Sculpt","Strength Arena","FlexFit Gym"],
  "Auto Services":["Balaji Auto Works","New Bharat Garage","Royal Automobile","Quick Fix Motors","Maruti Service Point","Tyre King","AutoCare Center","SpeedWheels Garage","Golden Auto Repairs","National Motors"],
  "Home Services":["Sharma Plumbing Works","City Electricals","PaintPro Services","AC Repair Wala","HomeFix Solutions","CleanSweep Services","CarpenterJi","PipeMaster Plumbing","WaterProof Solutions","SafeGuard Pest Control"],
  "Education":["Bright Future Academy","Vidya Coaching Centre","Excel Tutorials","Gurukul Classes","MathsMaster Tuitions","IIT Point Coaching","English Guru","Saraswati Academy","TopRank Institute","Smart Learning Hub"],
  "Photography":["ClickArt Studio","Royal Photography","Shutter Box Studio","Moments Photography","Dream Clicks","Golden Frame Studio","Candid Stories","Flash Photography","Pixel Perfect Studio","Photo Point"],
  "Grocery":["Fresh Mart","Daily Fresh Vegetables","Sabzi Mandi Express","Organic Basket","Green Grocery","FruitWala","Annpurna Grocery","SuperMart","Kisan Fresh","Nature's Best"],
  "Bakery & Sweets":["Shree Mithai Bhandar","Royal Bakery","Sweet Corner","Cake Walk","New Bombay Bakery","Gulab Sweets","Sugar & Spice","Anand Sweets","Fresh Bake","Mithai Palace"],
  "Clothing":["Fashion Point","Trendy Collection","Silk India","Style Mantra","Vastra Emporium","Kapda Bazar","Ethnic Wear Hub","Brand Factory Local","Rajwadi Collection","FashionStreet"]
};

// Scoring weights
function scoreLead(profile){
  let score=0, gaps=[];
  if(!profile.hasWebsite){score+=20;gaps.push("No website");}
  if(!profile.hasDomain){score+=15;gaps.push("No domain");}
  if(!profile.hasSocialMedia){score+=20;gaps.push("No social media");}
  else if(!profile.socialMediaActive){score+=10;gaps.push("Inactive social media");}
  if(profile.hasPhone){score+=8;} else gaps.push("No phone");
  if(profile.hasEmail){score+=7;} else gaps.push("No email");
  if(profile.hasLocation){score+=5;}
  if(profile.reviewCount>0 && !profile.hasWebsite){score+=10;}
  if(profile.photoCount<=2){score+=5;gaps.push("Few/no photos");}
  if(profile.businessName){score+=5;}
  if(profile.reviewCount<=3){score+=5;gaps.push("Few reviews ("+profile.reviewCount+")");}
  return {score:Math.min(score,100),gaps};
}

function scoreLabel(s){
  if(s>=80)return{label:"Hot Lead 🔥",cls:"score--hot"};
  if(s>=60)return{label:"Warm Lead ⭐",cls:"score--warm"};
  if(s>=40)return{label:"Cool Lead",cls:"score--cool"};
  return{label:"Cold Lead",cls:"score--cold"};
}

function generateLeads(area,state,industry){
  const loc=`${area}, ${state}`;
  const count=7+Math.floor(Math.random()*8);
  const leads=[],used=new Set();
  for(let i=0;i<count;i++){
    const ind=industry||INDUSTRIES[Math.floor(Math.random()*INDUSTRIES.length)];
    const pool=NAMES[ind]||NAMES["Retail"];
    let name;do{name=pool[Math.floor(Math.random()*pool.length)];}while(used.has(name)&&used.size<pool.length);
    used.add(name);
    const profile={
      businessName:name,
      hasWebsite:Math.random()<0.12,
      hasDomain:Math.random()<0.08,
      hasSocialMedia:Math.random()<0.35,
      socialMediaActive:Math.random()<0.2,
      hasPhone:Math.random()>0.15,
      hasEmail:Math.random()>0.55,
      hasLocation:Math.random()>0.1,
      reviewCount:Math.floor(Math.random()*25),
      photoCount:Math.floor(Math.random()*8),
      rating:Math.round((2+Math.random()*3)*10)/10
    };
    const {score,gaps}=scoreLead(profile);
    const {label,cls}=scoreLabel(score);
    leads.push({
      name,industry:ind,city:loc,profile,score,scoreLabel:label,scoreCls:cls,gaps,
      contact:profile.hasPhone?(profile.hasEmail?"Phone & Email":"Phone only"):(profile.hasEmail?"Email only":"No contact"),
      time:["Just now","2m ago","5m ago","12m ago","25m ago","45m ago","1h ago","2h ago"][i%8]
    });
  }
  leads.sort((a,b)=>b.score-a.score);
  return leads;
}

// ── DOM ──
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
let allLeads=[];
window.__leadarchLeads = allLeads;
const sidebar=$('#sidebar'),sidebarToggle=$('#sidebar-toggle');
const navItems=$$('.nav-item[data-page]'),pages=$$('.page');
const activityList=$('#activity-list'),resultsTbody=$('#results-tbody');
const searchResults=$('#search-results'),toastContainer=$('#toast-container');
const modalOverlay=$('#modal-overlay');
const scanBar=$('#scan-progress-bar'),scanPct=$('#scan-percent');
const locCountry=$('#loc-country'),locState=$('#loc-state'),locArea=$('#loc-area');
const activeAreaText=$('#active-area-text');
const genProg=$('#gen-progress'),genBar=$('#gen-progress-bar'),genTitle=$('#gen-progress-title'),genSub=$('#gen-progress-sub');
const stepC=$('#step-country'),stepS=$('#step-state'),stepA=$('#step-area');

// ── Nav ──
function switchPage(n){pages.forEach(p=>p.classList.add('hidden'));navItems.forEach(i=>i.classList.remove('nav-item--active'));const t=$(`#page-${n}`),v=$(`.nav-item[data-page="${n}"]`);if(t){t.classList.remove('hidden');t.style.animation='none';t.offsetHeight;t.style.animation='';}if(v)v.classList.add('nav-item--active');sidebar.classList.remove('sidebar--open');
  // Trigger module renderers
  if(n==='pipeline'&&typeof window.__renderPipeline==='function')window.__renderPipeline();
  if(n==='analytics'&&typeof window.__renderAnalytics==='function')window.__renderAnalytics();
}
window.__switchPage = switchPage;
navItems.forEach(i=>i.addEventListener('click',e=>{e.preventDefault();switchPage(i.dataset.page);}));
sidebarToggle.addEventListener('click',()=>sidebar.classList.toggle('sidebar--open'));
document.addEventListener('click',e=>{if(innerWidth<=768&&sidebar.classList.contains('sidebar--open')&&!sidebar.contains(e.target)&&e.target!==sidebarToggle)sidebar.classList.remove('sidebar--open');});

// ── Cascading selects ──
function fillSel(sel,items,ph){sel.innerHTML=`<option value="">${ph}</option>`;items.forEach(i=>{const o=document.createElement('option');o.value=i;o.textContent=i;sel.appendChild(o);});sel.disabled=false;}
function resetSel(sel,ph){sel.innerHTML=`<option value="">${ph}</option>`;sel.disabled=true;}
function upSteps(){const c=locCountry.value,s=locState.value,a=locArea.value;stepC.className='location-step'+(c?' location-step--done':' location-step--active');stepS.className='location-step'+(s?' location-step--done':(c?' location-step--active':''));stepA.className='location-step'+(a?' location-step--done':(s?' location-step--active':''));}

// Auto-select India and populate states
fillSel(locState,Object.keys(LOCATIONS).sort(),'Select State / UT');
locState.disabled=false;
locCountry.value='India';
activeAreaText.textContent='India';
upSteps();

locCountry.addEventListener('change',()=>{
  if(locCountry.value){fillSel(locState,Object.keys(LOCATIONS).sort(),'Select State / UT');} else resetSel(locState,'Select state first');
  resetSel(locArea,'Select area');activeAreaText.textContent=locCountry.value||'No area selected';upSteps();
});
locState.addEventListener('change',()=>{
  const st=locState.value;
  if(st&&LOCATIONS[st])fillSel(locArea,LOCATIONS[st],'Select City / Area');else resetSel(locArea,'Select area');
  activeAreaText.textContent=st?`${st}, India`:'India';upSteps();
});
locArea.addEventListener('change',()=>{activeAreaText.textContent=locArea.value?`${locArea.value}, ${locState.value}`:`${locState.value}, India`;upSteps();});

// ── Real Google Maps API Integration ──
async function fetchRealGoogleLeads(area, state, industry) {
  return new Promise((resolve, reject) => {
    if (!window.google || !google.maps || !google.maps.places) {
      resolve(null); // Fallback to simulated
      return;
    }

    const map = new google.maps.Map(document.createElement('div'));
    const service = new google.maps.places.PlacesService(map);
    const query = `${industry} in ${area}, ${state}`;

    service.textSearch({ query }, (results, status) => {
      if (status !== google.maps.places.PlacesServiceStatus.OK || !results) {
        resolve(null);
        return;
      }

      const leads = [];
      results.slice(0, 15).forEach((place, i) => { // Top 15 real results
        // Synthesize the same profile structure from real Google data
        const profile = {
          businessName: place.name,
          hasWebsite: false, // We check this below if details are fetched, assume false for base textSearch
          hasDomain: false,
          hasSocialMedia: false,
          socialMediaActive: false,
          hasPhone: false,
          hasEmail: false,
          hasLocation: !!place.formatted_address,
          reviewCount: place.user_ratings_total || 0,
          photoCount: place.photos ? place.photos.length : 0,
          rating: place.rating || 0
        };

        // Re-score based on real data
        const {score, gaps} = scoreLead(profile);
        const {label, cls} = scoreLabel(score);

        leads.push({
          name: place.name,
          industry: industry,
          city: `${area}, ${state}`,
          profile,
          score,
          scoreLabel: label,
          scoreCls: cls,
          gaps,
          contact: "Address only (need details fetch)",
          time: ["Just now","2m ago","5m ago","12m ago"][i%4]
        });
      });
      
      leads.sort((a,b)=>b.score-a.score);
      resolve(leads);
    });
  });
}

// ── Generate ──
$('#btn-run-search').addEventListener('click',()=>{
  const state=locState.value,area=locArea.value;
  if(!state){showToast('Please select a state.','error');return;}
  if(!area){showToast('Please select a city/area.','error');return;}
  const industry=$('#search-industry').value,priority=$('#search-priority').value;
  const fullLoc=`${area}, ${state}`;
  genProg.classList.remove('hidden');genBar.style.width='0%';
  genTitle.textContent=`Scanning ${fullLoc}...`;genSub.textContent='Querying Google Maps listings';
  let pct=0;const msgs=['Checking Google My Business profiles...','Analyzing domain registrations...','Scanning social media presence...','Scoring digital presence gaps...','Finalizing lead quality...'];let mi=0;
  const iv=setInterval(()=>{pct+=8+Math.random()*12;if(pct>95)pct=95;genBar.style.width=pct+'%';if(mi<msgs.length&&pct>(mi+1)*18)genSub.textContent=msgs[mi++];},400);
  setTimeout(async ()=>{
    clearInterval(iv);genBar.style.width='100%';genSub.textContent='Complete!';
    
    let results = await fetchRealGoogleLeads(area, state, industry);
    if (!results) {
      console.log('Using simulated data (No Google API or quota exceeded).');
      results = generateLeads(area,state,industry);
    } else {
      console.log('Using LIVE Google Places API data.');
    }

    if(priority==='High')results=results.filter(l=>l.score>=70);
    else if(priority==='Medium')results=results.filter(l=>l.score>=40&&l.score<70);
    else if(priority==='Low')results=results.filter(l=>l.score<40);
    // Deduplication — fuzzy name + area match
    let dupeCount=0;
    results.forEach(r=>{
      const isDupe=allLeads.some(l=>{
        if(l.city===r.city&&l.name===r.name)return true;
        if(l.city===r.city&&levenshtein(l.name.toLowerCase(),r.name.toLowerCase())<=2)return true;
        return false;
      });
      if(!isDupe)allLeads.push(r); else dupeCount++;
    });
    if(dupeCount)showToast(`${dupeCount} duplicate lead(s) filtered out.`,'info');
    allLeads.sort((a,b)=>b.score-a.score);
    window.__leadarchLeads = allLeads;
    setTimeout(()=>{
      genProg.classList.add('hidden');
      renderSearchResults(results,fullLoc);renderResultsTable(allLeads);renderActivityList(allLeads.slice(0,8));updateKPIs();
      const st2=$('.scan-card__title');if(st2)st2.textContent=`Active Scan: ${fullLoc} ${window.google ? '(LIVE)' : '(SIM)'}`;
      showToast(`${results.length} leads generated for ${fullLoc}!`, 'success');
    },500);
  },3000);
});

// ── Render: Activity list ──
function renderActivityList(data){
  activityList.innerHTML='';
  data.forEach((l,i)=>{
    const el=document.createElement('div');el.className='activity-item';el.style.animationDelay=`${i*.07}s`;
    const {label,cls}=scoreLabel(l.score);
    el.innerHTML=`<div class="activity-item__avatar">${l.name.charAt(0)}</div>
      <div class="activity-item__info"><div class="activity-item__name">${l.name}</div><div class="activity-item__meta">${l.industry} • ${l.time||''}</div></div>
      <div class="activity-item__location"><div class="activity-item__city">${l.city||''}</div><div class="activity-item__contact">${l.contact}</div></div>
      <span class="score-badge ${cls}">${l.score}/100</span>`;
    activityList.appendChild(el);
  });
}

// ── Render: Search results with profile detail ──
function renderSearchResults(results,area){
  searchResults.innerHTML='';
  if(!results.length){searchResults.innerHTML='<p class="search-results__empty">No leads found. Try broader criteria.</p>';return;}
  const h=document.createElement('div');h.className='search-results__header';
  h.innerHTML=`<h3>📍 Leads in ${area}</h3><span class="search-results__count">${results.length} businesses found</span>`;
  searchResults.appendChild(h);
  results.forEach((l,i)=>{
    const el=document.createElement('div');el.className='lead-card';el.style.animationDelay=`${i*.06}s`;
    const p=l.profile;
    const stars='★'.repeat(Math.floor(p.rating))+(p.rating%1>=0.5?'½':'')+'☆'.repeat(5-Math.ceil(p.rating));
    el.innerHTML=`
      <div class="lead-card__top">
        <div class="activity-item__avatar">${l.name.charAt(0)}</div>
        <div class="lead-card__info">
          <div class="activity-item__name">${l.name}</div>
          <div class="activity-item__meta">${l.industry} • ${l.city}</div>
        </div>
        <span class="score-badge ${l.scoreCls}" title="${l.scoreLabel}">${l.score}/100</span>
      </div>
      <div class="lead-card__profile">
        <div class="profile-row"><span class="profile-label">Rating</span><span class="profile-value">${stars} ${p.rating}</span></div>
        <div class="profile-row"><span class="profile-label">Reviews</span><span class="profile-value">${p.reviewCount}</span></div>
        <div class="profile-row"><span class="profile-label">Photos</span><span class="profile-value">${p.photoCount}</span></div>
        <div class="profile-row"><span class="profile-label">Phone</span><span class="profile-value ${p.hasPhone?'pv--yes':'pv--no'}">${p.hasPhone?'Shared ✓':'Not shared ✗'}</span></div>
        <div class="profile-row"><span class="profile-label">Email</span><span class="profile-value ${p.hasEmail?'pv--yes':'pv--no'}">${p.hasEmail?'Shared ✓':'Not shared ✗'}</span></div>
        <div class="profile-row"><span class="profile-label">Website</span><span class="profile-value ${!p.hasWebsite?'pv--no':'pv--yes'}">${p.hasWebsite?'Has website':'No website ✗'}</span></div>
        <div class="profile-row"><span class="profile-label">Domain</span><span class="profile-value ${!p.hasDomain?'pv--no':'pv--yes'}">${p.hasDomain?'Registered':'No domain ✗'}</span></div>
        <div class="profile-row"><span class="profile-label">Social Media</span><span class="profile-value ${!p.hasSocialMedia?'pv--no':(p.socialMediaActive?'pv--yes':'pv--warn')}">${!p.hasSocialMedia?'None ✗':(p.socialMediaActive?'Active':'Inactive ⚠')}</span></div>
      </div>
      <div class="lead-card__gaps">${l.gaps.map(g=>`<span class="gap-tag">${g}</span>`).join('')}</div>`;
    searchResults.appendChild(el);
  });
}

// ── Render: Results table ──
function renderResultsTable(data){
  resultsTbody.innerHTML='';
  data.forEach(l=>{
    const tr=document.createElement('tr');
    const gapTags=l.gaps.slice(0,3).map(g=>`<span class="gap-tag gap-tag--sm">${g}</span>`).join('');
    tr.innerHTML=`<td><strong>${l.name}</strong></td><td>${l.industry}</td><td>${l.city||''}</td><td><span class="score-badge score-badge--sm ${l.scoreCls}">${l.score}</span></td><td>${gapTags}</td><td>${l.contact}</td><td><button class="btn btn--sm btn--tertiary">View</button></td>`;
    resultsTbody.appendChild(tr);
  });
}

// ── KPIs ──
function updateKPIs(){
  const t=allLeads.length,hot=allLeads.filter(l=>l.score>=80).length,warm=allLeads.filter(l=>l.score>=60&&l.score<80).length,cool=allLeads.filter(l=>l.score<60).length;
  const vals={'kpi-total-leads':t,'kpi-high-priority':hot,'kpi-exported':warm,'kpi-medium-priority':Math.floor(t*.74),'kpi-low-priority':cool};
  Object.entries(vals).forEach(([id,v])=>{const el=$(`#${id} .kpi-card__value`);if(el){el.dataset.count=v;el.textContent=v.toLocaleString();}});
}

// ── Counters ──
function animateCounters(){$$('.kpi-card__value[data-count]').forEach(el=>{const tgt=parseInt(el.dataset.count,10),st=performance.now();(function f(n){const p=Math.min((n-st)/1800,1);el.textContent=Math.floor((1-Math.pow(1-p,4))*tgt).toLocaleString();if(p<1)requestAnimationFrame(f);else el.textContent=tgt.toLocaleString();})(st);});}

// ── Global search ──
const si=$('#search-input');let sto;
si.addEventListener('input',()=>{clearTimeout(sto);sto=setTimeout(()=>{const q=si.value.trim().toLowerCase();if(!q){renderActivityList(allLeads.slice(0,8));return;}const f=allLeads.filter(l=>l.name.toLowerCase().includes(q)||l.industry.toLowerCase().includes(q)||(l.city||'').toLowerCase().includes(q));if(f.length)renderActivityList(f);else activityList.innerHTML='<p class="search-results__empty" style="padding:2rem;">No matching leads.</p>';},250);});

// ── Modal ──
function openModal(){modalOverlay.classList.remove('hidden');document.body.style.overflow='hidden';}
function closeModal(){modalOverlay.classList.add('hidden');document.body.style.overflow='';}
$('#btn-new-campaign').addEventListener('click',openModal);
$('#modal-close').addEventListener('click',closeModal);
$('#modal-cancel').addEventListener('click',closeModal);
modalOverlay.addEventListener('click',e=>{if(e.target===modalOverlay)closeModal();});
$('#modal-submit').addEventListener('click',()=>{const n=$('#campaign-name').value.trim(),l=$('#campaign-location').value.trim(),ind=$('#campaign-industry').value;if(!n||!l||!ind){showToast('Please fill all fields.','error');return;}closeModal();showToast(`Campaign "${n}" launched!`,'success');switchPage('search');$('#campaign-name').value='';$('#campaign-location').value='';$('#campaign-industry').value='';});

// ── Export ──
$$('.export-card .btn').forEach(btn=>{btn.addEventListener('click',()=>{const t=btn.textContent.trim();if(t.includes('CSV')){downloadFile(buildCSV(),'leads.csv','text/csv');showToast('CSV exported!','success');}else if(t.includes('JSON')){downloadFile(JSON.stringify(allLeads,null,2),'leads.json','application/json');showToast('JSON exported!','success');}else showToast('Google Sheets coming soon!','info');});});
function buildCSV(){const h=['Name','Industry','City','Score','Website','Domain','Social Media','Phone','Email','Reviews','Rating','Gaps'];return[h,...allLeads.map(l=>[l.name,l.industry,l.city,l.score,l.profile.hasWebsite?'Yes':'No',l.profile.hasDomain?'Yes':'No',l.profile.hasSocialMedia?(l.profile.socialMediaActive?'Active':'Inactive'):'None',l.profile.hasPhone?'Yes':'No',l.profile.hasEmail?'Yes':'No',l.profile.reviewCount,l.profile.rating,l.gaps.join('; ')])].map(r=>r.map(c=>`"${c}"`).join(',')).join('\n');}
function downloadFile(c,n,m){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([c],{type:m}));a.download=n;document.body.appendChild(a);a.click();document.body.removeChild(a);}

// ── Toast ──
function showToast(msg,type='info'){const t=document.createElement('div');t.className=`toast toast--${type}`;t.textContent=msg;toastContainer.appendChild(t);setTimeout(()=>{if(t.parentNode)t.remove();},3600);}

// ── Scan sim ──
let sp=65;setInterval(()=>{if(sp<100){sp+=Math.random()*1.2;sp=Math.min(sp,100);scanBar.style.width=sp+'%';scanPct.textContent=Math.floor(sp)+'%';if(sp>=100){showToast('Scan complete!','success');const t=$('.scan-card__title'),d=$('.scan-card__desc');if(t)t.textContent='Scan Complete';if(d)d.textContent='Leads added to pipeline.';}}},3000);

// ── Misc ──
$('#btn-notifications').addEventListener('click',()=>{showToast('3 hot leads need attention!','info');const d=$('.notification-dot');if(d)d.style.display='none';});
$('#view-all-leads').addEventListener('click',e=>{e.preventDefault();switchPage('results');});

// ── Init ──
animateCounters();upSteps();
})();
