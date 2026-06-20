// EcoAI Guardian - Frontend App Orchestrator

// Global States
let activeTab = 'dashboard';
let userState = null;
let historyState = null;
let twinState = null;
let activeMapLayer = 'all';
let activePoiType = 'recycling';
let activeChallengesFilter = 'all';
let trendChartInstance = null;

// Modal States (Carbon log)
let logStep = 1;
let selectedCommuteMode = 'petrol_bike';
let selectedEnergySource = 'mixed_grid';
let selectedDiet = 'balanced';

// 1. Initial bootloader
window.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  loadUserSession();
  
  // Accessibility: Keyboard Escape key listener to close dialogues
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLogModal();
      closeScoreInfoModal();
      const drawer = document.getElementById('buddy-drawer');
      if (drawer && !drawer.classList.contains('translate-x-full')) {
        drawer.classList.add('translate-x-full');
      }
    }
  });
});

async function loadUserSession() {
  try {
    // Check Demo status
    const healthRes = await fetch('/api/health');
    if (healthRes.ok) {
      const health = await healthRes.json();
      const demo = health.mode_configurations.google_gemini !== 'YES' || health.mode_configurations.firebase_firestore !== 'YES';
      const banner = document.getElementById('demo-banner');
      if (demo) {
        banner.classList.remove('hidden');
      } else {
        banner.classList.add('hidden');
      }
    }

    // Fetch user details
    const userRes = await fetch('/api/user/demo_user');
    userState = await userRes.json();
    
    // Sync initial logging modal preferences
    if (userState.preferences) {
      selectedCommuteMode = userState.preferences.commute_mode || 'petrol_bike';
      selectedEnergySource = userState.preferences.home_energy_source || 'mixed_grid';
      selectedDiet = userState.preferences.diet_preference || 'balanced';
    }

    // Fetch carbon logs
    const histRes = await fetch('/api/carbon/history/demo_user');
    historyState = await histRes.json();

    // Fetch twin profile
    const twinRes = await fetch('/api/eco-twin/demo_user');
    twinState = await twinRes.json();

    // Fetch predictions
    fetchPredictions();

    // Draw UI views
    updateUserBadges();
    renderDashboard();
    renderEcoTwin();
    renderCityMap();
    renderChallenges();

  } catch (err) {
    console.error("Failed to load user session data", err);
  }
}

// Fetch prediction details
async function fetchPredictions() {
  const predLoading = document.getElementById('pred-loading');
  const predDetails = document.getElementById('pred-details');
  predLoading.classList.remove('hidden');
  predDetails.classList.add('hidden');
  
  try {
    const res = await fetch('/api/carbon/predict/demo_user');
    const prediction = await res.json();
    
    document.getElementById('pred-co2-val').innerText = prediction.predicted_next_month_total;
    const reasonSpan = document.getElementById('pred-reason-val').querySelector('span');
    const reasonIcon = document.getElementById('pred-reason-val').querySelector('i');
    
    reasonSpan.innerText = `${prediction.reason} (${prediction.difference > 0 ? '+' : ''}${prediction.difference_pct}% change).`;
    
    if (prediction.difference > 0) {
      reasonIcon.setAttribute('data-lucide', 'trending-up');
      reasonIcon.className = 'w-4 h-4 text-eco-accent-red mr-1 flex-shrink-0';
    } else {
      reasonIcon.setAttribute('data-lucide', 'trending-down');
      reasonIcon.className = 'w-4 h-4 text-eco-accent-green mr-1 flex-shrink-0';
    }
  } catch (err) {
    console.error(err);
  } finally {
    predLoading.classList.add('hidden');
    predDetails.classList.remove('hidden');
    lucide.createIcons();
  }
}

// 2. Tab Navigation routing
function switchTab(tabId) {
  activeTab = tabId;
  
  // Hide all tab panes
  document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
  // Show target tab pane
  document.getElementById(`tab-${tabId}`).classList.remove('hidden');
  
  // Update sidebar buttons style and WAI-ARIA states
  document.querySelectorAll('aside nav button').forEach(btn => {
    btn.className = "w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition border border-transparent text-slate-400 hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-eco-accent-green";
    btn.setAttribute('aria-selected', 'false');
  });
  
  const activeBtn = document.getElementById(`nav-${tabId}`);
  if (activeBtn) {
    activeBtn.className = "w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition bg-eco-accent-green/10 border border-eco-accent-green/25 text-eco-accent-mint focus:outline-none";
    activeBtn.setAttribute('aria-selected', 'true');
  }

  // Adjust View titles
  const titleMap = {
    'dashboard': { t: 'Dashboard Overview', s: 'Monitor daily emissions trends and predictions.' },
    'eco-twin': { t: 'Eco Digital Twin', s: 'Reflect your sustainability choices visually.' },
    'maps': { t: 'Carbon Map Radar', s: 'Navigate green POIs and route carbon emissions.' },
    'challenges': { t: 'Challenges & Leaderboard', s: 'Rank up by saving carbon in community milestones.' },
    'history': { t: 'Logs Manager', s: 'Track and audit your historical footprint logs.' }
  };
  
  document.getElementById('view-title').innerText = titleMap[tabId].t;
  document.getElementById('view-subtitle').innerText = titleMap[tabId].s;

  // Refresh dynamic nodes
  lucide.createIcons();

  if (tabId === 'dashboard') {
    renderTrendChart();
    fetchPersonalizedInsights();
  } else if (tabId === 'eco-twin') {
    renderEcoTwin();
  } else if (tabId === 'maps') {
    renderCityMap();
  } else if (tabId === 'challenges') {
    renderChallenges();
  } else if (tabId === 'history') {
    renderHistoryLogs();
  }
}

