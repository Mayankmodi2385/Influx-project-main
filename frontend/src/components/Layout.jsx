import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NavigationDrawer from './NavigationDrawer';
import { FaBars, FaUserCircle } from 'react-icons/fa';

const Layout = ({ children }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Safety check for navigation
  if (!navigate || !location) {
    return <main className="min-h-screen">{children}</main>;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/welcome');
  };

  // Don't show header on welcome/login/register pages
  const hideHeader = ['/welcome', '/login', '/register'].includes(location.pathname);

  if (hideHeader) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
      {/* Mobile Header - marked as search-bar so it can be hidden when drawer opens */}
      <header
        className="search-bar bg-green-200 md:hidden sticky top-0 z-30"
        aria-hidden={drawerOpen}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setDrawerOpen(true)}
            className="text-black p-2 hover:bg-green-300 rounded-lg transition-colors"
            aria-label="Open navigation"
          >
            <FaBars className="w-6 h-6" />
          </button>
          <Link to="/" className="text-2xl font-bold text-black">
            InFlux
          </Link>
          <Link
            to={isAuthenticated ? '/dashboard' : '/login'}
            className="text-black p-2 hover:bg-green-300 rounded-lg transition-colors"
          >
            {isAuthenticated && user ? (
              <div className="w-8 h-8 rounded-full bg-green-300 flex items-center justify-center overflow-hidden">
                <span className="text-sm font-bold text-black">
                  {user.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            ) : (
              <FaUserCircle className="w-6 h-6" />
            )}
          </Link>
        </div>
      </header>

      {/* Desktop Header - also marked as search-bar */}
      <nav className="search-bar hidden md:block bg-white shadow-md" aria-hidden={drawerOpen}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-green-600">
                InFlux
              </Link>
              <div className="ml-6 flex space-x-8">
                <Link
                  to="/"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Home
                </Link>
                <Link
                  to="/route-planner"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Route Planner
                </Link>
                {isAuthenticated && (
                  <>
                    <Link
                      to="/dashboard"
                      className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/profile"
                      className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      Profile
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <span className="text-sm text-gray-700">{user?.name}</span>
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Navigation Drawer */}
      <NavigationDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Main Content - set aria-hidden when drawer open to avoid accidental interactions */}
      <main className="flex-1" aria-hidden={drawerOpen}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
