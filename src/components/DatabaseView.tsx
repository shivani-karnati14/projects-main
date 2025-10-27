import { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';

interface Customer {
  id: string;
  image: string;
  name: string;
  phone: string;
  company: string;
  email: string;
  address: string;
  title: string;
}

function DatabaseView({
  toggleNavbar,
  setIsSidePanelOpen,
}: {
  toggleNavbar: () => void;
  setIsSidePanelOpen: (isOpen: boolean) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'inactive'>('all');
  const [selected, setSelected] = useState<Customer | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 9;
  const [scannedCards, setScannedCards] = useState<Customer[]>([]);
  const [scannedLoading, setScannedLoading] = useState(false);
  const [scannedError, setScannedError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // Add loading state

  useEffect(() => {
    const controller = new AbortController();
    const fetchScanned = async () => {
      setScannedLoading(true);
      setScannedError(null);
      try {
        const res = await fetch('http://localhost:8000/scanned-cards', { signal: controller.signal });
        if (!res.ok) throw new Error(`Server responded ${res.status}`);
        const data = await res.json();
        console.log('Fetched scanned cards:', data.data);
        setScannedCards(Array.isArray(data.data) ? data.data : [data.data]);
      } catch (err: any) {
        if (err.name !== 'AbortError') setScannedError(err.message || 'Failed to fetch scanned cards');
      } finally {
        setScannedLoading(false);
        setLoading(false); // Set loading to false once data is fetched
      }
    };

    fetchScanned();
    return () => controller.abort();
  }, []);

  // Filter data based on search query and filter type
  const filteredData = useMemo(() => {
  const q = searchQuery.trim().toLowerCase();
  return scannedCards.filter((c) => {
    const matchesSearch =
      q === '' ||
      (c.name?.toLowerCase().includes(q) || '') ||
      (c.company?.toLowerCase().includes(q) || '') ||
      (c.email?.toLowerCase().includes(q) || '');
    const matchesFilter =
      filterType === 'all' ||
      (filterType === 'active' && c.status === 'active') ||
      (filterType === 'inactive' && c.status === 'inactive');
    return matchesSearch && matchesFilter;
  });
  }, [searchQuery, filterType, scannedCards]);

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(start + pageSize - 1, filteredData.length);

  const visibleRows = filteredData.slice(start - 1, end);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1);

  const handleRowClick = (customer: Customer) => {
    setSelected(customer);
    setIsSidePanelOpen(true); // Open side panel
    toggleNavbar(); // Collapse navbar
  };

  const closeSidePanel = () => {
    setSelected(null);
    setIsSidePanelOpen(false); // Close side panel
  };

  return (
    <div className="flex h-full bg-slate-900 text-slate-200">
      {loading ? (
        <div className="flex items-center justify-center w-full h-full">
          <p className="text-slate-400 text-lg">Loading data...</p>
        </div>
      ) : (
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header card with search, filters and add button */}
            <div className="flex items-center justify-between bg-slate-800/70 backdrop-blur-2xl rounded-3xl p-4 border border-slate-700/50 shadow-lg">
              <div className="flex items-center gap-4 w-full">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    className="w-full pl-12 pr-4 py-3 bg-slate-700/50 rounded-2xl border border-slate-600/50 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                    placeholder="Search customers..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>

                <div className="hidden sm:flex gap-2">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-4 py-2 rounded-2xl font-medium text-sm border ${filterType === 'all' ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow' : 'bg-slate-700/50 text-slate-300 border-slate-600/50'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterType('active')}
                    className={`px-4 py-2 rounded-2xl font-medium text-sm border ${filterType === 'active' ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow' : 'bg-slate-700/50 text-slate-300 border-slate-600/50'}`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setFilterType('inactive')}
                    className={`px-4 py-2 rounded-2xl font-medium text-sm border ${filterType === 'inactive' ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow' : 'bg-slate-700/50 text-slate-300 border-slate-600/50'}`}
                  >
                    Inactive
                  </button>
                </div>
              </div>

              <div className="ml-4">
                <button className="px-4 py-2 rounded-2xl bg-violet-500 text-white font-semibold shadow hover:opacity-95">+</button>
              </div>
            </div>

            {/* Table Card */}
            <div className="bg-slate-800/70 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden">
              {scannedLoading ? (
                <div className="p-6 text-center text-slate-400">Loading...</div>
              ) : scannedError ? (
                <div className="p-6 text-center text-red-400">{scannedError}</div>
              ) : filteredData.length === 0 ? (
                <div className="p-6 text-center text-slate-400">No results found.</div>
              ) : (
                <table className="w-full table-auto min-w-[640px]">
                  <thead className="text-slate-400 text-sm">
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left py-3 px-6">Name</th>
                      <th className="text-left py-3 px-6">Company</th>
                      <th className="text-left py-3 px-6">Email</th>
                      <th className="text-left py-3 px-6">Phone</th>
                      <th className="text-left py-3 px-6">Title</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => handleRowClick(c)}
                        className="cursor-pointer hover:bg-violet-600/10 transition-colors"
                      >
                        <td className="py-4 px-6">{c.name}</td>
                        <td className="py-4 px-6">{c.company}</td>
                        <td className="py-4 px-6">{c.email}</td>
                        <td className="py-4 px-6">{c.phone}</td>
                        <td className="py-4 px-6">{c.title}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-700/50 bg-slate-800/60">
              <div className="text-sm text-slate-400">
                {start}-{end} of {filteredData.length} results
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  className="px-3 py-1 rounded-md bg-slate-700/50 text-slate-200 hover:bg-slate-700"
                >
                  ‹
                </button>
                {pages.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-md ${p === page ? 'bg-violet-500 text-white' : 'bg-slate-700/50 text-slate-200'}`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  className="px-3 py-1 rounded-md bg-slate-700/50 text-slate-200 hover:bg-slate-700"
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Side panel */}
      {selected && (
        <div className="w-96 border-l border-slate-700/50 bg-gradient-to-b from-slate-900/80 to-slate-900/70 p-6 relative">
          {/* Close Button */}
          <button
            onClick={closeSidePanel}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            aria-label="Close"
          >
            ✕
          </button>

          {/* Header Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-100">{selected.name}</h2>
            <p className="text-sm text-slate-400">{selected.title}</p>
          </div>

          {/* Uploaded Files Section */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-300 mb-2">Uploaded Files</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 bg-slate-800/60 p-3 rounded-lg">
                <img
                  src={selected.image}
                  alt={selected.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="text-sm text-slate-200 truncate">{selected.image}</p>
                </div>
                <button
                  className="text-slate-400 hover:text-red-400"
                  aria-label="Remove file"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-300 mb-2">Contact Information</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Email:</span>
                <span className="text-sm text-slate-200">{selected.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Phone:</span>
                <span className="text-sm text-slate-200">{selected.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Company:</span>
                <span className="text-sm text-slate-200">{selected.company}</span>
              </div>
            </div>
          </div>

          {/* Edit Button */}
          <button
            onClick={() => console.log('Edit user')}
            className="w-full px-4 py-2 rounded-lg bg-violet-500 text-white font-medium hover:bg-violet-600"
          >
            Edit User
          </button>

          {/* Danger Zone Section */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-red-400 mb-2">Danger Zone</h3>
            <button
              onClick={() => console.log('Delete user')}
              className="w-full px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600"
            >
              Delete User
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DatabaseView;