import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { apiClient } from '../lib/api';
import { Vendor, Category, KeyInfo, PersonalizationType, OCCASION_OPTIONS, GIFT_TYPE_OPTIONS, PERSONALIZATION_TYPE_OPTIONS } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, Plus, X, Upload, HelpCircle, Info, Check, ArrowLeft, ArrowRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, PageTransition } from '@/lib/motion';
import { FormSkeleton } from '@/components/ui/skeletons';

const STEPS = [
  { id: 1, name: 'Basic Info', description: 'Product details' },
  { id: 2, name: 'Media', description: 'Images & videos' },
  { id: 3, name: 'Pricing', description: 'Price & inventory' },
  { id: 4, name: 'Details', description: 'Additional info' },
  { id: 5, name: 'Customization', description: 'Options & badges' },
];

export function CreateProductPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const [currentStep, setCurrentStep] = useState(1);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<Array<{ url: string; publicId: string; isMain: boolean }>>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);

  // Form state
  const [vendorId, setVendorId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  const [selectedGiftTypes, setSelectedGiftTypes] = useState<string[]>([]);
  const [basePrice, setBasePrice] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [weight, setWeight] = useState('');
  const [color, setColor] = useState('');
  const [materials, setMaterials] = useState<string[]>([]);
  const [materialInput, setMaterialInput] = useState('');
  const [keyInfo, setKeyInfo] = useState<KeyInfo[]>([]);
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
      return price - (price * discount / 100);
    }
    return null;
  }, [basePrice, discountPercentage]);

  // Validation touch state for highlighting required fields
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const setTouchedField = (name: string) => setTouched((prev) => ({ ...prev, [name]: true }));
  const markStepTouched = (step: number) => {
    switch (step) {
      case 1:
        setTouched((prev) => ({ ...prev, vendorId: true, name: true, description: true, categories: true, sku: true }));
        break;
      case 2:
        setTouched((prev) => ({ ...prev, images: true }));
        break;
      case 3:
        setTouched((prev) => ({ ...prev, basePrice: true }));
        break;
      default:
        break;
    }
  };

  // Toggle category selection
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Toggle occasion selection
  const toggleOccasion = (occasion: string) => {
    setSelectedOccasions((prev) =>
      prev.includes(occasion)
        ? prev.filter((o) => o !== occasion)
        : [...prev, occasion]
    );
  };

  // Toggle gift type selection
  const toggleGiftType = (giftType: string) => {
    setSelectedGiftTypes((prev) =>
      prev.includes(giftType)
        ? prev.filter((g) => g !== giftType)
        : [...prev, giftType]
    );
  };

  const loadData = useCallback(async () => {
    try {
      const [vendorsRes, categoriesRes] = await Promise.all([
        apiClient.getVendors(),
        apiClient.getCategories(),
      ]);

      if (vendorsRes.success && vendorsRes.data) {
        setVendors(vendorsRes.data);
      }
      if (categoriesRes.success && categoriesRes.data) {
        setCategories(categoriesRes.data);
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
          setShortDescription(product.shortDescription || '');
          setSelectedCategories(product.categories?.map((c: any) => c._id || c) || (product.category ? [product.category._id || product.category] : []));
          setSelectedOccasions(product.occasion || []);
          setSelectedGiftTypes(product.giftType || []);
          setBasePrice(product.basePrice?.toString() || '');
          setDiscountPercentage(product.discountPercentage?.toString() || '');
          setWeight(product.weight || '');
          setColor(product.color || '');
          setMaterials(product.materials || []);
          setKeyInfo(product.keyInfo || []);
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

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Set vendor from URL parameter if present (only in create mode)
  useEffect(() => {
    if (!isEditMode) {
      const vendorParam = searchParams.get('vendor');
      if (vendorParam && vendors.length > 0) {
        // Verify the vendor exists in the vendors list
        const vendorExists = vendors.some(v => v._id === vendorParam);
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
    setKeyInfo((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const removeKeyInfo = (index: number) => {
    setKeyInfo((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const videoFiles = files.filter(file => file.type.startsWith('video/'));

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
    setShortDescription('');
    setSelectedCategories([]);
    setSelectedOccasions([]);
    setSelectedGiftTypes([]);
    setBasePrice('');
    setDiscountPercentage('');
    setWeight('');
    setColor('');
    setMaterials([]);
    setMaterialInput('');
    setKeyInfo([]);
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
        if (!vendorId || !name || !description || selectedCategories.length === 0 || !sku) {
          markStepTouched(1);
          toast.error('Please fill in all required fields');
          return false;
        }
        return true;
      case 2:
        // In edit mode, allow if there are existing images
        if (isEditMode) {
          if (images.length === 0 && existingImages.length === 0) {
            markStepTouched(2);
            toast.error('Please keep at least one product image or upload new ones');
            return false;
          }
        } else {
          // In create mode, require at least one image
          if (images.length === 0) {
            markStepTouched(2);
            toast.error('Please upload at least one product image');
            return false;
          }
        }
        return true;
      case 3:
        if (!basePrice) {
          markStepTouched(3);
          toast.error('Please enter the base price');
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
      if (shortDescription) formData.append('shortDescription', shortDescription);
      formData.append('categories', JSON.stringify(selectedCategories));
      if (selectedOccasions.length) formData.append('occasion', JSON.stringify(selectedOccasions));
      if (selectedGiftTypes.length) formData.append('giftType', JSON.stringify(selectedGiftTypes));
      formData.append('basePrice', basePrice);
      if (discountPercentage) formData.append('discountPercentage', discountPercentage);
      if (weight) formData.append('weight', weight);
      if (color) formData.append('color', color);
      if (materials.length) formData.append('materials', JSON.stringify(materials));
      if (keyInfo.length) formData.append('keyInfo', JSON.stringify(keyInfo.filter(k => k.label && k.value)));
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
      toast.error(error instanceof Error ? error.message : `Failed to ${isEditMode ? 'update' : 'create'} product`);
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
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">{isEditMode ? 'Edit Product' : 'Create Product'}</h1>
        <p className="text-gray-600 mt-1">
          {isEditMode
            ? 'Update product information and media files.'
            : 'Create a product on behalf of a vendor. The product will be auto-approved.'}
        </p>
      </motion.div>

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
                    <p className={cn('text-sm font-medium', currentStep === step.id ? 'text-gray-900' : 'text-gray-500')}>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <AnimatePresence mode="wait">
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Select the vendor and enter product details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vendor">Vendor *</Label>
                  <Select value={vendorId} onValueChange={setVendorId}>
                    <SelectTrigger
                      onBlur={() => setTouchedField('vendorId')}
                      className={!vendorId && (isSubmitting || touched.vendorId) ? 'border-red-500 ring-1 ring-red-500' : ''}
                    >
                      <SelectValue placeholder="Select a vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor._id} value={vendor._id}>
                          {vendor.vendorInfo?.businessName || `${vendor.firstName} ${vendor.lastName}`} ({vendor.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!vendorId && (isSubmitting || touched.vendorId) && (
                    <p className="text-sm text-red-600 mt-1">Vendor is required</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    onBlur={() => setTouchedField('sku')}
                    placeholder="e.g., EB-001"
                    className={!sku && (isSubmitting || touched.sku) ? 'border-red-500 ring-1 ring-red-500' : ''}
                  />
                  {!sku && (isSubmitting || touched.sku) && (
                    <p className="text-sm text-red-600 mt-1">SKU is required</p>
                  )}
                </div>
              </div>

              {/* Categories - Multi-select */}
              <div className="space-y-2">
                <Label>Categories * <span className="text-gray-500 font-normal">(Select one or more)</span></Label>
                <div
                  className={cn(
                    'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-4 border rounded-lg',
                    selectedCategories.length === 0 && (isSubmitting || touched.categories) ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'
                  )}
                >
                  {categories.map((cat) => (
                    <div key={cat._id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`cat-${cat._id}`}
                        checked={selectedCategories.includes(cat._id)}
                        onCheckedChange={() => {
                          toggleCategory(cat._id);
                          setTouchedField('categories');
                        }}
                      />
                      <label
                        htmlFor={`cat-${cat._id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {cat.name}
                      </label>
                    </div>
                  ))}
                </div>
                {selectedCategories.length === 0 && (isSubmitting || touched.categories) && (
                  <p className="text-sm text-red-600 mt-1">Please select at least one category</p>
                )}
                {selectedCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedCategories.map((catId) => {
                      const cat = categories.find((c) => c._id === catId);
                      return cat ? (
                        <span
                          key={catId}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                          style={{ backgroundColor: '#fef3e7', color: '#F6511E' }}
                        >
                          {cat.name}
                          <button
                            type="button"
                            onClick={() => toggleCategory(catId)}
                            className="hover:text-red-500"
                            style={{ color: '#F6511E' }}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {/* Occasions - Multi-select */}
              <div className="space-y-2">
                <Label>Occasion <span className="text-gray-500 font-normal">(Optional - helps with filtering)</span></Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 border border-gray-200 rounded-lg">
                  {OCCASION_OPTIONS.map((occasion) => (
                    <div key={occasion} className="flex items-center space-x-2">
                      <Checkbox
                        id={`occ-${occasion}`}
                        checked={selectedOccasions.includes(occasion)}
                        onCheckedChange={() => toggleOccasion(occasion)}
                      />
                      <label
                        htmlFor={`occ-${occasion}`}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {occasion}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gift Types - Multi-select */}
              <div className="space-y-2">
                <Label>Gift Type <span className="text-gray-500 font-normal">(Optional - helps with filtering)</span></Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-4 border border-gray-200 rounded-lg">
                  {GIFT_TYPE_OPTIONS.map((giftType) => (
                    <div key={giftType} className="flex items-center space-x-2">
                      <Checkbox
                        id={`gift-${giftType}`}
                        checked={selectedGiftTypes.includes(giftType)}
                        onCheckedChange={() => toggleGiftType(giftType)}
                      />
                      <label
                        htmlFor={`gift-${giftType}`}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {giftType}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setTouchedField('name')}
                  placeholder="Enter product name"
                  className={!name && (isSubmitting || touched.name) ? 'border-red-500 ring-1 ring-red-500' : ''}
                />
                {!name && (isSubmitting || touched.name) && (
                  <p className="text-sm text-red-600 mt-1">Product name is required</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="shortDescription">Short Description</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Brief summary shown on product cards and search results (1-2 sentences)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="shortDescription"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Brief product summary"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="description">Full Description *</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Detailed description shown on the product detail page. Include features, materials, and usage.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => setTouchedField('description')}
                  placeholder="Detailed product description"
                  rows={4}
                  className={!description && (isSubmitting || touched.description) ? 'border-red-500 ring-1 ring-red-500' : ''}
                />
                {!description && (isSubmitting || touched.description) && (
                  <p className="text-sm text-red-600 mt-1">Full description is required</p>
                )}
              </div>
            </CardContent>
          </Card>
          </motion.div>
        )}

        {/* Step 2: Media */}
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
                <CardTitle>Product Images *</CardTitle>
                <CardDescription>Upload up to 10 images. First image will be the main image.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {/* Existing images in edit mode */}
                  {existingImages.map((img, index) => (
                    <div key={`existing-${index}`} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                      <img src={img.url} alt={`Existing ${index + 1}`} className="w-full h-full object-cover" />
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
                        <span className="absolute bottom-1 left-1 text-xs text-white px-2 py-0.5 rounded" style={{ backgroundColor: '#F6511E' }}>
                          Main
                        </span>
                      )}
                    </div>
                  ))}
                  {/* New images to upload */}
                  {imagePreviews.map((preview, index) => (
                    <div key={`new-${index}`} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                      <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {!isEditMode && index === 0 && existingImages.length === 0 && (
                        <span className="absolute bottom-1 left-1 text-xs text-white px-2 py-0.5 rounded" style={{ backgroundColor: '#F6511E' }}>
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
                        onChange={(e) => { handleImageChange(e); setTouchedField('images'); }}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                {images.length === 0 && (isSubmitting || touched.images) && (
                  <p className="text-sm text-red-600 mt-2">Please upload at least one product image</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Product Videos (Optional)</CardTitle>
                <CardDescription>Upload up to 3 videos. Videos help customers see your product better.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {videos.map((video, index) => (
                    <div key={index} className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                      <video src={URL.createObjectURL(video)} className="w-full h-full object-cover" controls />
                      <button
                        type="button"
                        onClick={() => removeVideo(index)}
                        className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-2 left-2 flex gap-2">
                        {mainVideoIndex === index ? (
                          <span className="text-xs text-white px-2 py-1 rounded" style={{ backgroundColor: '#F6511E' }}>
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="basePrice">Base Price (₦) *</Label>
                  <Input
                    id="basePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    onBlur={() => setTouchedField('basePrice')}
                    placeholder="0.00"
                    className={!basePrice && (isSubmitting || touched.basePrice) ? 'border-red-500 ring-1 ring-red-500' : ''}
                  />
                  {!basePrice && (isSubmitting || touched.basePrice) && (
                    <p className="text-sm text-red-600 mt-1">Base price is required</p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="discountPercentage">Discount (%)</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Enter discount percentage (e.g., 20 for 20% off)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock Quantity</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Live Price Preview */}
              {(basePrice || discountPercentage) && (
                <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">Price Preview</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-baseline gap-2">
                      {discountedPrice !== null ? (
                        <>
                          <span className="text-2xl font-bold" style={{ color: '#F6511E' }}>
                            ₦{discountedPrice.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-lg text-gray-400 line-through">
                            ₦{parseFloat(basePrice).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="px-2 py-1 text-sm font-medium rounded text-white" style={{ backgroundColor: '#F6511E' }}>
                            {discountPercentage}% OFF
                          </span>
                        </>
                      ) : basePrice ? (
                        <span className="text-2xl font-bold text-gray-900">
                          ₦{parseFloat(basePrice).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

        {/* Step 4: Product Details */}
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
              <CardTitle>Product Details</CardTitle>
              <CardDescription>Add additional product information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight</Label>
                  <Input
                    id="weight"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="e.g., 250g"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="e.g., Natural Brown"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="estimatedDeliveryDays">Est. Delivery (days)</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 text-gray-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Enter a single number or range (e.g., "5" or "3-5")</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="estimatedDeliveryDays"
                    value={estimatedDeliveryDays}
                    onChange={(e) => setEstimatedDeliveryDays(e.target.value)}
                    placeholder="e.g., 3-5 or 7"
                  />
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
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Product specs like dimensions, weight, material details. E.g., "Size: 10x15cm" or "Care: Hand wash only"</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addKeyInfo}>
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>
                {keyInfo.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No key information added yet</p>
                ) : (
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
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
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
                <CardDescription>Does this product offer personalization options?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="personalizationType">Type of Personalization</Label>
                  <Select value={personalizationType} onValueChange={(value) => setPersonalizationType(value as PersonalizationType)}>
                    <SelectTrigger>
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
                      : `Customers can request ${PERSONALIZATION_TYPE_OPTIONS.find(o => o.value === personalizationType)?.label.toLowerCase()} for this product`}
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
                    <Switch checked={isBestSeller} onCheckedChange={setIsBestSeller} />
                    <Label>Best Seller</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
                    <Label>Featured</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={isMadeInNigeria} onCheckedChange={setIsMadeInNigeria} />
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
                  type="submit"
                  disabled={isSubmitting}
                  className="text-white px-8 hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#F6511E' }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {uploadProgress === 100 ? 'Finalizing...' : 'Creating...'}
                    </>
                  ) : (
                    'Create Product'
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
