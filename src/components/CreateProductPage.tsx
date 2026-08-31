import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { apiClient } from '../lib/api';
import {
  Vendor,
  KeyInfo,
  PersonalizationType,
  OCCASION_OPTIONS,
  RECIPIENT_OPTIONS,
  STYLE_TAG_OPTIONS,
  SUBCATEGORIES_MAP,
  CORE_CATEGORY_OPTIONS,
  SUB_SUBCATEGORIES_MAP,
  PERSONALIZATION_TYPE_OPTIONS,
} from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Loader2,
  Plus,
  X,
  Upload,
  HelpCircle,
  Info,
  Check,
  ArrowLeft,
  ArrowRight,
  ChevronsUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, PageTransition } from '@/lib/motion';
import { FormSkeleton } from '@/components/ui/skeletons';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

const PERSONALIZATION_CHIP_OPTIONS = ['Engraving', 'Print-on', 'Sticker'];

const VARIANT_LABEL_PRESETS = ['Size', 'Color', 'Material', 'Length'];

const VARIANT_PLACEHOLDER_MAP: Record<string, string> = {
  Size: 'e.g. Small, Medium, Large',
  Length: 'e.g. Small, Medium, Large',
  Color: 'e.g. Gold, Silver, Rose Gold',
  Material: 'e.g. Cotton, Wool, Silk',
};

const KEY_INFO_LABEL_PRESETS = [
  'Dimensions',
  'Care Instructions',
  'Country of Origin',
  "What's Included",
  'Shelf Life',
  'Allergen Information',
  'Battery Type',
  'Warranty',
  'Age Recommendation',
  'Assembly Required',
];

const STEPS = [
  { id: 1, name: 'Product Details', description: 'Name, description & media' },
  { id: 2, name: 'Category', description: 'Category, tags & audience' },
  { id: 3, name: 'Pricing', description: 'Price & inventory' },
  { id: 4, name: 'Variants', description: 'Options & pricing' },
  { id: 5, name: 'Personalization', description: 'Lead time & options' },
  { id: 6, name: 'Details & Badges', description: 'Specs & badges' },
];

