import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

interface NavbarProps {
  token: string | null;
  role: 'user' | 'admin' | null;
  onLogout: () => void;
}

export default function Navbar({ token, role, onLogout }: NavbarProps) {
  const [open, setOpen] = useState(false);

  const navLinkBase =
    'text-sm font-medium text-gray-300 hover:text-white transition-colors';
  const navLinkActive = 'text-sm font-semibold text-white';

  const makeNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? navLinkActive : navLinkBase;

  const renderLinks = (onClick?: () => void) => (
    <>
      {/* Public main links */}
      <NavLink to="/" className={makeNavClass} onClick={onClick}>
        Home
      </NavLink>
      <NavLink to="/about" className={makeNavClass} onClick={onClick}>
        About
      </NavLink>
      <NavLink to="/contact" className={makeNavClass} onClick={onClick}>
        Contact
      </NavLink>

      {/* Admin section */}
      {token && role === 'admin' && (
        <>
          <NavLink
            to="/admin/bookings"
            className={makeNavClass}
            onClick={onClick}
          >
            Bookings
          </NavLink>
          <NavLink
            to="/admin/services"
            className={makeNavClass}
            onClick={onClick}
          >
            Services
          </NavLink>
          <NavLink
            to="/admin/barbers"
            className={makeNavClass}
            onClick={onClick}
          >
            Barbers
          </NavLink>
          <NavLink
            to="/admin/users"
            className={makeNavClass}
            onClick={onClick}
          >
            Users
          </NavLink>
          <NavLink
            to="/admin/timeoff"
            className={makeNavClass}
            onClick={onClick}
          >
            Time off
          </NavLink>
        </>
      )}

      {/* User shortcuts */}
      {token && role === 'user' && (
        <NavLink
          to="/dashboard"
          className={makeNavClass}
          onClick={onClick}
        >
          My Bookings
        </NavLink>
      )}

      {/* Profile / Auth */}
      {token && (
        <NavLink
          to="/profile"
          className={makeNavClass}
          onClick={onClick}
        >
          Profile
        </NavLink>
      )}

      {!token && (
        <NavLink
          to="/login"
          className={makeNavClass}
          onClick={onClick}
        >
          Login
        </NavLink>
      )}

      {token && (
        <button
          onClick={() => {
            onLogout();
            if (onClick) onClick();
          }}
          className="text-sm font-medium text-gray-300 hover:text-white transition-colors text-left"
        >
          Logout
        </button>
      )}
    </>
  );

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
          {(!token || role === 'user') && (
            <Link
              to="/book"
              className="inline-flex items-center rounded-lg bg-amber-400 px-3 py-1.5 text-xs sm:text-sm font-semibold text-neutral-900 hover:bg-amber-300 transition shadow-sm"
            >
              Book Now
            </Link>
          )}

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-4">
            {renderLinks()}
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-300 hover:text-white hover:bg-neutral-800 focus:outline-none"
            onClick={() => setOpen((o) => !o)}
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
            {renderLinks(() => setOpen(false))}
          </div>
        </div>
      )}
    </nav>
  );
}
