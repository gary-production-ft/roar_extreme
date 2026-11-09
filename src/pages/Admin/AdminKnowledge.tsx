import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  X,
  FileText,
  Save,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../config/api';

interface KnowledgeDoc {
  _id: string;
  title: string;
  category: string;
  content: string;
  sourceUrl?: string;
  verificationStatus: 'verified' | 'unverified' | 'pending';
  isActive: boolean;
  updatedBy?: string;
  lastVerifiedAt?: string;
}

export const AdminKnowledge: React.FC = () => {
  const { token } = useAuth();
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'services',
    content: '',
    sourceUrl: '',
    verificationStatus: 'verified' as 'verified' | 'unverified' | 'pending',
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchKnowledge = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(apiUrl('/api/knowledge'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setDocs(data.documents || []);
      }
    } catch (err) {
      console.error('Error fetching knowledge:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledge();
  }, [token]);

  const handleOpenCreateModal = () => {
    setEditingDocId(null);
    setFormData({
      title: '',
      category: 'services',
      content: '',
      sourceUrl: '',
      verificationStatus: 'verified',
      isActive: true,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (doc: KnowledgeDoc) => {
    setEditingDocId(doc._id);
    setFormData({
      title: doc.title,
      category: doc.category,
      content: doc.content,
      sourceUrl: doc.sourceUrl || '',
      verificationStatus: doc.verificationStatus,
      isActive: doc.isActive !== false,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      const res = await fetch(apiUrl(`/api/knowledge/${id}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setDocs((prev) => prev.filter((d) => d._id !== id));
      }
    } catch (err) {
      console.error('Failed to delete knowledge document:', err);
    }
  };

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError(null);

    try {
      const url = editingDocId ? `/api/knowledge/${editingDocId}` : '/api/knowledge';
      const method = editingDocId ? 'PATCH' : 'POST';

      const res = await fetch(apiUrl(url), {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsModalOpen(false);
        fetchKnowledge();
      } else {
        setModalError(data.message || 'Failed to save knowledge document');
      }
    } catch (err: any) {
      setModalError(err.message || 'Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDocs = docs.filter((doc) => {
    const matchesCategory = !categoryFilter || doc.category === categoryFilter;
    if (!matchesCategory) return false;

    if (!search) return true;
    const term = search.toLowerCase();
    return (
      doc.title.toLowerCase().includes(term) ||
      doc.content.toLowerCase().includes(term) ||
      doc.category.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-black text-2xl tracking-wider text-white uppercase">
            GROUNDED KNOWLEDGE BASE ({docs.length})
          </h1>
          <p className="text-xs text-white/50 font-mono mt-0.5">
            Verified facts directly informing ROAR AI responses
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchKnowledge}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF5A1F] hover:bg-[#FF7545] text-black font-bold uppercase tracking-wider text-xs transition-colors cursor-pointer shadow-lg shadow-[#FF5A1F]/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Knowledge Item</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#111111] border border-white/10 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search verified facts by keyword or title..."
            className="w-full bg-[#181818] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF5A1F] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#181818] border border-white/10 rounded-xl px-3 py-2 text-xs text-white/80 focus:outline-none focus:border-[#FF5A1F] cursor-pointer"
          >
            <option value="">All Categories</option>
            <option value="services">Services & Training</option>
            <option value="location">Location & Rooftop</option>
            <option value="hours">Hours & Schedule</option>
            <option value="pricing">Pricing & Packages</option>
            <option value="free_session">Free Session Pass</option>
            <option value="amenities">Amenities & Gear</option>
            <option value="policy">Gym Policies</option>
            <option value="general">General Info</option>
          </select>
        </div>
      </div>

      {/* Knowledge Documents Grid */}
      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center text-white/40">
          <RefreshCw className="w-6 h-6 animate-spin text-[#FF5A1F] mb-2" />
          <span className="text-xs font-mono uppercase">Retrieving Grounded Fact Store...</span>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#111111] border border-white/10 text-white/40 text-xs">
          No knowledge documents found matching your filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => {
            const isVerified = doc.verificationStatus === 'verified';
            return (
              <div
                key={doc._id}
                className="p-5 rounded-2xl bg-[#111111] border border-white/10 flex flex-col justify-between hover:border-white/25 transition-all space-y-3"
              >
                <div>
                  {/* Category & Status */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-[#FF5A1F] bg-[#FF5A1F]/10 border border-[#FF5A1F]/20 px-2 py-0.5 rounded-full">
                      {doc.category}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                        isVerified
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                      }`}
                    >
                      {isVerified ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          Verified
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3" />
                          Pending Review
                        </>
                      )}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-heading font-bold text-base text-white tracking-wide">
                    {doc.title}
                  </h3>

                  {/* Content snippet */}
                  <p className="text-xs text-white/70 mt-2 leading-relaxed whitespace-pre-wrap line-clamp-4">
                    {doc.content}
                  </p>
                </div>

                {/* Footer metadata & Actions */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-white/40">
                  <span className="truncate max-w-[150px]">
                    {doc.sourceUrl ? `Source: ${doc.sourceUrl}` : 'Internal Official'}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(doc)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/80 hover:text-white transition-colors cursor-pointer"
                      title="Edit Fact"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc._id, doc.title)}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                      title="Delete Fact"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-[#121212] border border-white/15 rounded-2xl p-6 shadow-2xl text-white font-sans">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#FF5A1F]" />
                <h3 className="font-heading font-black text-base uppercase tracking-wider text-white">
                  {editingDocId ? 'Edit Knowledge Document' : 'Add New Knowledge Document'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-white/50 hover:text-white rounded-lg hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-400 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmitModal} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] uppercase font-mono text-white/60 mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Boxing Coach Qualifications"
                  className="w-full bg-[#181818] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#FF5A1F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase font-mono text-white/60 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-[#181818] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF5A1F] cursor-pointer"
                  >
                    <option value="services">Services & Training</option>
                    <option value="location">Location & Rooftop</option>
                    <option value="hours">Hours & Schedule</option>
                    <option value="pricing">Pricing & Packages</option>
                    <option value="free_session">Free Session Pass</option>
                    <option value="amenities">Amenities & Gear</option>
                    <option value="policy">Gym Policies</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-mono text-white/60 mb-1">
                    Verification
                  </label>
                  <select
                    value={formData.verificationStatus}
                    onChange={(e) => setFormData({ ...formData, verificationStatus: e.target.value as any })}
                    className="w-full bg-[#181818] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF5A1F] cursor-pointer"
                  >
                    <option value="verified">Verified Official</option>
                    <option value="pending">Pending Owner Signoff</option>
                    <option value="unverified">Unverified Draft</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase font-mono text-white/60 mb-1">
                  Fact Content (Instructions & Details)
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Provide precise details for the AI coach to cite..."
                  className="w-full bg-[#181818] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#FF5A1F] leading-relaxed resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase font-mono text-white/60 mb-1">
                  Source / Verification Reference
                </label>
                <input
                  type="text"
                  value={formData.sourceUrl}
                  onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                  placeholder="e.g. Magicpin Listing or Head Coach Notice"
                  className="w-full bg-[#181818] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#FF5A1F]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF5A1F] hover:bg-[#FF7545] disabled:opacity-50 text-black font-bold uppercase tracking-wider text-xs shadow-lg shadow-[#FF5A1F]/20 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Saving...' : 'Save Document'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
