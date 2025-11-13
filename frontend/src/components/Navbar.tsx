import { Link, NavLink } from "react-router-dom";
import { useState } from "react";

interface NavbarProps {
  token: string | null;
  role: "user" | "admin" | null;
  onLogout: () => void;
}

export default function Navbar({ token, role, onLogout }: NavbarProps) {
  const [open, setOpen] = useState(false);

  const linkClass =
    "text-sm font-medium text-gray-300 hover:text-white transition-colors";

  const userLinks = (
    <>
      <NavLink
        to="/dashboard"
        className={linkClass}
        onClick={() => setOpen(false)}
      >
        My Bookings
      </NavLink>
      <NavLink
        to="/profile"
        className={linkClass}
        onClick={() => setOpen(false)}
      >
        Profile
      </NavLink>
    </>
  );

  const adminLinks = (
    <>
      <NavLink
        to="/admin/bookings"
        className={linkClass}
        onClick={() => setOpen(false)}
      >
        Bookings
      </NavLink>
      <NavLink
        to="/admin/services"
        className={linkClass}
        onClick={() => setOpen(false)}
      >
        Services
      </NavLink>
      <NavLink
        to="/admin/users"
        className={linkClass}
        onClick={() => setOpen(false)}
      >
        Users
      </NavLink>
      <NavLink
        to="/admin/timeoff"
        className={linkClass}
        onClick={() => setOpen(false)}
      >
        Time off
      </NavLink>
    </>
  );

  return (
    <nav className="sticky top-0 z-20 bg-neutral-900/90 backdrop-blur border-b border-neutral-800">
      {/* Top bar */}
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="group inline-flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-amber-500/90 flex items-center justify-center ring-1 ring-amber-400/50">
            <span className="text-xs font-bold text-neutral-900">✂️</span>
          </div>
          <span className="font-semibold text-white tracking-tight">
            Barber<span className="text-amber-400">Booking</span>
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Book button (user + guests) – always in header */}
          {(!token || role === "user") && (
            <NavLink
              to="/book"
              className="text-sm font-semibold text-neutral-900 bg-amber-400 hover:bg-amber-300 rounded-lg px-3 py-1.5 transition"
              onClick={() => setOpen(false)}
            >
              Book Now
            </NavLink>
          )}

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-5">
            {!token && (
              <NavLink
                to="/login"
                className={linkClass}
                onClick={() => setOpen(false)}
              >
                Login
              </NavLink>
            )}

            {token && role === "user" && userLinks}
            {token && role === "admin" && adminLinks}

            {token && (
              <button
                onClick={() => {
                  setOpen(false);
                  onLogout();
                }}
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Logout
              </button>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden text-gray-200 hover:text-white"
            aria-label="Toggle navigation"
          >
            {open ? "✖" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile menu content */}
      {open && (
        <div className="md:hidden border-t border-neutral-800 bg-neutral-900/95">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-3">
            {!token && (
              <NavLink
                to="/login"
                className={linkClass}
                onClick={() => setOpen(false)}
              >
                Login
              </NavLink>
            )}

            {token && role === "user" && userLinks}
            {token && role === "admin" && adminLinks}

            {token && (
              <button
                onClick={() => {
                  setOpen(false);
                  onLogout();
                }}
                className="text-left text-sm font-medium text-gray-300 hover:text-white"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
