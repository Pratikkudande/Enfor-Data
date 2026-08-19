import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const MainLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Extract current section from path
  const currentPath = location.pathname.split('/')[1] || 'dashboard';

  const handleSectionChange = (section: string) => {
    navigate(`/${section}`);
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />
      
      <div className="flex pt-20 bg-gray-100 flex-1">
        <Sidebar
          isOpen={isSidebarOpen}
          currentSection={currentPath}
          onSectionChange={handleSectionChange}
        />

        <main className="flex-1 lg:ml-60 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col min-w-0 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
