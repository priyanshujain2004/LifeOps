"use client";

import React, { useState } from "react";
import type { LocationRow } from "@/features/trips/types";
import { Plus, Edit3, Trash2, MapPin, Check, X } from "lucide-react";

interface LocationManagerProps {
  locations: LocationRow[];
  onSave: (loc: Partial<LocationRow> & { name: string; type: any }) => void;
  onDelete: (id: string) => void;
}

export function LocationManager({ locations, onSave, onDelete }: LocationManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<"HOME" | "OFFICE" | "SITE">("SITE");
  const [address, setAddress] = useState("");

  const startNew = () => {
    setEditingId("NEW");
    setName("");
    setType("SITE");
    setAddress("");
  };

  const startEdit = (loc: LocationRow) => {
    setEditingId(loc.id);
    setName(loc.name);
    setType(loc.type);
    setAddress(loc.address || "");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: editingId === "NEW" ? undefined : editingId!,
      name: name.trim(),
      type,
      address: address.trim() || null,
      active: true,
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-rose-400" />
            <span>Saved Locations Directory ({locations.length} Total)</span>
          </h3>
          <p className="text-xs text-slate-400">Used for mobility trip origin and destination autocomplete</p>
        </div>
        {editingId !== "NEW" && (
          <button
            onClick={startNew}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
          >
            <Plus className="w-4 h-4" />
            <span>New Saved Location</span>
          </button>
        )}
      </div>

      {editingId && (
        <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-slate-900 border border-rose-500/60 space-y-3 animate-fade-in shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="font-bold text-sm text-rose-300">
              {editingId === "NEW" ? "Add New Location" : `Edit Location: ${name}`}
            </h4>
            <button type="button" onClick={() => setEditingId(null)} className="p-1 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Location Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Project Site Beta"
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Location Category</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-100 font-semibold"
              >
                <option value="SITE">SITE (Project/Client)</option>
                <option value="OFFICE">OFFICE (Corporate/HQ)</option>
                <option value="HOME">HOME (Residence)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Address (Optional)</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Sector 42, Tech Park..."
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="px-3 py-1.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1 shadow"
            >
              <Check className="w-3.5 h-3.5" /> Save Location
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {locations.map((loc) => (
          <div
            key={loc.id}
            className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-3"
          >
            <div className="space-y-1 overflow-hidden">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-extrabold uppercase ${
                  loc.type === "HOME" ? "bg-cyan-500/15 text-cyan-400" : loc.type === "OFFICE" ? "bg-indigo-500/15 text-indigo-400" : "bg-rose-500/15 text-rose-400"
                }`}>
                  {loc.type}
                </span>
                <h4 className="font-bold text-sm text-slate-100 truncate">{loc.name}</h4>
              </div>
              {loc.address && <p className="text-xs text-slate-400 truncate">{loc.address}</p>}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => startEdit(loc)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="Edit Location"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete(loc.id)}
                className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-red-500/20 text-slate-400 hover:text-red-400"
                title="Delete Location"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
