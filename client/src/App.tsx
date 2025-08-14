import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProjectPage from './pages/ProjectPage';
import SettingsPage from './pages/SettingsPage';
import { useStore } from './stores/useStore';
import { fetchProjects } from './lib/api';
import './utils/electronMock'; // Auto-inject mock if needed
import './styles/scrollbar.css'; // Custom scrollbar styles

function App() {
  const { setProjects, showToast } = useStore();

  useEffect(() => {
    loadProjects();

    // Listen for menu actions from Electron
    if (window.electronAPI) {
      window.electronAPI.onMenuAction((action) => {
        if (action === 'new-project') {
          useStore.getState().openModal('newProject');
        } else if (action === 'settings') {
          window.location.href = '/settings';
        }
      });
    }
  }, []);

  const loadProjects = async () => {
    try {
      const projects = await fetchProjects();
      setProjects(projects);
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Failed to load projects. Please check if the backend is running.'
      });
    }
  };

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/projects" replace />} />
        <Route path="projects" element={<ProjectPage />} />
        <Route path="projects/:slug" element={<ProjectPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

export default App;