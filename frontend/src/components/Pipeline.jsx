import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const Pipeline = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  const stages = ['New', 'Qualified', 'Proposal', 'Negotiation', 'Closed-Won', 'Closed-Lost'];

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await fetch('http://localhost:8001/leads', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLeads(data);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateLeadStage = async (leadId, newStage) => {
    try {
      const response = await fetch(`http://localhost:8001/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          stage: newStage
        })
      });
      
      if (response.ok) {
        fetchLeads(); // Refresh leads
      } else {
        const errorData = await response.json();
        console.error('Error updating lead stage:', errorData);
      }
    } catch (error) {
      console.error('Error updating lead stage:', error);
    }
  };

  const getLeadsByStage = (stage) => {
    return leads.filter(lead => lead.stage === stage);
  };

  const formatCurrency = (cents) => {
    return `$${(cents / 100).toLocaleString()}`;
  };

  const getBadgeClass = (stage) => {
    const badgeMap = {
      'New': 'badge-new',
      'Qualified': 'badge-qualified',
      'Proposal': 'badge-proposal',
      'Negotiation': 'badge-negotiation',
      'Closed-Won': 'badge-won',
      'Closed-Lost': 'badge-lost'
    };
    return badgeMap[stage] || 'badge-new';
  };

  if (loading) {
    return <div className="loading">Loading pipeline...</div>;
  }

  return (
    <div>
      <h2 style={{ marginBottom: '30px', color: '#1a202c' }}>Sales Pipeline</h2>

      <div className="kanban">
        {stages.map(stage => {
          const stageLeads = getLeadsByStage(stage);
          const stageValue = stageLeads.reduce((sum, lead) => sum + lead.value_cents, 0);

          return (
            <div key={stage} className="kanban-column">
              <div className="kanban-header">
                {stage} ({stageLeads.length})
                <div style={{ fontSize: '0.9rem', fontWeight: 'normal', color: '#64748b' }}>
                  {formatCurrency(stageValue)}
                </div>
              </div>

              {stageLeads.map(lead => (
                <div key={lead.id} className="kanban-card">
                  <h4>{lead.title}</h4>
                  <div className="meta">
                    Value: {formatCurrency(lead.value_cents)}
                  </div>
                  <div className="meta">
                    Probability: {lead.probability}%
                  </div>
                  {lead.expected_close_date && (
                    <div className="meta">
                      Close: {new Date(lead.expected_close_date).toLocaleDateString()}
                    </div>
                  )}
                  <div style={{ marginTop: '10px' }}>
                    <span className={`badge ${getBadgeClass(lead.stage)}`}>
                      {lead.stage}
                    </span>
                  </div>
                  
                  <div style={{ marginTop: '10px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {stages.map(newStage => (
                      newStage !== lead.stage && (
                        <button
                          key={newStage}
                          onClick={() => updateLeadStage(lead.id, newStage)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.8rem',
                            border: '1px solid #e2e8f0',
                            background: 'white',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          → {newStage}
                        </button>
                      )
                    ))}
                  </div>
                </div>
              ))}

              {stageLeads.length === 0 && (
                <div style={{ 
                  color: '#64748b', 
                  textAlign: 'center', 
                  padding: '20px',
                  fontStyle: 'italic'
                }}>
                  No leads in this stage
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Pipeline;
