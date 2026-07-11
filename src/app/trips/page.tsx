"use client";

import React, { useState } from "react";
import { useTrips } from "@/features/trips/hooks/useTrips";
import { StartTripModal } from "@/features/trips/components/StartTripModal";
import { TripList } from "@/features/trips/components/TripList";
import { Navigation, Plus, MapPin, Sparkles } from "lucide-react";

export default function TripsPage() {
  const { trips, locations, loading, startTrip, endTrip, addLocation } = useTrips();
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [showSavedLocations, setShowSavedLocations] = useState(false);

  return (
    <div className="space-y-6 pb-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-50 via-purple-50 to-slate-100 dark:from-indigo-950 dark:via-slate-900 dark:to-purple-950 border border-indigo-200 dark:border-indigo-500/40 shadow-lg dark:shadow-xl text-slate-900 dark:text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2 border border-indigo-300 dark:border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5" /> Mobility & Travel Tracking
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Trip Mode & Reimbursability</h1>
          <p className="text-xs text-slate-600 dark:text-indigo-200/80 mt-1 max-w-md">
            Track origin to destination sessions (`Home ➔ Site`, `Office ➔ Site`, etc.) with instant hardcoded rule verification for expense allowances.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowSavedLocations(!showSavedLocations)}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-300 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <MapPin className="w-4 h-4 text-rose-500 dark:text-rose-400" />
            <span>{locations.length} Locations</span>
          </button>

          <button
            onClick={() => setIsStartModalOpen(true)}
            className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/30 transition-transform active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Start Trip</span>
          </button>
        </div>
      </div>

      {/* Saved Locations Accordion */}
      {showSavedLocations && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-3 animate-fade-in shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Saved Locations Catalog (Autocomplete)
            </h3>
            <span className="text-xs font-mono text-slate-500">Manage in Settings for full CRUD</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {locations.map((loc) => (
              <div key={loc.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-200">{loc.name}</h4>
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 uppercase">
                    {loc.type}
                  </span>
                  {loc.address && <p className="text-xs text-slate-500 truncate mt-0.5">{loc.address}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trips History */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Mobility Sessions Log</span>
            <span className="text-xs font-mono font-normal text-slate-400">({trips.length} Total)</span>
          </h2>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-800/40 animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : (
          <TripList trips={trips} onEndTrip={(id) => endTrip(id)} />
        )}
      </div>

      {/* Start Trip Modal */}
      <StartTripModal
        isOpen={isStartModalOpen}
        onClose={() => setIsStartModalOpen(false)}
        locations={locations}
        onStartTrip={startTrip}
        onAddLocation={addLocation}
      />
    </div>
  );
}
