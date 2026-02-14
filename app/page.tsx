"use client";

import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, Trash2, Edit2, Check, X, RefreshCw } from 'lucide-react';

const API_BASE_URL = 'https://rabbit-epcrhpbjczbxcwas.southindia-01.azurewebsites.net/api/quotes';

type QuoteId = string;

interface Quote {
  id: string;
  name: string;
  phone: string;
  email: string;
  service: string;
  message: string;
  created_at: string;
  marked: boolean;
}

// Helper function to format date consistently
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

export default function QuoteAdminDashboard() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([]);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchBy, setSearchBy] = useState('name');
  const [filterStatus, setFilterStatus] = useState('not_marked');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Quote | null>(null);

  // Fetch all quotes from API
  const fetchQuotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(API_BASE_URL);
      
      if (!response.ok) {
        throw new Error('Failed to fetch quotes');
      }
      
      const result = await response.json();
      setQuotes(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching quotes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchQuotes();
  }, []);

  // Filter and search logic
  useEffect(() => {
    let filtered = quotes;

    // Apply status filter
    if (filterStatus === 'marked') {
      filtered = filtered.filter(q => q.marked === true);
    } else if (filterStatus === 'not_marked') {
      filtered = filtered.filter(q => q.marked === false);
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(quote => {
        const value = quote[searchBy as keyof Quote]?.toString().toLowerCase() || '';
        if (searchBy === 'created_at') {
          const date = formatDate(quote.created_at);
          return date.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return value.includes(searchTerm.toLowerCase());
      });
    }

    setFilteredQuotes(filtered);
  }, [quotes, searchTerm, searchBy, filterStatus]);

  const handleMarkToggle = async (id: QuoteId) => {
    try {
      const quote = quotes.find(q => q.id === id);
      if (!quote) return;

      const response = await fetch(`${API_BASE_URL}/${id}/marked`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ marked: !quote.marked }),
      });

      if (!response.ok) {
        throw new Error('Failed to update marked status');
      }

      const result = await response.json();
      
      // Update local state
      setQuotes(quotes.map(q =>
        q.id === id ? result.data : q
      ));
      
      // Close the detail panel after marking
      setSelectedQuote(null);
    } catch (err) {
      console.error('Error toggling marked status:', err);
      alert('Failed to update marked status. Please try again.');
    }
  };

  const handleDelete = async (id: QuoteId) => {
    if (!window.confirm('Are you sure you want to delete this quote?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete quote');
      }

      // Update local state
      setQuotes(quotes.filter(q => q.id !== id));
      
      if (selectedQuote?.id === id) {
        setSelectedQuote(null);
      }
    } catch (err) {
      console.error('Error deleting quote:', err);
      alert('Failed to delete quote. Please try again.');
    }
  };

  const handleEdit = (quote: Quote) => {
    setEditData({ ...quote });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editData) return;

    try {
      const response = await fetch(`${API_BASE_URL}/${editData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editData.name,
          phone: editData.phone,
          email: editData.email,
          service: editData.service,
          message: editData.message,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update quote');
      }

      const result = await response.json();
      
      // Update local state
      setQuotes(quotes.map(q => 
        q.id === editData.id ? result.data : q
      ));
      
      setSelectedQuote(result.data);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating quote:', err);
      alert('Failed to update quote. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData(null);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Quote Requests Dashboard</h1>
              <p className="text-gray-600">Manage and track all quote requests from your website</p>
            </div>
            <button
              onClick={fetchQuotes}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p className="font-medium">Error: {error}</p>
            <button
              onClick={fetchQuotes}
              className="text-sm underline mt-1"
            >
              Try again
            </button>
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={`Search by ${searchBy}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* Search By Dropdown */}
              <select
                value={searchBy}
                onChange={(e) => setSearchBy(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="name">Name</option>
                <option value="phone">Phone</option>
                <option value="email">Email</option>
                <option value="service">Service</option>
                <option value="message">Message</option>
                <option value="created_at">Date</option>
              </select>
            </div>

            {/* Filter Status */}
            <div className="flex gap-2 items-center">
              <Filter className="text-gray-400 w-5 h-5" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="not_marked">Not Marked</option>
                <option value="marked">Marked as Seen</option>
                <option value="all">All</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredQuotes.length} of {quotes.length} quotes
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Quotes List */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quote Requests</h2>
            
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="text-center py-12 text-gray-500">
                  <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
                  <p>Loading quotes...</p>
                </div>
              ) : filteredQuotes.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No quotes found matching your criteria
                </div>
              ) : (
                filteredQuotes.map(quote => (
                  <div
                    key={quote.id}
                    onClick={() => setSelectedQuote(quote)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedQuote?.id === quote.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{quote.name}</h3>
                        <p className="text-sm text-gray-600">{quote.email}</p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        quote.marked 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {quote.marked ? 'Seen' : 'New'}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-2 line-clamp-2">{quote.service}</p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{formatDate(quote.created_at)}</span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        View Details
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quote Details Panel */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            {!selectedQuote ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Eye className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Select a quote to view details</p>
                </div>
              </div>
            ) : isEditing ? (
              // Edit Mode
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Edit Quote</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={editData?.name || ''}
                      onChange={(e) => setEditData(editData ? { ...editData, name: e.target.value } : null)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="text"
                      value={editData?.phone || ''}
                      onChange={(e) => setEditData(editData ? { ...editData, phone: e.target.value } : null)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={editData?.email || ''}
                      onChange={(e) => setEditData(editData ? { ...editData, email: e.target.value } : null)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                    <input
                      type="text"
                      value={editData?.service || ''}
                      onChange={(e) => setEditData(editData ? { ...editData, service: e.target.value } : null)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea
                      value={editData?.message || ''}
                      onChange={(e) => setEditData(editData ? { ...editData, message: e.target.value } : null)}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ) : (
              // View Mode
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Quote Details</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMarkToggle(selectedQuote.id)}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                        selectedQuote.marked
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      {selectedQuote.marked ? 'Mark as Unread' : 'Mark as Seen'}
                    </button>
                    <button
                      onClick={() => handleEdit(selectedQuote)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(selectedQuote.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Name</h3>
                    <p className="text-lg text-gray-900">{selectedQuote.name}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Phone</h3>
                    <p className="text-lg text-gray-900">{selectedQuote.phone}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                    <p className="text-lg text-gray-900">{selectedQuote.email}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Service</h3>
                    <p className="text-lg text-gray-900">{selectedQuote.service}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Message</h3>
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedQuote.message}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Received</h3>
                    <p className="text-gray-900">
                      {formatDateTime(selectedQuote.created_at)}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                    <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                      selectedQuote.marked 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedQuote.marked ? 'Marked as Seen' : 'Not Marked'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}