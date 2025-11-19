import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../components/Navbar';

const renderNavbar = (options: {
  token: string | null;
  role: 'user' | 'admin' | null;
  onLogout?: () => void;
}) => {
  const { token, role, onLogout } = options;
  const handleLogout = onLogout ?? jest.fn();

  return render(
    <MemoryRouter initialEntries={['/']}>
      <Navbar token={token} role={role} onLogout={handleLogout} />
    </MemoryRouter>,
  );
};

describe('Navbar – guest state', () => {
  it('shows public links and login for guests', () => {
    renderNavbar({ token: null, role: null });

    // Logo: accessible name combines "Barber" + "Booking"
    const logoLink = screen.getByRole('link', { name: /Barber\s*Booking/i });
    expect(logoLink).toBeInTheDocument();

    // CTA
    expect(screen.getByText('Book Now')).toBeInTheDocument();

    // Public links
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();

    // Auth
    expect(screen.getByText('Login')).toBeInTheDocument();
  });
});

describe('Navbar – auth roles', () => {
  it('shows user shortcuts when logged in as user', () => {
    renderNavbar({ token: 'fake-user-token', role: 'user' });

    expect(screen.getByText('My Bookings')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('shows admin menu when logged in as admin', () => {
    renderNavbar({ token: 'fake-admin-token', role: 'admin' });

    // Admin button visible
    const adminBtn = screen.getByRole('button', { name: /admin/i });
    expect(adminBtn).toBeInTheDocument();

    // Open admin dropdown
    fireEvent.click(adminBtn);

    expect(screen.getByText('Bookings')).toBeInTheDocument();
    expect(screen.getByText('Services')).toBeInTheDocument();
    expect(screen.getByText('Barbers')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Time off')).toBeInTheDocument();
  });
});

describe('Navbar – mobile menu toggle', () => {
  it('toggles mobile menu open and close', () => {
    renderNavbar({ token: null, role: null });

    const toggleButton = screen.getByRole('button', {
      name: /toggle navigation/i,
    });

    // Initially: only desktop "Home" link
    expect(screen.getAllByText('Home')).toHaveLength(1);

    // Open mobile menu
    fireEvent.click(toggleButton);

    // Now: desktop + mobile "Home"
    expect(screen.getAllByText('Home').length).toBeGreaterThan(1);

    // Close mobile menu
    fireEvent.click(toggleButton);

    // Back to just desktop "Home"
    expect(screen.getAllByText('Home')).toHaveLength(1);
  });
});
