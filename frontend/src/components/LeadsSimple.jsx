import React, { useState } from 'react';

const LeadsSimple = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Simple Leads Test</h1>
      
      <div style={{ margin: '20px 0' }}>
        <button 
          onClick={() => {
            console.log('SIMPLE: Button clicked, showForm was:', showForm);
            setShowForm(!showForm);
            console.log('SIMPLE: Button clicked, showForm now:', !showForm);
          }}
          style={{ 
            padding: '10px 20px', 
            background: '#007bff', 
            color: 'white', 
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {showForm ? 'Hide Form' : 'Show Form'}
        </button>
      </div>

      <div style={{ 
        padding: '10px', 
        background: showForm ? '#d4edda' : '#f8d7da',
        border: `2px solid ${showForm ? '#28a745' : '#dc3545'}`,
        borderRadius: '4px',
        margin: '10px 0'
      }}>
        <strong>Debug: showForm = {showForm.toString()}</strong>
      </div>

      {showForm ? (
        <div style={{ 
          padding: '20px', 
          background: '#e8f5e8', 
          border: '2px solid #28a745',
          borderRadius: '4px'
        }}>
          <h3>✅ FORM IS VISIBLE!</h3>
          <p>This form is showing because showForm = {showForm.toString()}</p>
          <form>
            <div style={{ marginBottom: '15px' }}>
              <label>Lead Title:</label>
              <input 
                type="text" 
                placeholder="Enter lead title"
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  marginTop: '5px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </div>
            <button 
              type="button"
              style={{ 
                padding: '10px 20px', 
                background: '#28a745', 
                color: 'white', 
                border: 'none',
                borderRadius: '4px',
                marginRight: '10px'
              }}
            >
              Create Lead
            </button>
            <button 
              type="button"
              onClick={() => setShowForm(false)}
              style={{ 
                padding: '10px 20px', 
                background: '#6c757d', 
                color: 'white', 
                border: 'none',
                borderRadius: '4px'
              }}
            >
              Cancel
            </button>
          </form>
        </div>
      ) : (
        <div style={{ 
          padding: '20px', 
          background: '#f8d7da', 
          border: '2px solid #dc3545',
          borderRadius: '4px'
        }}>
          ❌ FORM IS HIDDEN
          <p>The form is hidden because showForm = {showForm.toString()}</p>
        </div>
      )}
    </div>
  );
};

export default LeadsSimple;
