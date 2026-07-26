import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';

/**
 * SearchSelect — a premium custom select with live search.
 *
 * Props:
 *  - options       : Array<{ value: string, label: string }>
 *  - value         : string (currently selected value)
 *  - onChange      : (value: string) => void
 *  - placeholder   : string  (shown when nothing selected)
 *  - searchPlaceholder : string (inside the search box)
 *  - disabled      : boolean
 *  - label         : string  (shown above the trigger)
 *  - required      : boolean (shows * on label)
 *  - emptyText     : string  (shown when no options match)
 *  - icon          : ReactNode (optional icon shown on trigger)
 *  - accentColor   : 'indigo' | 'emerald' | 'purple' | 'cyan'  (default indigo)
 */
const SearchSelect = ({
  options = [],
  value = '',
  onChange,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search...',
  disabled = false,
  label,
  required = false,
  emptyText = 'No results found',
  icon,
  accentColor = 'indigo',
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);

  // Accent color maps
  const accent = {
    indigo: {
      ring: 'ring-indigo-500/30 border-indigo-400',
      badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300',
      item: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
      highlight: 'bg-slate-100 dark:bg-white/5',
      check: 'text-indigo-500',
      searchFocus: 'focus:ring-indigo-500/20 focus:border-indigo-400',
    },
    emerald: {
      ring: 'ring-emerald-500/30 border-emerald-400',
      badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
      item: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
      highlight: 'bg-slate-100 dark:bg-white/5',
      check: 'text-emerald-500',
      searchFocus: 'focus:ring-emerald-500/20 focus:border-emerald-400',
    },
    purple: {
      ring: 'ring-purple-500/30 border-purple-400',
      badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-300',
      item: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300',
      highlight: 'bg-slate-100 dark:bg-white/5',
      check: 'text-purple-500',
      searchFocus: 'focus:ring-purple-500/20 focus:border-purple-400',
    },
    cyan: {
      ring: 'ring-cyan-500/30 border-cyan-400',
      badge: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-300',
      item: 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
      highlight: 'bg-slate-100 dark:bg-white/5',
      check: 'text-cyan-500',
      searchFocus: 'focus:ring-cyan-500/20 focus:border-cyan-400',
    },
  }[accentColor];

  const filtered = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
    if (!open) {
      setSearch('');
      setHighlightedIndex(-1);
    }
  }, [open]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-option]');
      items[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  const handleToggle = () => {
    if (disabled) return;
    setOpen((prev) => !prev);
  };

  const handleSelect = useCallback(
    (optValue) => {
      onChange?.(optValue);
      setOpen(false);
      setSearch('');
      setHighlightedIndex(-1);
    },
    [onChange]
  );

  const handleClear = (e) => {
    e.stopPropagation();
    onChange?.('');
    setOpen(false);
    setSearch('');
  };

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && filtered[highlightedIndex]) {
        handleSelect(filtered[highlightedIndex].value);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      {/* Label */}
      {label && (
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider dark:text-slate-500 select-none">
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Relative wrapper keeps trigger + panel together */}
      <div className="relative">

      {/* Trigger button */}
      <button
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={[
          'relative w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold',
          'transition-all duration-200 outline-none text-left',
          'bg-white dark:bg-dark-input',
          'shadow-sm',
          disabled
            ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-white/5 text-slate-400'
            : open
            ? `cursor-pointer border-2 ${accent.ring} ring-4`
            : 'cursor-pointer border-slate-200 dark:border-white/8 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-white/15',
        ].join(' ')}
      >
        {/* Icon slot */}
        {icon && (
          <span className="shrink-0 text-slate-400 dark:text-slate-500">{icon}</span>
        )}

        {/* Selected value or placeholder */}
        <span className={`flex-1 truncate ${selectedOption ? '' : 'text-slate-400 dark:text-slate-500'}`}>
          {selectedOption ? (
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold ${accent.badge}`}>
              {selectedOption.label}
            </span>
          ) : (
            placeholder
          )}
        </span>

        {/* Clear button */}
        {selectedOption && !disabled && (
          <span
            role="button"
            tabIndex={-1}
            onClick={handleClear}
            className="shrink-0 p-0.5 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
            title="Clear selection"
          >
            <X size={12} />
          </span>
        )}

        {/* Chevron */}
        <ChevronDown
          size={14}
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className={[
            'absolute z-50 mt-1 w-full min-w-[200px] rounded-2xl border shadow-2xl',
            'bg-white dark:bg-dark-card',
            'border-slate-200/80 dark:border-white/8',
            'shadow-slate-200/60 dark:shadow-black/60',
            'overflow-hidden',
            'animate-slide-up',
          ].join(' ')}
          style={{ top: '100%', left: 0 }}
        >
          {/* Search box */}
          {options.length > 5 && (
            <div className="p-2 border-b border-slate-100 dark:border-white/5">
              <div className="relative flex items-center">
                <Search
                  size={12}
                  className="absolute left-2.5 text-slate-400 dark:text-slate-500 pointer-events-none"
                />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={searchPlaceholder}
                  className={[
                    'w-full pl-7 pr-3 py-1.5 text-[11px] rounded-lg border outline-none',
                    'bg-slate-50 dark:bg-dark-input',
                    'border-slate-200 dark:border-white/5',
                    'text-slate-700 dark:text-slate-200',
                    'placeholder-slate-400 dark:placeholder-slate-500',
                    'transition-all ring-2 ring-transparent',
                    accent.searchFocus,
                  ].join(' ')}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => { setSearch(''); setHighlightedIndex(-1); }}
                    className="absolute right-2 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options list */}
          <ul
            ref={listRef}
            role="listbox"
            className="max-h-52 overflow-y-auto py-1"
            aria-label="Options"
          >
            {filtered.length === 0 ? (
              <li className="px-4 py-6 text-center text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                <Search size={16} className="mx-auto mb-1.5 opacity-40" />
                {emptyText}
              </li>
            ) : (
              filtered.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === highlightedIndex;
                return (
                  <li
                    key={opt.value}
                    data-option
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={[
                      'flex items-center gap-2.5 px-3 py-2 cursor-pointer text-[11px] font-semibold transition-colors duration-100 mx-1 rounded-lg my-0.5',
                      isSelected
                        ? accent.item
                        : isHighlighted
                        ? accent.highlight + ' text-slate-700 dark:text-slate-200'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5',
                    ].join(' ')}
                  >
                    {/* Check icon for selected */}
                    <span className={`shrink-0 w-3.5 h-3.5 flex items-center justify-center ${accent.check}`}>
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </span>
                    <span className="truncate">{opt.label}</span>
                  </li>
                );
              })
            )}
          </ul>

          {/* Footer count */}
          {filtered.length > 0 && (
            <div className="px-3 py-1.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                {filtered.length} option{filtered.length !== 1 ? 's' : ''}
              </span>
              {value && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-[9px] text-rose-400 hover:text-rose-500 font-bold uppercase tracking-wider transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      )}
      </div>{/* end relative wrapper */}
    </div>
  );
};

export default SearchSelect;