// 3. Render Dashboard View
function renderDashboard() {
  if (!userState || !historyState) return;

  const summary = historyState.summary;
  const score = summary.average_carbon_score || 70;

  // Draw circular score meter
  const gauge = document.getElementById('score-gauge');
  const offset = 251.2 - (251.2 * score) / 100;
  gauge.style.strokeDashoffset = offset;
  
  const scoreNum = document.getElementById('score-gauge-num');
  scoreNum.innerText = score;
  
  // Color code circular gauge
  if (score >= 75) {
    scoreNum.className = 'text-4xl font-extrabold font-display text-eco-accent-green';
    gauge.setAttribute('stroke', '#10b981');
    document.getElementById('score-gauge-tip').innerText = 'Excellent! Your carbon output is well below target thresholds.';
  } else if (score >= 50) {
    scoreNum.className = 'text-4xl font-extrabold font-display text-eco-accent-yellow';
    gauge.setAttribute('stroke', '#fbbf24');
    document.getElementById('score-gauge-tip').innerText = 'Moderate standing. Small commuting modifications can elevate your score.';
  } else {
    scoreNum.className = 'text-4xl font-extrabold font-display text-eco-accent-red';
    gauge.setAttribute('stroke', '#f87171');
    document.getElementById('score-gauge-tip').innerText = 'Notice: High emission metrics detected. Use EcoBuddy for optimization ideas.';
  }

  // Draw average daily emissions stat
  document.getElementById('stat-avg-co2').innerText = summary.average_daily_co2 || '12.4';

  // Draw Latest split heights
  const logs = historyState.logs;
  if (logs.length > 0) {
    const latest = logs[0].category_breakdown;
    const maxVal = Math.max(latest.transportation, latest.energy, latest.food, latest.lifestyle, 1.0);
    document.getElementById('split-transport-bar').style.height = `${(latest.transportation / maxVal) * 100}%`;
    document.getElementById('split-energy-bar').style.height = `${(latest.energy / maxVal) * 100}%`;
    document.getElementById('split-food-bar').style.height = `${(latest.food / maxVal) * 100}%`;
    document.getElementById('split-lifestyle-bar').style.height = `${(latest.lifestyle / maxVal) * 100}%`;
  }

  // Draw trend graph
  renderTrendChart();
  fetchPersonalizedInsights();
}

function renderTrendChart() {
  if (!historyState || historyState.logs.length === 0) return;

  const logs = [...historyState.logs].reverse().slice(-7);
  const labels = logs.map(l => l.date.substring(5)); // MM-DD
  const data = logs.map(l => l.total_emissions);

  const ctx = document.getElementById('trendChart').getContext('2d');

  if (trendChartInstance) {
    trendChartInstance.destroy();
  }

  trendChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Emissions (kg CO2)',
        data: data,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderWidth: 2,
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8', font: { size: 10 } }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#94a3b8', font: { size: 10 } }
        }
      }
    }
  });
}

// 4. Update sidebar and profile badges
function updateUserBadges() {
  if (!userState) return;

  document.getElementById('user-badge-level').innerText = `L${userState.level}`;
  document.getElementById('user-badge-name').innerText = userState.displayName;
  document.getElementById('user-badge-points').innerText = `${userState.points} EcoPoints`;
  
  // Dashboard indicators
  document.getElementById('profile-name').innerText = userState.displayName;
  document.getElementById('profile-city').innerText = userState.city;
  document.getElementById('user-level-num').innerText = userState.level;
  document.getElementById('user-xp-num').innerText = userState.xp % 500;
  document.getElementById('user-xp-bar').style.width = `${(userState.xp % 500) / 500 * 100}%`;
  document.getElementById('user-points-num').innerText = userState.points;
  document.getElementById('user-streak-num').innerText = userState.streak;
}

