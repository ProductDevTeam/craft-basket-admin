import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Gift, Loader2, ChevronDown, Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { revalidateOccasions } from '@/lib/revalidate';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Color Swatch Picker ──────────────────────────────────────────────────────

const PRESET_COLORS = [
  '#E4F5EF', '#D4EFE9', '#FCF3E3', '#FAD9CE',
  '#F9CFDE', '#EAD9F7', '#EEE5F3', '#FEF0C2',
  '#DCECF7', '#E0EAF4', '#E8F5E9', '#FCE4EC',
  '#FFF3E0', '#E3F2FD', '#F5F0E8', '#F3E5F5',
];

interface ColorSwatchPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

function ColorSwatchPicker({ label, value, onChange }: ColorSwatchPickerProps) {
  const customInputRef = useRef<HTMLInputElement>(null);
  const isCustom = value && !PRESET_COLORS.map(c => c.toLowerCase()).includes(value.toLowerCase());

  return (
    <div>
      <Label className="text-xs text-gray-500 mb-2 block">{label}</Label>
      <div className="flex flex-wrap gap-2 items-center">
        {PRESET_COLORS.map((color) => {
          const selected = value.toLowerCase() === color.toLowerCase();
          return (
            <button
              key={color}
              type="button"
              onClick={() => onChange(color)}
              className="relative w-8 h-8 rounded-full border-2 transition-all hover:scale-110 focus:outline-none"
              style={{
                backgroundColor: color,
                borderColor: selected ? '#F6511E' : '#e5e7eb',
                boxShadow: selected ? '0 0 0 2px white, 0 0 0 4px #F6511E' : undefined,
              }}
            >
              {selected && (
                <Check className="w-3.5 h-3.5 text-gray-700 absolute inset-0 m-auto" />
              )}
            </button>
          );
        })}

        {/* Custom color */}
        <div className="relative">
          <button
            type="button"
            onClick={() => customInputRef.current?.click()}
            className="relative w-8 h-8 rounded-full border-2 transition-all hover:scale-110 focus:outline-none overflow-hidden"
            style={{
              background: isCustom
                ? value
                : 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
              borderColor: isCustom ? '#F6511E' : '#e5e7eb',
              boxShadow: isCustom ? '0 0 0 2px white, 0 0 0 4px #F6511E' : undefined,
            }}
            title="Custom color"
          >
            {isCustom && (
              <Check className="w-3.5 h-3.5 text-white absolute inset-0 m-auto drop-shadow" />
            )}
          </button>
          <input
            ref={customInputRef}
            type="color"
            value={value || '#ffffff'}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 w-0 h-0"
            tabIndex={-1}
          />
        </div>
      </div>

      {/* Hex value */}
      <p className="text-[11px] text-gray-400 font-mono mt-1.5">{value || '—'}</p>
    </div>
  );
}

// ─── Emoji Picker ─────────────────────────────────────────────────────────────

const OCCASION_EMOJIS = [
  '💍','💒','👰','🤵','💑','🌹','🥂','💐',
  '🎂','🎁','🎊','🎉','🎈','🎀','🥳','🍰',
  '💼','🤝','🏆','🎖️','📊','🏢','👔','🌟',
  '👶','🎓','🌸','🦋','✨','🎵','🎗️','🎠',
  '🌺','🫂','🤗','🎪','🎆','🎇','🕯️','🪷',
];

