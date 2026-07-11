"use client";

import React, { useState } from "react";
import { TRIP_TYPE_OPTIONS, type TripType, type LocationRow } from "../types";
import { computeReimbursability } from "../utils/reimbursability";
import { Navigation, Plus, CheckCircle2, XCircle, MapPin, X } from "lucide-react";

interface StartTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: LocationRow[];
  onStartTrip: (
    tripType: TripType,
    originLabel: string,
    destinationLabel: string,
    originLocationId?: string | null,
    destinationLocationId?: string | null,
    notes?: string | null
  ) => void;
  onAddLocation?: (name: string, type: "HOME" | "OFFICE" | "SITE", address?: string) => void;
}

export function StartTripModal({
  isOpen,
  onClose,
  locations,
  onStartTrip,
  onAddLocation,
}: StartTripModalProps) {
  const [tripType, setTripType] = useState<TripType>("OFFICE_TO_SITE");
  const [originId, setOriginId] = useState<string>("");
  const [destinationId, setDestinationId] = useState<string>("");
  const [customOrigin, setCustomOrigin] = useState("");
  const [customDestination, setCustomDestination] = useState("");
  const [notes, setNotes] = useState("");

  // New location quick-add state
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocName, setNewLocName] = useState("");
  const [newLocType, setNewLocType] = useState<"HOME" | "OFFICE" | "SITE">("SITE");

  if (!isOpen) return null;

  const isReimbursable = computeReimbursability(tripType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const originLoc = locations.find((l) => l.id === originId);
    const destLoc = locations.find((l) => l.id === destinationId);

    const originLabel = originLoc ? originLoc.name : customOrigin.trim() || "Home";
    const destLabel = destLoc ? destLoc.name : customDestination.trim() || "Client Site Alpha";

    onStartTrip(
      tripType,
      originLabel,
      destLabel,
      originLoc ? originLoc.id : null,
      destLoc ? destLoc.id : null,
      notes.trim() || null
    );
    onClose();
  };

  const handleQuickAddLoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName.trim() || !onAddLocation) return;
    onAddLocation(newLocName.trim(), newLocType);
    setNewLocName("");
    setShowAddLocation(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-600 dark:text-indigo-400">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight text-slate-900 dark:text-white">Start Mobility Trip</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Select trip type & locations to track session</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Trip Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Trip Type & Reimbursability Rule
            </label>
            <select
              value={tripType}
              onChange={(e) => setTripType(e.target.value as TripType)}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-slate-100 font-medium focus:outline-none focus:border-indigo-500 transition-colors"
            >
              {TRIP_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ({opt.defaultReimbursable ? "REIMBURSABLE" : "NOT Reimbursable"})
                </option>
              ))}
            </select>
          </div>

          {/* Reimbursable Status Indicator Card */}
          <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
            isReimbursable
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-slate-800/60 border-slate-700 text-slate-400"
          }`}>
            {isReimbursable ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" /> : <XCircle className="w-5 h-5 shrink-0 text-slate-500" />}
            <div className="text-xs">
              <span className="font-bold block text-sm">
                {isReimbursable ? "Eligible for Expense Reimbursement" : "Personal Commute / Non-Reimbursable"}
              </span>
              <span>
                Computed automatically from rule: <span className="font-mono font-bold">{tripType}</span>
              </span>
            </div>
          </div>

          {/* Origin Location Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" /> Origin
                </span>
              </label>
              <select
                value={originId}
                onChange={(e) => setOriginId(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Custom / Manual Entry --</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    [{loc.type}] {loc.name}
                  </option>
                ))}
              </select>
              {!originId && (
                <input
                  type="text"
                  value={customOrigin}
                  onChange={(e) => setCustomOrigin(e.target.value)}
                  placeholder="Type origin name e.g. Home"
                  className="w-full mt-2 rounded-xl bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              )}
            </div>

            {/* Destination Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" /> Destination
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddLocation(!showAddLocation)}
                  className="text-[10px] text-indigo-400 hover:underline flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" /> Add Saved Loc
                </button>
              </label>
              <select
                value={destinationId}
                onChange={(e) => setDestinationId(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Custom / Manual Entry --</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    [{loc.type}] {loc.name}
                  </option>
                ))}
              </select>
              {!destinationId && (
                <input
                  type="text"
                  value={customDestination}
                  onChange={(e) => setCustomDestination(e.target.value)}
                  placeholder="Type destination e.g. Client Site Alpha"
                  className="w-full mt-2 rounded-xl bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              )}
            </div>
          </div>

          {/* Quick Add Location Sub-form */}
          {showAddLocation && (
            <div className="p-3 rounded-xl bg-slate-950 border border-indigo-500/40 space-y-2.5 animate-fade-in">
              <h4 className="text-xs font-bold text-indigo-300 flex items-center justify-between">
                <span>Save New Location for Autocomplete</span>
                <button type="button" onClick={() => setShowAddLocation(false)} className="text-slate-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newLocName}
                  onChange={(e) => setNewLocName(e.target.value)}
                  placeholder="e.g. Maruti Suzuki Plant Phase 2"
                  className="flex-1 rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-slate-100"
                />
                <select
                  value={newLocType}
                  onChange={(e) => setNewLocType(e.target.value as any)}
                  className="rounded-lg bg-slate-900 border border-slate-800 px-2 py-1.5 text-xs text-slate-100 font-semibold"
                >
                  <option value="SITE">SITE</option>
                  <option value="OFFICE">OFFICE</option>
                  <option value="HOME">HOME</option>
                </select>
                <button
                  type="button"
                  onClick={handleQuickAddLoc}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Trip Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Traveling with engineering team for inspection"
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/20 flex items-center gap-1.5"
            >
              <Navigation className="w-4 h-4 animate-pulse" />
              <span>Start Trip Session</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
