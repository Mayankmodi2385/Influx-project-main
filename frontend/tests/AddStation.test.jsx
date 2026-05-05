import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AddStation from '../src/pages/AddStation';
import { AuthProvider } from '../src/context/AuthContext';

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>{component}</AuthProvider>
    </BrowserRouter>
  );
};

describe('AddStation Page', () => {
  it('renders add station form', () => {
    renderWithProviders(<AddStation />);
    expect(screen.getByText(/add new station/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/station name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
  });

  it('displays connector form fields', () => {
    renderWithProviders(<AddStation />);
    expect(screen.getByText(/connectors/i)).toBeInTheDocument();
  });
});











