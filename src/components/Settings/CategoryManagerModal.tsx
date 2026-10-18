import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Category, TransactionType } from '../../types';
import { CategoryIcon } from '../Common/CategoryIcon';
import { Tag, Plus, Trash2, Edit2, Star, X, Check } from 'lucide-react';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVAILABLE_ICONS = [
  'Utensils', 'Bus', 'ShoppingCart', 'Receipt', 'HeartPulse',
  'GraduationCap', 'Home', 'ShoppingBag', 'Film', 'Plane',
  'Briefcase', 'Store', 'Laptop', 'TrendingUp', 'Gift', 'Coins',
  'Coffee', 'Fuel', 'Smartphone', 'CreditCard', 'MoreHorizontal'
];

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({ isOpen, onClose }) => {
  const { categories, saveCategory, deleteCategory, toggleFavoriteCategory, showSnackbar } = useApp();

  const [activeTab, setActiveTab] = useState<TransactionType>('expense');
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('ShoppingCart');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const currentList = categories.filter((c) => c.type === activeTab);

  const startEdit = (cat: Category) => {
    setEditingCat(cat);
    setName(cat.name);
    setIcon(cat.icon);
    setIsFavorite(cat.isFavorite);
    setIsAdding(true);
    setError('');
  };

  const startAdd = () => {
    setEditingCat(null);
    setName('');
    setIcon('ShoppingCart');
    setIsFavorite(false);
    setIsAdding(true);
    setError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('ক্যাটাগরির নাম লিখুন');
      return;
    }

    const cat: Category = {
      id: editingCat ? editingCat.id : `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      icon,
      type: activeTab,
      isFavorite,
      color: editingCat?.color || '#4f46e5',
      createdAt: editingCat ? editingCat.createdAt : Date.now(),
    };

    await saveCategory(cat);
    setIsAdding(false);
    setEditingCat(null);
    setName('');
  };

  const handleDelete = async (id: string) => {
    const res = await deleteCategory(id);
    if (!res.success) {
      alert(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto no-scrollbar bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              ক্যাটাগরি ব্যবস্থাপনা
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Expense vs Income Tab Switcher */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => {
              setActiveTab('expense');
              setIsAdding(false);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg ${
              activeTab === 'expense'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            খরচের ক্যাটাগরি
          </button>
          <button
            onClick={() => {
              setActiveTab('income');
              setIsAdding(false);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg ${
              activeTab === 'income'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            আয়ের উৎস
          </button>
        </div>

        {/* Create / Edit Form */}
        {isAdding ? (
          <form onSubmit={handleSave} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              {editingCat ? 'ক্যাটাগরি সম্পাদনা' : 'নতুন ক্যাটাগরি তৈরি'}
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ক্যাটাগরির নাম
              </label>
              <input
                type="text"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="নাম লিখুন"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
              />
              {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
            </div>

            {/* Icon Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                আইকন নির্বাচন করুন
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-600">
                {AVAILABLE_ICONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setIcon(ic)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center border transition ${
                      icon === ic
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-600 dark:bg-indigo-950'
                        : 'border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <CategoryIcon iconName={ic} className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            {/* Favorite toggle */}
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={isFavorite}
                onChange={(e) => setIsFavorite(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>প্রিয় (Favorite) ক্যাটাগরি হিসেবে চিহ্নিত করুন</span>
            </label>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingCat(null);
                }}
                className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-xs font-semibold"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-md"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={startAdd}
            className="w-full py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-indigo-100 transition"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন ক্যাটাগরি যোগ করুন</span>
          </button>
        )}

        {/* Categories List */}
        <div className="space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800/60 max-h-64 overflow-y-auto no-scrollbar">
          {currentList.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-1 rounded-xl transition"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <CategoryIcon iconName={cat.icon} className="w-4 h-4" color={cat.color} />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {cat.name}
                </span>
                {cat.isFavorite && (
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => toggleFavoriteCategory(cat.id)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
                    cat.isFavorite ? 'text-amber-500' : 'text-slate-300 hover:text-amber-500'
                  }`}
                  title="প্রিয় ক্যাটাগরি টগল"
                >
                  <Star className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => startEdit(cat)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 transition"
                  title="সম্পাদনা"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 transition"
                  title="মুছে ফেলুন"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
