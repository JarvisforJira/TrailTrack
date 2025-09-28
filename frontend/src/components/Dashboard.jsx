import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStatPanel, setShowStatPanel] = useState(false);
  const [statFilter, setStatFilter] = useState('');
  const [statTitle, setStatTitle] = useState('');
  const [statData, setStatData] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemType, setSelectedItemType] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:8001/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatClick = async (filterType, title) => {
    setStatFilter(filterType);
    setStatTitle(title);
    setShowStatPanel(true);
    
    try {
      let endpoint = '';
      switch (filterType) {
        case 'open_leads':
          endpoint = 'leads';
          break;
        case 'accounts':
          endpoint = 'accounts';
          break;
        case 'open_tasks':
          endpoint = 'tasks';
          break;
        case 'pipeline_leads':
          endpoint = 'leads';
          break;
        default:
          return;
      }

      const response = await fetch(`http://localhost:8001/${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        let filteredData = data;
        
        // Apply specific filters based on stat type
        switch (filterType) {
          case 'open_leads':
            filteredData = data.filter(item => item.status !== 'closed_won' && item.status !== 'closed_lost');
            break;
          case 'open_tasks':
            filteredData = data.filter(item => item.status === 'open');
            break;
          case 'pipeline_leads':
            filteredData = data.filter(item => item.value_cents > 0 && item.status !== 'closed_lost');
            break;
          // accounts shows all accounts (no filter needed)
        }
        
        setStatData(filteredData);
      }
    } catch (error) {
      console.error('Error fetching stat data:', error);
      setStatData([]);
    }
  };

  const formatCurrency = (cents) => {
    return `$${(cents / 100).toLocaleString()}`;
  };

  const getEntityDisplayName = (item, type) => {
    switch (type) {
      case 'open_leads':
      case 'pipeline_leads':
        return item.title;
      case 'accounts':
        return item.name;
      case 'open_tasks':
        return item.title;
      default:
        return 'Unknown';
    }
  };

  const getEntitySubtext = (item, type) => {
    switch (type) {
      case 'open_leads':
      case 'pipeline_leads':
        return `${item.stage} • ${formatCurrency(item.value_cents)}`;
      case 'accounts':
        return item.industry || 'No industry specified';
      case 'open_tasks':
        return `Priority: ${item.priority?.charAt(0).toUpperCase() + item.priority?.slice(1)} ${item.due_at ? '• Due: ' + new Date(item.due_at).toLocaleDateString() : ''}`;
      default:
        return '';
    }
  };

  const handleItemClick = (item, type) => {
    // Close the stat panel and show detail modal
    setShowStatPanel(false);
    setSelectedItem(item);
    setSelectedItemType(type);
    setShowDetailModal(true);
  };

  const renderDetailContent = (item, type) => {
    if (!item) return null;

    switch (type) {
      case 'open_leads':
      case 'pipeline_leads':
        return (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#374151', marginBottom: '8px' }}>Lead Information</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div><strong>Title:</strong> {item.title}</div>
                <div><strong>Stage:</strong> {item.stage}</div>
                <div><strong>Value:</strong> {formatCurrency(item.value_cents)}</div>
                <div><strong>Probability:</strong> {item.probability}%</div>
                <div><strong>Source:</strong> {item.source || 'Not specified'}</div>
                <div><strong>Status:</strong> {item.status}</div>
              </div>
            </div>
            {item.expected_close_date && (
              <div style={{ marginBottom: '16px' }}>
                <strong>Expected Close Date:</strong> {new Date(item.expected_close_date).toLocaleDateString()}
              </div>
            )}
            {item.notes && (
              <div>
                <strong>Notes:</strong>
                <div style={{ marginTop: '8px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
                  {item.notes}
                </div>
              </div>
            )}
          </div>
        );
      
      case 'accounts':
        return (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#374151', marginBottom: '8px' }}>Account Information</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div><strong>Name:</strong> {item.name}</div>
                <div><strong>Industry:</strong> {item.industry || 'Not specified'}</div>
                <div><strong>Size:</strong> {item.size || 'Not specified'}</div>
                <div><strong>Website:</strong> {item.website || 'Not specified'}</div>
                <div><strong>Phone:</strong> {item.phone || 'Not specified'}</div>
                <div><strong>Email:</strong> {item.email || 'Not specified'}</div>
              </div>
            </div>
            {(item.street || item.city || item.state) && (
              <div style={{ marginBottom: '16px' }}>
                <strong>Address:</strong>
                <div style={{ marginTop: '4px' }}>
                  {item.street && <div>{item.street}</div>}
                  {(item.city || item.state || item.postal_code) && (
                    <div>
                      {item.city}{item.city && item.state ? ', ' : ''}{item.state} {item.postal_code}
                    </div>
                  )}
                  {item.country && <div>{item.country}</div>}
                </div>
              </div>
            )}
            {item.notes && (
              <div>
                <strong>Notes:</strong>
                <div style={{ marginTop: '8px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
                  {item.notes}
                </div>
              </div>
            )}
          </div>
        );
      
      case 'open_tasks':
        return (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#374151', marginBottom: '8px' }}>Task Information</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div><strong>Title:</strong> {item.title}</div>
                <div><strong>Priority:</strong> {item.priority?.charAt(0).toUpperCase() + item.priority?.slice(1)}</div>
                <div><strong>Status:</strong> {item.status}</div>
                <div><strong>Type:</strong> {item.type || 'General'}</div>
              </div>
            </div>
            {item.due_at && (
              <div style={{ marginBottom: '16px' }}>
                <strong>Due Date:</strong> {new Date(item.due_at).toLocaleString()}
              </div>
            )}
            {item.description && (
              <div>
                <strong>Description:</strong>
                <div style={{ marginTop: '8px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
                  {item.description}
                </div>
              </div>
            )}
          </div>
        );
      
      default:
        return <div>No details available</div>;
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div>
      <h2 style={{ marginBottom: '30px', color: '#1a202c' }}>Dashboard</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '20px' }}>
        <div 
          onClick={() => handleStatClick('open_leads', 'Open Leads')}
          style={{ 
            backgroundColor: 'white', 
            padding: '24px', 
            borderRadius: '8px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
            border: '1px solid #e5e7eb',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
          }}
        >
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
            {stats?.open_leads || 0}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>Open Leads</div>
        </div>

        <div 
          onClick={() => handleStatClick('accounts', 'All Accounts')}
          style={{ 
            backgroundColor: 'white', 
            padding: '24px', 
            borderRadius: '8px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
            border: '1px solid #e5e7eb',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
          }}
        >
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
            {stats?.total_accounts || 0}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>Accounts</div>
        </div>

        <div 
          onClick={() => handleStatClick('open_tasks', 'Open Tasks')}
          style={{ 
            backgroundColor: 'white', 
            padding: '24px', 
            borderRadius: '8px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
            border: '1px solid #e5e7eb',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
          }}
        >
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
            {stats?.open_tasks || 0}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>Open Tasks</div>
        </div>

        <div 
          onClick={() => handleStatClick('pipeline_leads', 'Pipeline Value')}
          style={{ 
            backgroundColor: 'white', 
            padding: '24px', 
            borderRadius: '8px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
            border: '1px solid #e5e7eb',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
          }}
        >
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
            ${(stats?.pipeline_value || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>Pipeline Value</div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ marginBottom: '20px', color: '#374151' }}>Quick Actions</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary">Add New Lead</button>
            <button className="btn btn-secondary">Add Account</button>
            <button className="btn btn-secondary">Add Contact</button>
            <button className="btn btn-secondary">Log Activity</button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '20px', color: '#374151' }}>Recent Activity</h3>
          <div style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>
            No recent activities
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '20px', color: '#374151' }}>Welcome to TrailTrack CRM</h3>
        <p style={{ color: '#64748b', lineHeight: '1.6' }}>
          Your lightweight CRM for managing leads, accounts, and contacts. Start by adding your first 
          lead or account to begin tracking your sales pipeline.
        </p>
      </div>

      {/* Stat Panel Modal */}
      {showStatPanel && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            maxWidth: '90vw',
            maxHeight: '80vh',
            width: '800px',
            overflow: 'auto',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '20px',
              borderBottom: '1px solid #e5e7eb',
              paddingBottom: '15px'
            }}>
              <h3 style={{ color: '#374151', margin: 0 }}>{statTitle}</h3>
              <button
                onClick={() => setShowStatPanel(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '0',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <strong>{statData.length}</strong> item{statData.length !== 1 ? 's' : ''}
            </div>

            {statData.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px', 
                color: '#64748b' 
              }}>
                No items found.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {statData.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => handleItemClick(item, statFilter)}
                    style={{ 
                      backgroundColor: 'white', 
                      padding: '16px', 
                      borderRadius: '8px', 
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
                      border: '1px solid #e5e7eb',
                      borderLeft: '4px solid #667eea',
                      margin: '0',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateX(4px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ 
                          color: '#374151', 
                          margin: '0 0 8px 0'
                        }}>
                          {getEntityDisplayName(item, statFilter)}
                        </h4>
                        <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                          {getEntitySubtext(item, statFilter)}
                        </div>
                      </div>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: '#9ca3af',
                        marginLeft: '12px',
                        alignSelf: 'center'
                      }}>
                        Click for details →
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '90vw',
            maxHeight: '80vh',
            width: '600px',
            overflow: 'auto',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '24px',
              borderBottom: '1px solid #e5e7eb',
              paddingBottom: '16px'
            }}>
              <h3 style={{ color: '#374151', margin: 0 }}>
                {getEntityDisplayName(selectedItem, selectedItemType)} Details
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '0',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>
            
            {renderDetailContent(selectedItem, selectedItemType)}

            <div style={{ 
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