function EmojiPicker({ value, onChange }: { value: string; onChange: (e: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <Label className="text-xs text-gray-500 mb-2 block">Icon Emoji</Label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 h-10 px-4 rounded-xl border border-gray-200 bg-white hover:border-gray-300 transition-colors"
      >
        <span className="text-2xl leading-none">{value || '?'}</span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full left-0 mt-1 z-50 bg-white rounded-2xl border border-gray-200 shadow-lg p-3 w-64"
          >
            <div className="grid grid-cols-8 gap-1">
              {OCCASION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => { onChange(emoji); setOpen(false); }}
                  className={`w-7 h-7 rounded-lg text-base leading-none hover:bg-gray-100 transition-colors flex items-center justify-center ${
                    value === emoji ? 'bg-[#F6511E]/10 ring-1 ring-[#F6511E]/30' : ''
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Card Preview ─────────────────────────────────────────────────────────────

function CardPreview({ name, description, cardBg, imagePreview, iconEmoji }: {
  name: string; description: string; cardBg: string;
  imagePreview: string | null; iconEmoji: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-gray-500 block">Live Preview</Label>
      <div className="rounded-2xl p-2 overflow-visible transition-colors duration-200" style={{ backgroundColor: cardBg }}>
        <div className="relative w-full" style={{ paddingBottom: '75%' }}>
          <div className="absolute inset-0 rounded-xl overflow-hidden bg-gray-200">
            {imagePreview ? (
              <img src={imagePreview} alt="cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Gift className="w-10 h-10 text-gray-300" />
              </div>
            )}
          </div>
          <div className="absolute bottom-0 left-3 translate-y-1/2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100 z-10">
            {iconEmoji ? (
              <span className="text-2xl leading-none">{iconEmoji}</span>
            ) : (
              <Gift className="w-5 h-5 text-gray-300" />
            )}
          </div>
        </div>
        <div className="pt-9 px-3 pb-4">
          <p className="font-semibold text-[15px] text-[#0C0000] leading-snug truncate">
            {name || 'Occasion name'}
          </p>
          <p className="text-[12px] text-black/60 mt-1 truncate">
            {description || 'Subtitle'}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function OccasionFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cardBg, setCardBg] = useState('#E4F5EF');
  const [mobileBg, setMobileBg] = useState('#D4EFE9');
  const [iconEmoji, setIconEmoji] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    apiClient.getCategory(id).then((res) => {
      const cat = res.data;
      if (!cat) return;
      setName(cat.name || '');
      setDescription(cat.description || '');
      setCardBg(cat.cardBg || '#E4F5EF');
      setMobileBg(cat.mobileBg || '#D4EFE9');
      setIconEmoji(cat.iconEmoji || '');
      setImagePreview(cat.image?.url || null);
    }).catch(() => toast.error('Failed to load occasion'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('description', description.trim());
      formData.append('featuredOnHomepage', 'true');
      formData.append('cardBg', cardBg);
      formData.append('mobileBg', mobileBg);
      formData.append('iconEmoji', iconEmoji);
      if (image) formData.append('image', image);

      if (isEdit) {
        await apiClient.updateCategory(id!, formData);
        toast.success('Occasion updated');
      } else {
        await apiClient.createCategory(formData);
        toast.success(`"${name}" created`);
      }
      revalidateOccasions();
      navigate('/occasion');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="space-y-1">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 rounded-xl" />
              <Skeleton className="h-10 rounded-xl" />
            </div>
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2"><Skeleton className="h-3 w-24" /><div className="flex gap-2 flex-wrap">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="w-8 h-8 rounded-full"/>)}</div></div>
              <div className="space-y-2"><Skeleton className="h-3 w-24" /><div className="flex gap-2 flex-wrap">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="w-8 h-8 rounded-full"/>)}</div></div>
            </div>
          </div>
          <div><Skeleton className="w-full rounded-2xl" style={{ paddingBottom: '75%' }} /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Occasion' : 'New Occasion'}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {isEdit ? 'Update this homepage occasion' : 'Add a new gift basket occasion to the homepage'}
        </p>
      </div>

      {/* Form + Preview grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-8 items-start">
        {/* Left: fields */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
          {/* Name + subtitle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-500 mb-1.5 block">Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Weddings"
                className="rounded-xl h-10"
                autoFocus
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1.5 block">Subtitle</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Gifts & Keepsakes"
                className="rounded-xl h-10"
              />
            </div>
          </div>

          {/* Cover photo */}
          <div>
            <Label className="text-xs text-gray-500 mb-1.5 block">Cover Photo</Label>
            {imagePreview ? (
              <div className="relative h-48 rounded-xl overflow-hidden border border-gray-200 group">
                <img src={imagePreview} alt="Cover" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setImage(null); setImagePreview(null); }}
                  className="absolute top-3 right-3 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-300 cursor-pointer transition-colors bg-gray-50/50">
                <Upload className="w-6 h-6 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500 font-medium">Upload cover photo</span>
                <span className="text-xs text-gray-400 mt-1">Recommended: 800×600px or wider</span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            )}
          </div>

          {/* Emoji picker */}
          <EmojiPicker value={iconEmoji} onChange={setIconEmoji} />

          {/* Color pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <ColorSwatchPicker
              label="Desktop Card Color"
              value={cardBg}
              onChange={setCardBg}
            />
            <ColorSwatchPicker
              label="Mobile Card Color"
              value={mobileBg}
              onChange={setMobileBg}
            />
          </div>
        </div>

        {/* Right: sticky preview */}
        <div className="lg:sticky lg:top-8">
          <CardPreview
            name={name}
            description={description}
            cardBg={cardBg}
            imagePreview={imagePreview}
            iconEmoji={iconEmoji}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pb-8">
        <Button variant="ghost" onClick={() => navigate('/occasion')} className="rounded-xl">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!name.trim() || isSubmitting}
          className="text-white rounded-xl px-6"
          style={{ backgroundColor: '#F6511E' }}
        >
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isEdit ? 'Save Changes' : 'Create Occasion'}
        </Button>
      </div>
    </div>
  );
}
