import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Home from '../src/pages/Home';
import { AuthProvider } from '../src/context/AuthContext';

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>{component}</AuthProvider>
    </BrowserRouter>
  );
};

describe('Home Page', () => {
  it('renders home page with search bar', () => {
    renderWithProviders(<Home />);
    expect(screen.getByPlaceholderText(/search by name or location/i)).toBeInTheDocument();
  });

  it('renders use location button', () => {
    renderWithProviders(<Home />);
    expect(screen.getByText(/use my location/i)).toBeInTheDocument();
  });
});











