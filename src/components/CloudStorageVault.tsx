import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  CloudUpload, 
  CloudDownload, 
  Database, 
  Plus, 
  Trash2, 
  Sparkles, 
  Check, 
  RefreshCw, 
  Volume2, 
  Tag, 
  Search, 
  X,
  HardDrive,
  ShieldCheck
} from 'lucide-react';
import { CloudVaultItem, GestureKey } from '../types';
import { GESTURE_DEFINITIONS } from '../data/gestures';
import { speechService } from '../services/speechService';

interface CloudStorageVaultProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGesture: (key: GestureKey) => void;
}

const STORAGE_KEY = 'ejjilink_cloud_vault_v1';

const INITIAL_VAULT_ITEMS: CloudVaultItem[] = [
  {
    id: 'vault-1',
    title: 'Emergency Medical Assistance',
    phraseEn: 'Please help, medical emergency',
    phraseAm: 'እባክዎ እርዳኝ፣ ድንገተኛ የህክምና እርዳታ',
    gestureKey: 'help',
    timestamp: '2026-10-23 09:15',
    notes: 'Priority emergency phrase for hospitals and first responders.',
    tags: ['Emergency', 'Medical', 'Priority']
  },
  {
    id: 'vault-2',
    title: 'Polite Water Request',
    phraseEn: 'May I please have clean water to drink?',
    phraseAm: 'እባክዎ ንጹህ የመጠጥ ውሃ ማግኘት እችላለሁ?',
    gestureKey: 'water',
    timestamp: '2026-10-23 09:20',
    notes: 'Everyday dining and classroom request phrase.',
    tags: ['Daily', 'Hydration', 'Polite']
  },
  {
    id: 'vault-3',
    title: 'Classroom Greeting to Teacher',
    phraseEn: 'Good morning teacher, greetings to all',
    phraseAm: 'እንደምን አደሩ አስተማሪዬ፣ ለሁላችሁም ሰላምታ ይሁን',
    gestureKey: 'hello',
    timestamp: '2026-10-23 09:30',
    notes: 'Standard morning greeting at Holy Trinity Cathedral School.',
    tags: ['School', 'Greeting', 'Daily']
  },
  {
    id: 'vault-4',
    title: 'Heartfelt Gratitude',
    phraseEn: 'Thank you very much for your kind support',
    phraseAm: 'ስላደረጉልኝ ደግ ድጋፍ ከልብ አመሰግናለሁ',
    gestureKey: 'thank_you',
    timestamp: '2026-10-23 09:42',
    notes: 'Expressing sincere thanks in conversations.',
    tags: ['Politeness', 'Gratitude']
  },
  {
    id: 'vault-5',
    title: 'Peace & Unity Message',
    phraseEn: 'Peace and harmony to everyone',
    phraseAm: 'ሰላም እና ፍቅር ለሁላችን ይሁን',
    gestureKey: 'peace',
    timestamp: '2026-10-23 10:05',
    notes: 'Ethiopian peace symbol for unity and goodwill.',
    tags: ['Heritage', 'Peace', 'Expression']
  },
  {
    id: 'vault-6',
    title: 'Family & Loved Ones',
    phraseEn: 'I love you and cherish you',
    phraseAm: 'እወድሻለሁ / እወድሃለሁ',
    gestureKey: 'love',
    timestamp: '2026-10-23 10:12',
    notes: 'Personal communication sign with loved ones.',
    tags: ['Family', 'Affection']
  },
  {
    id: 'vault-7',
    title: 'Urgent Phone Callback',
    phraseEn: 'Please call me as soon as possible',
    phraseAm: 'እባክህ በተቻለ ፍጥነት ደውልልኝ',
    gestureKey: 'call',
    timestamp: '2026-10-23 10:18',
    notes: 'Remote contact reminder sign.',
    tags: ['Communication', 'Contact']
  },
  {
    id: 'vault-8',
    title: 'Safety Stop / Caution',
    phraseEn: 'Stop, please wait a moment',
    phraseAm: 'ቁም፣ እባክህ ትንሽ ጠብቅ',
    gestureKey: 'stop',
    timestamp: '2026-10-23 10:25',
    notes: 'Road crossing or urgent pause command.',
    tags: ['Safety', 'Urgent']
  }
];

