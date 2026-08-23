import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const GuideContext = createContext(null);

export const GuideProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState('modules'); // 'modules', 'workflows', 'shortcuts'
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);

  // Check if user has seen onboarding welcome modal on first login
  useEffect(() => {
    if (isAuthenticated && user) {
      const userKey = `crm_onboarded_${user.id || user.email || 'user'}`;
      const hasSeen = localStorage.getItem(userKey);
      if (!hasSeen) {
        // Automatically open welcome guide for new sessions
        const timer = setTimeout(() => {
          setIsWelcomeOpen(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    } else {
      setIsWelcomeOpen(false);
      setIsTourActive(false);
      setIsGuideOpen(false);
    }
  }, [isAuthenticated, user]);

  const dismissWelcome = (dontShowAgain = false) => {
    setIsWelcomeOpen(false);
    if (dontShowAgain && user) {
      const userKey = `crm_onboarded_${user.id || user.email || 'user'}`;
      localStorage.setItem(userKey, 'true');
    }
  };

  const openGuide = (tab = 'modules', moduleId = null) => {
    setActiveGuideTab(tab);
    setSelectedModuleId(moduleId);
    setIsGuideOpen(true);
  };

  const closeGuide = () => {
    setIsGuideOpen(false);
  };

  const startTour = () => {
    setIsWelcomeOpen(false);
    setIsGuideOpen(false);
    setTourStep(0);
    setIsTourActive(true);
  };

  const endTour = (markCompleted = true) => {
    setIsTourActive(false);
    setTourStep(0);
    if (markCompleted && user) {
      const userKey = `crm_onboarded_${user.id || user.email || 'user'}`;
      localStorage.setItem(userKey, 'true');
    }
  };

  const nextTourStep = (totalSteps) => {
    if (tourStep < totalSteps - 1) {
      setTourStep((prev) => prev + 1);
    } else {
      endTour(true);
    }
  };

  const prevTourStep = () => {
    if (tourStep > 0) {
      setTourStep((prev) => prev - 1);
    }
  };

  return (
    <GuideContext.Provider
      value={{
        isGuideOpen,
        openGuide,
        closeGuide,
        activeGuideTab,
        setActiveGuideTab,
        selectedModuleId,
        setSelectedModuleId,
        isTourActive,
        tourStep,
        startTour,
        endTour,
        nextTourStep,
        prevTourStep,
        isWelcomeOpen,
        dismissWelcome,
      }}
    >
      {children}
    </GuideContext.Provider>
  );
};

export const useGuide = () => {
  const context = useContext(GuideContext);
  if (!context) {
    throw new Error('useGuide must be used within a GuideProvider');
  }
  return context;
};
