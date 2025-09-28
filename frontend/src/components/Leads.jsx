import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    account_id: '',
    primary_contact_id: '',
    stage: 'New',
    value_cents: '0',
    probability: '10',
    expected_close_date: '',
    source: ''
  });
  const { token } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [leadsRes, accountsRes, contactsRes] = await Promise.all([
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

      if (leadsRes.ok && accountsRes.ok && contactsRes.ok) {
        const [leadsData, accountsData, contactsData] = await Promise.all([
          leadsRes.json(),
          accountsRes.json(),
          contactsRes.json()
        ]);
        setLeads(leadsData);
        setAccounts(accountsData);
        setContacts(contactsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Please enter a lead title');
      return;
    }
    
    const submitData = {
      title: formData.title.trim(),
      stage: formData.stage,
      value_cents: Math.round(parseFloat(formData.value_cents || '0') * 100),
      probability: parseInt(formData.probability || '10'),
      account_id: formData.account_id ? parseInt(formData.account_id) : null,
      primary_contact_id: formData.primary_contact_id ? parseInt(formData.primary_contact_id) : null,
      expected_close_date: formData.expected_close_date ? `${formData.expected_close_date}T00:00:00` : null,
      source: formData.source || null
    };


    try {
      const url = editingLead 
        ? `http://localhost:8001/leads/${editingLead.id}`
        : 'http://localhost:8001/leads';
      
      const method = editingLead ? 'PATCH' : 'POST';
      

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
        alert('Lead saved successfully!');
      } else {
        const errorData = await response.json();
        console.error('Backend validation error:', errorData);
        alert(`Error saving lead: ${JSON.stringify(errorData.detail || errorData)}`);
      }
    } catch (error) {
      console.error('Error saving lead:', error);
      alert('An unexpected error occurred while saving the lead.');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingLead(null);
    setFormData({
      title: '', account_id: '', primary_contact_id: '', stage: 'New',
      value_cents: '0', probability: '10', expected_close_date: '', source: ''
    });
  };

  const handleEditClick = (lead) => {
    setEditingLead(lead);
    setFormData({
      title: lead.title,
      account_id: lead.account_id || '',
      primary_contact_id: lead.primary_contact_id || '',
      stage: lead.stage,
      value_cents: (lead.value_cents / 100).toString(),
      probability: lead.probability.toString(),
      expected_close_date: lead.expected_close_date ? lead.expected_close_date.split('T')[0] : '',
      source: lead.source || ''
    });
    setShowForm(true);
  };

  const handleDeleteClick = async (leadId) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        const response = await fetch(`http://localhost:8001/leads/${leadId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          fetchData();
        } else {
          alert('Error deleting lead');
        }
      } catch (error) {
        console.error('Error deleting lead:', error);
        alert('An unexpected error occurred while deleting the lead.');
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading leads...</div>;
  }

  const openLeads = leads.filter(l => l.status === 'open');
  const totalPipelineValue = openLeads.reduce((sum, lead) => sum + (lead.value_cents || 0), 0);
  const avgDealSize = openLeads.length > 0 ? totalPipelineValue / openLeads.length : 0;

  return (
    <div className="container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ color: '#1a202c' }}>Leads</h2>
        <button 
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setShowForm(prevState => !prevState);
          }}
        >
          {showForm ? 'Cancel' : 'Create Lead'}
        </button>
      </div>


      {/* Create/Edit Lead Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '20px', color: '#374151' }}>
            {editingLead ? 'Edit Lead' : 'Create New Lead'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Lead Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Acme Corp - Website Redesign"
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px' 
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Stage</label>
                <select
                  value={formData.stage}
                  onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px' 
                  }}
                >
                  <option value="New">New</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Proposal">Proposal</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="Closed-Won">Closed Won</option>
                  <option value="Closed-Lost">Closed Lost</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Deal Value ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.value_cents}
                  onChange={(e) => setFormData({ ...formData, value_cents: e.target.value })}
                  placeholder="0.00"
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px' 
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Win Probability (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.probability}
                  onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px' 
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Expected Close Date</label>
                <input
                  type="date"
                  value={formData.expected_close_date}
                  onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px' 
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Source</label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  placeholder="e.g. Website, Referral, Cold Call"
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px' 
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="submit" 
                style={{
                  padding: '10px 20px',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {editingLead ? 'Update Lead' : 'Create Lead'}
              </button>
              <button 
                type="button" 
                onClick={resetForm}
                style={{
                  padding: '10px 20px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}


      {/* Quick Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px', 
        marginBottom: '30px' 
      }}>
        <div className="card">
          <h4 style={{ color: '#374151', marginBottom: '8px' }}>Open Leads</h4>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6', margin: '0' }}>
            {openLeads.length}
          </p>
        </div>
        <div className="card">
          <h4 style={{ color: '#374151', marginBottom: '8px' }}>Pipeline Value</h4>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981', margin: '0' }}>
            ${(totalPipelineValue / 100).toLocaleString()}
          </p>
        </div>
        <div className="card">
          <h4 style={{ color: '#374151', marginBottom: '8px' }}>Avg Deal Size</h4>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b', margin: '0' }}>
            ${(avgDealSize / 100).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Leads List */}
      {leads.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          No leads yet. Click "Create Lead" to create your first lead.
        </div>
      ) : (
        <div>
          {leads.map(lead => (
            <div key={lead.id} className="card" style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                <h4 style={{ color: '#374151', margin: '0' }}>
                  {lead.title}
                </h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => handleEditClick(lead)} 
                    style={{
                      padding: '5px 10px',
                      background: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(lead.id)} 
                    style={{
                      padding: '5px 10px',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              <div style={{ marginBottom: '12px', fontSize: '0.9rem', color: '#6b7280' }}>
                <div><strong>Stage:</strong> {lead.stage}</div>
                <div><strong>Value:</strong> ${(lead.value_cents / 100).toLocaleString()}</div>
                <div><strong>Probability:</strong> {lead.probability}%</div>
                {lead.source && <div><strong>Source:</strong> {lead.source}</div>}
              </div>

              <div style={{ 
                fontSize: '0.85rem', 
                color: '#9ca3af', 
                borderTop: '1px solid #e5e7eb', 
                paddingTop: '10px' 
              }}>
                Created: {new Date(lead.created_at).toLocaleDateString()}
                {lead.expected_close_date && (
                  <span style={{ float: 'right' }}>
                    Expected Close: {new Date(lead.expected_close_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Leads;