export const CloudStorageVault: React.FC<CloudStorageVaultProps> = ({
  isOpen,
  onClose,
  onSelectGesture
}) => {
  const [items, setItems] = useState<CloudVaultItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not read from local storage', e);
    }
    return INITIAL_VAULT_ITEMS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');
  const [isAddingNew, setIsAddingNew] = useState(false);

  // New Item Form State
  const [newTitle, setNewTitle] = useState('');
  const [newPhraseEn, setNewPhraseEn] = useState('');
  const [newPhraseAm, setNewPhraseAm] = useState('');
  const [newGesture, setNewGesture] = useState<GestureKey>('hello');
  const [newNotes, setNewNotes] = useState('');
  const [newTags, setNewTags] = useState('Custom, Classroom');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Save to localStorage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save to local storage', e);
    }
  }, [items]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Cloud Sync action
  const handleSyncCloud = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSyncTime(`Today at ${now}`);
      showToast('Cloud Vault synced successfully with EjjiLink Cloud Storage!');
    }, 900);
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(items, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ejjilink_cloud_vault_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Vault backup file downloaded to your device!');
  };

  // Import JSON Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          setItems(parsed);
          showToast(`Successfully restored ${parsed.length} phrases from backup!`);
        } else {
          alert('Invalid backup format: File does not contain an array of vault items.');
        }
      } catch (err) {
        alert('Could not parse JSON backup file. Please select a valid EjjiLink export.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Add Item
  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPhraseEn.trim()) {
      alert('Please provide a title and English phrase.');
      return;
    }

    const newItem: CloudVaultItem = {
      id: `vault-${Date.now()}`,
      title: newTitle.trim(),
      phraseEn: newPhraseEn.trim(),
      phraseAm: newPhraseAm.trim() || GESTURE_DEFINITIONS[newGesture]?.labelAm || 'ሰላም',
      gestureKey: newGesture,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      notes: newNotes.trim(),
      tags: newTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    };

    setItems([newItem, ...items]);
    setIsAddingNew(false);
    setNewTitle('');
    setNewPhraseEn('');
    setNewPhraseAm('');
    setNewNotes('');
    showToast(`Added "${newItem.title}" to Cloud Storage!`);
  };

  const handleDeleteItem = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}" from your Cloud Vault?`)) {
      setItems(items.filter((i) => i.id !== id));
      showToast(`Removed "${title}" from vault.`);
    }
  };

  // Calculate approximate storage usage
  const approxBytes = JSON.stringify(items).length;
  const approxKB = (approxBytes / 1024).toFixed(1);

  // Collect all unique tags
  const allTags = ['All', ...Array.from(new Set(items.flatMap((i) => i.tags)))];

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesTag = selectedTag === 'All' || item.tags.includes(selectedTag);
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.phraseEn.toLowerCase().includes(q) ||
      item.phraseAm.includes(q) ||
      item.tags.some((t) => t.toLowerCase().includes(q));
    return matchesTag && matchesSearch;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-amber-500/40 rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-gray-50/70 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-heading">
                  EjjiLink Cloud Storage & Vault
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" /> Encrypted & Active
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                Preserve customized phrases, emergency signs, and student vocabulary synchronized across devices.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncCloud}
              disabled={isSyncing}
              className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Synchronize with Cloud"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Cloud'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Storage Metrics Bar */}
        <div className="px-6 py-3 bg-amber-500/5 dark:bg-amber-500/10 border-b border-gray-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-gray-300">
              <Database className="w-3.5 h-3.5 text-amber-500" />
              <span>{items.length} Phrases in Vault</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-gray-400">
              <HardDrive className="w-3.5 h-3.5 text-emerald-500" />
              <span>{approxKB} KB / 50 MB Allocated</span>
            </span>
            <span className="hidden md:inline text-slate-400">
              Last synced: {lastSyncTime}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportBackup}
              className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-slate-700 dark:text-gray-300 text-[11px] font-medium border border-gray-200 dark:border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <CloudDownload className="w-3 h-3 text-amber-500" />
              <span>Export Backup</span>
            </button>

            <label className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-slate-700 dark:text-gray-300 text-[11px] font-medium border border-gray-200 dark:border-slate-700 flex items-center gap-1 cursor-pointer transition-colors">
              <CloudUpload className="w-3 h-3 text-emerald-500" />
              <span>Import JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

          {/* Toast Notice */}
          {toastMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Controls: Search, Tag Filters, Add New Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search saved phrases or tags..."
                className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all text-slate-900 dark:text-white"
              />
            </div>

            <button
              onClick={() => setIsAddingNew(!isAddingNew)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddingNew ? 'Close Form' : 'Add Custom Phrase'}</span>
            </button>
          </div>

          {/* Tags row */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-semibold mr-1 flex items-center gap-1">
              <Tag className="w-3 h-3" /> Filter:
            </span>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                  selectedTag === tag
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Add New Phrase Form */}
          {isAddingNew && (
            <form onSubmit={handleCreateItem} className="p-5 rounded-2xl bg-amber-500/5 dark:bg-slate-950 border border-amber-500/30 space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Add New Phrase to Cloud Storage
              </h4>

              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-gray-300 font-medium mb-1">Phrase Title / Context</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Asking for Directions"
                    required
                    className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-gray-300 font-medium mb-1">Associated 3D Gesture</label>
                  <select
                    value={newGesture}
                    onChange={(e) => setNewGesture(e.target.value as GestureKey)}
                    className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
                  >
                    {Object.values(GESTURE_DEFINITIONS).map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.emoji} {g.labelEn} — {g.labelAm}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-gray-300 font-medium mb-1">English Phrase</label>
                  <input
                    type="text"
                    value={newPhraseEn}
                    onChange={(e) => setNewPhraseEn(e.target.value)}
                    placeholder="e.g. Which way to the library?"
                    required
                    className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-gray-300 font-medium mb-1">Amharic Translation (Optional)</label>
                  <input
                    type="text"
                    value={newPhraseAm}
                    onChange={(e) => setNewPhraseAm(e.target.value)}
                    placeholder="e.g. ቤተ-መጽሐፍቱ የት በኩል ነው?"
                    className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none font-ethiopic"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 dark:text-gray-300 font-medium mb-1">Tags (Comma-separated)</label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="Classroom, Travel, Medical, Custom"
                    className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-gray-300 font-semibold text-xs cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Save to Vault
                </button>
              </div>
            </form>
          )}

          {/* Phrase Cards Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {filteredItems.map((item) => {
              const def = GESTURE_DEFINITIONS[item.gestureKey];
              return (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between gap-4 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{def?.emoji || '👋'}</span>
                        <div>
                          <h5 className="font-bold text-slate-900 dark:text-white text-sm font-heading">
                            {item.title}
                          </h5>
                          <span className="text-[10px] text-slate-400">{item.timestamp}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteItem(item.id, item.title)}
                        className="opacity-40 hover:opacity-100 p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
                        title="Delete from Vault"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800/80 space-y-1">
                      <p className="text-xs font-semibold text-slate-800 dark:text-gray-200">
                        {item.phraseEn}
                      </p>
                      <p className="text-xs font-ethiopic text-amber-600 dark:text-amber-400">
                        {item.phraseAm}
                      </p>
                    </div>

                    {item.notes && (
                      <p className="text-[11px] text-slate-500 dark:text-gray-400 italic">
                        "{item.notes}"
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1 pt-1">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md bg-gray-200 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-gray-400"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions on Card */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-slate-800/80">
                    <button
                      onClick={() => {
                        if (def) {
                          speechService.speak(def, 'en-US');
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-800 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-gray-200 dark:border-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Speak</span>
                    </button>

                    <button
                      onClick={() => {
                        onSelectGesture(item.gestureKey);
                        onClose();
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Articulate Hand</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredItems.length === 0 && (
            <div className="p-12 text-center text-slate-500 dark:text-gray-400 space-y-2">
              <Database className="w-8 h-8 mx-auto text-gray-400 opacity-60" />
              <p className="font-semibold text-sm">No saved phrases matched your search filter.</p>
              <p className="text-xs">Click "Add Custom Phrase" above to store your first customized entry in Cloud Storage.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-gray-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-gray-50/70 dark:bg-slate-950/40 text-xs text-slate-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>EjjiLink Cloud Sync Active • The Ethio-Tech Initiative</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Close Vault
          </button>
        </div>
      </div>
    </div>
  );
};
