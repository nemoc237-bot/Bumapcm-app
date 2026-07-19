"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import RoleGuard from "@/components/RoleGuard";
import { Spinner } from "@/components/Shared";
import type { Settings } from "@/types";

function SettingsContent() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getDoc(doc(db, "settings", "global")).then((snap) => {
      setSettings(
        snap.exists() ? (snap.data() as Settings) : { bikeBaseFee: 500, taxiBaseFee: 1500, perKmRate: 100 }
      );
    });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    await setDoc(doc(db, "settings", "global"), settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!settings) return <Spinner />;

  return (
    <form onSubmit={save} className="mx-auto max-w-md space-y-4">
      <div>
        <label className="label">🛵 Bike Base Fee (FCFA)</label>
        <input
          className="input"
          type="number"
          min={0}
          value={settings.bikeBaseFee}
          onChange={(e) => setSettings({ ...settings, bikeBaseFee: Number(e.target.value) })}
        />
      </div>
      <div>
        <label className="label">🚕 Taxi Base Fee (FCFA)</label>
        <input
          className="input"
          type="number"
          min={0}
          value={settings.taxiBaseFee}
          onChange={(e) => setSettings({ ...settings, taxiBaseFee: Number(e.target.value) })}
        />
      </div>
      <div>
        <label className="label">Per KM Rate (FCFA)</label>
        <input
          className="input"
          type="number"
          min={0}
          value={settings.perKmRate}
          onChange={(e) => setSettings({ ...settings, perKmRate: Number(e.target.value) })}
        />
      </div>
      <button className="btn-primary w-full">{saved ? "Saved ✓" : "Save Settings"}</button>
    </form>
  );
}

export default function AdminSettingsPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="mb-4 text-xl font-bold">Delivery Fee Settings</h1>
        <RoleGuard allow={["admin"]}>
          <SettingsContent />
        </RoleGuard>
      </main>
    </>
  );
}