// 5. Render Eco Twin
function renderEcoTwin() {
  if (!twinState) return;

  const score = twinState.current_status.overall_health_score || 0;
  document.getElementById('twin-score-val').innerText = score;
  
  const statusTag = document.getElementById('twin-status-tag');
  statusTag.innerText = score >= 75 ? 'Eco Guardian' : (score >= 50 ? 'Eco Steady' : 'Eco Critical');
  statusTag.className = score >= 75 ? 'text-md font-bold uppercase tracking-wider text-eco-accent-mint' : (score >= 50 ? 'text-md font-bold uppercase tracking-wider text-eco-accent-yellow' : 'text-md font-bold uppercase tracking-wider text-eco-accent-red');

  // SVG leaves builder
  let leafColor = '#f87171'; // Red
  let count = 4;
  let scale = 0.8;

  if (score >= 75) {
    leafColor = '#34d399'; // Green
    count = 14;
    scale = 1.25;
  } else if (score >= 50) {
    leafColor = '#fbbf24'; // Yellow
    count = 8;
    scale = 1.0;
  }

  const leavesCoords = [
    { cx: 80, cy: 110, rx: 12, ry: 20, rotate: -40 },
    { cx: 120, cy: 110, rx: 12, ry: 20, rotate: 40 },
    { cx: 70, cy: 70, rx: 14, ry: 24, rotate: -30 },
    { cx: 130, cy: 70, rx: 14, ry: 24, rotate: 30 },
    { cx: 100, cy: 50, rx: 15, ry: 26, rotate: 0 },
    { cx: 90, cy: 85, rx: 12, ry: 20, rotate: -15 },
    { cx: 110, cy: 85, rx: 12, ry: 20, rotate: 15 },
    { cx: 60, cy: 100, rx: 10, ry: 18, rotate: -60 },
    { cx: 140, cy: 100, rx: 10, ry: 18, rotate: 60 },
    { cx: 100, cy: 30, rx: 10, ry: 16, rotate: 5 },
    { cx: 75, cy: 50, rx: 10, ry: 18, rotate: -20 },
    { cx: 125, cy: 50, rx: 10, ry: 18, rotate: 20 },
    { cx: 82, cy: 128, rx: 8, ry: 14, rotate: -45 },
    { cx: 118, cy: 128, rx: 8, ry: 14, rotate: 45 }
  ];

  let leavesHtml = '';
  leavesCoords.slice(0, count).forEach(c => {
    leavesHtml += `<ellipse cx="${c.cx}" cy="${c.cy}" rx="${c.rx * scale}" ry="${c.ry * scale}" fill="${leafColor}" opacity="0.85" transform="rotate(${c.rotate}, ${c.cx}, ${c.cy})" class="transition-all duration-1000" />`;
  });
  document.getElementById('twin-leaves-group').innerHTML = leavesHtml;

  // Impact level badges
  const impacts = twinState.current_status;
  document.getElementById('twin-badge-transport').innerHTML = getImpactTagHtml(impacts.transportation_impact);
  document.getElementById('twin-badge-energy').innerHTML = getImpactTagHtml(impacts.energy_impact);
  document.getElementById('twin-badge-food').innerHTML = getImpactTagHtml(impacts.food_impact);
  document.getElementById('twin-badge-lifestyle').innerHTML = getImpactTagHtml(impacts.lifestyle_impact);

  // Render roadmap checklist
  let roadmapHtml = '';
  twinState.roadmap.forEach((milestone, idx) => {
    roadmapHtml += `
      <div class="flex items-start space-x-4 p-3.5 rounded-xl border transition ${milestone.completed ? 'border-eco-accent-green/20 bg-eco-accent-green/5' : 'border-white/5 bg-white/5'}">
        <div class="mt-0.5 p-1.5 rounded-lg ${milestone.completed ? 'bg-eco-accent-green/20 text-eco-accent-mint' : 'bg-white/5 text-slate-400'}">
          <i data-lucide="${milestone.completed ? 'shield-check' : 'flame'}" class="w-4 h-4" aria-hidden="true"></i>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex justify-between items-center">
            <span class="text-xs font-semibold text-eco-accent-cyan">Week ${milestone.week} - ${milestone.milestone}</span>
            ${milestone.completed ? '<span class="text-xxs font-bold text-eco-accent-mint uppercase tracking-wider">Completed</span>' : `<button onclick="completeRoadmapMilestone(${idx})" class="text-xxs font-bold text-eco-accent-cyan hover:underline uppercase tracking-wider focus:outline-none">Complete</button>`}
          </div>
          <p class="text-sm font-medium text-slate-200 mt-0.5">${milestone.action}</p>
          <div class="flex items-center space-x-2 mt-1">
            <i data-lucide="leaf" class="w-3.5 h-3.5 text-eco-accent-green" aria-hidden="true"></i>
            <span class="text-xs text-slate-400">Target Savings: <strong class="text-slate-300 font-semibold">${milestone.target_saving} kg CO2</strong></span>
          </div>
        </div>
      </div>
    `;
  });
  document.getElementById('roadmap-items-container').innerHTML = roadmapHtml;
  lucide.createIcons();
}

function getImpactTagHtml(val) {
  if (val === 'high') {
    return `<span class="px-2 py-0.5 rounded text-xs font-bold bg-eco-accent-red/20 text-eco-accent-red border border-eco-accent-red/35">High</span>`;
  } else if (val === 'medium') {
    return `<span class="px-2 py-0.5 rounded text-xs font-bold bg-eco-accent-yellow/20 text-eco-accent-yellow border border-eco-accent-yellow/35">Medium</span>`;
  } else {
    return `<span class="px-2 py-0.5 rounded text-xs font-bold bg-eco-accent-green/20 text-eco-accent-mint border border-eco-accent-green/35">Low</span>`;
  }
}

async function completeRoadmapMilestone(index) {
  if (!twinState) return;
  twinState.roadmap[index].completed = true;
  
  // Award user points
  userState.points += 50;
  userState.xp += 150;
  userState.level = Math.floor(userState.xp / 500) + 1;
  
  try {
    await fetch('/api/user/demo_user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userState)
    });
    
    await fetch('/api/eco-twin/demo_user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(twinState)
    });
    
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 }
    });
    
    loadUserSession();
  } catch (err) {
    console.error(err);
  }
}

// 6. Sustainable Map Radar
function toggleMapLayer(layer) {
  activeMapLayer = layer;
  document.querySelectorAll('[id^="layer-btn-"]').forEach(btn => {
    btn.className = "py-2 px-2 text-xs rounded-lg border font-medium transition border-white/10 bg-white/5 text-slate-400 focus:outline-none";
  });
  document.getElementById(`layer-btn-${layer}`).className = "py-2 px-2 text-xs rounded-lg border font-medium transition border-eco-accent-green bg-eco-accent-green/20 text-white focus:outline-none";
  renderCityMap();
}

