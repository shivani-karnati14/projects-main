import { useState } from 'react';
import { Database, Search, Filter, Calendar, User } from 'lucide-react';

interface DataEntry {
  id: string;
  type: string;
  content: string;
  timestamp: Date;
  status: 'active' | 'archived';
}

function DatabaseView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'chat' | 'file' | 'scan'>('all');

  const mockData: DataEntry[] = [
    {
      id: '1',
      type: 'chat',
      content: 'What are the services offered?',
      timestamp: new Date('2025-10-09T14:30:00'),
      status: 'active',
    },
    {
      id: '2',
      type: 'file',
      content: 'document.json',
      timestamp: new Date('2025-10-09T15:45:00'),
      status: 'active',
    },
    {
      id: '3',
      type: 'scan',
      content: 'QR Code: https://example.com',
      timestamp: new Date('2025-10-10T10:15:00'),
      status: 'active',
    },
  ];

  const filteredData = mockData.filter((entry) => {
    const matchesSearch = entry.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || entry.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'chat':
        return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
      case 'file':
        return 'bg-green-500/20 text-green-300 border-green-400/30';
      case 'scan':
        return 'bg-orange-500/20 text-orange-300 border-orange-400/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-400/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'chat':
        return '💬';
      case 'file':
        return '📄';
      case 'scan':
        return '📷';
      default:
        return '📦';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 relative overflow-hidden">
      {/* Dark glassmorphism background elements */}
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-3xl"></div>
      <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-indigo-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-r from-pink-500/10 to-rose-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      {/* Header */}
      <div className="relative z-10 bg-slate-800/80 backdrop-blur-xl border-b border-slate-700/50 px-6 py-4 shadow-lg">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Database & Analysis</h2>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Search and Filter Bar */}
          <div className="bg-slate-800/70 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-700/50 p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search database..."
                  className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border-2 border-slate-600/50 rounded-2xl focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/20 outline-none transition-all text-slate-200 placeholder-slate-400 backdrop-blur-sm"
                />
              </div>

              {/* Filter */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-6 py-4 rounded-2xl font-semibold transition-all backdrop-blur-sm border ${
                    filterType === 'all'
                      ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg border-violet-400/50'
                      : 'bg-slate-700/50 text-slate-300 border-slate-600/50 hover:bg-slate-600/50'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType('chat')}
                  className={`px-6 py-4 rounded-2xl font-semibold transition-all backdrop-blur-sm border ${
                    filterType === 'chat'
                      ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg border-violet-400/50'
                      : 'bg-slate-700/50 text-slate-300 border-slate-600/50 hover:bg-slate-600/50'
                  }`}
                >
                  Chats
                </button>
                <button
                  onClick={() => setFilterType('file')}
                  className={`px-6 py-4 rounded-2xl font-semibold transition-all backdrop-blur-sm border ${
                    filterType === 'file'
                      ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg border-violet-400/50'
                      : 'bg-slate-700/50 text-slate-300 border-slate-600/50 hover:bg-slate-600/50'
                  }`}
                >
                  Files
                </button>
                <button
                  onClick={() => setFilterType('scan')}
                  className={`px-6 py-4 rounded-2xl font-semibold transition-all backdrop-blur-sm border ${
                    filterType === 'scan'
                      ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg border-violet-400/50'
                      : 'bg-slate-700/50 text-slate-300 border-slate-600/50 hover:bg-slate-600/50'
                  }`}
                >
                  Scans
                </button>
              </div>
            </div>
          </div>

          {/* Data Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredData.length > 0 ? (
              filteredData.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-slate-800/70 backdrop-blur-2xl rounded-3xl shadow-2xl hover:shadow-purple-500/10 border border-slate-700/50 p-6 transition-all hover:-translate-y-2 hover:bg-slate-800/80"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{getTypeIcon(entry.type)}</span>
                      <span
                        className={`px-4 py-2 rounded-full text-xs font-bold uppercase backdrop-blur-sm border ${getTypeColor(
                          entry.type
                        )}`}
                      >
                        {entry.type}
                      </span>
                    </div>
                    <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-semibold backdrop-blur-sm border border-green-400/30">
                      {entry.status}
                    </span>
                  </div>

                  <p className="text-slate-200 font-semibold mb-4 line-clamp-2 text-lg">
                    {entry.content}
                  </p>

                  <div className="flex items-center gap-6 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{entry.timestamp.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{entry.timestamp.toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 bg-slate-800/70 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-700/50 p-12">
                <div className="text-center">
                  <div className="inline-block p-8 bg-slate-700/50 rounded-full mb-6 backdrop-blur-sm border border-slate-600/50">
                    <Database className="w-16 h-16 text-slate-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-200 mb-3">
                    No data found
                  </h3>
                  <p className="text-slate-400 text-lg">
                    {searchQuery || filterType !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Start chatting, uploading files, or scanning to see data here'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DatabaseView;