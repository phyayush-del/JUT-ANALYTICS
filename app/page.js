'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.success) {
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('jnanasudha_username', username);
        sessionStorage.setItem('jnanasudha_password', password);
        sessionStorage.setItem('jnanasudha_cookies', data.cookies || '');
        router.push('/dashboard');
      } else {
        setError(data.message || 'Invalid credentials.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }

    setLoading(false);
  };

  return (
    // ... rest of your login form (same as before) ...
  );
}