function changePoiType(type) {
  activePoiType = type;
  document.querySelectorAll('[id^="poi-btn-"]').forEach(btn => {
    btn.className = "py-2 px-3 text-xs rounded-lg border font-medium transition flex items-center space-x-1.5 border-white/5 bg-white/5 text-slate-400 focus:outline-none";
  });
  document.getElementById(`poi-btn-${type}`).className = "py-2 px-3 text-xs rounded-lg border font-medium transition flex items-center space-x-1.5 border-white/20 bg-white/15 text-white focus:outline-none";
  renderCityMap();
}

async function renderCityMap() {
  const mapHotspots = [
    { name: "Downtown Commuter Corridor", x: 140, y: 80, radius: 25, type: "traffic", intensity: "High Traffic Emissions", color: "rgba(248, 113, 113, 0.4)" },
    { name: "Industrial Zone Transit Bypass", x: 50, y: 150, radius: 30, type: "traffic", intensity: "Heavy Freight Carbon Zone", color: "rgba(239, 68, 68, 0.45)" },
    { name: "Central Botanic Reserve", x: 100, y: 100, radius: 35, type: "green", intensity: "Low Carbon Offset Park", color: "rgba(16, 185, 129, 0.35)" },
    { name: "North Side Ecological Reserve", x: 150, y: 40, radius: 20, type: "green", intensity: "Urban Green Belt", color: "rgba(52, 211, 153, 0.3)" }
  ];

  // Draw zones based on layers
  let zonesHtml = '';
  mapHotspots.forEach(h => {
    if (activeMapLayer === 'all' || activeMapLayer === h.type) {
      zonesHtml += `
        <circle cx="${h.x}" cy="${h.y}" r="${h.radius}" fill="${h.color}" class="animate-pulse" style="animation-duration: 3s" />
        <text x="${h.x}" y="${h.y - 2}" text-anchor="middle" fill="#94a3b8" font-size="4.5" font-weight="semibold" opacity="0.8">${h.name}</text>
        <text x="${h.x}" y="${h.y + 4}" text-anchor="middle" fill="${h.type === 'traffic' ? '#f87171' : '#34d399'}" font-size="3.5" font-weight="bold">${h.intensity}</text>
      `;
    }
  });
  document.getElementById('map-zones-layer').innerHTML = zonesHtml;

  // Fetch coordinates and place pins
  try {
    const lat = userState?.latitude || 47.6062;
    const lon = userState?.longitude || -122.3321;
    const response = await fetch(`/api/location/nearby?latitude=${lat}&longitude=${lon}&place_type=${activePoiType}`);
    const pois = await response.json();

    const pinColors = {
      recycling: '#fbbf24',
      ev_charging: '#22d3ee',
      public_transport: '#34d399',
      sustainable_shop: '#10b981'
    };
    const color = pinColors[activePoiType] || '#10b981';

    let pinsHtml = '';
    pois.forEach((p, idx) => {
      // Scale coordinates into 200x150 SVG viewport
      const xVal = 100 + ((p.longitude - lon) * 1200);
      const yVal = 75 - ((p.latitude - lat) * 1200);

      pinsHtml += `
        <g transform="translate(${xVal}, ${yVal})" class="cursor-pointer group">
          <circle cx="0" cy="0" r="3.5" fill="${color}" stroke="#ffffff" stroke-width="0.5" class="animate-bounce" />
          <circle cx="0" cy="0" r="1.5" fill="#000000" />
          
          <g class="opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" transform="translate(0, 0)">
            <rect x="-35" y="-18" width="70" height="13" rx="2" fill="rgba(8, 13, 10, 0.95)" stroke="rgba(255,255,255,0.15)" stroke-width="0.5" />
            <text x="0" y="-12" text-anchor="middle" fill="#ffffff" font-size="4" font-weight="bold">${p.name}</text>
            <text x="0" y="-8" text-anchor="middle" fill="#94a3b8" font-size="3">${p.address}</text>
          </g>
        </g>
      `;
    });
    document.getElementById('map-pins-layer').innerHTML = pinsHtml;
  } catch (err) {
    console.error(err);
  }
}

async function runRouteAnalysis(event) {
  event.preventDefault();
  const origin = document.getElementById('route-origin').value;
  const destination = document.getElementById('route-destination').value;
  
  const container = document.getElementById('route-results-container');
  container.classList.add('hidden');

  try {
    const response = await fetch('/api/location/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin,
        destination,
        current_mode: userState?.preferences?.commute_mode || 'petrol_bike'
      })
    });
    const res = await response.json();
    
    document.getElementById('route-distance-val').innerText = res.distance_km;
    document.getElementById('route-duration-val').innerText = res.duration_mins;
    document.getElementById('route-recommendation-val').innerText = `💡 AI: ${res.ai_recommendation}`;

    let modesHtml = '';
    res.modes_comparison.forEach(m => {
      modesHtml += `
        <div class="flex justify-between items-center bg-white/5 border border-white/5 rounded-lg p-2 text-xxs">
          <span class="font-semibold text-white">${m.name}</span>
          <div class="text-right">
            <span class="text-slate-200 block font-bold">${m.emissions_kg} kg CO2</span>
            <span class="text-slate-400 block">${m.duration_mins} mins</span>
          </div>
        </div>
      `;
    });
    document.getElementById('route-modes-list').innerHTML = modesHtml;
    container.classList.remove('hidden');

  } catch (err) {
    console.error(err);
  }
}

// 7. Challenges & Leaderboard
function filterChallenges(scope) {
  activeChallengesFilter = scope;
  document.querySelectorAll('[id^="chal-filter-"]').forEach(btn => {
    btn.className = "py-1.5 px-3 text-xxs rounded-lg border transition border-white/5 bg-white/5 text-slate-400 focus:outline-none";
  });
  document.getElementById(`chal-filter-${scope}`).className = "py-1.5 px-3 text-xxs rounded-lg border transition border-eco-accent-green bg-eco-accent-green/20 text-white font-bold focus:outline-none";
  renderChallenges();
}

