'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

type JournalEntry = {
  id: string;
  created_at: string;
  date: string;
  title: string | null;
  content: string;
  is_public: boolean;
};

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    setUser(user);
    fetchEntries(user.id);
  };

  const fetchEntries = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching entries:', error);
    } else {
      setEntries(data || []);
    }
    setLoading(false);
  };

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim()) return;

    setSubmitting(true);

    const { data, error } = await supabase
      .from('journal_entries')
      .insert([
        {
          user_id: user.id,
          title: title.trim() || null,
          content: content.trim(),
          is_public: isPublic,
          date: new Date().toISOString().split('T')[0], // Today's date
        },
      ])
      .select();

    if (error) {
      console.error('Error creating entry:', error);
      alert('Failed to create entry');
    } else {
      // Add new entry to the list
      if (data) {
        setEntries([data[0], ...entries]);
      }
      // Clear form
      setTitle('');
      setContent('');
      setIsPublic(false);
    }

    setSubmitting(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting entry:', error);
      alert('Failed to delete entry');
    } else {
      setEntries(entries.filter((entry) => entry.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl text-black font-bold">My Journal</h1>
          <button
            onClick={handleSignOut}
            className="text-sm text-black font-bold hover:text-red-600"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Create Entry Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-black mb-4">New Entry</h2>
          <form onSubmit={handleCreateEntry} className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-black mb-1"
              >
                Title (optional)
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 text-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="What's on your mind?"
                suppressHydrationWarning
              />
            </div>

            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Content
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="w-full text-gray-800 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Write your thoughts..."
                required
                suppressHydrationWarning
              />
            </div>

            <div className="flex items-center">
              <input
                id="is_public"
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="is_public"
                className="ml-2 block text-sm text-gray-700"
              >
                Check this to make the entry pulbic
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating...' : 'Create Entry'}
            </button>
          </form>
        </div>

        {/* Entries List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-black">
            Your Entries ({entries.length})
          </h2>

          {entries.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              No entries yet. Create your first one above!
            </div>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    {entry.title && (
                      <h3 className="text-lg font-semibold text-black kmb-1 mb-1">
                        {entry.title}
                      </h3>
                    )}
                    <p className="text-sm text-gray-500">
                      Posted On: {/* Added space after the colon */}
                      {/* Creates the posted date */}
                      {new Date(entry.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {entry.is_public === true ? (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-bold">
                        Public
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded font-bold">
                        Private
                      </span>
                    )}
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {entry.content}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
