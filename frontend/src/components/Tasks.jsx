import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [leads, setLeads] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    linked_type: 'lead',
    linked_id: '',
    due_at: '',
    priority: 'medium'
  });
  const [filterStatus, setFilterStatus] = useState('open');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterType, setFilterType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showStatPanel, setShowStatPanel] = useState(false);
  const [statFilter, setStatFilter] = useState('');
  const [statTitle, setStatTitle] = useState('');
  const { token } = useAuth();

  const priorities = [
    { value: 'low', label: 'Low', color: '#10b981', bgColor: '#d1fae5' },
    { value: 'medium', label: 'Medium', color: '#f59e0b', bgColor: '#fef3c7' },
    { value: 'high', label: 'High', color: '#ef4444', bgColor: '#fee2e2' }
  ];

  const linkedTypes = [
    { value: 'lead', label: 'Lead' },
    { value: 'account', label: 'Account' },
    { value: 'contact', label: 'Contact' }
  ];

  const statuses = [
    { value: 'open', label: 'Open', color: '#3b82f6' },
    { value: 'done', label: 'Completed', color: '#10b981' },
    { value: 'canceled', label: 'Cancelled', color: '#6b7280' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, leadsRes, accountsRes, contactsRes] = await Promise.all([
        fetch('http://localhost:8001/tasks', {
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

      if (tasksRes.ok) setTasks(await tasksRes.json());
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
      linked_id: parseInt(formData.linked_id),
      due_at: formData.due_at || null
    };

    try {
      const url = editingTask 
        ? `http://localhost:8001/tasks/${editingTask.id}`
        : 'http://localhost:8001/tasks';
      
      const method = editingTask ? 'PATCH' : 'POST';

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
      console.error('Error saving task:', error);
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title || '',
      linked_type: task.linked_type || 'lead',
      linked_id: task.linked_id || '',
      due_at: task.due_at ? new Date(task.due_at).toISOString().slice(0, 16) : '',
      priority: task.priority || 'medium'
    });
    setShowForm(true);
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:8001/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleDelete = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        const response = await fetch(`http://localhost:8001/tasks/${taskId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          fetchData();
        }
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingTask(null);
    setFormData({
      title: '', linked_type: 'lead', linked_id: '', due_at: '', priority: 'medium'
    });
  };

  const getFilteredTasks = () => {
    return tasks.filter(task => {
      const statusMatch = filterStatus === '' || task.status === filterStatus;
      const priorityMatch = filterPriority === '' || task.priority === filterPriority;
      const typeMatch = filterType === '' || task.linked_type === filterType;
      const searchMatch = searchTerm === '' || 
        task.title.toLowerCase().includes(searchTerm.toLowerCase());
      
      return statusMatch && priorityMatch && typeMatch && searchMatch;
    });
  };

  const getLinkedEntityName = (task) => {
    switch (task.linked_type) {
      case 'lead':
        const lead = leads.find(l => l.id === task.linked_id);
        return lead ? lead.title : `Lead #${task.linked_id}`;
      case 'account':
        const account = accounts.find(a => a.id === task.linked_id);
        return account ? account.name : `Account #${task.linked_id}`;
      case 'contact':
        const contact = contacts.find(c => c.id === task.linked_id);
        return contact ? `${contact.first_name} ${contact.last_name}` : `Contact #${task.linked_id}`;
      default:
        return 'Unknown';
    }
  };

  const getLinkedEntitiesForType = (type) => {
    switch (type) {
      case 'lead':
        return leads;
      case 'account':
        return accounts;
      case 'contact':
        return contacts;
      default:
        return [];
    }
  };

  const getPriorityStyle = (priority) => {
    const priorityObj = priorities.find(p => p.value === priority);
    return priorityObj ? { color: priorityObj.color, backgroundColor: priorityObj.bgColor } : {};
  };

  const getStatusStyle = (status) => {
    const statusObj = statuses.find(s => s.value === status);
    return statusObj ? { color: statusObj.color } : {};
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const formatDueDate = (dueDate) => {
    if (!dueDate) return 'No due date';
    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays === -1) return 'Due yesterday';
    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`;
    if (diffDays <= 7) return `Due in ${diffDays} days`;
    
    return date.toLocaleDateString();
  };

  const handleStatClick = (filterType, title) => {
    setStatFilter(filterType);
    setStatTitle(title);
    setShowStatPanel(true);
  };

  const getStatFilteredTasks = () => {
    switch (statFilter) {
      case 'open':
        return tasks.filter(t => t.status === 'open');
      case 'overdue':
        return tasks.filter(t => t.status === 'open' && isOverdue(t.due_at));
      case 'completed':
        return tasks.filter(t => t.status === 'done');
      default:
        return [];
    }
  };

  if (loading) {
    return <div className="loading">Loading tasks...</div>;
  }

  const filteredTasks = getFilteredTasks();
  const openTasks = filteredTasks.filter(t => t.status === 'open');
  const overdueTasks = openTasks.filter(t => isOverdue(t.due_at));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ color: '#1a202c' }}>Tasks</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Add Task'}
        </button>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
        <div 
          onClick={() => handleStatClick('open', 'Open Tasks')}
          style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
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
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>{openTasks.length}</div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '4px' }}>Open Tasks</div>
        </div>
        <div 
          onClick={() => handleStatClick('overdue', 'Overdue Tasks')}
          style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
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
          <div style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            color: overdueTasks.length > 0 ? '#ef4444' : '#10b981' 
          }}>
            {overdueTasks.length}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '4px' }}>Overdue</div>
        </div>
        <div 
          onClick={() => handleStatClick('completed', 'Completed Tasks')}
          style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
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
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
            {filteredTasks.filter(t => t.status === 'done').length}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '4px' }}>Completed</div>
        </div>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Search Tasks</label>
            <input
              type="text"
              placeholder="Search by title..."
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
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '8px', 
                border: '1px solid #ddd', 
                borderRadius: '4px' 
              }}
            >
              <option value="">All Status</option>
              {statuses.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '8px', 
                border: '1px solid #ddd', 
                borderRadius: '4px' 
              }}
            >
              <option value="">All Priorities</option>
              {priorities.map(priority => (
                <option key={priority.value} value={priority.value}>{priority.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Type</label>
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
              {linkedTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={() => {
            setSearchTerm('');
            setFilterStatus('open');
            setFilterPriority('');
            setFilterType('');
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

      {/* Add/Edit Task Form */}
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
            {editingTask ? 'Edit Task' : 'Add New Task'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Task Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="What needs to be done?"
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
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px' 
                  }}
                >
                  {priorities.map(priority => (
                    <option key={priority.value} value={priority.value}>{priority.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Due Date</label>
                <input
                  type="datetime-local"
                  value={formData.due_at}
                  onChange={(e) => setFormData({ ...formData, due_at: e.target.value })}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px' 
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Related To</label>
                <select
                  value={formData.linked_type}
                  onChange={(e) => setFormData({ ...formData, linked_type: e.target.value, linked_id: '' })}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px' 
                  }}
                >
                  {linkedTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Select {formData.linked_type.charAt(0).toUpperCase() + formData.linked_type.slice(1)} *</label>
                <select
                  value={formData.linked_id}
                  onChange={(e) => setFormData({ ...formData, linked_id: e.target.value })}
                  required
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px' 
                  }}
                >
                  <option value="">Select {formData.linked_type}...</option>
                  {getLinkedEntitiesForType(formData.linked_type).map(entity => (
                    <option key={entity.id} value={entity.id}>
                      {formData.linked_type === 'lead' ? entity.title :
                       formData.linked_type === 'account' ? entity.name :
                       `${entity.first_name} ${entity.last_name}`}
                    </option>
                  ))}
                </select>
              </div>
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
                {editingTask ? 'Update Task' : 'Create Task'}
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

      {/* Tasks Display */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
        border: '1px solid #e5e7eb' 
      }}>
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ color: '#374151' }}>
            {filteredTasks.length} Task{filteredTasks.length !== 1 ? 's' : ''}
            {(searchTerm || filterPriority || filterType || filterStatus !== 'open') && ` (filtered from ${tasks.length})`}
          </h3>
        </div>

        {filteredTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            {searchTerm || filterPriority || filterType || filterStatus !== 'open'
              ? 'No tasks match your filters.' 
              : 'No tasks yet. Click "Add Task" to create your first task.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredTasks
              .sort((a, b) => {
                // Sort by due date, then by priority
                if (a.due_at && b.due_at) {
                  return new Date(a.due_at) - new Date(b.due_at);
                }
                if (a.due_at && !b.due_at) return -1;
                if (!a.due_at && b.due_at) return 1;
                
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
              })
              .map(task => (
                <div 
                  key={task.id} 
                  style={{ 
                    backgroundColor: 'white', 
                    padding: '16px', 
                    borderRadius: '8px', 
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
                    border: '1px solid #e5e7eb',
                    borderLeft: `4px solid ${priorities.find(p => p.value === task.priority)?.color || '#6b7280'}`,
                    margin: '0',
                    opacity: task.status === 'done' ? 0.6 : 1
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <h4 style={{ 
                          color: '#374151', 
                          margin: '0',
                          textDecoration: task.status === 'done' ? 'line-through' : 'none'
                        }}>
                          {task.title}
                        </h4>
                        <span 
                          className="badge"
                          style={getPriorityStyle(task.priority)}
                        >
                          {task.priority}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '8px' }}>
                        <strong>Related to:</strong> {task.linked_type.charAt(0).toUpperCase() + task.linked_type.slice(1)} - {getLinkedEntityName(task)}
                      </div>

                      <div style={{ fontSize: '0.85rem', marginBottom: '8px' }}>
                        <span style={getStatusStyle(task.status)}>
                          <strong>{statuses.find(s => s.value === task.status)?.label}</strong>
                        </span>
                        {task.due_at && (
                          <span style={{ 
                            marginLeft: '12px',
                            color: isOverdue(task.due_at) ? '#ef4444' : '#64748b'
                          }}>
                            {formatDueDate(task.due_at)}
                            {isOverdue(task.due_at) && ' ⚠️'}
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                        Created: {new Date(task.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'end' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleEdit(task)}
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
                          onClick={() => handleDelete(task.id)}
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

                      {task.status !== 'done' && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => handleStatusChange(task.id, 'done')}
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.75rem',
                              background: '#d1fae5',
                              border: '1px solid #a7f3d0',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              color: '#065f46'
                            }}
                          >
                            ✓ Complete
                          </button>
                          <button
                            onClick={() => handleStatusChange(task.id, 'canceled')}
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.75rem',
                              background: '#f3f4f6',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              color: '#374151'
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      {task.status === 'done' && (
                        <button
                          onClick={() => handleStatusChange(task.id, 'open')}
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            background: '#dbeafe',
                            border: '1px solid #93c5fd',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            color: '#1e40af'
                          }}
                        >
                          Reopen
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
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
              <strong>{getStatFilteredTasks().length}</strong> task{getStatFilteredTasks().length !== 1 ? 's' : ''}
            </div>

            {getStatFilteredTasks().length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px', 
                color: '#64748b' 
              }}>
                No {statFilter} tasks found.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {getStatFilteredTasks()
                  .sort((a, b) => {
                    // Sort by due date, then by priority
                    if (a.due_at && b.due_at) {
                      return new Date(a.due_at) - new Date(b.due_at);
                    }
                    if (a.due_at && !b.due_at) return -1;
                    if (!a.due_at && b.due_at) return 1;
                    
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                  })
                  .map(task => (
                    <div 
                      key={task.id} 
                      style={{ 
                        backgroundColor: 'white', 
                        padding: '16px', 
                        borderRadius: '8px', 
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
                        border: '1px solid #e5e7eb',
                        borderLeft: `4px solid ${priorities.find(p => p.value === task.priority)?.color || '#6b7280'}`,
                        margin: '0',
                        opacity: task.status === 'done' ? 0.6 : 1
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <h4 style={{ 
                              color: '#374151', 
                              margin: '0',
                              textDecoration: task.status === 'done' ? 'line-through' : 'none'
                            }}>
                              {task.title}
                            </h4>
                            <span 
                              style={{
                                ...getPriorityStyle(task.priority),
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: '500'
                              }}
                            >
                              {priorities.find(p => p.value === task.priority)?.label}
                            </span>
                            {task.status && (
                              <span 
                                style={{
                                  ...getStatusStyle(task.status),
                                  fontSize: '0.75rem',
                                  fontWeight: '500'
                                }}
                              >
                                {statuses.find(s => s.value === task.status)?.label}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '8px' }}>
                            {getLinkedEntityName(task)} • {formatDueDate(task.due_at)}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => {
                              handleEdit(task);
                              setShowStatPanel(false);
                            }}
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
                            onClick={() => {
                              handleDelete(task.id);
                              setShowStatPanel(false);
                            }}
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
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;