import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState({
    account_id: '',
    first_name: '',
    last_name: '',
    title: '',
    email: '',
    phone: '',
    notes: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAccount, setFilterAccount] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [contactsRes, accountsRes] = await Promise.all([
        fetch('http://localhost:8001/contacts', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:8001/accounts', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (contactsRes.ok) setContacts(await contactsRes.json());
      if (accountsRes.ok) setAccounts(await accountsRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      alert('Please enter both first and last name');
      return;
    }
    
    const submitData = {
      ...formData,
      account_id: formData.account_id ? parseInt(formData.account_id) : null
    };

    try {
      const url = editingContact 
        ? `http://localhost:8001/contacts/${editingContact.id}`
        : 'http://localhost:8001/contacts';
      
      const method = editingContact ? 'PATCH' : 'POST';

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
        alert('Contact saved successfully!');
      } else {
        alert('Error saving contact');
      }
    } catch (error) {
      console.error('Error saving contact:', error);
    }
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setFormData({
      account_id: contact.account_id || '',
      first_name: contact.first_name || '',
      last_name: contact.last_name || '',
      title: contact.title || '',
      email: contact.email || '',
      phone: contact.phone || '',
      notes: contact.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (contactId) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        const response = await fetch(`http://localhost:8001/contacts/${contactId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          fetchData();
        }
      } catch (error) {
        console.error('Error deleting contact:', error);
      }
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingContact(null);
    setFormData({
      account_id: '', first_name: '', last_name: '', title: '', email: '', phone: '', notes: ''
    });
  };

  const getFilteredContacts = () => {
    return contacts.filter(contact => {
      const searchMatch = searchTerm === '' || 
        `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (contact.title && contact.title.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const accountMatch = filterAccount === '' || contact.account_id === parseInt(filterAccount);
      
      return searchMatch && accountMatch;
    });
  };

  const getAccountName = (accountId) => {
    const account = accounts.find(a => a.id === accountId);
    return account ? account.name : 'Independent';
  };

  if (loading) {
    return <div className="loading">Loading contacts...</div>;
  }

  const filteredContacts = getFilteredContacts();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ color: '#1a202c' }}>Contacts</h2>
        <button 
          className="btn btn-primary"
          onClick={() => {
            setShowForm(!showForm);
          }}
        >
          {showForm ? 'Cancel' : 'Add Contact'}
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Search Contacts</label>
            <input
              type="text"
              placeholder="Search by name, email, or title..."
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
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Filter by Account</label>
            <select
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '8px', 
                border: '1px solid #ddd', 
                borderRadius: '4px' 
              }}
            >
              <option value="">All Accounts</option>
              <option value="0">Independent Contacts</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={() => {
            setSearchTerm('');
            setFilterAccount('');
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


      {/* Add/Edit Contact Form */}
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
            {editingContact ? 'Edit Contact' : 'Add New Contact'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>First Name *</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="e.g. John"
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px' 
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Last Name *</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="e.g. Smith"
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px' 
                  }}
                />
              </div>

              <div className="form-group">
                <label>Account</label>
                <select
                  value={formData.account_id}
                  onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                >
                  <option value="">Independent Contact</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>{account.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Job Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. CEO, Manager, Director"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this contact..."
                rows="3"
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
                {editingContact ? 'Update Contact' : 'Create Contact'}
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

      {/* Contacts Display */}
      <div className="card">
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ color: '#374151' }}>
            {filteredContacts.length} Contact{filteredContacts.length !== 1 ? 's' : ''}
            {(searchTerm || filterAccount) && ` (filtered from ${contacts.length})`}
          </h3>
        </div>

        {filteredContacts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            {searchTerm || filterAccount ? 'No contacts match your filters.' : 'No contacts yet. Click "Add Contact" to create your first contact.'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginTop: '20px' }}>
            {filteredContacts.map(contact => (
              <div key={contact.id} style={{ 
                backgroundColor: 'white', 
                padding: '20px', 
                borderRadius: '8px', 
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
                border: '1px solid #e5e7eb' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <h4 
                    style={{ 
                      color: '#374151', 
                      margin: '0', 
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                    onClick={() => handleEdit(contact)}
                  >
                    {contact.first_name} {contact.last_name}
                  </h4>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleEdit(contact)}
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
                      onClick={() => handleDelete(contact.id)}
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

                <div style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: '1.5' }}>
                  <div style={{ marginBottom: '6px' }}>
                    <strong>Account:</strong> {getAccountName(contact.account_id)}
                  </div>
                  
                  {contact.title && (
                    <div style={{ marginBottom: '6px' }}>
                      <strong>Title:</strong> {contact.title}
                    </div>
                  )}
                  
                  {contact.email && (
                    <div style={{ marginBottom: '6px' }}>
                      <strong>Email:</strong> 
                      <a href={`mailto:${contact.email}`} style={{ marginLeft: '8px', color: '#667eea' }}>
                        {contact.email}
                      </a>
                    </div>
                  )}
                  
                  {contact.phone && (
                    <div style={{ marginBottom: '6px' }}>
                      <strong>Phone:</strong> 
                      <a href={`tel:${contact.phone}`} style={{ marginLeft: '8px', color: '#667eea' }}>
                        {contact.phone}
                      </a>
                    </div>
                  )}
                  
                  {contact.notes && (
                    <div style={{ marginTop: '10px', padding: '8px', background: '#f8fafc', borderRadius: '4px', fontSize: '0.85rem' }}>
                      {contact.notes}
                    </div>
                  )}
                  
                  <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#9ca3af' }}>
                    Added: {new Date(contact.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Contacts;