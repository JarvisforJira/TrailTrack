import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const Activities = () => {
  const [activities, setActivities] = useState([]);
  const [leads, setLeads] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [formData, setFormData] = useState({
    type: 'note',
    subject: '',
    body: '',
    lead_id: '',
    account_id: '',
    contact_id: '',
    occurred_at: '',
    duration_minutes: ''
  });
  const [filterType, setFilterType] = useState('');
  const [filterLead, setFilterLead] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { token } = useAuth();

  const activityTypes = [
    { value: 'call', label: 'Phone Call', icon: '📞' },
    { value: 'email', label: 'Email', icon: '📧' },
    { value: 'meeting', label: 'Meeting', icon: '👥' },
    { value: 'note', label: 'Note', icon: '📝' },
    { value: 'sms', label: 'SMS/Text', icon: '💬' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [activitiesRes, leadsRes, accountsRes, contactsRes] = await Promise.all([
        fetch('http://localhost:8001/activities', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:8001/leads', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:8001/accounts', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:8001/contacts', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (activitiesRes.ok) setActivities(await activitiesRes.json());
      if (leadsRes.ok) setLeads(await leadsRes.json());
      if (accountsRes.ok) setAccounts(await accountsRes.json());
      if (contactsRes.ok) setContacts(await contactsRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      lead_id: formData.lead_id ? parseInt(formData.lead_id) : null,
      account_id: formData.account_id ? parseInt(formData.account_id) : null,
      contact_id: formData.contact_id ? parseInt(formData.contact_id) : null,
      duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
      occurred_at: formData.occurred_at || new Date().toISOString()
    };

    try {
      const url = editingActivity 
        ? `http://localhost:8001/activities/${editingActivity.id}`
        : 'http://localhost:8001/activities';
      
      const method = editingActivity ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        resetForm();
        fetchData();
      }
    } catch (error) {
      console.error('Error saving activity:', error);
    }
  };

  const handleEdit = (activity) => {
    setEditingActivity(activity);
    setFormData({
      type: activity.type || 'note',
      subject: activity.subject || '',
      body: activity.body || '',
      lead_id: activity.lead_id || '',
      account_id: activity.account_id || '',
      contact_id: activity.contact_id || '',
      occurred_at: activity.occurred_at ? new Date(activity.occurred_at).toISOString().slice(0, 16) : '',
      duration_minutes: activity.duration_minutes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (activityId) => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      try {
        const response = await fetch(`http://localhost:8001/activities/${activityId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          fetchData();
        }
      } catch (error) {
        console.error('Error deleting activity:', error);
      }
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingActivity(null);
    setFormData({
      type: 'note', subject: '', body: '', lead_id: '', account_id: '', 
      contact_id: '', occurred_at: '', duration_minutes: ''
    });
  };

  const getFilteredActivities = () => {
    return activities.filter(activity => {
      const typeMatch = filterType === '' || activity.type === filterType;
      const leadMatch = filterLead === '' || activity.lead_id === parseInt(filterLead);
      const searchMatch = searchTerm === '' || 
        (activity.subject && activity.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (activity.body && activity.body.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return typeMatch && leadMatch && searchMatch;
    });
  };

  const getLinkedName = (activity) => {
    const parts = [];
    
    if (activity.lead_id) {
      const lead = leads.find(l => l.id === activity.lead_id);
      if (lead) parts.push(`Lead: ${lead.title}`);
    }
    
    if (activity.account_id) {
      const account = accounts.find(a => a.id === activity.account_id);
      if (account) parts.push(`Account: ${account.name}`);
    }
    
    if (activity.contact_id) {
      const contact = contacts.find(c => c.id === activity.contact_id);
      if (contact) parts.push(`Contact: ${contact.first_name} ${contact.last_name}`);
    }
    
    return parts.length > 0 ? parts.join(' • ') : 'General Activity';
  };

  const getActivityIcon = (type) => {
    const activity = activityTypes.find(a => a.value === type);
    return activity ? activity.icon : '📝';
  };

  const getActivityLabel = (type) => {
    const activity = activityTypes.find(a => a.value === type);
    return activity ? activity.label : type;
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'No date';
    return new Date(dateTime).toLocaleString();
  };

  const formatDuration = (minutes) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  if (loading) {
    return <div className="loading">Loading activities...</div>;
  }

  const filteredActivities = getFilteredActivities();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ color: '#1a202c' }}>Activities</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Log Activity'}
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
        border: '1px solid #e5e7eb',
        marginBottom: '20px' 
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Search Activities</label>
            <input
              type="text"
              placeholder="Search by subject or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '8px', 
                border: '1px solid #ddd', 
                borderRadius: '4px' 
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Filter by Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '8px', 
                border: '1px solid #ddd', 
                borderRadius: '4px' 
              }}
            >
              <option value="">All Types</option>
              {activityTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Filter by Lead</label>
            <select
              value={filterLead}
              onChange={(e) => setFilterLead(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '8px', 
                border: '1px solid #ddd', 
                borderRadius: '4px' 
              }}
            >
              <option value="">All Leads</option>
              {leads.map(lead => (
                <option key={lead.id} value={lead.id}>{lead.title}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={() => {
            setSearchTerm('');
            setFilterType('');
            setFilterLead('');
          }}
          style={{ 
            marginTop: '20px',
            backgroundColor: '#6c757d',
            color: 'white',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Clear Filters
        </button>
      </div>

      {/* Add/Edit Activity Form */}
      {showForm && (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
          border: '1px solid #e5e7eb',
          marginBottom: '30px' 
        }}>
          <h3 style={{ marginBottom: '20px', color: '#374151' }}>
            {editingActivity ? 'Edit Activity' : 'Log New Activity'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Activity Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px' 
                  }}
                >
                  {activityTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.occurred_at}
                  onChange={(e) => setFormData({ ...formData, occurred_at: e.target.value })}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px' 
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Subject *</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Brief description of the activity"
                  required
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px' 
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Duration (minutes)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  placeholder="e.g. 30"
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px' 
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Related Lead</label>
                <select
                  value={formData.lead_id}
                  onChange={(e) => setFormData({ ...formData, lead_id: e.target.value })}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px' 
                  }}
                >
                  <option value="">No lead selected</option>
                  {leads.map(lead => (
                    <option key={lead.id} value={lead.id}>{lead.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Related Account</label>
                <select
                  value={formData.account_id}
                  onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px' 
                  }}
                >
                  <option value="">No account selected</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>{account.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Related Contact</label>
                <select
                  value={formData.contact_id}
                  onChange={(e) => setFormData({ ...formData, contact_id: e.target.value })}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px' 
                  }}
                >
                  <option value="">No contact selected</option>
                  {contacts.map(contact => (
                    <option key={contact.id} value={contact.id}>
                      {contact.first_name} {contact.last_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Description/Notes</label>
              <textarea
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder="Detailed notes about this activity..."
                rows="4"
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px' 
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="submit" 
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {editingActivity ? 'Update Activity' : 'Log Activity'}
              </button>
              <button 
                type="button" 
                onClick={resetForm}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Activities Display */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
        border: '1px solid #e5e7eb' 
      }}>
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ color: '#374151' }}>
            {filteredActivities.length} Activit{filteredActivities.length !== 1 ? 'ies' : 'y'}
            {(searchTerm || filterType || filterLead) && ` (filtered from ${activities.length})`}
          </h3>
        </div>

        {filteredActivities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            {searchTerm || filterType || filterLead 
              ? 'No activities match your filters.' 
              : 'No activities logged yet. Click "Log Activity" to record your first activity.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {filteredActivities
              .sort((a, b) => new Date(b.occurred_at || b.created_at) - new Date(a.occurred_at || a.created_at))
              .map(activity => (
                <div key={activity.id} style={{ 
                  backgroundColor: 'white', 
                  padding: '16px', 
                  borderRadius: '8px', 
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
                  border: '1px solid #e5e7eb',
                  borderLeft: '4px solid #667eea',
                  margin: '0' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '1.5rem' }}>{getActivityIcon(activity.type)}</span>
                      <div>
                        <h4 style={{ color: '#374151', margin: '0 0 4px 0' }}>
                          {activity.subject}
                        </h4>
                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                          {getActivityLabel(activity.type)} • {formatDateTime(activity.occurred_at)}
                          {activity.duration_minutes && ` • ${formatDuration(activity.duration_minutes)}`}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleEdit(activity)}
                        style={{
                          padding: '4px 8px',
                          fontSize: '0.75rem',
                          background: '#f1f5f9',
                          border: '1px solid #e2e8f0',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(activity.id)}
                        style={{
                          padding: '4px 8px',
                          fontSize: '0.75rem',
                          background: '#fee2e2',
                          border: '1px solid #fecaca',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          color: '#991b1b'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '10px' }}>
                    <strong>Related to:</strong> {getLinkedName(activity)}
                  </div>

                  {activity.body && (
                    <div style={{ 
                      background: '#f8fafc', 
                      padding: '12px', 
                      borderRadius: '6px', 
                      fontSize: '0.9rem',
                      lineHeight: '1.5',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {activity.body}
                    </div>
                  )}

                  <div style={{ marginTop: '12px', fontSize: '0.8rem', color: '#9ca3af' }}>
                    Logged: {new Date(activity.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Activities;