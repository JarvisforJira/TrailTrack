import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [sizeFilter, setSizeFilter] = useState('');
  const [formData, setFormData] = useState({
    name: '', website: '', industry: '', size: '', phone: '', email: '',
    street: '', city: '', state: '', postal_code: '', country: '', notes: ''
  });
  const { token } = useAuth();

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    let filtered = accounts;

    if (searchTerm) {
      filtered = filtered.filter(account =>
        account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (industryFilter) {
      filtered = filtered.filter(account => account.industry === industryFilter);
    }

    if (sizeFilter) {
      filtered = filtered.filter(account => account.size === sizeFilter);
    }

    setFilteredAccounts(filtered);
  }, [accounts, searchTerm, industryFilter, sizeFilter]);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('http://localhost:8001/accounts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched accounts:', data);
        setAccounts(data);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Please enter a company name');
      return;
    }

    try {
      const url = editingAccount 
        ? `http://localhost:8001/accounts/${editingAccount.id}`
        : 'http://localhost:8001/accounts';
      
      const method = editingAccount ? 'PATCH' : 'POST';
      
      console.log(`${method} request to:`, url);
      console.log('Account data:', formData);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        resetForm();
        fetchAccounts();
        alert('Account saved successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error saving account: ${JSON.stringify(errorData.detail || errorData)}`);
      }
    } catch (error) {
      console.error('Error saving account:', error);
      alert('An unexpected error occurred while saving the account.');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingAccount(null);
    setFormData({
      name: '', website: '', industry: '', size: '', phone: '', email: '',
      street: '', city: '', state: '', postal_code: '', country: '', notes: ''
    });
  };

  const handleEdit = (account) => {
    console.log('Editing account:', account);
    setEditingAccount(account);
    setFormData({
      name: account.name || '',
      website: account.website || '',
      industry: account.industry || '',
      size: account.size || '',
      phone: account.phone || '',
      email: account.email || '',
      street: account.street || '',
      city: account.city || '',
      state: account.state || '',
      postal_code: account.postal_code || '',
      country: account.country || '',
      notes: account.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (account) => {
    if (window.confirm(`Are you sure you want to delete "${account.name}"?`)) {
      try {
        const response = await fetch(`http://localhost:8001/accounts/${account.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          fetchAccounts();
          alert('Account deleted successfully!');
        } else {
          alert('Error deleting account');
        }
      } catch (error) {
        console.error('Error deleting account:', error);
        alert('An unexpected error occurred while deleting the account.');
      }
    }
  };

  const getUniqueValues = (key) => {
    return [...new Set(accounts.map(account => account[key]).filter(Boolean))].sort();
  };

  if (loading) {
    return <div className="loading">Loading accounts...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ color: '#1a202c' }}>Accounts</h2>
        <button 
          className="btn btn-primary"
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
        >
          {showForm ? 'Cancel' : 'Add Account'}
        </button>
      </div>

      {/* Search and Filter Controls */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '2fr 1fr 1fr', 
        gap: '15px', 
        marginBottom: '20px',
        padding: '20px',
        background: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>
            Search Accounts
          </label>
          <input
            type="text"
            placeholder="Search by name, industry, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '8px 12px', 
              border: '1px solid #d1d5db', 
              borderRadius: '6px',
              fontSize: '0.9rem'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>
            Filter by Industry
          </label>
          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '8px 12px', 
              border: '1px solid #d1d5db', 
              borderRadius: '6px',
              fontSize: '0.9rem'
            }}
          >
            <option value="">All Industries</option>
            {getUniqueValues('industry').map(industry => (
              <option key={industry} value={industry}>{industry}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>
            Filter by Size
          </label>
          <select
            value={sizeFilter}
            onChange={(e) => setSizeFilter(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '8px 12px', 
              border: '1px solid #d1d5db', 
              borderRadius: '6px',
              fontSize: '0.9rem'
            }}
          >
            <option value="">All Sizes</option>
            {getUniqueValues('size').map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
      </div>


      {/* Results Summary */}
      <div style={{ marginBottom: '20px', color: '#64748b', fontSize: '0.9rem' }}>
        Showing {filteredAccounts.length} of {accounts.length} accounts
        {searchTerm && ` matching "${searchTerm}"`}
        {industryFilter && ` in ${industryFilter}`}
        {sizeFilter && ` (${sizeFilter})`}
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '20px', color: '#374151' }}>
            {editingAccount ? 'Edit Account' : 'Add New Account'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Company Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Acme Corporation"
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px' 
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px' 
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Industry</label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  placeholder="e.g. Technology, Healthcare"
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px' 
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Company Size</label>
                <select
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px' 
                  }}
                >
                  <option value="">Select Size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-1000">201-1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px' 
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@company.com"
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px' 
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Street Address</label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  placeholder="123 Main Street"
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px' 
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="San Francisco"
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px' 
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="CA"
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px' 
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Postal Code</label>
                <input
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  placeholder="94105"
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px' 
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="United States"
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px' 
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this account..."
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
              />
            </div>

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
              {editingAccount ? 'Update Account' : 'Create Account'}
            </button>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginTop: '20px' }}>
        {filteredAccounts.map(account => (
          <div key={account.id} style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
            border: '1px solid #e5e7eb' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#374151' }}>{account.name}</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleEdit(account)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.8rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(account)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.8rem',
                    backgroundColor: '#ef4444',
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
            
            {account.website && (
              <p style={{ marginBottom: '8px' }}>
                <strong>Website:</strong> 
                <a href={account.website} target="_blank" rel="noopener noreferrer" style={{ marginLeft: '8px', color: '#667eea' }}>
                  {account.website}
                </a>
              </p>
            )}
            
            {account.industry && (
              <p style={{ marginBottom: '8px' }}>
                <strong>Industry:</strong> {account.industry}
              </p>
            )}
            
            {account.size && (
              <p style={{ marginBottom: '8px' }}>
                <strong>Size:</strong> {account.size}
              </p>
            )}
            
            {account.phone && (
              <p style={{ marginBottom: '8px' }}>
                <strong>Phone:</strong> {account.phone}
              </p>
            )}
            
            {account.email && (
              <p style={{ marginBottom: '8px' }}>
                <strong>Email:</strong> {account.email}
              </p>
            )}
            
            {(account.street || account.city || account.state) && (
              <p style={{ marginBottom: '8px' }}>
                <strong>Address:</strong> 
                {[account.street, account.city, account.state, account.postal_code]
                  .filter(Boolean)
                  .join(', ')
                }
              </p>
            )}
            
            {account.notes && (
              <p style={{ marginTop: '15px', padding: '10px', background: '#f8fafc', borderRadius: '6px', fontSize: '0.9rem' }}>
                {account.notes}
              </p>
            )}
            
            <div style={{ marginTop: '15px', fontSize: '0.85rem', color: '#64748b' }}>
              Added: {new Date(account.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

      {filteredAccounts.length === 0 && accounts.length > 0 && (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '40px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
          border: '1px solid #e5e7eb',
          textAlign: 'center' 
        }}>
          <div style={{ color: '#64748b' }}>
            No accounts match your search criteria. Try adjusting your filters.
          </div>
        </div>
      )}

      {accounts.length === 0 && (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '40px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
          border: '1px solid #e5e7eb',
          textAlign: 'center' 
        }}>
          <div style={{ color: '#64748b' }}>
            No accounts yet. Click "Add Account" to create your first account.
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounts;
