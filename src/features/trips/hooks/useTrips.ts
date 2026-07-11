"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";
import type { TripRow, LocationRow, TripType } from "../types";
import { DEFAULT_LOCATIONS } from "../types/seedLocations";
import { computeReimbursability } from "../utils/reimbursability";
import { toast } from "sonner";

export function useTrips() {
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [locations, setLocations] = useState<LocationRow[]>(DEFAULT_LOCATIONS);
  const [loading, setLoading] = useState(true);
  const { activeTrip, setActiveTrip } = useAppStore();

  const fetchTripsAndLocations = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient();

      // Fetch active/all locations
      const { data: locsData } = await supabase
        .from("locations")
        .select("*")
        .eq("active", true)
        .order("name", { ascending: true });

      if (locsData && locsData.length > 0) {
        setLocations(locsData);
      } else {
        setLocations(DEFAULT_LOCATIONS);
      }

      // Fetch trips
      const { data: tripsData } = await supabase
        .from("trips")
        .select("*")
        .order("departed_at", { ascending: false });

      if (tripsData) {
        setTrips(tripsData);
        const inProg = tripsData.find((t) => t.status === "IN_PROGRESS");
        setActiveTrip(inProg || null);
      }
    } catch (err) {
      console.error("Error loading trips and locations:", err);
    } finally {
      setLoading(false);
    }
  }, [setActiveTrip]);

  useEffect(() => {
    fetchTripsAndLocations();
  }, [fetchTripsAndLocations]);

  const startTrip = async (
    tripType: TripType,
    originLabel: string,
    destinationLabel: string,
    originLocationId?: string | null,
    destinationLocationId?: string | null,
    notes?: string | null
  ) => {
    const isReimbursable = computeReimbursability(tripType);
    const nowIso = new Date().toISOString();
    const tempId = `trip-${Date.now()}`;

    const newTrip: TripRow = {
      id: tempId,
      user_id: "current-user",
      trip_type: tripType,
      origin_label: originLabel,
      destination_label: destinationLabel,
      origin_location_id: originLocationId || null,
      destination_location_id: destinationLocationId || null,
      departed_at: nowIso,
      arrived_at: null,
      status: "IN_PROGRESS",
      reimbursable: isReimbursable,
      notes: notes || null,
      created_at: nowIso,
    };

    // Optimistic UI update
    setTrips((prev) => [newTrip, ...prev]);
    setActiveTrip(newTrip);
    toast.success(`Trip Started: ${originLabel} ➔ ${destinationLabel} (${isReimbursable ? "Reimbursable" : "Personal"})`);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("trips")
        .insert({
          user_id: "demo-user",
          trip_type: tripType,
          origin_label: originLabel,
          destination_label: destinationLabel,
          origin_location_id: originLocationId || null,
          destination_location_id: destinationLocationId || null,
          departed_at: nowIso,
          status: "IN_PROGRESS",
          reimbursable: isReimbursable,
          notes: notes || null,
        })
        .select()
        .single();

      if (!error && data) {
        setTrips((prev) => prev.map((t) => (t.id === tempId ? data : t)));
        setActiveTrip(data);
      }
    } catch (err) {
      console.error("Failed to insert trip to Supabase:", err);
    }
  };

  const endTrip = async (tripId: string) => {
    const arrivedAt = new Date().toISOString();
    setTrips((prev) =>
      prev.map((t) => (t.id === tripId ? { ...t, status: "COMPLETED", arrived_at: arrivedAt } : t))
    );
    if (activeTrip?.id === tripId) {
      setActiveTrip(null);
    }
    toast.success("Trip Completed");

    try {
      const supabase = getSupabaseBrowserClient();
      await supabase
        .from("trips")
        .update({ status: "COMPLETED", arrived_at: arrivedAt })
        .eq("id", tripId);
    } catch (err) {
      console.error("Failed to end trip on server:", err);
    }
  };

  const addLocation = async (name: string, type: "HOME" | "OFFICE" | "SITE", address?: string) => {
    const tempId = `loc-${Date.now()}`;
    const newLoc: LocationRow = {
      id: tempId,
      user_id: "current-user",
      name,
      type,
      address: address || null,
      active: true,
      created_at: new Date().toISOString(),
    };
    setLocations((prev) => [...prev, newLoc]);
    toast.success(`Added Location: ${name}`);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase
        .from("locations")
        .insert({ user_id: "demo-user", name, type, address: address || null })
        .select()
        .single();
      if (data) {
        setLocations((prev) => prev.map((l) => (l.id === tempId ? data : l)));
      }
    } catch (err) {
      console.error("Error inserting location:", err);
    }
  };

  return {
    trips,
    locations,
    loading,
    activeTrip,
    startTrip,
    endTrip,
    addLocation,
    refresh: fetchTripsAndLocations,
  };
}
