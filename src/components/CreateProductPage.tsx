import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

const STEPS = [
  { id: 1, name: 'Product Details', description: 'Name, description & media' },
  { id: 2, name: 'Category', description: 'Category, tags & audience' },
  { id: 3, name: 'Pricing', description: 'Price & inventory' },
  { id: 4, name: 'Additional Details', description: 'Style, specs & info' },
  { id: 5, name: 'Customization', description: 'Options & badges' },
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
  const [vendorSearchOpen, setVendorSearchOpen] = useState(false);


  // Form state
  const [vendorId, setVendorId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  // Form state — V2 IA Taxonomy
  const [selectedCoreCategory, setSelectedCoreCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedSubSubcategory, setSelectedSubSubcategory] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [selectedOccasionTags, setSelectedOccasionTags] = useState<string[]>([]);
  const [selectedStyleTags, setSelectedStyleTags] = useState<string[]>([]);
  // Legacy form state
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  const [selectedGiftTypes, setSelectedGiftTypes] = useState<string[]>([]);
  const [basePrice, setBasePrice] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [weight, setWeight] = useState('');
  const [color, setColor] = useState('');
  const [materials, setMaterials] = useState<string[]>([]);
  const [materialInput, setMaterialInput] = useState('');
  const [keyInfo, setKeyInfo] = useState<KeyInfo[]>([{ label: '', value: '' }]);
  const [personalizationType, setPersonalizationType] = useState<PersonalizationType>('none');
  const [estimatedDeliveryDays, setEstimatedDeliveryDays] = useState('');
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
  const subSubcategoryOptions = selectedSubcategory ? SUB_SUBCATEGORIES_MAP[selectedSubcategory] ?? [] : [];

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
  // When core category changes, reset subcategory
  const handleCoreCategoryChange = (cat: string) => {
    setSelectedCoreCategory(cat);
    setSelectedSubcategory('');
    setSelectedSubSubcategory('');
  };

  const handleSubcategoryChange = (sub: string) => {
    setSelectedSubcategory(sub);
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
          setVendorId(product.vendor?._id || product.vendor || '');
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
              setSelectedSubcategory(subcategoryKey);
              setSelectedSubSubcategory(product.subcategory);
            } else {
              // It's a level-2 subcategory value
              const coreCat = Object.entries(SUBCATEGORIES_MAP).find(([, subs]) =>
                (subs as readonly string[]).includes(product.subcategory)
              )?.[0] ?? '';
              setSelectedCoreCategory(coreCat);
              setSelectedSubcategory(product.subcategory);
            }
          }
          // Legacy
          setSelectedOccasions(product.occasion || []);
          setSelectedGiftTypes(product.giftType || []);
          setBasePrice(product.basePrice?.toString() || '');
          setDiscountPercentage(product.discountPercentage?.toString() || '');
          setWeight(product.weight || '');
          setColor(product.color || '');
          setMaterials(product.materials || []);
          setKeyInfo(product.keyInfo?.length > 0 ? product.keyInfo : [{ label: '', value: '' }]);
          setPersonalizationType(product.personalizationType || 'none');
          setEstimatedDeliveryDays(product.estimatedDeliveryDays?.toString() || '');
          setIsBestSeller(product.isBestSeller || false);
          setIsFeatured(product.isFeatured || false);
          setIsMadeInNigeria(product.isMadeInNigeria || false);
          setStock(product.stock?.toString() || '0');
          setSku(product.sku || '');
          setTags(product.tags || []);
          setExistingImages(product.images || []);
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
        const vendorExists = vendors.some((v) => v._id === vendorParam);
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

  const addMaterial = () => {
    if (materialInput.trim() && !materials.includes(materialInput.trim())) {
      setMaterials((prev) => [...prev, materialInput.trim()]);
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
  };

  const updateKeyInfo = (index: number, field: 'label' | 'value', value: string) => {
    setKeyInfo((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const removeKeyInfo = (index: number) => {
    setKeyInfo((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const videoFiles = files.filter((file) => file.type.startsWith('video/'));

    if (videoFiles.length + videos.length > 3) {
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
  };

  const resetForm = () => {
    setVendorId('');
    setName('');
    setDescription('');
    // V2 IA
    setSelectedCoreCategory('');
    setSelectedSubcategory('');
    setSelectedSubSubcategory('');
    setSelectedRecipients([]);
    setSelectedOccasionTags([]);
    setSelectedStyleTags([]);
    // Legacy
    setSelectedOccasions([]);
    setSelectedGiftTypes([]);
    setBasePrice('');
    setDiscountPercentage('');
    setWeight('');
    setColor('');
    setMaterials([]);
    setMaterialInput('');
    setKeyInfo([{ label: '', value: '' }]);
    setPersonalizationType('none');
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
    setCurrentStep(1);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!vendorId || !name || !description || !sku) {
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
      // Store the most specific level selected (sub-subcategory if chosen, else subcategory)
      const subcategoryValue = selectedSubSubcategory || selectedSubcategory;
      if (subcategoryValue) formData.append('subcategory', subcategoryValue);
      // Legacy (kept for backwards compat)
      if (selectedOccasions.length) formData.append('occasion', JSON.stringify(selectedOccasions));
      if (selectedGiftTypes.length) formData.append('giftType', JSON.stringify(selectedGiftTypes));
      formData.append('basePrice', basePrice);
      if (discountPercentage) formData.append('discountPercentage', discountPercentage);
      if (weight) formData.append('weight', weight);
      if (color) formData.append('color', color);
      if (materials.length) formData.append('materials', JSON.stringify(materials));
      if (keyInfo.length)
        formData.append('keyInfo', JSON.stringify(keyInfo.filter((k) => k.label && k.value)));
      if (personalizationType && personalizationType !== 'none') {
        formData.append('personalizationType', personalizationType);
      }
      if (estimatedDeliveryDays) formData.append('estimatedDeliveryDays', estimatedDeliveryDays);
      formData.append('isBestSeller', String(isBestSeller));
      formData.append('isFeatured', String(isFeatured));
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
                                  const vendor = vendors.find((v) => v._id === vendorId);
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
                                    key={vendor._id}
                                    value={`${vendor.vendorInfo?.businessName || ''} ${vendor.firstName} ${vendor.lastName} ${vendor.email}`}
                                    onSelect={() => handleVendorChange(vendor._id)}
                                  >
                                    <Check
                                      className={cn(
                                        'mr-2 h-4 w-4',
                                        vendorId === vendor._id ? 'opacity-100' : 'opacity-0'
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
                        <Label htmlFor="sku">SKU *</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-gray-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Auto-generated when you select a vendor. You can modify it if needed.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        id="sku"
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        onBlur={() => setTouchedField('sku')}
                        placeholder={vendorId ? 'Generating...' : 'Select a vendor first'}
                        className={
                          !sku && (isSubmitting || touched.sku)
                            ? 'border-red-500 ring-1 ring-red-500'
                            : ''
                        }
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
                    Upload up to 10 images. First image will be the main image.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {existingImages.map((img, index) => (
                      <div
                        key={`existing-${index}`}
                        className="relative aspect-square rounded-lg overflow-hidden border border-gray-200"
                      >
                        <img
                          src={img.url}
                          alt={`Existing ${index + 1}`}
                          className="w-full h-full object-cover"
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
                        {img.isMain && (
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
                        className="relative aspect-square rounded-lg overflow-hidden border border-gray-200"
                      >
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        {!isEditMode && index === 0 && existingImages.length === 0 && (
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
                            <span
                              className="text-xs text-white px-2 py-1 rounded"
                              style={{ backgroundColor: '#F6511E' }}
                            >
                              Main Video
                            </span>
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
                    {videos.length < 3 && (
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
                          value={selectedSubcategory}
                          onValueChange={handleSubcategoryChange}
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
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Additional Details */}
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
                  <CardTitle>Additional Details</CardTitle>
                  <CardDescription>Style tags, specs and product information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">

                  {/* ── Style Tags ────────────────────────────────────────── */}
                  <div className="space-y-2">
                    <Label>
                      Style / Vibe Tags{' '}
                      <span className="text-gray-500 font-normal">(Optional)</span>
                    </Label>
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
                          style={
                            selectedStyleTags.includes(style)
                              ? { backgroundColor: '#F6511E' }
                              : {}
                          }
                        >
                          {selectedStyleTags.includes(style) && (
                            <Check className="w-3 h-3 inline mr-1" />
                          )}
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 min-h-[24px]">
                        <Label htmlFor="weight">Weight</Label>
                      </div>
                      <Input
                        id="weight"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="e.g., 250g"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 min-h-[24px]">
                        <Label htmlFor="color">Color</Label>
                      </div>
                      <Input
                        id="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        placeholder="e.g., Natural Brown"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 min-h-[24px]">
                        <Label htmlFor="estimatedDeliveryDays">Est. Delivery (days)</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="w-4 h-4 text-gray-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">
                                Enter a single number or range (e.g., "5" or "3-5")
                              </p>
                            </TooltipContent>
                          </Tooltip>
                      </div>
                      <Input
                        id="estimatedDeliveryDays"
                        value={estimatedDeliveryDays}
                        onChange={(e) => setEstimatedDeliveryDays(e.target.value)}
                        placeholder="e.g., 3-5 or 7"
                        className={estimatedDeliveryDays && !/^\d+(-\d+)?$/.test(estimatedDeliveryDays.trim()) ? 'border-red-500' : ''}
                      />
                      {estimatedDeliveryDays && !/^\d+(-\d+)?$/.test(estimatedDeliveryDays.trim()) && (
                        <p className="text-xs text-red-500 mt-1">Enter a number or range e.g. 3 or 3-5</p>
                      )}
                    </div>
                  </div>

                  {/* Materials */}
                  <div className="space-y-2">
                    <Label>Materials</Label>
                    <div className="flex gap-2">
                      <Input
                        value={materialInput}
                        onChange={(e) => setMaterialInput(e.target.value)}
                        placeholder="Add a material"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMaterial())}
                      />
                      <Button type="button" variant="outline" onClick={addMaterial}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {materials.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {materials.map((material, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm"
                          >
                            {material}
                            <button
                              type="button"
                              onClick={() => removeMaterial(index)}
                              className="text-gray-500 hover:text-red-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex gap-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Add a tag"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      />
                      <Button type="button" variant="outline" onClick={addTag}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                            style={{ backgroundColor: '#fef3e7', color: '#F6511E' }}
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(index)}
                              className="hover:text-red-500"
                              style={{ color: '#F6511E' }}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Key Info */}
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
                                Product specs like dimensions, weight, material details. E.g.,
                                "Size: 10x15cm" or "Care: Hand wash only"
                              </p>
                            </TooltipContent>
                          </Tooltip>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={addKeyInfo}>
                        <Plus className="w-4 h-4 mr-1" /> Add More
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500">
                      Add product specifications that customers should know about.
                    </p>
                    <div className="space-y-3">
                      {keyInfo.map((info, index) => (
                        <div key={index} className="flex gap-2 items-start">
                          <Input
                            placeholder="Label (e.g., Dimensions)"
                            value={info.label}
                            onChange={(e) => updateKeyInfo(index, 'label', e.target.value)}
                            className="flex-1"
                          />
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
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 5: Customization & Badges */}
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
                  <CardTitle>Personalization</CardTitle>
                  <CardDescription>
                    Does this product offer personalization options?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="personalizationType">Type of Personalization</Label>
                    <Select
                      value={personalizationType}
                      onValueChange={(value) =>
                        setPersonalizationType(value as PersonalizationType)
                      }
                    >
                      <SelectTrigger type="button">
                        <SelectValue placeholder="Select personalization type" />
                      </SelectTrigger>
                      <SelectContent>
                        {PERSONALIZATION_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500">
                      {personalizationType === 'none'
                        ? 'This product does not offer personalization'
                        : `Customers can request ${PERSONALIZATION_TYPE_OPTIONS.find((o) => o.value === personalizationType)?.label.toLowerCase()} for this product`}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Product Badges</CardTitle>
                  <CardDescription>Highlight special features of this product</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center gap-2">
                      <Switch type="button" checked={isBestSeller} onCheckedChange={setIsBestSeller} />
                      <Label>Best Seller</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch type="button" checked={isFeatured} onCheckedChange={setIsFeatured} />
                      <Label>Featured</Label>
                    </div>
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
