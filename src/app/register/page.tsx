"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { uploadFile } from "@/lib/upload";
import Navbar from "@/components/Navbar";
import { ErrorNote } from "@/components/Shared";
import type { UserRole, VehicleType } from "@/types";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("buyer");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [location, setLocation] = useState("");
  const [idPhoto, setIdPhoto] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);

  // Driver-only fields
  const [vehicleType, setVehicleType] = useState<VehicleType>("bike");
  const [plateNumber, setPlateNumber] = useState("");
  const [licensePhoto, setLicensePhoto] = useState<File | null>(null);
  const [vehiclePhoto, setVehiclePhoto] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!idPhoto || !selfie) {
      setError("Please upload both your ID card photo and a selfie.");
      return;
    }
    if (role === "driver" && (!licensePhoto || !vehiclePhoto || !plateNumber)) {
      setError("Please complete all driver fields: plate number, license photo, vehicle photo.");
      return;
    }

    setSubmitting(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      const [idPhotoUrl, selfieUrl] = await Promise.all([
        uploadFile(idPhoto, `ids/${uid}`),
        uploadFile(selfie, `selfies/${uid}`),
      ]);

      await setDoc(doc(db, "users", uid), {
        role,
        name,
        phone,
        email,
        idPhotoUrl,
        selfieUrl,
        verified: false,
        banned: false,
        location,
        createdAt: Date.now(),
      });

      if (role === "driver") {
        const [licenseUrl, vehiclePhotoUrl] = await Promise.all([
          uploadFile(licensePhoto as File, `licenses/${uid}`),
          uploadFile(vehiclePhoto as File, `vehicles/${uid}`),
        ]);
        await setDoc(doc(db, "drivers", uid), {
          userId: uid,
          vehicleType,
          plateNumber,
          licenseUrl,
          vehiclePhotoUrl,
          isActive: false,
          currentLocation: null,
          verified: false,
          totalEarnings: 0,
          completedDeliveries: 0,
        });
      }

      router.push(
        role === "seller" ? "/seller" : role === "driver" ? "/driver" : role === "admin" ? "/admin" : "/buyer"
      );
    } catch (err: any) {
      setError(err.message?.replace("Firebase: ", "") || "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-lg px-4 py-8">
        <h1 className="text-2xl font-bold text-brand-800">Create your BUMAP account</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Admins verify every ID before you can sell, drive, or go live.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <span className="label">I am a…</span>
            <div className="grid grid-cols-4 gap-2">
              {(["buyer", "seller", "driver", "admin"] as UserRole[]).map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRole(r)}
                  className={`rounded-xl border px-2 py-2 text-sm font-medium capitalize ${
                    role === r
                      ? "border-brand-600 bg-brand-50 text-brand-700"
                      : "border-neutral-300 text-neutral-600"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Full Name</label>
            <input className="input" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" required placeholder="6XX XXX XXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <label className="label">Location in Buea</label>
            <input className="input" required placeholder="e.g. Molyko, Buea" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>

          <div>
            <label className="label">ID Card Photo</label>
            <input className="input" required type="file" accept="image/*" onChange={(e) => setIdPhoto(e.target.files?.[0] || null)} />
          </div>
          <div>
            <label className="label">Selfie Photo</label>
            <input className="input" required type="file" accept="image/*" onChange={(e) => setSelfie(e.target.files?.[0] || null)} />
          </div>

          {role === "driver" && (
            <div className="space-y-4 rounded-xl border border-dashed border-brand-300 p-4">
              <p className="text-sm font-semibold text-brand-700">Driver details</p>
              <div>
                <span className="label">Vehicle Type</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVehicleType("bike")}
                    className={`rounded-xl border px-3 py-2 ${vehicleType === "bike" ? "border-brand-600 bg-brand-50" : "border-neutral-300"}`}
                  >
                    🛵 Bike
                  </button>
                  <button
                    type="button"
                    onClick={() => setVehicleType("taxi")}
                    className={`rounded-xl border px-3 py-2 ${vehicleType === "taxi" ? "border-brand-600 bg-brand-50" : "border-neutral-300"}`}
                  >
                    🚕 Taxi
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Vehicle Plate Number</label>
                <input className="input" required value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} />
              </div>
              <div>
                <label className="label">Driver License Photo</label>
                <input className="input" required type="file" accept="image/*" onChange={(e) => setLicensePhoto(e.target.files?.[0] || null)} />
              </div>
              <div>
                <label className="label">Vehicle Photo</label>
                <input className="input" required type="file" accept="image/*" onChange={(e) => setVehiclePhoto(e.target.files?.[0] || null)} />
              </div>
            </div>
          )}

          <ErrorNote message={error} />

          <button className="btn-primary w-full" disabled={submitting}>
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>
      </main>
    </>
  );
}
