import React from 'react';
import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import ToastContainer from './ToastContainer';
import NewProjectModal from './modals/NewProjectModal';
import DeleteProjectModal from './modals/DeleteProjectModal';
import { useStore } from '../stores/useStore';

const Layout: React.FC = () => {
  const { sidebarCollapsed } = useStore();

  return (
    <div className="flex flex-col h-screen bg-black">
      <TopBar />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 overflow-auto custom-scrollbar bg-gradient-mesh">
          <Outlet />
        </main>
      </div>

      <ToastContainer />
      <NewProjectModal />
      <DeleteProjectModal />
    </div>
  );
};

export default Layout;