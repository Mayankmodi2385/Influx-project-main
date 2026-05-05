import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../src/App';
import { AuthProvider } from '../src/context/AuthContext';

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>{component}</AuthProvider>
    </BrowserRouter>
  );
};

describe('App', () => {
  it('renders app without crashing', () => {
    renderWithProviders(<App />);
    expect(screen.getByText(/influx/i)).toBeInTheDocument();
  });
});











