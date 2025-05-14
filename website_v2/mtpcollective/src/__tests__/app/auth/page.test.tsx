import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AuthPage from '@/app/auth/page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock AuthContext
jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('AuthPage', () => {
  const mockRouter = {
    replace: jest.fn(),
  };

  const mockAuth = {
    user: null,
    loading: false,
    error: null,
    signIn: jest.fn(),
    signUp: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuth as jest.Mock).mockReturnValue(mockAuth);
  });

  it('renders sign in form by default', () => {
    render(<AuthPage />);
    
    expect(screen.getByRole('tab', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Sign In$/ })).toBeInTheDocument();
  });

  it('switches between sign in and sign up tabs', () => {
    render(<AuthPage />);
    
    // Click sign up tab
    fireEvent.click(screen.getByRole('tab', { name: 'Sign Up' }));
    expect(screen.getByRole('button', { name: /^Sign Up$/ })).toBeInTheDocument();
    
    // Click sign in tab
    fireEvent.click(screen.getByRole('tab', { name: 'Sign In' }));
    expect(screen.getByRole('button', { name: /^Sign In$/ })).toBeInTheDocument();
  });

  it('shows validation error when submitting empty form', async () => {
    render(<AuthPage />);
    
    const form = screen.getByRole('form');
    await act(async () => {
      fireEvent.submit(form);
    });
    expect(await screen.findByText(/email and password are required/i)).toBeInTheDocument();
    expect(mockAuth.signIn).not.toHaveBeenCalled();
  });

  it('calls signIn with form data', async () => {
    render(<AuthPage />);
    
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: /^Sign In$/ }));
    
    expect(mockAuth.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('calls signUp with form data', async () => {
    render(<AuthPage />);
    
    // Switch to sign up tab
    fireEvent.click(screen.getByRole('tab', { name: 'Sign Up' }));
    
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: /^Sign Up$/ }));
    
    expect(mockAuth.signUp).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('displays loading state during authentication', () => {
    (useAuth as jest.Mock).mockReturnValue({
      ...mockAuth,
      loading: true,
    });
    
    render(<AuthPage />);
    
    expect(screen.getByRole('button', { name: /^Signing In\.{3}$/ })).toBeInTheDocument();
  });

  it('displays error message from auth context', () => {
    const errorMessage = 'Invalid credentials';
    (useAuth as jest.Mock).mockReturnValue({
      ...mockAuth,
      error: errorMessage,
    });
    
    render(<AuthPage />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('redirects to home when user is authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      ...mockAuth,
      user: { email: 'test@example.com' },
    });
    
    render(<AuthPage />);
    
    expect(mockRouter.replace).toHaveBeenCalledWith('/');
  });
}); 