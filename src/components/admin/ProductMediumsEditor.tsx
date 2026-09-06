'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Globe, Layers, AlertCircle, RotateCcw, Check } from 'lucide-react';
import { SPRING_UI, SPRING_PRESS } from '@/components/admin/AdminUI';

export interface MediumItem {
  code: string;
  name: string;
  stock: number;
}

interface ProductMediumsEditorProps {
  mediums: MediumItem[];
  onChange: (mediums: MediumItem[]) => void;
}

// Preset suggestions for quick 1-click addition
const PRESET_MEDIUMS: Array<{ code: string; name: string }> = [
  { code: 'en', name: 'English' },
  { code: 'te', name: 'Telugu' },
  { code: 'hi', name: 'Hindi' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ta', name: 'Tamil' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'mr', name: 'Marathi' },
  { code: 'bn', name: 'Bengali' },
  { code: 'or', name: 'Odia' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'ur', name: 'Urdu' },
];

export default function ProductMediumsEditor({ mediums, onChange }: ProductMediumsEditorProps) {
  const [customName, setCustomName] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [customStock, setCustomStock] = useState('0');
  const [errorMessage, setErrorMessage] = useState('');

  const totalStock = mediums.reduce((sum, m) => sum + (Number(m.stock) || 0), 0);

  const cleanCode = (val: string) => {
    return val
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');
  };

  const handleAddCustom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedName = customName.trim();
    if (!trimmedName) {
      setErrorMessage('Please enter a medium name');
      return;
    }

    const derivedCode = cleanCode(customCode.trim() || trimmedName);
    if (!derivedCode) {
      setErrorMessage('Please provide a valid medium code');
      return;
    }

    if (mediums.some((m) => m.code.toLowerCase() === derivedCode.toLowerCase())) {
      setErrorMessage(`A medium with code "${derivedCode}" already exists`);
      return;
    }

    const stock = Math.max(0, parseInt(customStock, 10) || 0);

    const updated = [
      ...mediums,
      {
        code: derivedCode,
        name: trimmedName,
        stock,
      },
    ];

    onChange(updated);
    setCustomName('');
    setCustomCode('');
    setCustomStock('0');
    setErrorMessage('');
  };

  const handleAddPreset = (preset: { code: string; name: string }) => {
    if (mediums.some((m) => m.code.toLowerCase() === preset.code.toLowerCase())) {
      return;
    }
    const updated = [
      ...mediums,
      {
        code: preset.code,
        name: preset.name,
        stock: 0,
      },
    ];
    onChange(updated);
    setErrorMessage('');
  };

  const handleUpdate = (index: number, field: keyof MediumItem, value: string | number) => {
    const next = [...mediums];
    if (field === 'stock') {
      next[index] = {
        ...next[index],
        stock: Math.max(0, parseInt(String(value), 10) || 0),
      };
    } else if (field === 'code') {
      next[index] = {
        ...next[index],
        code: cleanCode(String(value)),
      };
    } else if (field === 'name') {
      next[index] = {
        ...next[index],
        name: String(value),
      };
    }
    onChange(next);
  };

  const handleRemove = (index: number) => {
    const next = mediums.filter((_, i) => i !== index);
    onChange(next);
  };

  const handleResetDefaults = () => {
    onChange([
      { code: 'en', name: 'English', stock: 0 },
      { code: 'te', name: 'Telugu', stock: 0 },
      { code: 'hi', name: 'Hindi', stock: 0 },
    ]);
    setErrorMessage('');
  };

  return (
    <div className="space-y-5">
      {/* Header with Live Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-(--color-border-light)">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-lg bg-(--color-primary-light) text-(--color-primary)">
            <Globe size={18} />
          </span>
          <div>
            <h4 className="text-sm font-bold text-(--color-text-primary)">
              Mediums & Stock Levels
            </h4>
            <p className="text-xs text-(--color-text-muted)">
              Add languages/mediums and specify inventory available for each
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-(--color-bg-secondary) text-(--color-text-secondary) border border-(--color-border)">
            {mediums.length} {mediums.length === 1 ? 'Medium' : 'Mediums'}
          </span>
          <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
            totalStock > 0
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
          }`}>
            Total Stock: {totalStock}
          </span>
          {mediums.length === 0 && (
            <motion.button
              type="button"
              onClick={handleResetDefaults}
              whileTap={{ scale: 0.95 }}
              className="text-xs text-(--color-primary) hover:underline flex items-center gap-1 font-medium"
            >
              <RotateCcw size={12} /> Reset Standard
            </motion.button>
          )}
        </div>
      </div>

      {/* Preset Quick Chips */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-(--color-text-secondary) uppercase tracking-wider">
          Quick-Add Presets
        </label>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_MEDIUMS.map((preset) => {
            const isAlreadyAdded = mediums.some(
              (m) => m.code.toLowerCase() === preset.code.toLowerCase()
            );
            return (
              <button
                key={preset.code}
                type="button"
                onClick={() => handleAddPreset(preset)}
                disabled={isAlreadyAdded}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all duration-200 flex items-center gap-1 border ${
                  isAlreadyAdded
                    ? 'bg-(--color-bg-secondary) text-(--color-text-muted) border-transparent opacity-60 cursor-default'
                    : 'bg-(--color-bg-card) hover:bg-(--color-primary-light) text-(--color-text-secondary) hover:text-(--color-primary) border-(--color-border) hover:border-(--color-primary)/30 shadow-2xs'
                }`}
                title={isAlreadyAdded ? `${preset.name} already added` : `Click to add ${preset.name}`}
              >
                {isAlreadyAdded ? <Check size={12} /> : <Plus size={12} />}
                <span>{preset.name}</span>
                <span className="text-[10px] opacity-70 uppercase font-mono">({preset.code})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Mediums List */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-(--color-text-secondary) uppercase tracking-wider flex items-center gap-1.5">
          <Layers size={14} />
          Configured Mediums ({mediums.length})
        </label>

        {mediums.length === 0 ? (
          <div className="p-6 text-center border-2 border-dashed border-(--color-border) rounded-2xl bg-(--color-bg-secondary)/50 space-y-2">
            <AlertCircle size={24} className="mx-auto text-amber-500 opacity-80" />
            <p className="text-sm font-semibold text-(--color-text-primary)">No mediums configured</p>
            <p className="text-xs text-(--color-text-muted) max-w-sm mx-auto">
              Click a preset above or type a custom medium name below to add languages for this product.
            </p>
            <motion.button
              type="button"
              onClick={handleResetDefaults}
              whileTap={{ scale: 0.95 }}
              className="btn btn-secondary btn-sm mt-2 inline-flex items-center gap-1.5"
            >
              <RotateCcw size={14} /> Add Default Mediums (English, Telugu, Hindi)
            </motion.button>
          </div>
        ) : (
          <div className="space-y-2.5">
            <AnimatePresence initial={false}>
              {mediums.map((medium, index) => {
                const stockVal = Number(medium.stock) || 0;
                return (
                  <motion.div
                    key={`${medium.code}-${index}`}
                    initial={{ opacity: 0, height: 0, scale: 0.98 }}
                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                    transition={SPRING_UI}
                    className="p-3.5 rounded-xl border border-(--color-border) bg-(--color-bg-card) shadow-2xs hover:border-(--color-primary)/40 transition-colors"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      {/* Medium Name Input */}
                      <div className="sm:col-span-5">
                        <label className="block text-[11px] font-semibold text-(--color-text-muted) mb-1">
                          Medium Name
                        </label>
                        <input
                          type="text"
                          required
                          value={medium.name}
                          onChange={(e) => handleUpdate(index, 'name', e.target.value)}
                          placeholder="e.g. English, Kannada, Bilingual"
                          className="form-input text-sm py-1.5 font-medium"
                        />
                      </div>

                      {/* Code Input */}
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-semibold text-(--color-text-muted) mb-1">
                          Code (Slug)
                        </label>
                        <input
                          type="text"
                          required
                          value={medium.code}
                          onChange={(e) => handleUpdate(index, 'code', e.target.value)}
                          placeholder="e.g. kn, en, te"
                          className="form-input text-sm py-1.5 font-mono uppercase text-xs"
                        />
                      </div>

                      {/* Stock Quantity Input */}
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-semibold text-(--color-text-muted) mb-1 flex items-center justify-between">
                          <span>Stock</span>
                          <span
                            className={`text-[10px] font-bold ${
                              stockVal > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                            }`}
                          >
                            {stockVal > 0 ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          required
                          value={medium.stock}
                          onChange={(e) => handleUpdate(index, 'stock', e.target.value)}
                          className="form-input text-sm py-1.5 font-semibold"
                        />
                      </div>

                      {/* Delete Action */}
                      <div className="sm:col-span-1 flex items-end justify-end sm:pt-4">
                        <motion.button
                          type="button"
                          onClick={() => handleRemove(index)}
                          whileTap={{ scale: 0.9 }}
                          transition={SPRING_PRESS}
                          className="p-2 rounded-lg border border-(--color-border) text-(--color-text-muted) hover:text-rose-600 hover:bg-rose-500/10 hover:border-rose-500/30 transition-colors"
                          title={`Remove ${medium.name || 'medium'}`}
                          aria-label={`Remove ${medium.name || 'medium'}`}
                        >
                          <Trash2 size={16} />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Add Custom Medium Section */}
      <div className="p-4 rounded-xl border border-dashed border-(--color-border) bg-(--color-bg-secondary)/40 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-(--color-text-primary) flex items-center gap-1.5">
            <Plus size={14} className="text-(--color-primary)" />
            Add Custom Medium
          </label>
          <span className="text-[11px] text-(--color-text-muted)">
            Enter any regional language or custom edition
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <div className="sm:col-span-5">
            <input
              type="text"
              value={customName}
              onChange={(e) => {
                const val = e.target.value;
                setCustomName(val);
                if (!customCode || customCode === cleanCode(customName)) {
                  setCustomCode(cleanCode(val));
                }
                setErrorMessage('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustom();
                }
              }}
              placeholder="Medium Name (e.g. Assamese, Bilingual)"
              className="form-input text-sm py-1.5"
            />
          </div>

          <div className="sm:col-span-3">
            <input
              type="text"
              value={customCode}
              onChange={(e) => {
                setCustomCode(cleanCode(e.target.value));
                setErrorMessage('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustom();
                }
              }}
              placeholder="Code (e.g. as, bi)"
              className="form-input text-sm py-1.5 font-mono uppercase text-xs"
            />
          </div>

          <div className="sm:col-span-2">
            <input
              type="number"
              min="0"
              value={customStock}
              onChange={(e) => setCustomStock(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustom();
                }
              }}
              placeholder="Stock"
              className="form-input text-sm py-1.5"
            />
          </div>

          <div className="sm:col-span-2">
            <motion.button
              type="button"
              onClick={() => handleAddCustom()}
              whileTap={{ scale: 0.95 }}
              transition={SPRING_PRESS}
              className="btn btn-primary btn-sm w-full h-[38px] justify-center text-xs"
            >
              <Plus size={14} /> Add Medium
            </motion.button>
          </div>
        </div>

        {errorMessage && (
          <div className="text-xs text-rose-500 font-semibold flex items-center gap-1 pt-1">
            <AlertCircle size={13} />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
