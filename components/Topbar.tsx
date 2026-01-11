'use client';

import React from 'react';

export default function Topbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="menu-toggle" onClick={onToggleSidebar} aria-label="toggle menu">
          <i className="fas fa-bars" />
        </button>

        <div className="logo">
          <i className="fas fa-building" />
          <h1>منظِم</h1>
        </div>
      </div>

      <div className="topbar-right">
        <button className="profile-btn" type="button">
          <img
            src="https://ui-avatars.com/api/?name=المدير&background=2c5aa0&color=fff"
            alt="user"
          />
          <span>المدير</span>
          <i className="fas fa-chevron-down" />
        </button>
      </div>
    </header>
  );
}