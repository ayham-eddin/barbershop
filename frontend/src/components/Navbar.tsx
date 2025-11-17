// src/components/Navbar.tsx
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

interface NavbarProps {
  token: string | null;
  role: "user" | "admin" | null;
  onLogout: () => void;
}

export default function Navbar({ token, role, onLogout }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

  const navLinkBase =
    "text-sm font-medium text-gray-300 hover:text-white transition-colors";
  const navLinkActive = "text-sm font-semibold text-white";

  const makeNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? navLinkActive : navLinkBase;

  const isAdmin = token && role === "admin";
  const isUser = token && role === "user";

  const handleLogout = () => {
    onLogout();
    setOpen(false);
    setAdminMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-20 bg-neutral-900/90 backdrop-blur border-b border-neutral-800">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        {/* Logo */}
        <Link to="/" className="group inline-flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-amber-500/90 flex items-center justify-center ring-1 ring-amber-400/50">
            <span className="text-xs font-bold text-neutral-900">✂️</span>
          </div>
          <span className="font-semibold text-white tracking-tight">
            Barber<span className="text-amber-400">Booking</span>
          </span>
        </Link>

        {/* Right side: Book button + nav */}
        <div className="flex items-center gap-2">
          {/* Book button always visible for guests & normal users */}
          {(!token || role === "user") && (
            <Link
              to="/book"
              className="inline-flex items-center rounded-lg bg-amber-400 px-3 py-1.5 text-xs sm:text-sm font-semibold text-neutral-900 hover:bg-amber-300 transition shadow-sm"
            >
              Book Now
            </Link>
          )}

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-4">
            {/* Public main links */}
            <NavLink to="/" className={makeNavClass}>
              Home
            </NavLink>
            <NavLink to="/about" className={makeNavClass}>
              About
            </NavLink>
            <NavLink to="/contact" className={makeNavClass}>
              Contact
            </NavLink>

            {/* User shortcuts */}
            {isUser && (
              <NavLink to="/dashboard" className={makeNavClass}>
                My Bookings
              </NavLink>
            )}

            {/* Admin dropdown */}
            {isAdmin && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAdminMenuOpen((o) => !o)}
                  className="inline-flex items-center gap-1 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  Admin
                  <span className="text-xs">{adminMenuOpen ? "▲" : "▼"}</span>
                </button>
                {adminMenuOpen && (
                  <div className="absolute right-0 mt-2 w-44 rounded-xl border border-neutral-800 bg-neutral-900 shadow-lg py-2">
                    <NavLink
                      to="/admin/bookings"
                      className={({ isActive }) =>
                        (isActive ? navLinkActive : navLinkBase) +
                        " block px-4 py-1.5"
                      }
                      onClick={() => setAdminMenuOpen(false)}
                    >
                      Bookings
                    </NavLink>
                    <NavLink
                      to="/admin/services"
                      className={({ isActive }) =>
                        (isActive ? navLinkActive : navLinkBase) +
                        " block px-4 py-1.5"
                      }
                      onClick={() => setAdminMenuOpen(false)}
                    >
                      Services
                    </NavLink>
                    <NavLink
                      to="/admin/barbers"
                      className={({ isActive }) =>
                        (isActive ? navLinkActive : navLinkBase) +
                        " block px-4 py-1.5"
                      }
                      onClick={() => setAdminMenuOpen(false)}
                    >
                      Barbers
                    </NavLink>
                    <NavLink
                      to="/admin/users"
                      className={({ isActive }) =>
                        (isActive ? navLinkActive : navLinkBase) +
                        " block px-4 py-1.5"
                      }
                      onClick={() => setAdminMenuOpen(false)}
                    >
                      Users
                    </NavLink>
                    <NavLink
                      to="/admin/timeoff"
                      className={({ isActive }) =>
                        (isActive ? navLinkActive : navLinkBase) +
                        " block px-4 py-1.5"
                      }
                      onClick={() => setAdminMenuOpen(false)}
                    >
                      Time off
                    </NavLink>
                  </div>
                )}
              </div>
            )}

            {/* Profile / Auth */}
            {token && (
              <NavLink to="/profile" className={makeNavClass}>
                Profile
              </NavLink>
            )}
            {!token && (
              <NavLink to="/login" className={makeNavClass}>
                Login
              </NavLink>
            )}

            {/* Logout (desktop) */}
            {token && (
              <button
                onClick={handleLogout}
                className="ml-3 pl-3 border-l border-neutral-700 text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Logout
              </button>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-300 hover:text-white hover:bg-neutral-800 focus:outline-none"
            onClick={() => {
              setOpen((o) => !o);
              setAdminMenuOpen(false);
            }}
            aria-label="Toggle navigation"
          >
            {open ? (
              <span className="text-lg leading-none">✕</span>
            ) : (
              <span className="text-lg leading-none">☰</span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t border-neutral-800 bg-neutral-900">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-2">
            {/* Public main links */}
            <NavLink
              to="/"
              className={makeNavClass}
              onClick={() => setOpen(false)}
            >
              Home
            </NavLink>
            <NavLink
              to="/about"
              className={makeNavClass}
              onClick={() => setOpen(false)}
            >
              About
            </NavLink>
            <NavLink
              to="/contact"
              className={makeNavClass}
              onClick={() => setOpen(false)}
            >
              Contact
            </NavLink>

            {/* User shortcuts */}
            {isUser && (
              <NavLink
                to="/dashboard"
                className={makeNavClass}
                onClick={() => setOpen(false)}
              >
                My Bookings
              </NavLink>
            )}

            {/* Admin links grouped */}
            {isAdmin && (
              <>
                <span className="mt-2 text-[11px] uppercase tracking-wide text-neutral-500">
                  Admin
                </span>
                <NavLink
                  to="/admin/bookings"
                  className={makeNavClass}
                  onClick={() => setOpen(false)}
                >
                  Bookings
                </NavLink>
                <NavLink
                  to="/admin/services"
                  className={makeNavClass}
                  onClick={() => setOpen(false)}
                >
                  Services
                </NavLink>
                <NavLink
                  to="/admin/barbers"
                  className={makeNavClass}
                  onClick={() => setOpen(false)}
                >
                  Barbers
                </NavLink>
                <NavLink
                  to="/admin/users"
                  className={makeNavClass}
                  onClick={() => setOpen(false)}
                >
                  Users
                </NavLink>
                <NavLink
                  to="/admin/timeoff"
                  className={makeNavClass}
                  onClick={() => setOpen(false)}
                >
                  Time off
                </NavLink>
              </>
            )}

            {/* Profile / Auth */}
            {token && (
              <NavLink
                to="/profile"
                className={makeNavClass}
                onClick={() => setOpen(false)}
              >
                Profile
              </NavLink>
            )}
            {!token && (
              <NavLink
                to="/login"
                className={makeNavClass}
                onClick={() => setOpen(false)}
              >
                Login
              </NavLink>
            )}

            {/* Logout footer */}
            {token && (
              <div className="mt-3 pt-3 border-t border-neutral-800">
                <button
                  onClick={handleLogout}
                  className="w-full text-left text-sm font-medium text-red-300 hover:text-red-200 transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