async function renderChallenges() {
  try {
    const chalRes = await fetch('/api/challenges');
    const challenges = await chalRes.json();

    const leadRes = await fetch('/api/leaderboard');
    const leaderboard = await leadRes.json();

    // Draw active challenges
    let listHtml = '';
    const filtered = activeChallengesFilter === 'all' ? challenges : challenges.filter(c => c.scope === activeChallengesFilter);

    const scopesIconMap = {
      global: 'globe',
      city: 'map-pin',
      college: 'school',
      workplace: 'briefcase'
    };

    filtered.forEach(c => {
      const isJoined = c.participants.includes('demo_user');
      const isCompleted = c.completed_by.includes('demo_user');
      const icon = scopesIconMap[c.scope] || 'users';

      listHtml += `
        <div class="glass-card rounded-2xl p-5 border-white/10 flex flex-col justify-between relative overflow-hidden transition-all ${isCompleted ? 'border-eco-accent-green/25 bg-eco-accent-green/5' : ''}">
          <div class="absolute -top-4 -right-4 w-12 h-12 bg-white/5 rotate-45 border-l border-b border-white/5" aria-hidden="true"></div>
          <div>
            <div class="flex items-center space-x-2 text-slate-400 text-xxs uppercase tracking-wider font-bold">
              <i data-lucide="${icon}" class="w-3.5 h-3.5" aria-hidden="true"></i>
              <span>${c.scope_name}</span>
            </div>
            <h4 class="text-md font-bold text-white mt-1 font-display">${c.title}</h4>
            <p class="text-xs text-slate-300 mt-1.5 leading-relaxed">${c.description}</p>
          </div>
          <div class="mt-4 pt-4 border-t border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div class="flex items-center space-x-4 text-xxs text-slate-400">
              <span class="flex items-center text-eco-accent-mint font-semibold">
                <i data-lucide="leaf" class="w-3.5 h-3.5 mr-1 text-eco-accent-green" aria-hidden="true"></i>
                Saves ${c.target_saving_kg} kg CO2
              </span>
              <span class="flex items-center text-eco-accent-yellow font-bold">
                <i data-lucide="award" class="w-3.5 h-3.5 mr-0.5 text-eco-accent-yellow" aria-hidden="true"></i>
                +${c.points_reward} Points
              </span>
            </div>
            
            ${isCompleted ? `
              <div class="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-eco-accent-green/20 text-eco-accent-mint border border-eco-accent-green/30 text-xs font-bold uppercase" aria-label="Challenge Completed badge">
                <i data-lucide="check-circle" class="w-4 h-4" aria-hidden="true"></i>
                <span>Completed</span>
              </div>
            ` : isJoined ? `
              <button onclick="completeChallenge('${c.id}')" class="px-4 py-1.5 bg-eco-accent-green hover:bg-emerald-600 text-slate-900 font-extrabold text-xs rounded-lg transition focus:outline-none">Complete Sprint</button>
            ` : `
              <button onclick="joinChallenge('${c.id}')" class="px-4 py-1.5 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-semibold text-xs rounded-lg transition flex items-center space-x-1 focus:outline-none">
                <span>Join Challenge</span>
              </button>
            `}
          </div>
        </div>
      `;
    });
    document.getElementById('challenges-list').innerHTML = listHtml;

    // Draw Leaderboard
    let leadHtml = '';
    leaderboard.forEach(u => {
      const isMe = u.userId === 'demo_user';
      leadHtml += `
        <div class="flex items-center justify-between p-2.5 rounded-xl border transition ${isMe ? 'border-eco-accent-green bg-eco-accent-green/10' : 'border-white/5 bg-white/5'}">
          <div class="flex items-center space-x-3">
            <span class="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${u.rank === 1 ? 'bg-amber-400 text-slate-950' : (u.rank === 2 ? 'bg-slate-300 text-slate-950' : (u.rank === 3 ? 'bg-amber-700 text-white' : 'bg-white/10 text-slate-400'))}">
              ${u.rank}
            </span>
            <div>
              <span class="text-xs font-bold block ${isMe ? 'text-eco-accent-mint' : 'text-white'}">${u.displayName}</span>
              <span class="text-xxs text-slate-400 block">${u.city}</span>
            </div>
          </div>
          <div class="text-right">
            <span class="text-xs font-bold text-white block">${u.carbon_saved_kg} kg Saved</span>
            <span class="text-xxs text-eco-accent-cyan block font-medium">${u.points} EP</span>
          </div>
        </div>
      `;
    });
    document.getElementById('leaderboard-container').innerHTML = leadHtml;

    // Draw Trophies case
    let trophyHtml = '';
    if (userState && userState.badges.length > 0) {
      userState.badges.forEach(b => {
        trophyHtml += `
          <div class="flex items-center space-x-2 bg-white/5 border border-white/5 rounded-xl p-2 hover:border-eco-accent-yellow/20 transition duration-300">
            <div class="p-1.5 rounded-lg bg-eco-accent-yellow/15 text-eco-accent-yellow">
              <i data-lucide="award" class="w-5 h-5" aria-hidden="true"></i>
            </div>
            <div>
              <span class="text-xxs font-bold text-white block">${b.name}</span>
              <span class="text-[9px] text-slate-400 block max-w-[100px] truncate">${b.description}</span>
            </div>
          </div>
        `;
      });
    } else {
      trophyHtml = `<span class="text-xxs text-slate-500">Trophies will appear here upon challenge completions.</span>`;
    }
    document.getElementById('trophies-container').innerHTML = trophyHtml;
    
    lucide.createIcons();

  } catch (err) {
    console.error(err);
  }
}

