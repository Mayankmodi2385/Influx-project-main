import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FaHome,
  FaCalendarCheck,
  FaStar,
  FaChartLine,
  FaQuestionCircle,
  FaCog,
  FaUserPlus,
  FaSignOutAlt,
} from 'react-icons/fa';

const NavigationDrawer = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const body = document.body;
    if (!body) {
      return undefined;
    }

    if (isOpen) {
      body.classList.add('influx-drawer-open');
    } else {
      body.classList.remove('influx-drawer-open');
    }

    return () => {
      body.classList.remove('influx-drawer-open');
    };
  }, [isOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/welcome');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed left-0 top-0 h-full w-2/3 max-w-sm bg-green-100 bg-opacity-95 backdrop-blur-sm z-50 transform transition-transform duration-300 ease-in-out md:hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-green-300">
            <button onClick={onClose} className="text-black">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-xl font-bold text-black">InFlux</h2>
            <div></div>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto py-4">
            <div className="space-y-1 px-2">
              <Link
                to="/"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 text-black hover:bg-green-200 rounded-lg transition-colors"
              >
                <FaHome className="w-5 h-5" />
                <span className="font-medium">Dashboard</span>
              </Link>
              <Link
                to="/dashboard?tab=bookings"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 text-black hover:bg-green-200 rounded-lg transition-colors"
              >
                <FaCalendarCheck className="w-5 h-5" />
                <span className="font-medium">Reservations</span>
              </Link>
              <Link
                to="/dashboard?tab=favorites"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 text-black hover:bg-green-200 rounded-lg transition-colors"
              >
                <FaStar className="w-5 h-5" />
                <span className="font-medium">Activity</span>
              </Link>
              <Link
                to="/route-planner"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 text-black hover:bg-green-200 rounded-lg transition-colors"
              >
                <FaChartLine className="w-5 h-5" />
                <span className="font-medium">Route Planner</span>
              </Link>
            </div>

            {/* Divider */}
            <div className="border-t border-green-300 my-4"></div>

            {/* More Menu Items */}
            <div className="space-y-1 px-2">
              <Link
                to="/help"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 text-black hover:bg-green-200 rounded-lg transition-colors"
              >
                <FaQuestionCircle className="w-5 h-5" />
                <span className="font-medium">Get Help</span>
              </Link>
              <Link
                to="/settings"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 text-black hover:bg-green-200 rounded-lg transition-colors"
              >
                <FaCog className="w-5 h-5" />
                <span className="font-medium">Settings</span>
              </Link>
              <Link
                to="/refer"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 text-black hover:bg-green-200 rounded-lg transition-colors"
              >
                <FaUserPlus className="w-5 h-5" />
                <span className="font-medium">Refer A Friend</span>
              </Link>
            </div>
          </div>

          {/* User Profile Section */}
          <div className="border-t border-green-300 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-green-300 flex items-center justify-center overflow-hidden">
                {user?.name ? (
                  <span className="text-lg font-bold text-black">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <FaHome className="w-6 h-6 text-black" />
                )}
              </div>
              <div>
                <p className="font-semibold text-black">{user?.name || 'Guest'}</p>
                <p className="text-sm text-gray-600">
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-black hover:bg-green-200 rounded-lg transition-colors"
            >
              <FaSignOutAlt className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NavigationDrawer;
