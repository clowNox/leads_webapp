/**
 * Analytics Module — Chart.js visualizations for lead data
 */
(function(){
'use strict';
const $=s=>document.querySelector(s);
const chartInstances = {};

const PALETTE = ['#6366f1','#f59e0b','#10b981','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f97316','#84cc16','#06b6d4','#a855f7','#e11d48','#22d3ee','#eab308'];

window.__renderAnalytics = function() {
  const allLeads = window.__leadarchLeads || [];
  if (!allLeads.length) {
    document.querySelectorAll('.analytics-card').forEach(c => {
      if (!c.querySelector('.analytics-empty')) {
        const canvas = c.querySelector('canvas');
        if (canvas) canvas.style.display = 'none';
        const p = document.createElement('p');
        p.className = 'analytics-empty';
        p.textContent = 'Generate leads to see analytics.';
        c.appendChild(p);
      }
    });
    return;
  }

  // Remove empty messages and show canvases
  document.querySelectorAll('.analytics-empty').forEach(e => e.remove());
  document.querySelectorAll('.analytics-card canvas').forEach(c => c.style.display = '');

  // Destroy existing charts
  Object.values(chartInstances).forEach(c => c.destroy());

  // 1. Score Distribution (Bar)
  const scoreBuckets = {'0-19':0,'20-39':0,'40-59':0,'60-79':0,'80-100':0};
  allLeads.forEach(l => {
    if(l.score>=80) scoreBuckets['80-100']++;
    else if(l.score>=60) scoreBuckets['60-79']++;
    else if(l.score>=40) scoreBuckets['40-59']++;
    else if(l.score>=20) scoreBuckets['20-39']++;
    else scoreBuckets['0-19']++;
  });
  chartInstances.scores = new Chart($('#chart-scores'), {
    type: 'bar',
    data: {
      labels: Object.keys(scoreBuckets),
      datasets: [{
        label: 'Leads',
        data: Object.values(scoreBuckets),
        backgroundColor: ['#ef4444','#f59e0b','#eab308','#3b82f6','#10b981'],
        borderRadius: 8, borderSkipped: false
      }]
    },
    options: { responsive:true, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true,ticks:{stepSize:1}},x:{grid:{display:false}}} }
  });

  // 2. Industry Breakdown (Doughnut)
  const industryCounts = {};
  allLeads.forEach(l => { industryCounts[l.industry] = (industryCounts[l.industry]||0)+1; });
  const indSorted = Object.entries(industryCounts).sort((a,b)=>b[1]-a[1]);
  chartInstances.industry = new Chart($('#chart-industry'), {
    type: 'doughnut',
    data: {
      labels: indSorted.map(e=>e[0]),
      datasets: [{ data: indSorted.map(e=>e[1]), backgroundColor: PALETTE.slice(0,indSorted.length), borderWidth:0 }]
    },
    options: { responsive:true, plugins:{legend:{position:'right',labels:{boxWidth:12,font:{size:11}}}} }
  });

  // 3. Pipeline Overview (Doughnut)
  const pipeline = JSON.parse(localStorage.getItem('leadarch_pipeline')||'{}');
  const stageCounts = {new:0,contacted:0,pitched:0,won:0,lost:0};
  allLeads.forEach(l => {
    const id = l.name+'|'+l.city;
    const stage = pipeline[id]?.stage || 'new';
    stageCounts[stage]++;
  });
  chartInstances.pipeline = new Chart($('#chart-pipeline'), {
    type: 'doughnut',
    data: {
      labels: ['New','Contacted','Pitched','Won','Lost'],
      datasets: [{ data: Object.values(stageCounts), backgroundColor:['#6366f1','#f59e0b','#3b82f6','#10b981','#ef4444'], borderWidth:0 }]
    },
    options: { responsive:true, plugins:{legend:{position:'right',labels:{boxWidth:12,font:{size:11}}}} }
  });

  // 4. Top States (Horizontal Bar)
  const stateCounts = {};
  allLeads.forEach(l => {
    const parts = (l.city||'').split(',');
    const state = parts.length > 1 ? parts[parts.length-1].trim() : 'Unknown';
    stateCounts[state] = (stateCounts[state]||0)+1;
  });
  const stateSorted = Object.entries(stateCounts).sort((a,b)=>b[1]-a[1]).slice(0,10);
  chartInstances.states = new Chart($('#chart-states'), {
    type: 'bar',
    data: {
      labels: stateSorted.map(e=>e[0]),
      datasets: [{ label:'Leads', data:stateSorted.map(e=>e[1]), backgroundColor:'#6366f1', borderRadius:6, borderSkipped:false }]
    },
    options: { indexAxis:'y', responsive:true, plugins:{legend:{display:false}}, scales:{x:{beginAtZero:true,ticks:{stepSize:1}},y:{grid:{display:false}}} }
  });

  // 5. Digital Gaps Breakdown (Polar Area)
  const gapCounts = {};
  allLeads.forEach(l => { (l.gaps||[]).forEach(g => { gapCounts[g]=(gapCounts[g]||0)+1; }); });
  const gapSorted = Object.entries(gapCounts).sort((a,b)=>b[1]-a[1]).slice(0,8);
  chartInstances.gaps = new Chart($('#chart-gaps'), {
    type: 'polarArea',
    data: {
      labels: gapSorted.map(e=>e[0]),
      datasets: [{ data:gapSorted.map(e=>e[1]), backgroundColor:PALETTE.slice(0,gapSorted.length).map(c=>c+'99') }]
    },
    options: { responsive:true, plugins:{legend:{position:'right',labels:{boxWidth:10,font:{size:10}}}} }
  });
};
})();
