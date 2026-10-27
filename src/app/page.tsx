import Link from "next/link";
import { VEHICLES } from "@/lib/fare";

const FEATURES = [
  { icon: "🗺️", title: "Live map tracking", text: "Watch your driver come to you and follow the trip on the map in real time." },
  { icon: "🎥", title: "Video KYC drivers", text: "Every driver is verified on a live video call before they can take rides." },
  { icon: "🔐", title: "OTP to start", text: "Your ride starts only when you share your 4-digit OTP with the driver." },
  { icon: "💸", title: "Upfront fares", text: "See the price for every vehicle before you book. No surprises." },
];

export default function Home() {
  return (
    <div className="space-y-14 py-6">
      <section className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Your ride, <span className="text-blue-600">tracked live</span> from door to door.
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Book a bike, auto, car or SUV in seconds. Drivers are verified through video KYC, and you can see where they
            are at every moment.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/register" className="btn-primary px-6 py-3 text-base">
              Book a ride
            </Link>
            <Link href="/register?role=driver" className="btn-secondary px-6 py-3 text-base">
              Drive with us
            </Link>
          </div>
        </div>
        <div className="card grid grid-cols-2 gap-4">
          {Object.values(VEHICLES).map((v) => (
            <div key={v.label} className="rounded-xl bg-gray-50 p-4 text-center">
              <div className="text-4xl">{v.icon}</div>
              <div className="mt-2 font-semibold">{v.label}</div>
              <div className="text-xs text-gray-500">
                {v.seats} seat{v.seats > 1 ? "s" : ""} · ₹{v.perKm}/km
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="card">
            <div className="text-3xl">{f.icon}</div>
            <h3 className="mt-3 font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-gray-600">{f.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