async function joinChallenge(id) {
  try {
    const res = await fetch(`/api/challenges/${id}/join/demo_user`, { method: 'POST' });
    if (res.ok) {
      loadUserSession();
    }
  } catch (err) {
    console.error(err);
  }
}

async function completeChallenge(id) {
  try {
    const res = await fetch(`/api/challenges/${id}/complete/demo_user`, { method: 'POST' });
    if (res.ok) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.65 },
        colors: ['#10b981', '#34d399', '#06b6d4', '#fbbf24']
      });
      loadUserSession();
    }
  } catch (err) {
    console.error(err);
  }
}

// 8. Log Modal Stepper
function openLogModal() {
  document.getElementById('log-modal').classList.remove('hidden');
  setLogStep(1);

  // Smart Flow: Pre-fill sliders with the user's historical averages
  if (userState && userState.historical_averages) {
    const avgDist = userState.historical_averages.commute_distance_km;
    const avgElec = userState.historical_averages.electricity_kwh;
    
    // Set distance
    const distInput = document.getElementById('input-distance');
    if (distInput) {
      distInput.value = avgDist;
      document.getElementById('slider-distance-num').innerText = avgDist;
    }
    // Set electricity
    const elecInput = document.getElementById('input-electricity');
    if (elecInput) {
      elecInput.value = avgElec;
      document.getElementById('slider-electricity-num').innerText = avgElec;
    }
  }

  // Pre-select buttons inside log modal
  selectCommuteMode(selectedCommuteMode);
  selectEnergySource(selectedEnergySource);
  selectDiet(selectedDiet);
}

function closeLogModal() {
  document.getElementById('log-modal').classList.add('hidden');
}

function setLogStep(step) {
  logStep = step;
  document.querySelectorAll('.log-form-step').forEach(el => el.classList.add('hidden'));
  document.getElementById(`log-step-${step}`).classList.remove('hidden');
  lucide.createIcons();
}

function selectCommuteMode(mode) {
  selectedCommuteMode = mode;
  document.querySelectorAll('.commute-mode-btn').forEach(btn => {
    btn.className = "commute-mode-btn px-3 py-2.5 text-sm rounded-lg border font-medium transition border-white/10 bg-white/5 text-slate-400 focus:outline-none";
  });
  document.getElementById(`mode-btn-${mode}`).className = "commute-mode-btn px-3 py-2.5 text-sm rounded-lg border font-medium transition border-eco-accent-green bg-eco-accent-green/20 text-white focus:outline-none";
  
  const distanceSection = document.getElementById('commute-distance-section');
  if (mode === 'walk_cycle') {
    distanceSection.classList.add('hidden');
  } else {
    distanceSection.classList.remove('hidden');
  }
}

function selectEnergySource(source) {
  selectedEnergySource = source;
  document.querySelectorAll('.energy-source-btn').forEach(btn => {
    btn.className = "energy-source-btn px-3 py-2 text-sm rounded-lg border font-medium transition border-white/10 bg-white/5 text-slate-400 focus:outline-none";
  });
  document.getElementById(`source-btn-${source}`).className = "energy-source-btn px-3 py-2 text-sm rounded-lg border font-medium transition border-eco-accent-cyan bg-eco-accent-cyan/20 text-white focus:outline-none";
}

function selectDiet(diet) {
  selectedDiet = diet;
  document.querySelectorAll('.diet-btn').forEach(btn => {
    btn.className = "diet-btn px-3 py-2 text-sm rounded-lg border font-medium transition border-white/10 bg-white/5 text-slate-400 focus:outline-none";
  });
  document.getElementById(`diet-btn-${diet}`).className = "diet-btn px-3 py-2 text-sm rounded-lg border font-medium transition border-amber-400 bg-amber-400/20 text-white focus:outline-none";
}

function updateDistanceSliderVal(val) {
  document.getElementById('slider-distance-num').innerText = val;
}

function updateElectricitySliderVal(val) {
  document.getElementById('slider-electricity-num').innerText = val;
}

