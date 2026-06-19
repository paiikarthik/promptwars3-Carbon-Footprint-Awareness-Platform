import React, { useState } from 'react';
import { X, Bike, Zap, Utensils, ShoppingBag } from 'lucide-react';

export default function CarbonLogModal({ isOpen, onClose, onSave, defaultPreferences = {} }) {
  const [step, setStep] = useState(1);
  const [commuteDistance, setCommuteDistance] = useState(defaultPreferences.commute_distance_km || 15);
  const [commuteMode, setCommuteMode] = useState(defaultPreferences.commute_mode || 'petrol_bike');
  const [electricityKwh, setElectricityKwh] = useState(8);
  const [energySource, setEnergySource] = useState(defaultPreferences.home_energy_source || 'mixed_grid');
  const [diet, setDiet] = useState(defaultPreferences.diet_preference || 'balanced');
  const [shoppingPurchases, setShoppingPurchases] = useState(0);
  const [wasteRecycled, setWasteRecycled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const logData = {
      commute_distance_km: parseFloat(commuteDistance),
      commute_mode: commuteMode,
      electricity_kwh: parseFloat(electricityKwh),
      home_energy_source: energySource,
      diet_preference: diet,
      shopping_purchases: parseInt(shoppingPurchases),
      waste_recycled: wasteRecycled
    };

    try {
      await onSave(logData);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl glass-card rounded-2xl overflow-hidden shadow-2xl border-white/10 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 border-b border-white/10 bg-white/5">
          <h3 className="text-xl font-semibold font-display text-white">Log Daily Activities</h3>
          <p className="text-sm text-slate-400">Record your footprint for today to keep your streak alive!</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Step 1: Transport */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-eco-accent-green">
                <Bike className="w-6 h-6" />
                <h4 className="font-semibold text-lg text-white">Transportation</h4>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-slate-300 block">Commute Mode</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'petrol_bike', name: 'Petrol Bike' },
                    { id: 'diesel_car', name: 'Diesel Car' },
                    { id: 'ev', name: 'EV Car' },
                    { id: 'public_transit', name: 'Bus/Metro' },
                    { id: 'walk_cycle', name: 'Walk/Cycle' },
                  ].map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setCommuteMode(m.id)}
                      className={`px-3 py-2.5 text-sm rounded-lg border font-medium transition ${
                        commuteMode === m.id
                          ? 'border-eco-accent-green bg-eco-accent-green/20 text-white'
                          : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>

              {commuteMode !== 'walk_cycle' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Daily Travel Distance</span>
                    <span className="text-eco-accent-green font-semibold">{commuteDistance} km</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={commuteDistance}
                    onChange={(e) => setCommuteDistance(e.target.value)}
                    className="w-full accent-eco-accent-green bg-white/10 rounded-lg appearance-none h-2"
                  />
                </div>
              )}

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2 bg-eco-accent-green hover:bg-emerald-600 text-slate-900 font-bold rounded-lg transition"
                >
                  Next: Energy
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Energy & Food */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-eco-accent-cyan">
                <Zap className="w-6 h-6" />
                <h4 className="font-semibold text-lg text-white">Electricity & Household</h4>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Electricity Usage (Today)</span>
                  <span className="text-eco-accent-cyan font-semibold">{electricityKwh} kWh</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="40"
                  value={electricityKwh}
                  onChange={(e) => setElectricityKwh(e.target.value)}
                  className="w-full accent-eco-accent-cyan bg-white/10 rounded-lg appearance-none h-2"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-slate-300 block">Home Energy Source</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'coal_grid', name: 'Coal Power' },
                    { id: 'mixed_grid', name: 'Mixed Grid' },
                    { id: 'solar', name: 'Solar/Renew' },
                  ].map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => setEnergySource(s.id)}
                      className={`px-3 py-2 text-sm rounded-lg border font-medium transition ${
                        energySource === s.id
                          ? 'border-eco-accent-cyan bg-eco-accent-cyan/20 text-white'
                          : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-2 border border-white/10 hover:bg-white/5 text-white rounded-lg transition"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-5 py-2 bg-eco-accent-cyan hover:bg-cyan-600 text-slate-900 font-bold rounded-lg transition"
                >
                  Next: Lifestyle
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Diet & Lifestyle */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-amber-400">
                <Utensils className="w-6 h-6" />
                <h4 className="font-semibold text-lg text-white">Diet & Lifestyle</h4>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-slate-300 block">Diet Preference (Today)</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'meat_heavy', name: 'Meat Heavy' },
                    { id: 'balanced', name: 'Balanced' },
                    { id: 'vegetarian', name: 'Vegetarian' },
                    { id: 'vegan', name: 'Vegan/Plant-Based' },
                  ].map((d) => (
                    <button
                      type="button"
                      key={d.id}
                      onClick={() => setDiet(d.id)}
                      className={`px-3 py-2 text-sm rounded-lg border font-medium transition ${
                        diet === d.id
                          ? 'border-amber-400 bg-amber-400/20 text-white'
                          : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-slate-300 block">New Purchases (Shopping)</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    min="0"
                    value={shoppingPurchases}
                    onChange={(e) => setShoppingPurchases(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-24 px-3 py-2 bg-eco-bg-input border border-white/10 rounded-lg text-white text-center focus:outline-none focus:border-eco-accent-green"
                  />
                  <span className="text-sm text-slate-400">items purchased today (clothes, gadgets, etc.)</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/5">
                <div>
                  <span className="text-sm font-semibold text-white block">Waste Management</span>
                  <span className="text-xs text-slate-400">Did you sort and recycle your waste today?</span>
                </div>
                <input
                  type="checkbox"
                  checked={wasteRecycled}
                  onChange={(e) => setWasteRecycled(e.target.checked)}
                  className="w-5 h-5 rounded accent-eco-accent-green cursor-pointer"
                />
              </div>

              <div className="flex justify-between pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2 border border-white/10 hover:bg-white/5 text-white rounded-lg transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-eco-accent-green hover:bg-emerald-600 disabled:bg-emerald-800 text-slate-900 font-bold rounded-lg shadow-lg hover:shadow-eco-accent-green/20 transition flex items-center"
                >
                  {isSubmitting ? 'Saving...' : 'Submit Log'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
