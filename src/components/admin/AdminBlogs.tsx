import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/adminApi';
import { BlogPost } from '../../types/admin';
import {
  BookOpen,
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  Calendar,
  Tag,
  Check,
  X,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

export const AdminBlogs: React.FC = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [selectedBlogForPreview, setSelectedBlogForPreview] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState<Partial<BlogPost>>({
    title: '',
    slug: '',
    shortDescription: '',
    fullContent: '',
    featuredImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop',
    author: 'TrustSets Editorial Team',
    category: 'Real Estate Insights',
    tags: ['Title Deed', 'Property Buying', 'Verification'],
    seoTitle: '',
    seoDescription: '',
    seoKeywords: ['trustsets', 'real estate', 'verified plots'],
    status: 'Published',
    publishDate: new Date().toISOString().substring(0, 10),
  });
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBlogs = async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.getBlogs();
      setBlogs(res.blogs);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const filteredBlogs = blogs.filter((b) => {
    const matchesSearch =
      !search ||
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.slug.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || b.category === categoryFilter;
    const matchesStatus = !statusFilter || b.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleOpenCreate = () => {
    setEditingBlogId(null);
    setFormData({
      title: '',
      slug: '',
      shortDescription: '',
      fullContent: '# Introduction\n\nWrite your blog article content here using markdown...\n\n### Key Takeaways\n- Point 1\n- Point 2',
      featuredImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop',
      author: 'TrustSets Editorial Team',
      category: 'Real Estate Insights',
      tags: ['Title Deed', 'Property Advice'],
      seoTitle: '',
      seoDescription: '',
      seoKeywords: ['real estate', 'trustsets'],
      status: 'Published',
      publishDate: new Date().toISOString().substring(0, 10),
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (blog: BlogPost) => {
    setEditingBlogId(blog.id);
    setFormData({ ...blog });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this blog post?')) return;
    try {
      await adminApi.deleteBlog(id);
      fetchBlogs();
    } catch (e) {
      console.error(e);
    }
  };

  const handleTitleChange = (val: string) => {
    const slug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setFormData({
      ...formData,
      title: val,
      slug: formData.slug && editingBlogId ? formData.slug : slug,
      seoTitle: formData.seoTitle ? formData.seoTitle : `${val} | TrustSets Insights`,
    });
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const current = formData.tags || [];
    if (!current.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...current, tagInput.trim()] });
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: (formData.tags || []).filter((t) => t !== tag),
    });
  };

  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (editingBlogId) {
        await adminApi.updateBlog(editingBlogId, formData);
      } else {
        await adminApi.createBlog(formData);
      }
      setIsModalOpen(false);
      fetchBlogs();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Knowledge Base & Blogs Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Publish real estate advisory, legal guides, market analysis, and SEO articles.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#77101F] hover:bg-[#600c19] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Write New Article
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search blogs by title or URL slug..."
            className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:bg-white focus:outline-none"
        >
          <option value="">All Categories</option>
          <option value="Real Estate Insights">Real Estate Insights</option>
          <option value="Legal & Title Deeds">Legal & Title Deeds</option>
          <option value="Rental Advice">Rental Advice</option>
          <option value="Market Trends">Market Trends</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:bg-white focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="Published">Published</option>
          <option value="Draft">Draft</option>
          <option value="Archived">Archived</option>
        </select>
      </div>

      {/* Blogs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-3 py-16 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-[#77101F]/30 border-t-[#77101F] rounded-full animate-spin mx-auto mb-2" />
            Loading blog posts...
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="col-span-3 bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 font-semibold">
            No blogs matching the criteria. Click "Write New Article" to compose one.
          </div>
        ) : (
          filteredBlogs.map((blog) => (
            <div
              key={blog.id}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
            >
              {/* Image */}
              <div className="h-44 overflow-hidden relative bg-slate-100">
                <img
                  src={blog.featuredImage}
                  alt={blog.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 bg-black/70 backdrop-blur-xs text-white rounded-lg text-[10px] font-bold">
                    {blog.category}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                      blog.status === 'Published'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    {blog.status}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] text-slate-400 font-medium mb-1">
                    {blog.publishDate} • By {blog.author} • {blog.views} Views
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-[#77101F] transition-colors line-clamp-2">
                    {blog.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                    {blog.shortDescription}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1 max-w-[160px] truncate">
                    {blog.tags?.slice(0, 2).map((t, i) => (
                      <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md">
                        #{t}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSelectedBlogForPreview(blog);
                        setIsPreviewOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                      title="Preview article"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(blog)}
                      className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                      title="Edit article"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(blog.id)}
                      className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                      title="Delete article"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-3xl rounded-3xl p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingBlogId ? 'Edit Blog Article' : 'Compose New Article'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBlog} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Article Title</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  required
                  placeholder="e.g. 5 Common Title Deed Loopholes Every Land Buyer in Hyderabad Must Know"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">URL Slug</label>
                  <input
                    type="text"
                    value={formData.slug || ''}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category || 'Real Estate Insights'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none font-medium"
                  >
                    <option value="Real Estate Insights">Real Estate Insights</option>
                    <option value="Legal & Title Deeds">Legal & Title Deeds</option>
                    <option value="Rental Advice">Rental Advice</option>
                    <option value="Market Trends">Market Trends</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Featured Image URL</label>
                <input
                  type="text"
                  value={formData.featuredImage || ''}
                  onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Short Summary</label>
                <textarea
                  rows={2}
                  value={formData.shortDescription || ''}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  required
                  placeholder="Summary for cards and social snippets..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Article Body (Markdown Supported)
                </label>
                <textarea
                  rows={8}
                  value={formData.fullContent || ''}
                  onChange={(e) => setFormData({ ...formData, fullContent: e.target.value })}
                  required
                  placeholder="Write the full post with # Headings, bullet points, paragraphs..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none font-mono"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Article Tags</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="e.g. HMDA Approved"
                    className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    + Add Tag
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {formData.tags?.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold"
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="text-slate-400 hover:text-red-600 font-bold ml-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Status & Author */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status || 'Published'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none font-medium"
                  >
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Author Name</label>
                  <input
                    type="text"
                    value={formData.author || ''}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#77101F] text-white rounded-xl text-xs font-bold hover:bg-[#600c19] cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Article Preview Modal */}
      {isPreviewOpen && selectedBlogForPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-md text-slate-600">
                Article Reader Preview
              </span>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <img
                src={selectedBlogForPreview.featuredImage}
                alt={selectedBlogForPreview.title}
                className="w-full h-56 object-cover rounded-2xl"
              />
              <div className="text-xs text-slate-400 font-medium">
                {selectedBlogForPreview.publishDate} • By {selectedBlogForPreview.author} • {selectedBlogForPreview.category}
              </div>
              <h2 className="text-xl font-black text-slate-900 leading-tight">
                {selectedBlogForPreview.title}
              </h2>
              <div className="text-xs text-slate-600 font-semibold p-3 bg-slate-50 rounded-xl border border-slate-200">
                {selectedBlogForPreview.shortDescription}
              </div>
              <div className="prose prose-sm max-w-none text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                {selectedBlogForPreview.fullContent}
              </div>
            </div>

            <div className="pt-4 mt-6 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