async function submitCarbonLog() {
  const distance = parseFloat(document.getElementById('input-distance').value);
  const electricity = parseFloat(document.getElementById('input-electricity').value);
  const purchases = parseInt(document.getElementById('input-purchases').value) || 0;
  const recycled = document.getElementById('input-recycled').checked;

  const todayStr = new Date().toISOString().split('T')[0];
  const payload = {
    commute_distance_km: selectedCommuteMode === 'walk_cycle' ? 0.0 : distance,
    commute_mode: selectedCommuteMode,
    electricity_kwh: electricity,
    home_energy_source: selectedEnergySource,
    diet_preference: selectedDiet,
    shopping_purchases: purchases,
    waste_recycled: recycled
  };

  try {
    const res = await fetch(`/api/carbon/log/demo_user/${todayStr}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (res.ok) {
      closeLogModal();
      confetti({
        particleCount: 50,
        spread: 45,
        origin: { y: 0.8 }
      });
      loadUserSession();
    }
  } catch (err) {
    console.error(err);
  }
}

// 9. EcoBuddy Chat Sidebar
let chatHistory = [
  {
    role: 'assistant',
    content: `### 🌿 Welcome to EcoBuddy!
I am your personal AI sustainability coach. I track your habits, location context, and carbon logs to give you actionable advice.

Click a suggestion below or type your own question to start!`,
    timestamp: new Date()
  }
];

function toggleBuddy() {
  const drawer = document.getElementById('buddy-drawer');
  drawer.classList.toggle('translate-x-full');
  renderBuddyChat();
}

function checkBuddySubmit(event) {
  if (event.key === 'Enter') {
    submitBuddyQuery();
  }
}

function renderBuddyChat() {
  const historyContainer = document.getElementById('buddy-chat-history');
  
  let chatHtml = '';
  chatHistory.forEach(msg => {
    const isMe = msg.role === 'user';
    chatHtml += `
      <div class="flex items-start space-x-3 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse space-x-reverse' : ''}">
        <div class="p-2 rounded-lg flex-shrink-0 ${isMe ? 'bg-eco-accent-cyan/20 text-eco-accent-cyan' : 'bg-eco-accent-green/20 text-eco-accent-mint'}">
          <i data-lucide="${isMe ? 'user' : 'message-square'}" class="w-4 h-4" aria-hidden="true"></i>
        </div>
        <div class="p-3.5 rounded-2xl border text-slate-200 ${isMe ? 'bg-eco-bg-input border-eco-accent-cyan/20 rounded-tr-none' : 'bg-white/5 border-white/15 rounded-tl-none'}">
          ${isMe ? `<p class="text-sm font-medium">${msg.content}</p>` : parseMarkdown(msg.content)}
        </div>
      </div>
    `;
  });
  
  historyContainer.innerHTML = chatHtml;
  historyContainer.scrollTop = historyContainer.scrollHeight;
  lucide.createIcons();
}

async function sendBuddyQuery(query) {
  chatHistory.push({ role: 'user', content: query, timestamp: new Date() });
  renderBuddyChat();

  // Hide suggestions after chat start
  document.getElementById('buddy-suggestion-chips').classList.add('hidden');

  // Add temporary typing indicator
  const historyContainer = document.getElementById('buddy-chat-history');
  const typingId = 'buddy-typing-indicator';
  historyContainer.innerHTML += `
    <div id="${typingId}" class="flex items-start space-x-3 max-w-[80%]">
      <div class="p-2 bg-eco-accent-green/20 text-eco-accent-mint rounded-lg">
        <i data-lucide="message-square" class="w-4 h-4" aria-hidden="true"></i>
      </div>
      <div class="p-3.5 rounded-2xl bg-white/5 border border-white/15 rounded-tl-none flex items-center space-x-2">
        <span class="w-2 h-2 rounded-full bg-eco-accent-mint animate-bounce" style="animation-delay: 0ms"></span>
        <span class="w-2 h-2 rounded-full bg-eco-accent-mint animate-bounce" style="animation-delay: 150ms"></span>
        <span class="w-2 h-2 rounded-full bg-eco-accent-mint animate-bounce" style="animation-delay: 300ms"></span>
      </div>
    </div>
  `;
  historyContainer.scrollTop = historyContainer.scrollHeight;
  lucide.createIcons();

  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, user_id: 'demo_user' })
    });
    const data = await res.json();
    
    // Remove typing indicator and push reply
    const indicator = document.getElementById(typingId);
    if (indicator) indicator.remove();

    chatHistory.push({ role: 'assistant', content: data.reply, timestamp: new Date() });
    renderBuddyChat();

  } catch (err) {
    console.error(err);
    const indicator = document.getElementById(typingId);
    if (indicator) indicator.remove();
    
    chatHistory.push({ role: 'assistant', content: "❌ Failed to connect to EcoBuddy AI services. Verify backend is running.", timestamp: new Date() });
    renderBuddyChat();
  }
}

function submitBuddyQuery() {
  const input = document.getElementById('buddy-input');
  const query = input.value.trim();
  if (!query) return;

  input.value = '';
  sendBuddyQuery(query);
}

function clearBuddyChat() {
  chatHistory = [
    {
      role: 'assistant',
      content: `### 🌿 Chat reset!
Ask me anything about your current carbon footprint or how to lower emissions.`,
      timestamp: new Date()
    }
  ];
  document.getElementById('buddy-suggestion-chips').classList.remove('hidden');
  renderBuddyChat();
}

// Simple local markdown parser for chat bubble HTML output
function parseMarkdown(text) {
  const lines = text.split('\n');
  let html = '';
  
  lines.forEach(line => {
    if (line.startsWith('### ')) {
      html += `<h4 class="text-md font-bold text-white mt-3 mb-1 font-display">${line.substring(4)}</h4>`;
    } else if (line.startsWith('## ')) {
      html += `<h3 class="text-lg font-bold text-white mt-4 mb-2 font-display">${line.substring(3)}</h3>`;
    } else if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
      html += `<ul class="list-disc list-inside pl-2 py-0.5 text-slate-300 text-sm"><li>${parseBold(line.trim().substring(2))}</li></ul>`;
    } else {
      const numMatch = line.trim().match(/^(\d+)\.\s(.*)/);
      if (numMatch) {
        html += `<ol class="list-decimal list-inside pl-2 py-0.5 text-slate-300 text-sm"><li>${parseBold(numMatch[2])}</li></ol>`;
      } else if (line.trim() === '') {
        html += `<div class="h-2"></div>`;
      } else {
        html += `<p class="text-slate-300 text-sm leading-relaxed my-1">${parseBold(line)}</p>`;
      }
    }
  });

  return html;
}

function parseBold(text) {
  return text.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-eco-accent-mint">$1</strong>');
}

// 10. Privacy/Delete Data callback
async function deleteProfileData() {
  if (confirm("WARNING: Are you sure you want to delete all your carbon history, Eco Twin profile, and points? This action is permanent.")) {
    try {
      const res = await fetch('/api/user/delete/demo_user', { method: 'DELETE' });
      if (res.ok) {
        alert("All your environmental records have been cleared successfully.");
        loadUserSession();
      }
    } catch (err) {
      console.error(err);
    }
  }
}

// 11. Complete Daily Sprint challenge trigger
async function completeDailySprint() {
  const check = document.getElementById('daily-sprint-check');
  if (check.checked) {
    // Reward XP
    userState.xp += 50;
    userState.points += 15;
    userState.level = Math.floor(userState.xp / 500) + 1;
    
    try {
      await fetch('/api/user/demo_user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userState)
      });
      
      confetti({
        particleCount: 50,
        spread: 35,
        origin: { y: 0.7 }
      });
      
      loadUserSession();
    } catch (err) {
      console.error(err);
    }
  }
}

// 12. Mobile Menu Toggle
let isMobileMenuOpen = false;
function toggleMobileMenu() {
  isMobileMenuOpen = !isMobileMenuOpen;
  const menu = document.getElementById('mobile-menu');
  if (isMobileMenuOpen) {
    menu.classList.remove('hidden');
  } else {
    menu.classList.add('hidden');
  }
}

// 13. Personalized AI Action Insights
let activeInsightChallengeId = null;

async function fetchPersonalizedInsights() {
  const loadingEl = document.getElementById('insights-loading');
  const containerEl = document.getElementById('insights-container');
  if (!loadingEl || !containerEl) return;
  
  loadingEl.classList.remove('hidden');
  containerEl.classList.add('hidden');
  
  try {
    const res = await fetch('/api/carbon/insights/demo_user');
    if (!res.ok) throw new Error("Failed to fetch insights");
    const data = await res.json();
    
    const insight = data.insight;
    document.getElementById('insight-title').innerText = insight.title;
    document.getElementById('insight-desc').innerText = insight.description;
    document.getElementById('insight-saving').innerText = insight.estimated_saving_kg;
    document.getElementById('insight-difficulty').innerText = insight.difficulty;
    
    activeInsightChallengeId = insight.challenge_id;
    
    // Update button text
    const actionBtn = document.getElementById('insight-action-btn').querySelector('span');
    actionBtn.innerText = "Join Target Challenge";
    
    loadingEl.classList.add('hidden');
    containerEl.classList.remove('hidden');
  } catch (err) {
    console.error("Personalized insights loading error:", err);
    loadingEl.classList.add('hidden');
  }
}

function commitInsightAction() {
  if (activeInsightChallengeId) {
    switchTab('challenges');
    setTimeout(() => {
      const challengeEl = document.getElementById('challenges-list');
      if (challengeEl) {
        challengeEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 150);
  }
}

// 14. Carbon Logging History Manager
function renderHistoryLogs() {
  const tbody = document.getElementById('history-logs-tbody');
  if (!tbody || !historyState) return;
  
  const logs = historyState.logs;
  if (!logs || logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="p-4 text-center text-slate-500">No logs tracked yet. Go log today's footprint!</td></tr>`;
    return;
  }
  
  let html = '';
  logs.forEach(log => {
    const inputs = log.inputs;
    const date = log.date;
    const score = log.carbon_score;
    const scoreColor = score >= 75 ? 'text-eco-accent-mint font-bold' : (score >= 50 ? 'text-eco-accent-yellow font-bold' : 'text-eco-accent-red font-bold');
    
    const commuteName = inputs.commute_mode.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
    const energySource = inputs.home_energy_source.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
    const dietName = inputs.diet_preference.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
    
    html += `
      <tr class="border-b border-white/5 hover:bg-white/5 transition">
        <td class="p-3 font-semibold text-slate-300">${date}</td>
        <td class="p-3 ${scoreColor}">${score}</td>
        <td class="p-3 font-bold text-white">${log.total_emissions} kg</td>
        <td class="p-3 text-slate-300">${commuteName}</td>
        <td class="p-3 text-slate-400">${inputs.commute_distance_km} km</td>
        <td class="p-3 text-slate-300">${inputs.electricity_kwh} kWh (${energySource})</td>
        <td class="p-3 text-slate-300">${dietName}</td>
        <td class="p-3 text-right">
          <button onclick="deleteHistoryLog('${date}')" aria-label="Delete carbon log for ${date}" class="px-2.5 py-1 text-xxs font-bold rounded-lg border border-eco-accent-red/20 text-eco-accent-red hover:bg-eco-accent-red/10 transition focus:outline-none">
            Delete
          </button>
        </td>
      </tr>
    `;
  });
  
  tbody.innerHTML = html;
}

async function deleteHistoryLog(date) {
  if (confirm(`Are you sure you want to delete your carbon record for ${date}? This will update your score and Eco Twin status.`)) {
    try {
      const res = await fetch(`/api/carbon/log/demo_user/${date}`, { method: 'DELETE' });
      if (res.ok) {
        loadUserSession();
        setTimeout(() => {
          renderHistoryLogs();
        }, 150);
      }
    } catch (err) {
      console.error("Failed to delete carbon log:", err);
    }
  }
}

// 15. Score Explanation Modal handlers
function openScoreInfoModal() {
  document.getElementById('score-info-modal').classList.remove('hidden');
}

function closeScoreInfoModal() {
  document.getElementById('score-info-modal').classList.add('hidden');
}
