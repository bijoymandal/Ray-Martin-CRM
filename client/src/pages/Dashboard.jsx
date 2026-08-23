import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import { getContactsAPI, getDealsAPI } from '../services/api';
import { Users, Briefcase, DollarSign, Percent, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const canReadContacts = user && ['SUPERADMIN', 'ADMIN', 'EDITOR'].includes(user.role);

  const [contacts, setContacts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError('');
        if (canReadContacts) {
          const [contactsRes, dealsRes] = await Promise.all([
            getContactsAPI(),
            getDealsAPI(),
          ]);
          if (contactsRes.success && dealsRes.success) {
            setContacts(contactsRes.data);
            setDeals(dealsRes.data);
          } else {
            setError('Failed to load some dashboard data.');
          }
        } else {
          const dealsRes = await getDealsAPI();
          if (dealsRes.success) {
            setDeals(dealsRes.data);
          } else {
            setError('Failed to load pipeline data.');
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Connection failed. Could not fetch dashboard details.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [canReadContacts]);

  // Compute Stats
  const totalContacts = contacts.length;
  const totalDeals = deals.length;
  
  const wonDeals = deals.filter(deal => deal.stage === 'CLOSED_WON');
  const wonDealsValue = wonDeals.reduce((sum, deal) => sum + deal.value, 0);
  
  const conversionRate = totalDeals > 0 
    ? Math.round((wonDeals.length / totalDeals) * 100) 
    : 0;

  // Formatting helper
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Badges styling
  const getContactBadgeClass = (status) => {
    switch (status) {
      case 'CUSTOMER':
        return 'inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
      case 'PROSPECT':
        return 'inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20';
      case 'INACTIVE':
        return 'inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600 border border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/5';
      case 'LEAD':
      default:
        return 'inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20';
    }
  };

  const getDealBadgeClass = (stage) => {
    switch (stage) {
      case 'CLOSED_WON':
        return 'inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
      case 'CLOSED_LOST':
        return 'inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
      case 'NEGOTIATION':
        return 'inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20';
      case 'PROPOSAL':
        return 'inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20';
      case 'QUALIFICATION':
      default:
        return 'inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
    }
  };

  const formatStage = (stage) => {
    return stage ? stage.replace('_', ' ') : '';
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-dark-main text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto md:pl-[260px] pt-[70px]">
        <Navbar />
        
        <div data-tour="main-content" className="flex-1 p-8 max-w-[1600px] w-full mx-auto animate-fade-in">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-gradient mb-2">Dashboard</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Real-time performance analytics and pipeline overview.</p>
          </div>

          {error && (
            <div className="flex items-center gap-3 bg-rose-50 border border-rose-200/60 rounded-xl p-4 mb-6 text-sm text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400">
              <AlertCircle size={18} className="shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {loading ? (
            // Skeleton Layout
            <div className="flex flex-col gap-8">
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${canReadContacts ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6`}>
                {canReadContacts && <div className="skeleton h-[120px] rounded-2xl" />}
                <div className="skeleton h-[120px] rounded-2xl" />
                <div className="skeleton h-[120px] rounded-2xl" />
                <div className="skeleton h-[120px] rounded-2xl" />
              </div>
              <div className={`grid grid-cols-1 ${canReadContacts ? 'lg:grid-cols-2' : ''} gap-6`}>
                {canReadContacts && <div className="skeleton h-[350px] rounded-2xl" />}
                <div className="skeleton h-[350px] rounded-2xl" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {/* Stats Row */}
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${canReadContacts ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6`}>
                {canReadContacts && (
                  <StatCard 
                    title="Total Contacts" 
                    value={totalContacts} 
                    icon={<Users size={20} />} 
                    color="indigo" 
                  />
                )}
                <StatCard 
                  title="Total Pipeline Deals" 
                  value={totalDeals} 
                  icon={<Briefcase size={20} />} 
                  color="purple" 
                />
                <StatCard 
                  title="Revenue Won" 
                  value={formatCurrency(wonDealsValue)} 
                  icon={<DollarSign size={20} />} 
                  color="emerald" 
                />
                <StatCard 
                  title="Conversion Rate" 
                  value={`${conversionRate}%`} 
                  icon={<Percent size={20} />} 
                  color="cyan" 
                />
              </div>

              {/* Lists Row */}
              <div className={`grid grid-cols-1 ${canReadContacts ? 'lg:grid-cols-2' : ''} gap-6`}>
                {/* Recent Contacts */}
                {canReadContacts && (
                  <div className="glass-card p-6">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-5 tracking-tight">Recent Contacts</h3>
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200/60 dark:border-white/5">
                            <th className="pb-3 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Name</th>
                            <th className="pb-3 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Company</th>
                            <th className="pb-3 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/50 dark:divide-white/3">
                          {contacts.slice(0, 5).map((contact) => (
                            <tr key={contact.id} className="hover:bg-slate-50/50 dark:hover:bg-white/1">
                              <td className="py-4 font-semibold text-slate-800 dark:text-slate-200">{contact.firstName} {contact.lastName}</td>
                              <td className="py-4 text-slate-500 dark:text-slate-400">{contact.company || '—'}</td>
                              <td className="py-4">
                                <span className={getContactBadgeClass(contact.status)}>
                                  {contact.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {contacts.length === 0 && (
                            <tr>
                              <td colSpan="3" className="text-center text-slate-400 py-8 italic dark:text-slate-500">No contacts found. Create one.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Recent Deals */}
                <div className="glass-card p-6">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-5 tracking-tight">Recent Pipeline Deals</h3>
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200/60 dark:border-white/5">
                          <th className="pb-3 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Deal Title</th>
                          <th className="pb-3 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Value</th>
                          <th className="pb-3 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Stage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100/50 dark:divide-white/3">
                        {deals.slice(0, 5).map((deal) => (
                          <tr key={deal.id} className="hover:bg-slate-50/50 dark:hover:bg-white/1">
                            <td className="py-4 font-semibold text-slate-800 dark:text-slate-200">{deal.title}</td>
                            <td className="py-4 font-bold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(deal.value)}
                            </td>
                            <td className="py-4">
                              <span className={getDealBadgeClass(deal.stage)}>
                                {formatStage(deal.stage)}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {deals.length === 0 && (
                          <tr>
                            <td colSpan="3" className="text-center text-slate-400 py-8 italic dark:text-slate-500">No active deals. Create one.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
