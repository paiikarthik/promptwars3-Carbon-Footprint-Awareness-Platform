import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Search, 
  Layers, 
  Bike, 
  Trash2, 
  Zap, 
  Compass, 
  Navigation,
  Footprints,
  Bus
} from 'lucide-react';

export default function CarbonMap({ user }) {
  const [activeLayer, setActiveLayer] = useState('all'); // 'all', 'traffic', 'green'
  const [poiType, setPoiType] = useState('recycling'); // 'ev_charging', 'recycling', 'public_transport', 'sustainable_shop'
  const [pois, setPois] = useState([]);
  const [isLoadingPois, setIsLoadingPois] = useState(false);
  const [routeQuery, setRouteQuery] = useState({ origin: 'Home', destination: 'College' });
  const [routeResult, setRouteResult] = useState(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  
  // Default coordinates (e.g. Metro City Center)
  const latitude = user?.latitude || 47.6062;
  const longitude = user?.longitude || -122.3321;

  useEffect(() => {
    fetchPois();
  }, [poiType, latitude, longitude]);

  const fetchPois = async () => {
    setIsLoadingPois(true);
    try {
      const response = await fetch(`/api/location/nearby?latitude=${latitude}&longitude=${longitude}&place_type=${poiType}`);
      const data = await response.json();
      setPois(data);
    } catch (err) {
      console.error("Failed to load POIs", err);
    } finally {
      setIsLoadingPois(false);
    }
  };

  const handleRouteAnalysis = async (e) => {
    e.preventDefault();
    if (!routeQuery.origin.trim() || !routeQuery.destination.trim()) return;

    setIsLoadingRoute(true);
    try {
      const response = await fetch('/api/location/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: routeQuery.origin,
          destination: routeQuery.destination,
          current_mode: user?.preferences?.commute_mode || 'petrol_bike'
        })
      });
      const data = await response.json();
      setRouteResult(data);
    } catch (err) {
      console.error("Failed to analyze route emissions", err);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // SVG Fallback Map settings
  const mapHotspots = [
    { name: "Downtown Commuter Corridor", x: 140, y: 80, radius: 25, type: "traffic", intensity: "High Traffic Emissions", color: "rgba(248, 113, 113, 0.4)" },
    { name: "Industrial Zone Transit Bypass", x: 50, y: 150, radius: 30, type: "traffic", intensity: "Heavy Freight Carbon Zone", color: "rgba(239, 68, 68, 0.45)" },
    { name: "Central Botanic Reserve", x: 100, y: 100, radius: 35, type: "green", intensity: "Low Carbon Offset Park", color: "rgba(16, 185, 129, 0.35)" },
    { name: "North Side Ecological Reserve", x: 150, y: 40, radius: 20, type: "green", intensity: "Urban Green Belt", color: "rgba(52, 211, 153, 0.3)" }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Sidebar Controllers & Routing */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Layer Toggles & Search */}
        <div className="glass-card rounded-2xl p-5 border-white/10 space-y-4">
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider font-display flex items-center">
            <Layers className="w-4 h-4 mr-2 text-eco-accent-green" />
            Carbon Map Layers
          </h4>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'all', name: 'Standard' },
              { id: 'traffic', name: 'Emissions' },
              { id: 'green', name: 'Greenery' }
            ].map(l => (
              <button
                key={l.id}
                onClick={() => setActiveLayer(l.id)}
                className={`py-2 px-2 text-xs rounded-lg border font-medium transition ${
                  activeLayer === l.id
                    ? 'border-eco-accent-green bg-eco-accent-green/20 text-white'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {l.name}
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-white/5 space-y-2">
            <label className="text-xs text-slate-400 block font-semibold uppercase">Filter Sustainable Places</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'recycling', name: 'Recycle Hubs', icon: Trash2, color: 'text-amber-400' },
                { id: 'ev_charging', name: 'EV Charging', icon: Zap, color: 'text-cyan-400' },
                { id: 'public_transport', name: 'Bus Stations', icon: Bus, color: 'text-eco-accent-mint' },
                { id: 'sustainable_shop', name: 'Eco Groceries', icon: Footprints, color: 'text-emerald-400' }
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setPoiType(p.id)}
                  className={`py-2 px-3 text-xs rounded-lg border font-medium transition flex items-center space-x-1.5 ${
                    poiType === p.id
                      ? 'border-white/20 bg-white/15 text-white font-semibold'
                      : 'border-white/5 bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <p.icon className={`w-3.5 h-3.5 ${p.color}`} />
                  <span>{p.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Route Emission Calculator */}
        <div className="glass-card rounded-2xl p-5 border-white/10 space-y-4">
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider font-display flex items-center">
            <Compass className="w-4 h-4 mr-2 text-eco-accent-cyan" />
            Route Emission Finder
          </h4>

          <form onSubmit={handleRouteAnalysis} className="space-y-3">
            <div className="space-y-1 relative">
              <label className="text-xxs text-slate-400 font-bold uppercase">Origin</label>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 text-eco-accent-cyan absolute left-3" />
                <input
                  type="text"
                  value={routeQuery.origin}
                  onChange={(e) => setRouteQuery({ ...routeQuery, origin: e.target.value })}
                  placeholder="e.g. Home"
                  className="w-full pl-9 pr-3 py-2 bg-eco-bg-input border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-eco-accent-cyan placeholder-slate-600"
                />
              </div>
            </div>

            <div className="space-y-1 relative">
              <label className="text-xxs text-slate-400 font-bold uppercase">Destination</label>
              <div className="flex items-center">
                <Navigation className="w-4 h-4 text-eco-accent-green absolute left-3" />
                <input
                  type="text"
                  value={routeQuery.destination}
                  onChange={(e) => setRouteQuery({ ...routeQuery, destination: e.target.value })}
                  placeholder="e.g. College"
                  className="w-full pl-9 pr-3 py-2 bg-eco-bg-input border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-eco-accent-green placeholder-slate-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoadingRoute}
              className="w-full py-2.5 bg-eco-accent-cyan hover:bg-cyan-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg hover:shadow-eco-accent-cyan/15 transition flex items-center justify-center space-x-2"
            >
              <span>{isLoadingRoute ? 'Calculating...' : 'Compare Commute Modes'}</span>
            </button>
          </form>

          {/* Route results */}
          {routeResult && (
            <div className="pt-3 border-t border-white/5 space-y-3">
              <div className="text-xxs text-slate-400 font-bold uppercase flex justify-between">
                <span>Distance: {routeResult.distance_km} km</span>
                <span>Time: {routeResult.duration_mins} mins</span>
              </div>

              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {routeResult.modes_comparison.map((m, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white/5 border border-white/5 rounded-lg p-2 text-xxs">
                    <span className="font-semibold text-white">{m.name}</span>
                    <div className="flex items-center space-x-3 text-right">
                      <div>
                        <span className="text-slate-200 block font-bold">{m.emissions_kg} kg CO2</span>
                        <span className="text-slate-400 block">{m.duration_mins} mins</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xxs text-eco-accent-mint font-semibold leading-relaxed border-t border-white/5 pt-2">
                💡 AI: {routeResult.ai_recommendation}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Map Viewer */}
      <div className="lg:col-span-8 glass-card rounded-2xl p-4 border-white/10 flex flex-col justify-between min-h-[500px]">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-md font-bold text-white font-display">City Sustainability Radar</h3>
            <p className="text-xs text-slate-400">Emission intensity map for Metro City</p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xxs font-bold bg-white/5 border border-white/10 text-slate-400">
            Fallback SVG Engine Active
          </span>
        </div>

        {/* Custom SVG Map Canvas */}
        <div className="flex-1 border border-white/10 rounded-xl relative overflow-hidden bg-[#070b09] select-none shadow-inner aspect-[4/3] flex items-center justify-center">
          <svg viewBox="0 0 200 150" className="w-full h-full">
            {/* Grid Lines representing streets */}
            <g stroke="rgba(255, 255, 255, 0.03)" strokeWidth="0.5">
              <line x1="20" y1="0" x2="20" y2="150" />
              <line x1="40" y1="0" x2="40" y2="150" />
              <line x1="60" y1="0" x2="60" y2="150" />
              <line x1="80" y1="0" x2="80" y2="150" />
              <line x1="100" y1="0" x2="100" y2="150" />
              <line x1="120" y1="0" x2="120" y2="150" />
              <line x1="140" y1="0" x2="140" y2="150" />
              <line x1="160" y1="0" x2="160" y2="150" />
              <line x1="180" y1="0" x2="180" y2="150" />
              
              <line x1="0" y1="20" x2="200" y2="20" />
              <line x1="0" y1="40" x2="200" y2="40" />
              <line x1="0" y1="60" x2="200" y2="60" />
              <line x1="0" y1="80" x2="200" y2="80" />
              <line x1="0" y1="100" x2="200" y2="100" />
              <line x1="0" y1="120" x2="200" y2="120" />
            </g>

            {/* City Transit Paths (Bus lines / trains) */}
            <path d="M 0,35 Q 70,30 130,90 T 200,80" fill="none" stroke="rgba(6, 182, 212, 0.2)" strokeWidth="1.5" strokeDasharray="3,2" />
            <path d="M 40,0 Q 110,60 110,150" fill="none" stroke="rgba(16, 185, 129, 0.2)" strokeWidth="1.5" strokeDasharray="4,3" />

            {/* Active Carbon Zone Overlays */}
            {mapHotspots
              .filter(h => activeLayer === 'all' || activeLayer === h.type)
              .map((h, idx) => (
                <g key={idx} className="transition-opacity duration-300">
                  <circle 
                    cx={h.x} 
                    cy={h.y} 
                    r={h.radius} 
                    fill={h.color} 
                    className="animate-pulse-slow"
                  />
                  <text x={h.x} y={h.y - 2} textAnchor="middle" fill="#94a3b8" fontSize="4.5" fontWeight="semibold" opacity={0.8}>{h.name}</text>
                  <text x={h.x} y={h.y + 4} textAnchor="middle" fill={h.type === 'traffic' ? '#f87171' : '#34d399'} fontSize="3.5" fontWeight="bold">{h.intensity}</text>
                </g>
              ))
            }

            {/* POI pins */}
            {pois.map((p, idx) => {
              // Map latitude/longitude offsets to SVG viewport
              // Simple conversion: latitude is centered at 47.6, longitude at -122.3
              const xVal = 100 + ((p.longitude - longitude) * 1200);
              const yVal = 75 - ((p.latitude - latitude) * 1200);
              
              const pinColor = poiType === 'recycling' 
                ? '#fbbf24' 
                : poiType === 'ev_charging' 
                ? '#22d3ee' 
                : poiType === 'public_transport' 
                ? '#34d399' 
                : '#10b981';

              return (
                <g key={idx} transform={`translate(${xVal}, ${yVal})`} className="cursor-pointer group">
                  <circle cx="0" cy="0" r="3.5" fill={pinColor} stroke="#ffffff" strokeWidth="0.5" className="animate-bounce" />
                  <circle cx="0" cy="0" r="1.5" fill="#000000" />
                  
                  {/* Floating tooltip on hover */}
                  <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <rect x="-35" y="-18" width="70" height="13" rx="2" fill="rgba(8, 13, 10, 0.95)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                    <text x="0" y="-12" textAnchor="middle" fill="#ffffff" fontSize="4" fontWeight="bold">{p.name}</text>
                    <text x="0" y="-8" textAnchor="middle" fill="#94a3b8" fontSize="3">{p.address}</text>
                  </g>
                </g>
              );
            })}
          </svg>

          {/* Map legend overlay */}
          <div className="absolute bottom-4 left-4 p-2 bg-eco-bg-dark/90 border border-white/10 rounded-lg text-[9px] space-y-1.5 backdrop-blur-md">
            <span className="font-bold text-white uppercase block">Map Legend</span>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-eco-accent-red/40 border border-eco-accent-red/60 inline-block"></span>
              <span className="text-slate-300">High Emission Zones</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-eco-accent-green/45 border border-eco-accent-green/60 inline-block"></span>
              <span className="text-slate-300">Carbon Sink Reserves</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded bg-amber-400 inline-block"></span>
              <span className="text-slate-300">Sustainable Pins (POIs)</span>
            </div>
          </div>
        </div>

        <div className="mt-3 text-xxs text-slate-400 flex items-center justify-between border-t border-white/5 pt-2">
          <span>Move cursor over pins to view eco locations.</span>
          <span>Google Places API synced.</span>
        </div>
      </div>
    </div>
  );
}
