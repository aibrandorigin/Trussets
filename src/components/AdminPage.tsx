import React, { useState, useEffect } from 'react';
import { PropertyListing } from '../types';
import { AdminLayout, AdminTab } from './admin/AdminLayout';
import { AdminLogin } from './admin/AdminLogin';
import { AdminOverview } from './admin/AdminOverview';
import { AdminUsers } from './admin/AdminUsers';
import { AdminProperties } from './admin/AdminProperties';
import { AdminPlans } from './admin/AdminPlans';
import { AdminAnalytics } from './admin/AdminAnalytics';
import { AdminBanners } from './admin/AdminBanners';
import { AdminBlogs } from './admin/AdminBlogs';
import { AdminTestimonials } from './admin/AdminTestimonials';
import { AdminFraudReports } from './admin/AdminFraudReports';
import { AdminInquiries } from './admin/AdminInquiries';
import { AdminNotifications } from './admin/AdminNotifications';
import { AdminAuditLogs } from './admin/AdminAuditLogs';
import { AdminSettings } from './admin/AdminSettings';
import { adminAuthStorage, adminApi } from '../services/adminApi';

interface AdminPageProps {
  properties?: PropertyListing[];
  onUpdateProperty?: (updated: PropertyListing) => void;
  onDeleteProperty?: (id: string) => void;
  onAddProperty?: (newProp: PropertyListing) => void;
  onBackToHome: () => void;
  onOpenProfile?: () => void;
  onLogout?: () => void;
  onSelectProperty?: (prop: PropertyListing) => void;
  onAuthChange?: (isAuth: boolean) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  onBackToHome,
  onOpenProfile,
  onLogout,
  onSelectProperty,
  onAuthChange,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return adminAuthStorage.isAuthenticated();
  });
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [plansSubTab, setPlansSubTab] = useState<'buying' | 'rental'>('buying');
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Sync URL route to activeTab and plansSubTab
  useEffect(() => {
    const handleRouteFromUrl = () => {
      try {
        const pathname = window.location.pathname.toLowerCase();
        const hash = window.location.hash.toLowerCase().replace(/^#\/?/, '');
        const searchParams = new URLSearchParams(window.location.search);

        // Check for old rental plans routes
        if (
          pathname.includes('rental-property-plans') ||
          hash.includes('rental-property-plans') ||
          hash.includes('rentalplans')
        ) {
          window.history.replaceState(null, '', '/admin/property-plans?tab=rental');
          setActiveTab('plans');
          setPlansSubTab('rental');
          return;
        }

        // Check for old buying plans routes
        if (
          pathname.includes('buying-property-plans') ||
          hash.includes('buying-property-plans') ||
          hash.includes('buyingplans')
        ) {
          window.history.replaceState(null, '', '/admin/property-plans?tab=buying');
          setActiveTab('plans');
          setPlansSubTab('buying');
          return;
        }

        // Check for unified property plans route
        if (
          pathname.includes('property-plans') ||
          hash.includes('property-plans') ||
          hash === 'plans' ||
          hash.startsWith('plans?')
        ) {
          const tabParam = searchParams.get('tab') || (hash.includes('tab=rental') ? 'rental' : 'buying');
          const sub = tabParam === 'rental' ? 'rental' : 'buying';
          setActiveTab('plans');
          setPlansSubTab(sub);
          return;
        }

        // Other tabs
        const tabMatches: Record<string, AdminTab> = {
          users: 'users',
          properties: 'properties',
          analytics: 'analytics',
          banners: 'banners',
          blogs: 'blogs',
          testimonials: 'testimonials',
          fraudreports: 'fraudReports',
          inquiries: 'inquiries',
          notifications: 'notifications',
          auditlogs: 'auditLogs',
          settings: 'settings',
          overview: 'overview',
        };

        for (const [key, tab] of Object.entries(tabMatches)) {
          if (pathname.includes(`/admin/${key}`) || hash === key) {
            setActiveTab(tab);
            return;
          }
        }
      } catch (err) {
        console.error('Route parsing error:', err);
      }
    };

    handleRouteFromUrl();
    window.addEventListener('popstate', handleRouteFromUrl);
    window.addEventListener('hashchange', handleRouteFromUrl);

    return () => {
      window.removeEventListener('popstate', handleRouteFromUrl);
      window.removeEventListener('hashchange', handleRouteFromUrl);
    };
  }, []);

  // Check auth session validity on mount
  useEffect(() => {
    let isMounted = true;
    const verifyAuth = async () => {
      if (adminAuthStorage.isAuthenticated()) {
        try {
          await adminApi.getMe();
          if (!isMounted || !adminAuthStorage.isAuthenticated()) return;
          setIsAuthenticated(true);
          onAuthChange?.(true);

          // Get initial unread notifications count
          const notifRes = await adminApi.getNotifications();
          if (!isMounted || !adminAuthStorage.isAuthenticated()) return;
          const unread = notifRes.notifications.filter((n) => !n.isRead).length;
          setUnreadCount(unread);
        } catch {
          if (!isMounted) return;
          // Token expired or invalid
          adminAuthStorage.clear();
          setIsAuthenticated(false);
          onAuthChange?.(false);
        }
      } else {
        setIsAuthenticated(false);
        onAuthChange?.(false);
      }
    };

    verifyAuth();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNavigateTab = (tab: AdminTab, filter?: any) => {
    if (tab === 'buyingPlans') {
      setActiveTab('plans');
      setPlansSubTab('buying');
      window.history.replaceState(null, '', '/admin/property-plans?tab=buying');
      return;
    }
    if (tab === 'rentalPlans') {
      setActiveTab('plans');
      setPlansSubTab('rental');
      window.history.replaceState(null, '', '/admin/property-plans?tab=rental');
      return;
    }
    if (tab === 'plans') {
      const sub = filter?.subTab === 'rental' ? 'rental' : filter?.subTab === 'buying' ? 'buying' : plansSubTab;
      setActiveTab('plans');
      setPlansSubTab(sub);
      window.history.replaceState(null, '', `/admin/property-plans?tab=${sub}`);
      return;
    }

    setActiveTab(tab);
    window.history.replaceState(null, '', `/admin/${tab}`);
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    onAuthChange?.(true);
    setActiveTab('overview');
  };

  const handleLogout = () => {
    adminAuthStorage.clear();
    setIsAuthenticated(false);
    onAuthChange?.(false);
    if (onLogout) {
      onLogout();
    } else {
      onBackToHome();
    }
  };

  // If not authenticated, display the dedicated secure admin login
  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} onBackToHome={onBackToHome} />;
  }

  // Render Admin Workspace
  return (
    <AdminLayout
      activeTab={activeTab === 'buyingPlans' || activeTab === 'rentalPlans' ? 'plans' : activeTab}
      onTabChange={handleNavigateTab}
      onLogout={handleLogout}
      onNavigateHome={onBackToHome}
      onOpenProfile={onOpenProfile}
      unreadCount={unreadCount}
    >
      {activeTab === 'overview' && <AdminOverview onNavigateTab={handleNavigateTab} />}

      {activeTab === 'users' && <AdminUsers />}

      {activeTab === 'properties' && (
        <AdminProperties onSelectProperty={onSelectProperty} />
      )}

      {activeTab === 'analytics' && <AdminAnalytics />}

      {(activeTab === 'plans' || activeTab === 'buyingPlans' || activeTab === 'rentalPlans') && (
        <AdminPlans
          initialTab={
            activeTab === 'rentalPlans'
              ? 'rental'
              : activeTab === 'buyingPlans'
              ? 'buying'
              : plansSubTab
          }
          onSubTabChange={(sub) => {
            setPlansSubTab(sub);
            window.history.replaceState(null, '', `/admin/property-plans?tab=${sub}`);
          }}
        />
      )}

      {activeTab === 'banners' && <AdminBanners />}

      {activeTab === 'blogs' && <AdminBlogs />}

      {activeTab === 'testimonials' && <AdminTestimonials />}

      {activeTab === 'fraudReports' && <AdminFraudReports />}

      {activeTab === 'inquiries' && <AdminInquiries />}

      {activeTab === 'notifications' && (
        <AdminNotifications onNavigate={(tab) => handleNavigateTab(tab)} />
      )}

      {activeTab === 'auditLogs' && <AdminAuditLogs />}

      {activeTab === 'settings' && <AdminSettings />}
    </AdminLayout>
  );
};