export function CreateProductPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const [currentStep, setCurrentStep] = useState(1);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<
    Array<{ url: string; publicId: string; isMain: boolean }>
  >([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragIndex = useRef<number | null>(null);
  const [newDragOverIndex, setNewDragOverIndex] = useState<number | null>(null);
  const newDragIndex = useRef<number | null>(null);
  const [vendorSearchOpen, setVendorSearchOpen] = useState(false);


  // Form state
  const [vendorId, setVendorId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  // Form state — V2 IA Taxonomy
  const [selectedCoreCategory, setSelectedCoreCategory] = useState('');
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [selectedSubSubcategory, setSelectedSubSubcategory] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [selectedOccasionTags, setSelectedOccasionTags] = useState<string[]>([]);
  const [selectedStyleTags, setSelectedStyleTags] = useState<string[]>([]);
  // Legacy form state
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  const [selectedGiftTypes, setSelectedGiftTypes] = useState<string[]>([]);
  const [basePrice, setBasePrice] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [weightValue, setWeightValue] = useState('');
  const [weightUnit, setWeightUnit] = useState<'g' | 'kg' | 'lb' | 'oz'>('g');
  const [materials, setMaterials] = useState<string[]>([]);
  const [materialInput, setMaterialInput] = useState('');
  const [keyInfo, setKeyInfo] = useState<KeyInfo[]>([{ label: '', value: '' }]);
  const [productVariants, setProductVariants] = useState<{
    name: string;
    options: string[];
    valueInput: string;
    labelOpen: boolean;
    priceOverrides: Record<string, string>;
    stockOverrides: Record<string, string>;
  }[]>([]);
  const [personalizationType, setPersonalizationType] = useState<PersonalizationType>('none');
  const [isPersonalizable, setIsPersonalizable] = useState(false);
  const [selectedPersonalizationTypes, setSelectedPersonalizationTypes] = useState<string[]>([]);
  const [personalizationLeadTimes, setPersonalizationLeadTimes] = useState<Record<string, number>>({});
  const [estimatedDeliveryDays, setEstimatedDeliveryDays] = useState('');
  const [keyInfoCustom, setKeyInfoCustom] = useState<boolean[]>([false]);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isMadeInNigeria, setIsMadeInNigeria] = useState(false);
  const [stock, setStock] = useState('0');
  const [sku, setSku] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videos, setVideos] = useState<File[]>([]);
  const [mainVideoIndex, setMainVideoIndex] = useState<number | null>(null);
  const [existingVideos, setExistingVideos] = useState<Array<{ url: string; publicId: string; thumbnail?: string; isMain: boolean }>>([]);
  const [videosToDelete, setVideosToDelete] = useState<string[]>([]);
  const [existingMainVideoPublicId, setExistingMainVideoPublicId] = useState<string | null>(null);

  // Calculate discounted price live preview
  const discountedPrice = useMemo(() => {
    const price = parseFloat(basePrice) || 0;
    const discount = parseFloat(discountPercentage) || 0;
    if (price > 0 && discount > 0 && discount <= 100) {
      return price - (price * discount) / 100;
    }
    return null;
  }, [basePrice, discountPercentage]);

  // Validation touch state for highlighting required fields
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const setTouchedField = (name: string) => setTouched((prev) => ({ ...prev, [name]: true }));

  // Cascading options derived from selections
  const subcategoryOptions = selectedCoreCategory ? SUBCATEGORIES_MAP[selectedCoreCategory] ?? [] : [];
  const subSubcategoryOptions = selectedSubcategories.length === 1 ? SUB_SUBCATEGORIES_MAP[selectedSubcategories[0]] ?? [] : [];

  const markStepTouched = (step: number) => {
    switch (step) {
      case 1:
        setTouched((prev) => ({
          ...prev,
          vendorId: true,
          name: true,
          description: true,
          sku: true,
          images: true,
        }));
        break;
      case 2:
        setTouched((prev) => ({ ...prev, category: true, recipients: true }));
        break;
      case 3:
        setTouched((prev) => ({ ...prev, basePrice: true, discountPercentage: true, stock: true }));
        break;
      default:
        break;
    }
  };

  // Toggle handlers for all chip-select fields
  const toggleOccasion = (occasion: string) => {
    setSelectedOccasions((prev) =>
      prev.includes(occasion) ? prev.filter((o) => o !== occasion) : [...prev, occasion]
    );
  };
  const toggleGiftType = (giftType: string) => {
    setSelectedGiftTypes((prev) =>
      prev.includes(giftType) ? prev.filter((g) => g !== giftType) : [...prev, giftType]
    );
  };
  const toggleRecipient = (r: string) => {
    setSelectedRecipients((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  };
  const toggleOccasionTag = (o: string) => {
    setSelectedOccasionTags((prev) =>
      prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o]
    );
  };
  const toggleStyleTag = (s: string) => {
    setSelectedStyleTags((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const handlePersonalizableToggle = (checked: boolean) => {
    setIsPersonalizable(checked);
    if (!checked) {
      setSelectedPersonalizationTypes([]);
      setPersonalizationLeadTimes({});
    }
  };

  const togglePersonalizationType = (typeName: string) => {
    setSelectedPersonalizationTypes((prev) => {
      if (prev.includes(typeName)) {
        setPersonalizationLeadTimes((lt) => {
          const copy = { ...lt };
          delete copy[typeName];
          return copy;
        });
        return prev.filter((n) => n !== typeName);
      } else {
        setPersonalizationLeadTimes((lt) => ({ ...lt, [typeName]: 0 }));
        return [...prev, typeName];
      }
    });
  };

  const addVariantOption = (idx: number, rawInput: string) => {
    const entries = rawInput.split(',').map((s) => s.trim()).filter(Boolean);
    const variant = productVariants[idx];
    const newOnes = entries.filter((e) => !variant.options.includes(e));
    if (!newOnes.length) return;
    const newPriceOverrides = { ...variant.priceOverrides };
    const newStockOverrides = { ...variant.stockOverrides };
    newOnes.forEach((opt) => {
      newPriceOverrides[opt] = basePrice;
      newStockOverrides[opt] = stock;
    });
    setProductVariants((prev) =>
      prev.map((v, i) =>
        i === idx
          ? { ...v, options: [...v.options, ...newOnes], priceOverrides: newPriceOverrides, stockOverrides: newStockOverrides, valueInput: '' }
          : v
      )
    );
  };

  const removeVariantOption = (idx: number, optIdx: number) => {
    const opt = productVariants[idx].options[optIdx];
    setProductVariants((prev) =>
      prev.map((v, i) => {
        if (i !== idx) return v;
        const newPrice = { ...v.priceOverrides };
        const newStock = { ...v.stockOverrides };
        delete newPrice[opt];
        delete newStock[opt];
        return { ...v, options: v.options.filter((_, oi) => oi !== optIdx), priceOverrides: newPrice, stockOverrides: newStock };
      })
    );
  };
  // When core category changes, reset subcategories
  const handleCoreCategoryChange = (cat: string) => {
    setSelectedCoreCategory(cat);
    setSelectedSubcategories([]);
    setSelectedSubSubcategory('');
  };

  const toggleSubcategory = (sub: string) => {
    setSelectedSubcategories((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
    setSelectedSubSubcategory('');
  };

  const loadData = useCallback(async () => {
    try {
      const vendorsRes = await apiClient.getVendors();
      if (vendorsRes.success && vendorsRes.data) {
        setVendors(vendorsRes.data);
      }

      // Load product data if in edit mode
      if (isEditMode && id) {
        const productRes = await apiClient.getProduct(id);
        if (productRes.success && productRes.data) {
          const product = productRes.data as any;

          // Populate form fields
          setVendorId(product.vendor?.id || product.vendor || '');
          setName(product.name || '');
          setDescription(product.description || '');
          // V2 IA Taxonomy
          setSelectedOccasionTags(product.occasionTags || []);
          setSelectedRecipients(product.recipientTags || []);
          setSelectedStyleTags(product.styleTags || []);
          if (product.subcategory) {
            // Check if the stored value is a sub-subcategory (level 3)
            const subSubEntry = Object.entries(SUB_SUBCATEGORIES_MAP).find(([, items]) =>
              (items as readonly string[]).includes(product.subcategory)
            );
            if (subSubEntry) {
              // It's a level-3 value: find the parent subcategory, then core category
              const subcategoryKey = subSubEntry[0];
              const coreCat = Object.entries(SUBCATEGORIES_MAP).find(([, subs]) =>
                (subs as readonly string[]).includes(subcategoryKey)
              )?.[0] ?? '';
              setSelectedCoreCategory(coreCat);
              setSelectedSubcategories([subcategoryKey]);
              setSelectedSubSubcategory(product.subcategory);
            } else {
              // It's a level-2 subcategory value
              const coreCat = Object.entries(SUBCATEGORIES_MAP).find(([, subs]) =>
                (subs as readonly string[]).includes(product.subcategory)
              )?.[0] ?? '';
              setSelectedCoreCategory(coreCat);
              setSelectedSubcategories(
                (product as any).subcategories?.length
                  ? (product as any).subcategories
                  : product.subcategory ? [product.subcategory] : []
              );
            }
          }
          // Legacy
          setSelectedOccasions(product.occasion || []);
          setSelectedGiftTypes(product.giftType || []);
          setBasePrice(product.basePrice?.toString() || '');
          setDiscountPercentage(product.discountPercentage?.toString() || '');
          setWeightValue((product as any).weightValue?.toString() || '');
          setWeightUnit((product as any).weightUnit || 'g');
          setMaterials(product.materials || []);
          const loadedKeyInfo = product.keyInfo?.length > 0 ? product.keyInfo : [{ label: '', value: '' }];
          setKeyInfo(loadedKeyInfo);
          setKeyInfoCustom(loadedKeyInfo.map((k: any) => k.label !== '' && !KEY_INFO_LABEL_PRESETS.includes(k.label)));
          setProductVariants(
            (product.variants || []).map((v: any) => ({
              name: v.name,
              options: v.options || [],
              valueInput: '',
              labelOpen: false,
              priceOverrides: Object.fromEntries((v.options || []).map((o: string) => [o, product.basePrice?.toString() || ''])),
              stockOverrides: Object.fromEntries((v.options || []).map((o: string) => [o, product.stock?.toString() || '0'])),
            }))
          );
          setPersonalizationType(product.personalizationType || 'none');
          const legacyMap: Record<string, string> = { engraving: 'Engraving', 'print-on': 'Print-on', sticker: 'Sticker' };
          const personalizationTypesArr: { name: string; extraDays: number }[] =
            (product as any).personalizationTypes?.length > 0
              ? (product as any).personalizationTypes
              : product.personalizationType && product.personalizationType !== 'none'
              ? [{ name: legacyMap[product.personalizationType] ?? product.personalizationType, extraDays: 0 }]
              : [];
          setSelectedPersonalizationTypes(personalizationTypesArr.map((t) => t.name));
          setIsPersonalizable(personalizationTypesArr.length > 0);
          const loadedLeadTimes: Record<string, number> = {};
          personalizationTypesArr.forEach((t) => { loadedLeadTimes[t.name] = t.extraDays ?? 0; });
          setPersonalizationLeadTimes(loadedLeadTimes);
          setEstimatedDeliveryDays(product.estimatedDeliveryDays?.toString() || '');
          setIsBestSeller(product.isBestSeller || false);
          setIsFeatured(product.isFeatured || false);
          setIsMadeInNigeria(product.isMadeInNigeria || false);
          setStock(product.stock?.toString() || '0');
          setSku(product.sku || '');
          setTags(product.tags || []);
          setExistingImages(product.images || []);
          const existingVids: Array<{ url: string; publicId: string; thumbnail?: string; isMain: boolean }> =
            (product as any).videos || [];
          setExistingVideos(existingVids);
          const mainVid = existingVids.find((v) => v.isMain);
          if (mainVid) setExistingMainVideoPublicId(mainVid.publicId);
        }
      }
    } catch (error) {
      toast.error(isEditMode ? 'Failed to load product' : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [isEditMode, id]);

  // Generate SKU when vendor is selected (only in create mode)
  const generateSku = useCallback(
    async (selectedVendorId: string) => {
      if (!selectedVendorId || isEditMode) return;

      try {
        const response = await apiClient.generateSku(selectedVendorId);
        if (response.success && response.data?.sku) {
          setSku(response.data.sku);
        }
      } catch (error) {
        console.error('Failed to generate SKU:', error);
      }
    },
    [isEditMode]
  );

  // Handle vendor selection change
  const handleVendorChange = (newVendorId: string) => {
    setVendorId(newVendorId);
    setVendorSearchOpen(false);
    if (!isEditMode) {
      generateSku(newVendorId);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Set vendor from URL parameter if present (only in create mode)
  useEffect(() => {
    if (!isEditMode) {
      const vendorParam = searchParams.get('vendor');
      if (vendorParam && vendors.length > 0) {
        // Verify the vendor exists in the vendors list
        const vendorExists = vendors.some((v) => v.id === vendorParam);
        if (vendorExists) {
          setVendorId(vendorParam);
        }
      }
    }
  }, [searchParams, vendors, isEditMode]);

  // Scroll to top when navigating between steps so the next step starts at the top
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 10) {
      toast.error('Maximum 10 images allowed');
      return;
    }

    setImages((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragIndex.current = index;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDrop = (dropIndex: number) => {
    if (dragIndex.current === null || dragIndex.current === dropIndex) {
      dragIndex.current = null;
      setDragOverIndex(null);
      return;
    }
    const reordered = [...existingImages];
    const [moved] = reordered.splice(dragIndex.current, 1);
    reordered.splice(dropIndex, 0, moved);
    setExistingImages(reordered.map((img, i) => ({ ...img, isMain: i === 0 })));
    dragIndex.current = null;
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    dragIndex.current = null;
    setDragOverIndex(null);
  };

  const handleNewDragStart = (e: React.DragEvent, index: number) => {
    newDragIndex.current = index;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleNewDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setNewDragOverIndex(index);
  };

  const handleNewDrop = (dropIndex: number) => {
    if (newDragIndex.current === null || newDragIndex.current === dropIndex) {
      newDragIndex.current = null;
      setNewDragOverIndex(null);
      return;
    }
    const fromIndex = newDragIndex.current;
    setImagePreviews((prev) => {
      const arr = [...prev];
      const [moved] = arr.splice(fromIndex, 1);
      arr.splice(dropIndex, 0, moved);
      return arr;
    });
    setImages((prev) => {
      const arr = [...prev];
      const [moved] = arr.splice(fromIndex, 1);
      arr.splice(dropIndex, 0, moved);
      return arr;
    });
    newDragIndex.current = null;
    setNewDragOverIndex(null);
  };

  const handleNewDragEnd = () => {
    newDragIndex.current = null;
    setNewDragOverIndex(null);
  };

  const addMaterial = () => {
    const entries = materialInput.split(',').map((m) => m.trim()).filter(Boolean);
    const newOnes = entries.filter((e) => !materials.includes(e));
    if (newOnes.length) {
      setMaterials((prev) => [...prev, ...newOnes]);
      setMaterialInput('');
    }
  };

  const removeMaterial = (index: number) => {
    setMaterials((prev) => prev.filter((_, i) => i !== index));
  };


  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags((prev) => [...prev, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    setTags((prev) => prev.filter((_, i) => i !== index));
  };

  const addKeyInfo = () => {
    setKeyInfo((prev) => [...prev, { label: '', value: '' }]);
    setKeyInfoCustom((prev) => [...prev, false]);
  };

  const updateKeyInfo = (index: number, field: 'label' | 'value', value: string) => {
    setKeyInfo((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const removeKeyInfo = (index: number) => {
    setKeyInfo((prev) => prev.filter((_, i) => i !== index));
    setKeyInfoCustom((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const videoFiles = files.filter((file) => file.type.startsWith('video/'));

    if (videoFiles.length + videos.length + existingVideos.length > 3) {
      toast.error('Maximum 3 videos allowed');
      return;
    }

    setVideos((prev) => [...prev, ...videoFiles]);
  };

  const removeVideo = (index: number) => {
    setVideos((prev) => prev.filter((_, i) => i !== index));
    if (mainVideoIndex === index) {
      setMainVideoIndex(null);
    } else if (mainVideoIndex !== null && mainVideoIndex > index) {
      setMainVideoIndex(mainVideoIndex - 1);
    }
  };

  const setVideoAsMain = (index: number) => {
    setMainVideoIndex(index);
    setExistingMainVideoPublicId(null);
  };

  const removeExistingVideo = (publicId: string) => {
    setVideosToDelete((prev) => [...prev, publicId]);
    setExistingVideos((prev) => prev.filter((v) => v.publicId !== publicId));
    if (existingMainVideoPublicId === publicId) setExistingMainVideoPublicId(null);
  };

  const setExistingVideoAsMain = (publicId: string) => {
    setExistingMainVideoPublicId(publicId);
    setMainVideoIndex(null);
  };

  const resetForm = () => {
    setVendorId('');
    setName('');
    setDescription('');
    // V2 IA
    setSelectedCoreCategory('');
    setSelectedSubcategories([]);
    setSelectedSubSubcategory('');
    setSelectedRecipients([]);
    setSelectedOccasionTags([]);
    setSelectedStyleTags([]);
    // Legacy
    setSelectedOccasions([]);
    setSelectedGiftTypes([]);
    setBasePrice('');
    setDiscountPercentage('');
    setWeightValue('');
    setWeightUnit('g');
    setMaterials([]);
    setMaterialInput('');
    setKeyInfo([{ label: '', value: '' }]);
    setKeyInfoCustom([false]);
    setProductVariants([]);
    setPersonalizationType('none');
    setIsPersonalizable(false);
    setSelectedPersonalizationTypes([]);
    setPersonalizationLeadTimes({});
    setEstimatedDeliveryDays('');
    setIsBestSeller(false);
    setIsFeatured(false);
    setIsMadeInNigeria(false);
    setStock('0');
    setSku('');
    setTags([]);
    setTagInput('');
    setImages([]);
    setImagePreviews([]);
    setVideos([]);
    setMainVideoIndex(null);
    setExistingVideos([]);
    setVideosToDelete([]);
    setExistingMainVideoPublicId(null);
    setCurrentStep(1);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!vendorId || !name || !description) {
          markStepTouched(1);
          toast.error('Please fill in all required fields');
          return false;
        }
        if (isEditMode) {
          if (images.length === 0 && existingImages.length === 0) {
            markStepTouched(1);
            toast.error('Please keep at least one product image or upload new ones');
            return false;
          }
        } else {
          if (images.length === 0) {
            markStepTouched(1);
            toast.error('Please upload at least one product image');
            return false;
          }
        }
        return true;
      case 2:
        if (!selectedCoreCategory) {
          markStepTouched(2);
          toast.error('Please select a category');
          return false;
        }
        if (selectedRecipients.length === 0) {
          markStepTouched(2);
          toast.error('Please select at least one recipient (who is this gift for?)');
          return false;
        }
        return true;
      case 3:
        if (!basePrice || parseFloat(basePrice) <= 0) {
          markStepTouched(3);
          toast.error('Please enter a valid base price greater than 0');
          return false;
        }
        if (discountPercentage && (parseFloat(discountPercentage) < 0 || parseFloat(discountPercentage) > 100)) {
          setTouched((prev) => ({ ...prev, discountPercentage: true }));
          toast.error('Discount must be between 0 and 100');
          return false;
        }
        if (!stock || parseInt(stock, 10) < 1) {
          setTouched((prev) => ({ ...prev, stock: true }));
          toast.error('Please enter a stock quantity of at least 1');
          return false;
        }
        return true;
      case 4:
        return true;
      case 5:
        if (!estimatedDeliveryDays || estimatedDeliveryDays.trim() === '') {
          setTouched((prev) => ({ ...prev, estimatedDeliveryDays: true }));
          toast.error('Please enter the estimated delivery time in days');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all steps before submitting
    for (let i = 1; i <= STEPS.length; i++) {
      if (!validateStep(i)) {
        setCurrentStep(i);
        return;
      }
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const formData = new FormData();
      formData.append('vendorId', vendorId);
      formData.append('name', name);
      formData.append('description', description);
      // V2 IA Taxonomy
      if (selectedRecipients.length) formData.append('recipientTags', JSON.stringify(selectedRecipients));
      if (selectedOccasionTags.length) formData.append('occasionTags', JSON.stringify(selectedOccasionTags));
      if (selectedStyleTags.length) formData.append('styleTags', JSON.stringify(selectedStyleTags));
      // Store primary subcategory + full list
      const subcategoryValue = selectedSubSubcategory || selectedSubcategories[0] || '';
      if (subcategoryValue) formData.append('subcategory', subcategoryValue);
      if (selectedSubcategories.length) formData.append('subcategories', JSON.stringify(selectedSubcategories));
      // Legacy (kept for backwards compat)
      if (selectedOccasions.length) formData.append('occasion', JSON.stringify(selectedOccasions));
      if (selectedGiftTypes.length) formData.append('giftType', JSON.stringify(selectedGiftTypes));
      formData.append('basePrice', basePrice);
      if (discountPercentage) formData.append('discountPercentage', discountPercentage);
      if (weightValue) {
        formData.append('weightValue', weightValue);
        formData.append('weightUnit', weightUnit);
      }
      if (materials.length) formData.append('materials', JSON.stringify(materials));
      if (keyInfo.length)
        formData.append('keyInfo', JSON.stringify(keyInfo.filter((k) => k.label && k.value)));
      const personalizationTypesPayload = selectedPersonalizationTypes.map((name) => ({
        name,
        extraDays: personalizationLeadTimes[name] ?? 0,
      }));
      formData.append('personalizationTypes', JSON.stringify(personalizationTypesPayload));
      const variantsPayload = productVariants
        .filter((v) => v.name.trim() && v.options.length > 0)
        .map((v) => ({
          name: v.name.trim(),
          options: v.options,
          priceModifiers: v.priceOverrides,
          stockModifiers: v.stockOverrides,
        }));
      formData.append('variants', JSON.stringify(variantsPayload));
      if (estimatedDeliveryDays) formData.append('estimatedDeliveryDays', estimatedDeliveryDays);
      // isBestSeller and isFeatured are admin-only — set via product management, not this form
      formData.append('isMadeInNigeria', String(isMadeInNigeria));
      formData.append('stock', stock || '0');
      formData.append('sku', sku);
      if (tags.length) formData.append('tags', JSON.stringify(tags));

      images.forEach((image) => {
        formData.append('images', image);
      });

      videos.forEach((video) => {
        formData.append('videos', video);
      });

      if (mainVideoIndex !== null) {
        formData.append('mainVideoIndex', String(mainVideoIndex));
      }

      // Add images to delete for edit mode
      if (isEditMode && imagesToDelete.length > 0) {
        formData.append('deleteImages', JSON.stringify(imagesToDelete));
      }
      // Send reorder for existing images
      if (isEditMode && existingImages.length > 0) {
        formData.append('imageOrder', JSON.stringify(existingImages.map((img) => img.publicId)));
      }
      // Videos to delete + which existing video is main
      if (isEditMode && videosToDelete.length > 0) {
        formData.append('deleteVideos', JSON.stringify(videosToDelete));
      }
      if (existingMainVideoPublicId) {
        formData.append('existingMainVideoPublicId', existingMainVideoPublicId);
      }

      // Call appropriate API method
      if (isEditMode) {
        await apiClient.updateProduct(id!, formData);
      } else {
        await apiClient.createProduct(formData);
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast.success(isEditMode ? 'Product updated successfully!' : 'Product created successfully!');
      setTimeout(() => {
        navigate('/products');
      }, 500);
    } catch (error) {
      setUploadProgress(0);
      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to ${isEditMode ? 'update' : 'create'} product`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <PageTransition className="space-y-6">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
        </div>
        <FormSkeleton />
      </PageTransition>
    );
  }

  return (
    <PageTransition className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditMode ? 'Edit Product' : 'Create Product'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEditMode
            ? 'Update product information and media files.'
            : 'Create a product on behalf of a vendor. The product will be auto-approved.'}
        </p>
      </div>

      {/* Stepper */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => (
                <React.Fragment key={step.id}>
                  <motion.div
                    className="flex flex-col items-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                        currentStep > step.id
                          ? 'bg-green-100 text-green-700'
                          : currentStep === step.id
                            ? 'text-white'
                            : 'bg-gray-100 text-gray-400'
                      )}
                      style={currentStep === step.id ? { backgroundColor: '#F6511E' } : {}}
                    >
                      {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                    </div>
                    <div className="mt-2 text-center hidden sm:block">
                      <p
                        className={cn(
                          'text-sm font-medium',
                          currentStep === step.id ? 'text-gray-900' : 'text-gray-500'
                        )}
                      >
                        {step.name}
                      </p>
                      <p className="text-xs text-gray-400">{step.description}</p>
                    </div>
                  </motion.div>
                  {index < STEPS.length - 1 && (
                    <div className="flex-1 h-0.5 bg-gray-200 mx-2 sm:mx-4">
                      <motion.div
                        className="h-full"
                        initial={{ width: 0 }}
                        animate={{ width: currentStep > step.id ? '100%' : '0%' }}
                        transition={{ duration: 0.4 }}
                        style={{
                          backgroundColor: currentStep > step.id ? '#10b981' : '#e5e7eb',
                        }}
                      />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
        onKeyDown={(e) => {
          // Prevent Enter key from submitting form unless on last step
          if (e.key === 'Enter' && currentStep < STEPS.length) {
            const target = e.target as HTMLElement;
            // Allow Enter in textareas
            if (target.tagName !== 'TEXTAREA') {
              e.preventDefault();
            }
          }
        }}
      >
        <AnimatePresence mode="wait">
          {/* Step 1: Product Details — name, description & media */}
          {currentStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Product Details</CardTitle>
                  <CardDescription>Select the vendor and enter the product name and description</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* ── Vendor + SKU ─────────────────────────────────────── */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 min-h-[24px]">
                        <Label htmlFor="vendor">Vendor *</Label>
                      </div>
                      <Popover open={vendorSearchOpen} onOpenChange={setVendorSearchOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            aria-expanded={vendorSearchOpen}
                            onBlur={() => setTouchedField('vendorId')}
                            className={cn(
                              'w-full justify-between font-normal',
                              !vendorId && 'text-muted-foreground',
                              !vendorId &&
                                (isSubmitting || touched.vendorId) &&
                                'border-red-500 ring-1 ring-red-500'
                            )}
                          >
                            {vendorId
                              ? (() => {
                                  const vendor = vendors.find((v) => v.id === vendorId);
                                  return vendor
                                    ? `${vendor.vendorInfo?.businessName || `${vendor.firstName} ${vendor.lastName}`}`
                                    : 'Select a vendor';
                                })()
                              : 'Select a vendor'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search vendors..." />
                            <CommandList>
                              <CommandEmpty>No vendor found.</CommandEmpty>
                              <CommandGroup>
                                {vendors.map((vendor) => (
                                  <CommandItem
                                    key={vendor.id}
                                    value={`${vendor.vendorInfo?.businessName || ''} ${vendor.firstName} ${vendor.lastName} ${vendor.email}`}
                                    onSelect={() => handleVendorChange(vendor.id)}
                                  >
                                    <Check
                                      className={cn(
                                        'mr-2 h-4 w-4',
                                        vendorId === vendor.id ? 'opacity-100' : 'opacity-0'
                                      )}
                                    />
                                    <div className="flex flex-col">
                                      <span className="font-medium">
                                        {vendor.vendorInfo?.businessName ||
                                          `${vendor.firstName} ${vendor.lastName}`}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {vendor.email}
                                      </span>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {!vendorId && (isSubmitting || touched.vendorId) && (
                        <p className="text-sm text-red-600 mt-1">Vendor is required</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 min-h-[24px]">
                        <Label htmlFor="sku">SKU</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-gray-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Auto-generated when you select a vendor.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        id="sku"
                        value={sku}
                        readOnly
                        placeholder={vendorId ? 'Generating...' : 'Select a vendor first'}
                        className="bg-gray-50 text-gray-500 cursor-default"
                      />
                      {!sku && (isSubmitting || touched.sku) && (
                        <p className="text-sm text-red-600 mt-1">SKU is required</p>
                      )}
                    </div>
                  </div>

                  {/* ── Product Name ──────────────────────────────────────── */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={() => setTouchedField('name')}
                      placeholder="Enter product name"
                      className={
                        !name && (isSubmitting || touched.name)
                          ? 'border-red-500 ring-1 ring-red-500'
                          : ''
                      }
                    />
                    {!name && (isSubmitting || touched.name) && (
                      <p className="text-sm text-red-600 mt-1">Product name is required</p>
                    )}
                  </div>

                  {/* ── Description ──────────────────────────────────────── */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="description">Description *</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 text-gray-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Detailed description shown on the product detail page. Include features, materials, and usage.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      onBlur={() => setTouchedField('description')}
                      placeholder="Detailed product description"
                      rows={4}
                      className={
                        !description && (isSubmitting || touched.description)
                          ? 'border-red-500 ring-1 ring-red-500'
                          : ''
                      }
                    />
                    {!description && (isSubmitting || touched.description) && (
                      <p className="text-sm text-red-600 mt-1">Description is required</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* ── Images ──────────────────────────────────────────────── */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Product Images *</CardTitle>
                  <CardDescription>
                    Upload up to 10 images. Drag to reorder — first image is the main image.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {existingImages.map((img, index) => (
                      <div
                        key={`existing-${img.publicId}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={() => handleDrop(index)}
                        onDragEnd={handleDragEnd}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-grab active:cursor-grabbing transition-all ${
                          dragOverIndex === index
                            ? 'border-orange-400 ring-2 ring-orange-200 scale-105'
                            : 'border-gray-200'
                        }`}
                      >
                        <img
                          src={img.url}
                          alt={`Existing ${index + 1}`}
                          draggable={false}
                          className="w-full h-full object-cover pointer-events-none select-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagesToDelete([...imagesToDelete, img.publicId]);
                            setExistingImages(existingImages.filter((_, i) => i !== index));
                          }}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        {img.isMain && mainVideoIndex === null && (
                          <span
                            className="absolute bottom-1 left-1 text-xs text-white px-2 py-0.5 rounded"
                            style={{ backgroundColor: '#F6511E' }}
                          >
                            Main
                          </span>
                        )}
                      </div>
                    ))}
                    {imagePreviews.map((preview, index) => (
                      <div
                        key={`new-${index}`}
                        draggable
                        onDragStart={(e) => handleNewDragStart(e, index)}
                        onDragOver={(e) => handleNewDragOver(e, index)}
                        onDrop={() => handleNewDrop(index)}
                        onDragEnd={handleNewDragEnd}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-grab active:cursor-grabbing transition-all ${
                          newDragOverIndex === index
                            ? 'border-orange-400 ring-2 ring-orange-200 scale-105'
                            : 'border-gray-200'
                        }`}
                      >
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          draggable={false}
                          className="w-full h-full object-cover pointer-events-none select-none"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        {!isEditMode && index === 0 && existingImages.length === 0 && mainVideoIndex === null && (
                          <span
                            className="absolute bottom-1 left-1 text-xs text-white px-2 py-0.5 rounded"
                            style={{ backgroundColor: '#F6511E' }}
                          >
                            Main
                          </span>
                        )}
                        <span className="absolute bottom-1 right-1 text-xs bg-blue-500 text-white px-2 py-0.5 rounded">
                          New
                        </span>
                      </div>
                    ))}
                    {images.length < 10 && (
                      <label
                        className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer transition-colors ${images.length === 0 && (isSubmitting || touched.images) ? 'border-red-500 ring-1 ring-red-500' : 'border-dashed border-gray-300 hover:border-[#F6511E]'}`}
                      >
                        <Upload className="w-6 h-6 text-gray-400" />
                        <span className="text-xs text-gray-500 mt-1">Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            handleImageChange(e);
                            setTouchedField('images');
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  {images.length === 0 && !isEditMode && (isSubmitting || touched.images) && (
                    <p className="text-sm text-red-600 mt-2">
                      Please upload at least one product image
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* ── Videos ──────────────────────────────────────────────── */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Product Videos (Optional)</CardTitle>
                  <CardDescription>
                    Upload up to 3 videos. Videos help customers see your product better.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {/* Existing uploaded videos (edit mode) */}
                    {existingVideos.map((video) => (
                      <div
                        key={video.publicId}
                        className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 bg-gray-100"
                      >
                        {video.thumbnail ? (
                          <img src={video.thumbnail} alt="Video thumbnail" className="w-full h-full object-cover" />
                        ) : (
                          <video src={video.url} className="w-full h-full object-cover" controls />
                        )}
                        <button
                          type="button"
                          onClick={() => removeExistingVideo(video.publicId)}
                          className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-2 left-2 flex gap-2">
                          {existingMainVideoPublicId === video.publicId ? (
                            <button
                              type="button"
                              onClick={() => setExistingMainVideoPublicId(null)}
                              className="text-xs text-white px-2 py-1 rounded flex items-center gap-1"
                              style={{ backgroundColor: '#F6511E' }}
                              title="Click to unset as main"
                            >
                              Main Video <X className="w-3 h-3" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setExistingVideoAsMain(video.publicId)}
                              className="text-xs text-white px-2 py-1 rounded bg-gray-700 hover:bg-gray-600"
                            >
                              Set as Main
                            </button>
                          )}
                        </div>
                        <div className="absolute top-2 left-2 text-xs text-white px-2 py-0.5 rounded bg-black/50">
                          Uploaded
                        </div>
                      </div>
                    ))}
                    {/* New videos staged for upload */}
                    {videos.map((video, index) => (
                      <div
                        key={index}
                        className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 bg-gray-100"
                      >
                        <video
                          src={URL.createObjectURL(video)}
                          className="w-full h-full object-cover"
                          controls
                        />
                        <button
                          type="button"
                          onClick={() => removeVideo(index)}
                          className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-2 left-2 flex gap-2">
                          {mainVideoIndex === index ? (
                            <button
                              type="button"
                              onClick={() => setMainVideoIndex(null)}
                              className="text-xs text-white px-2 py-1 rounded flex items-center gap-1"
                              style={{ backgroundColor: '#F6511E' }}
                              title="Click to unset as main"
                            >
                              Main Video <X className="w-3 h-3" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setVideoAsMain(index)}
                              className="text-xs text-white px-2 py-1 rounded bg-gray-700 hover:bg-gray-600"
                            >
                              Set as Main
                            </button>
                          )}
                        </div>
                        <div className="absolute top-2 left-2 text-xs text-white px-2 py-0.5 rounded bg-black/50">
                          {(video.size / (1024 * 1024)).toFixed(1)} MB
                        </div>
                      </div>
                    ))}
                    {videos.length + existingVideos.length < 3 && (
                      <label className="aspect-video rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-[#F6511E] transition-colors">
                        <Upload className="w-8 h-8 text-gray-400" />
                        <span className="text-sm text-gray-500 mt-2">Upload Video</span>
                        <span className="text-xs text-gray-400 mt-1">MP4, MOV (Max 50MB)</span>
                        <input
                          type="file"
                          accept="video/*"
                          multiple
                          onChange={handleVideoUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Category — category, subcategory, recipients & occasions */}
          {currentStep === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Category & Classification</CardTitle>
                  <CardDescription>Set the category, audience, and occasion for this product</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* ── 3-level Category Cascade ─────────────────────────── */}
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="coreCategory">Category <span className="text-red-500">*</span></Label>
                      <Select value={selectedCoreCategory} onValueChange={handleCoreCategoryChange}>
                        <SelectTrigger id="coreCategory" type="button" className={!selectedCoreCategory && (isSubmitting || touched.category) ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CORE_CATEGORY_OPTIONS.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!selectedCoreCategory && (isSubmitting || touched.category) && (
                        <p className="text-xs text-red-500 mt-1">Category is required</p>
                      )}
                    </div>

                    {subcategoryOptions.length > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="subcategory">Subcategory</Label>
                        <Select
                          value={selectedSubcategories[0] || ''}
                          onValueChange={(val) => {
                            setSelectedSubcategories(val ? [val] : []);
                            setSelectedSubSubcategory('');
                          }}
                        >
                          <SelectTrigger id="subcategory" type="button">
                            <SelectValue placeholder="Select a subcategory" />
                          </SelectTrigger>
                          <SelectContent>
                            {subcategoryOptions.map((sub) => (
                              <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {subSubcategoryOptions.length > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="subSubcategory">Type</Label>
                        <Select
                          value={selectedSubSubcategory}
                          onValueChange={setSelectedSubSubcategory}
                        >
                          <SelectTrigger id="subSubcategory" type="button">
                            <SelectValue placeholder="Select a type" />
                          </SelectTrigger>
                          <SelectContent>
                            {subSubcategoryOptions.map((item) => (
                              <SelectItem key={item} value={item}>{item}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* ── Recipients (Required) ─────────────────────────────── */}
                  <div className="space-y-2">
                    <Label>
                      Who is this gift for? *{' '}
                      <span className="text-gray-500 font-normal">(Select at least one)</span>
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {RECIPIENT_OPTIONS.map((recipient) => (
                        <button
                          key={recipient}
                          type="button"
                          onClick={() => {
                            toggleRecipient(recipient);
                            setTouchedField('recipients');
                          }}
                          className={cn(
                            'px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
                            selectedRecipients.includes(recipient)
                              ? 'border-transparent text-white'
                              : 'border-gray-300 text-gray-700 bg-white hover:border-[#F6511E]'
                          )}
                          style={
                            selectedRecipients.includes(recipient)
                              ? { backgroundColor: '#F6511E' }
                              : {}
                          }
                        >
                          {selectedRecipients.includes(recipient) && (
                            <Check className="w-3 h-3 inline mr-1" />
                          )}
                          {recipient}
                        </button>
                      ))}
                    </div>
                    {selectedRecipients.length === 0 && (isSubmitting || touched.recipients) && (
                      <p className="text-sm text-red-600 mt-1">
                        Please select who this gift is for
                      </p>
                    )}
                  </div>

                  {/* ── Occasion Tags (Optional) ──────────────────────────── */}
                  <div className="space-y-2">
                    <Label>
                      Occasion Tags{' '}
                      <span className="text-gray-500 font-normal">(Optional — select all that apply)</span>
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {OCCASION_OPTIONS.map((occasion) => (
                        <button
                          key={occasion}
                          type="button"
                          onClick={() => toggleOccasionTag(occasion)}
                          className={cn(
                            'px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
                            selectedOccasionTags.includes(occasion)
                              ? 'border-transparent text-white'
                              : 'border-gray-300 text-gray-700 bg-white hover:border-[#F6511E]'
                          )}
                          style={
                            selectedOccasionTags.includes(occasion)
                              ? { backgroundColor: '#F6511E' }
                              : {}
                          }
                        >
                          {selectedOccasionTags.includes(occasion) && (
                            <Check className="w-3 h-3 inline mr-1" />
                          )}
                          {occasion}
                        </button>
                      ))}
                    </div>
                  </div>

                  <hr className="border-gray-200" />

                  {/* ── Style / Vibe Tags ─────────────────────────────────── */}
                  <div className="space-y-2">
                    <Label>
                      Style / Vibe Tags{' '}
                      <span className="text-gray-500 font-normal">(Optional)</span>
                    </Label>
                    <p className="text-xs text-gray-500">Helps customers filter by mood and style.</p>
                    <div className="flex flex-wrap gap-2">
                      {STYLE_TAG_OPTIONS.map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => toggleStyleTag(style)}
                          className={cn(
                            'px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
                            selectedStyleTags.includes(style)
                              ? 'border-transparent text-white'
                              : 'border-gray-300 text-gray-700 bg-white hover:border-[#F6511E]'
                          )}
                          style={selectedStyleTags.includes(style) ? { backgroundColor: '#F6511E' } : {}}
                        >
                          {selectedStyleTags.includes(style) && <Check className="w-3 h-3 inline mr-1" />}
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Pricing & Inventory */}
          {currentStep === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Pricing & Inventory</CardTitle>
                  <CardDescription>Set pricing and stock information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 min-h-[24px]">
                        <Label htmlFor="basePrice">Base Price (₦) *</Label>
                      </div>
                      <Input
                        id="basePrice"
                        type="number"
                        step="0.01"
                        min="0"
                        value={basePrice}
                        onChange={(e) => setBasePrice(e.target.value)}
                        onBlur={() => setTouchedField('basePrice')}
                        placeholder="0.00"
                        className={
                          (!basePrice || parseFloat(basePrice) <= 0) && (isSubmitting || touched.basePrice)
                            ? 'border-red-500 ring-1 ring-red-500'
                            : ''
                        }
                      />
                      {(!basePrice || parseFloat(basePrice) <= 0) && (isSubmitting || touched.basePrice) && (
                        <p className="text-sm text-red-600 mt-1">Please enter a valid price greater than 0</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 min-h-[24px]">
                        <Label htmlFor="discountPercentage">Discount (%)</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">
                                Enter discount percentage (e.g., 20 for 20% off)
                              </p>
                            </TooltipContent>
                          </Tooltip>
                      </div>
                      <Input
                        id="discountPercentage"
                        type="number"
                        step="1"
                        min="0"
                        max="100"
                        value={discountPercentage}
                        onChange={(e) => setDiscountPercentage(e.target.value)}
                        placeholder="e.g., 20"
                        className={discountPercentage && (parseFloat(discountPercentage) < 0 || parseFloat(discountPercentage) > 100) ? 'border-red-500' : ''}
                      />
                      {discountPercentage && (parseFloat(discountPercentage) < 0 || parseFloat(discountPercentage) > 100) && (
                        <p className="text-xs text-red-500 mt-1">Discount must be between 0 and 100</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 min-h-[24px]">
                        <Label htmlFor="stock">Stock Quantity *</Label>
                      </div>
                      <Input
                        id="stock"
                        type="number"
                        min="1"
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                        onBlur={() => setTouchedField('stock')}
                        placeholder="1"
                        className={
                          (!stock || parseInt(stock, 10) < 1) && (isSubmitting || touched.stock)
                            ? 'border-red-500 ring-1 ring-red-500'
                            : ''
                        }
                      />
                      {(!stock || parseInt(stock, 10) < 1) && (isSubmitting || touched.stock) && (
                        <p className="text-sm text-red-600 mt-1">Stock quantity is required</p>
                      )}
                    </div>
                  </div>

                  {/* Live Price Preview */}
                  {(basePrice || discountPercentage) && (
                    <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                      <Label className="text-sm font-medium text-gray-700 mb-3 block">
                        Price Preview
                      </Label>
                      <div className="flex items-center gap-4">
                        <div className="flex items-baseline gap-2">
                          {discountedPrice !== null ? (
                            <>
                              <span className="text-2xl font-bold" style={{ color: '#F6511E' }}>
                                ₦
                                {discountedPrice.toLocaleString('en-NG', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                              <span className="text-lg text-gray-400 line-through">
                                ₦
                                {parseFloat(basePrice).toLocaleString('en-NG', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                              <span
                                className="px-2 py-1 text-sm font-medium rounded text-white"
                                style={{ backgroundColor: '#F6511E' }}
                              >
                                {discountPercentage}% OFF
                              </span>
                            </>
                          ) : basePrice ? (
                            <span className="text-2xl font-bold text-gray-900">
                              ₦
                              {parseFloat(basePrice).toLocaleString('en-NG', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Commission breakdown */}
                  {Number(basePrice) > 0 && (() => {
                    const price = Number(basePrice);
                    const commissionRate = isPersonalizable ? 0.18 : 0.12;
                    const commissionAmt = price * commissionRate;
                    const vendorNet = price - commissionAmt;
                    const fmt = (n: number) => n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    return (
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
                        <p className="text-sm font-semibold text-gray-800">Vendor earnings breakdown</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between text-gray-500">
                            <span>Customer pays</span>
                            <span className="font-medium text-gray-800">₦{fmt(price)}</span>
                          </div>
                          <div className="flex justify-between text-gray-500">
                            <span>
                              Ebunly commission ({isPersonalizable ? '18% — personalised' : '12%'})
                            </span>
                            <span className="font-medium text-red-500">− ₦{fmt(commissionAmt)}</span>
                          </div>
                          <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold text-gray-800">
                            <span>Vendor receives</span>
                            <span style={{ color: '#F6511E' }}>₦{fmt(vendorNet)}</span>
                          </div>
                        </div>
                        {!isPersonalizable && (
                          <p className="text-xs text-gray-400">
                            Commission increases to 18% if personalisation is enabled in Step 5.
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Product Variants */}
          {currentStep === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Product Variants</CardTitle>
                  <CardDescription>Options customers choose before buying — e.g. Size, Color, Material.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {productVariants.length === 0 && (
                    <p className="text-sm text-gray-500">No variants added. Click below to add one.</p>
                  )}
                  {productVariants.map((variant, vIdx) => (
                    <div key={vIdx} className="border border-gray-200 rounded-lg p-4 space-y-3">
                      {/* Variant label row */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Variant label</Label>
                          <button
                            type="button"
                            onClick={() => setProductVariants((prev) => prev.filter((_, i) => i !== vIdx))}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        {/* Combobox for label */}
                        <Popover
                          open={variant.labelOpen}
                          onOpenChange={(open) =>
                            setProductVariants((prev) =>
                              prev.map((v, i) => (i === vIdx ? { ...v, labelOpen: open } : v))
                            )
                          }
                        >
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className={cn(
                                'w-full text-left px-3 py-2 border rounded-md flex items-center justify-between text-sm transition-colors hover:border-[#F6511E]',
                                !variant.name && 'text-muted-foreground'
                              )}
                            >
                              <span>{variant.name || 'Choose or type a label (e.g. Size, Color)'}</span>
                              <ChevronsUpDown className="w-4 h-4 text-gray-400 shrink-0" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                            <Command>
                              <CommandInput
                                placeholder="Type a label..."
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const val = (e.target as HTMLInputElement).value.trim();
                                    if (val) {
                                      setProductVariants((prev) =>
                                        prev.map((v, i) => (i === vIdx ? { ...v, name: val, labelOpen: false } : v))
                                      );
                                    }
                                  }
                                }}
                              />
                              <CommandList>
                                <CommandEmpty>Press Enter to use this label</CommandEmpty>
                                <CommandGroup>
                                  {VARIANT_LABEL_PRESETS.map((preset) => (
                                    <CommandItem
                                      key={preset}
                                      value={preset}
                                      onSelect={() =>
                                        setProductVariants((prev) =>
                                          prev.map((v, i) => (i === vIdx ? { ...v, name: preset, labelOpen: false } : v))
                                        )
                                      }
                                    >
                                      <Check className={cn('mr-2 h-4 w-4', variant.name === preset ? 'opacity-100' : 'opacity-0')} />
                                      {preset}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Values field */}
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Values</Label>
                        <Input
                          disabled={!variant.name}
                          placeholder={variant.name ? (VARIANT_PLACEHOLDER_MAP[variant.name] ?? 'Type a value') : 'Select a label first'}
                          value={variant.valueInput}
                          onChange={(e) =>
                            setProductVariants((prev) =>
                              prev.map((v, i) => (i === vIdx ? { ...v, valueInput: e.target.value } : v))
                            )
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addVariantOption(vIdx, variant.valueInput);
                            }
                          }}
                          className={cn(!variant.name && 'bg-gray-50 text-gray-400')}
                        />
                        {variant.options.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {variant.options.map((opt, oIdx) => (
                              <span key={oIdx} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
                                {opt}
                                <button type="button" onClick={() => removeVariantOption(vIdx, oIdx)} className="text-gray-500 hover:text-red-500">
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Price & Stock table — only when at least one value exists */}
                      {variant.options.length > 0 && (
                        <div className="space-y-2 pt-1">
                          <p className="text-sm font-medium text-gray-700">Price & stock per option</p>
                          <p className="text-xs text-gray-500">Adjust if this option should cost or stock differently than the default below.</p>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-left text-xs text-gray-500 border-b">
                                  <th className="pb-2 pr-4 font-medium">Value</th>
                                  <th className="pb-2 pr-4 font-medium">Price override (₦)</th>
                                  <th className="pb-2 font-medium">Stock override</th>
                                </tr>
                              </thead>
                              <tbody>
                                {variant.options.map((opt) => (
                                  <tr key={opt} className="border-b last:border-0">
                                    <td className="py-2 pr-4 text-gray-700 font-medium">{opt}</td>
                                    <td className="py-2 pr-4">
                                      <Input
                                        type="number"
                                        min="0"
                                        value={variant.priceOverrides[opt] ?? basePrice}
                                        onChange={(e) =>
                                          setProductVariants((prev) =>
                                            prev.map((v, i) =>
                                              i === vIdx ? { ...v, priceOverrides: { ...v.priceOverrides, [opt]: e.target.value } } : v
                                            )
                                          )
                                        }
                                        className="h-8 w-32"
                                      />
                                    </td>
                                    <td className="py-2">
                                      <Input
                                        type="number"
                                        min="0"
                                        value={variant.stockOverrides[opt] ?? stock}
                                        onChange={(e) =>
                                          setProductVariants((prev) =>
                                            prev.map((v, i) =>
                                              i === vIdx ? { ...v, stockOverrides: { ...v.stockOverrides, [opt]: e.target.value } } : v
                                            )
                                          )
                                        }
                                        className="h-8 w-24"
                                      />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {productVariants.length >= 2 && (
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                      Note: per-option pricing currently works correctly for a single variant dimension. With two or more dimensions, pricing per combination (e.g. "Large + Gold") requires a combination matrix — this will be addressed in a future update.
                    </p>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    disabled={
                      productVariants.length > 0 &&
                      (productVariants[productVariants.length - 1].name.trim() === '' ||
                        productVariants[productVariants.length - 1].options.length === 0)
                    }
                    onClick={() =>
                      setProductVariants((prev) => [
                        ...prev,
                        { name: '', options: [], valueInput: '', labelOpen: false, priceOverrides: {}, stockOverrides: {} },
                      ])
                    }
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Variant
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 5: Personalization & Lead Time */}
          {currentStep === 5 && (
            <motion.div
              key="step-5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Personalization & Lead Time</CardTitle>
                  <CardDescription>Set how long this product takes to prepare, and how much longer each personalization option adds.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Est. delivery days — required, comes first */}
                  <div className="space-y-2">
                    <Label htmlFor="estimatedDeliveryDays">Est. Delivery (days) *</Label>
                    <p className="text-xs text-gray-500">How long this product takes to prepare with no personalization.</p>
                    <Input
                      id="estimatedDeliveryDays"
                      type="number"
                      min="0"
                      value={estimatedDeliveryDays}
                      onChange={(e) => setEstimatedDeliveryDays(e.target.value)}
                      onBlur={() => setTouched((prev) => ({ ...prev, estimatedDeliveryDays: true }))}
                      placeholder="e.g. 3"
                      className={cn(
                        'w-40',
                        (!estimatedDeliveryDays || estimatedDeliveryDays.trim() === '') &&
                          touched.estimatedDeliveryDays
                          ? 'border-red-500 ring-1 ring-red-500'
                          : ''
                      )}
                    />
                    {(!estimatedDeliveryDays || estimatedDeliveryDays.trim() === '') && touched.estimatedDeliveryDays && (
                      <p className="text-sm text-red-600">Estimated delivery is required</p>
                    )}
                  </div>

                  <hr className="border-gray-200" />

                  {/* Personalization toggle */}
                  <div className="flex items-center gap-3">
                    <Switch
                      type="button"
                      checked={isPersonalizable}
                      onCheckedChange={handlePersonalizableToggle}
                    />
                    <Label className="cursor-pointer" onClick={() => handlePersonalizableToggle(!isPersonalizable)}>
                      Does this product offer personalization?
                    </Label>
                  </div>

                  {isPersonalizable && (
                    <div className="space-y-4">
                      {/* Personalization type chips */}
                      <div className="space-y-2">
                        <Label>Personalization Types</Label>
                        <div className="flex flex-wrap gap-2">
                          {PERSONALIZATION_CHIP_OPTIONS.map((typeName) => {
                            const active = selectedPersonalizationTypes.includes(typeName);
                            return (
                              <button
                                key={typeName}
                                type="button"
                                onClick={() => togglePersonalizationType(typeName)}
                                className="px-4 py-2 rounded-full text-sm font-medium border transition-colors"
                                style={
                                  active
                                    ? { backgroundColor: '#F6511E', color: '#fff', borderColor: '#F6511E' }
                                    : { backgroundColor: '#fff', color: '#374151', borderColor: '#d1d5db' }
                                }
                              >
                                {active && <Check className="w-3 h-3 inline mr-1" />}
                                {typeName}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Per-type lead time */}
                      {selectedPersonalizationTypes.length > 0 && (
                        <div className="space-y-2">
                          {selectedPersonalizationTypes.map((typeName) => {
                            const extraDays = personalizationLeadTimes[typeName] ?? 0;
                            const baseDays = parseInt(estimatedDeliveryDays, 10) || 0;
                            const total = baseDays + extraDays;
                            return (
                              <div key={typeName} className="flex items-center gap-3 py-2 px-3 bg-gray-50 rounded-lg">
                                <span
                                  className="px-3 py-1 rounded-full text-sm font-medium text-white"
                                  style={{ backgroundColor: '#F6511E' }}
                                >
                                  {typeName}
                                </span>
                                <span className="text-sm text-gray-600">adds</span>
                                <Input
                                  type="number"
                                  min="0"
                                  value={extraDays}
                                  onChange={(e) =>
                                    setPersonalizationLeadTimes((lt) => ({
                                      ...lt,
                                      [typeName]: parseInt(e.target.value, 10) || 0,
                                    }))
                                  }
                                  className="h-8 w-20"
                                />
                                <span className="text-sm text-gray-600">days</span>
                                <span className="text-sm text-gray-400">→</span>
                                <span className="text-sm font-medium text-gray-800">total: {total} days</span>
                              </div>
                            );
                          })}
                          <p className="text-xs text-gray-500 pt-1">
                            Each option shows its own total lead time — a customer picks one method per order, so these don't add together.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 6: Additional Details & Badges */}
          {currentStep === 6 && (
            <motion.div
              key="step-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Additional Details</CardTitle>
                  <CardDescription>Specs and information shown on the product page.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Weight */}
                  <div className="space-y-2">
                    <Label htmlFor="weightValue">Weight</Label>
                    <div className="flex gap-2 w-48">
                      <Input
                        id="weightValue"
                        type="number"
                        min="0"
                        step="0.01"
                        value={weightValue}
                        onChange={(e) => setWeightValue(e.target.value)}
                        placeholder="e.g. 250"
                        className="flex-1"
                      />
                      <Select value={weightUnit} onValueChange={(v) => setWeightUnit(v as typeof weightUnit)}>
                        <SelectTrigger className="w-20" type="button">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="g">g</SelectItem>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="lb">lb</SelectItem>
                          <SelectItem value="oz">oz</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Materials — chip-on-enter */}
                  <div className="space-y-2">
                    <Label>Materials</Label>
                    <Input
                      value={materialInput}
                      onChange={(e) => setMaterialInput(e.target.value)}
                      placeholder="Type a material, then press Enter"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addMaterial();
                        }
                      }}
                    />
                    {materials.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {materials.map((material, index) => (
                          <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
                            {material}
                            <button type="button" onClick={() => removeMaterial(index)} className="text-gray-500 hover:text-red-500">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tags — chip-on-enter */}
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Type a tag, then press Enter"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                    />
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                            style={{ backgroundColor: '#fef3e7', color: '#F6511E' }}
                          >
                            {tag}
                            <button type="button" onClick={() => removeTag(index)} className="hover:opacity-70" style={{ color: '#F6511E' }}>
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Key Information — label preset dropdown */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label>Key Information</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              These rows appear under "KEY INFO" on the buyer's product page. Add facts that help customers decide.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={addKeyInfo}>
                        <Plus className="w-4 h-4 mr-1" /> Add More
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500">Shown on the buyer's product page.</p>
                    <div className="space-y-3">
                      {keyInfo.map((info, index) => {
                        const isCustom = keyInfoCustom[index] ?? false;
                        const selectVal = KEY_INFO_LABEL_PRESETS.includes(info.label)
                          ? info.label
                          : isCustom
                          ? 'custom'
                          : '';
                        return (
                          <div key={index} className="space-y-1">
                            <div className="flex gap-2 items-start">
                              <div className="flex-1 space-y-1">
                                <Select
                                  value={selectVal}
                                  onValueChange={(val) => {
                                    if (val === 'custom') {
                                      setKeyInfoCustom((prev) => prev.map((c, i) => (i === index ? true : c)));
                                      updateKeyInfo(index, 'label', '');
                                    } else {
                                      setKeyInfoCustom((prev) => prev.map((c, i) => (i === index ? false : c)));
                                      updateKeyInfo(index, 'label', val);
                                    }
                                  }}
                                >
                                  <SelectTrigger type="button">
                                    <SelectValue placeholder="Select a label" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {KEY_INFO_LABEL_PRESETS.map((p) => (
                                      <SelectItem key={p} value={p}>{p}</SelectItem>
                                    ))}
                                    <SelectItem value="custom">Custom...</SelectItem>
                                  </SelectContent>
                                </Select>
                                {isCustom && (
                                  <Input
                                    placeholder="Type your label"
                                    value={info.label}
                                    onChange={(e) => updateKeyInfo(index, 'label', e.target.value)}
                                  />
                                )}
                              </div>
                              <Input
                                placeholder="Value (e.g., 10cm x 15cm)"
                                value={info.value}
                                onChange={(e) => updateKeyInfo(index, 'value', e.target.value)}
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeKeyInfo(index)}
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                disabled={keyInfo.length === 1}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <hr className="border-gray-200" />

                  {/* Product Badges */}
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Product Badges</Label>
                    <p className="text-sm text-gray-500">Best Seller and Featured are assigned by admin.</p>
                    <div className="flex items-center gap-2">
                      <Switch type="button" checked={isMadeInNigeria} onCheckedChange={setIsMadeInNigeria} />
                      <Label>Made in Nigeria 🇳🇬</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {/* Progress Bar */}
          {isSubmitting && uploadProgress > 0 && (
            <div className="w-full">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Uploading product...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <motion.div
                  className="h-2.5 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  style={{
                    backgroundColor: '#F6511E',
                  }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1 || isSubmitting}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </Button>
            </motion.div>

            <div className="text-sm text-gray-500">
              Step {currentStep} of {STEPS.length}
            </div>

            {currentStep < STEPS.length ? (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={isSubmitting}
                  className="text-white gap-2"
                  style={{ backgroundColor: '#F6511E' }}
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            ) : (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="button"
                  onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
                  disabled={isSubmitting}
                  className="text-white px-8 hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#F6511E' }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {uploadProgress === 100 ? 'Finalizing...' : isEditMode ? 'Saving...' : 'Creating...'}
                    </>
                  ) : (
                    isEditMode ? 'Save Changes' : 'Create Product'
                  )}
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </form>
    </PageTransition>
  );
}
