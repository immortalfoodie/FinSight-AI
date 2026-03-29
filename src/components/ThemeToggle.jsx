import React from 'react';
import { Moon } from 'lucide-react';

const ThemeToggle = () => (
  <button className="glass-panel" style={{ 
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    padding: '0.5rem',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    <Moon size={20} />
  </button>
);

export default ThemeToggle;
