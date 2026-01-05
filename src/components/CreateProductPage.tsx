import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/api';
import { Vendor, Category, KeyInfo, PersonalizationOption } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Plus, X, Upload, HelpCircle, Info, Check, ArrowLeft, ArrowRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 1, name: 'Basic Info', description: 'Product details' },
  { id: 2, name: 'Media', description: 'Images & videos' },
  { id: 3, name: 'Pricing', description: 'Price & inventory' },
  { id: 4, name: 'Details', description: 'Additional info' },
  { id: 5, name: 'Customization', description: 'Options & badges' },
];

export function CreateProductPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Form state
  const [vendorId, setVendorId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [category, setCategory] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [weight, setWeight] = useState('');
  const [color, setColor] = useState('');
  const [materials, setMaterials] = useState<string[]>([]);
  const [materialInput, setMaterialInput] = useState('');
  const [keyInfo, setKeyInfo] = useState<KeyInfo[]>([]);
  const [personalizationOptions, setPersonalizationOptions] = useState<PersonalizationOption[]>([]);
  const [isPersonalizable, setIsPersonalizable] = useState(false);
  const [estimatedDeliveryDays, setEstimatedDeliveryDays] = useState('');
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [stock, setStock] = useState('0');
  const [sku, setSku] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videos, setVideos] = useState<File[]>([]);
  const [mainVideoIndex, setMainVideoIndex] = useState<number | null>(null);

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
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const addPersonalizationOption = () => {
    setPersonalizationOptions((prev) => [
      ...prev,
      { name: '', type: 'text', required: false },
    ]);
  };

  const updatePersonalizationOption = (
    index: number,
    field: keyof PersonalizationOption,
    value: unknown
  ) => {
    setPersonalizationOptions((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const removePersonalizationOption = (index: number) => {
    setPersonalizationOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setVendorId('');
    setName('');
    setDescription('');
    setShortDescription('');
    setCategory('');
    setBasePrice('');
    setCompareAtPrice('');
    setWeight('');
    setColor('');
    setMaterials([]);
    setMaterialInput('');
    setKeyInfo([]);
    setPersonalizationOptions([]);
    setIsPersonalizable(false);
    setEstimatedDeliveryDays('');
    setIsBestSeller(false);
    setIsFeatured(false);
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
        if (!vendorId || !name || !description || !category || !sku) {
          toast.error('Please fill in all required fields');
          return false;
        }
        return true;
      case 2:
        if (images.length === 0) {
          toast.error('Please upload at least one product image');
          return false;
        }
        return true;
      case 3:
        if (!basePrice) {
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
      formData.append('category', category);
      formData.append('basePrice', basePrice);
      if (compareAtPrice) formData.append('compareAtPrice', compareAtPrice);
      if (weight) formData.append('weight', weight);
      if (color) formData.append('color', color);
      if (materials.length) formData.append('materials', JSON.stringify(materials));
      if (keyInfo.length) formData.append('keyInfo', JSON.stringify(keyInfo.filter(k => k.label && k.value)));
      if (personalizationOptions.length) {
        formData.append('personalizationOptions', JSON.stringify(personalizationOptions.filter(p => p.name)));
      }
      formData.append('isPersonalizable', String(isPersonalizable));
      if (estimatedDeliveryDays) formData.append('estimatedDeliveryDays', estimatedDeliveryDays);
      formData.append('isBestSeller', String(isBestSeller));
      formData.append('isFeatured', String(isFeatured));
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

      await apiClient.createProduct(formData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast.success('Product created successfully!');
      setTimeout(() => {
        resetForm();
        setUploadProgress(0);
      }, 1000);
    } catch (error) {
      setUploadProgress(0);
      toast.error(error instanceof Error ? error.message : 'Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#4a3032' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create Product</h1>
        <p className="text-gray-600 mt-1">
          Create a product on behalf of a vendor. The product will be auto-approved.
        </p>
      </div>

      {/* Stepper */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                      currentStep > step.id
                        ? 'bg-green-100 text-green-700'
                        : currentStep === step.id
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-400'
                    )}
                    style={currentStep === step.id ? { backgroundColor: '#4a3032' } : {}}
                  >
                    {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                  </div>
                  <div className="mt-2 text-center hidden sm:block">
                    <p className={cn('text-sm font-medium', currentStep === step.id ? 'text-gray-900' : 'text-gray-500')}>
                      {step.name}
                    </p>
                    <p className="text-xs text-gray-400">{step.description}</p>
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 bg-gray-200 mx-2 sm:mx-4">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        backgroundColor: currentStep > step.id ? '#10b981' : '#e5e7eb',
                        width: currentStep > step.id ? '100%' : '0%',
                      }}
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
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
                    <SelectTrigger className={!vendorId && isSubmitting ? 'border-red-500' : ''}>
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className={!category && isSubmitting ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat._id} value={cat._id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter product name"
                  className={!name && isSubmitting ? 'border-red-500' : ''}
                />
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
                  placeholder="Detailed product description"
                  rows={4}
                  className={!description && isSubmitting ? 'border-red-500' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g., CB-001"
                  className={!sku && isSubmitting ? 'border-red-500' : ''}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Media */}
        {currentStep === 2 && (
          <>
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Product Images *</CardTitle>
                <CardDescription>Upload up to 10 images. First image will be the main image.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                      <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {index === 0 && (
                        <span className="absolute bottom-1 left-1 text-xs text-white px-2 py-0.5 rounded" style={{ backgroundColor: '#4a3032' }}>
                          Main
                        </span>
                      )}
                    </div>
                  ))}
                  {images.length < 10 && (
                    <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-[#4a3032] transition-colors">
                      <Upload className="w-6 h-6 text-gray-400" />
                      <span className="text-xs text-gray-500 mt-1">Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
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
                          <span className="text-xs text-white px-2 py-1 rounded" style={{ backgroundColor: '#4a3032' }}>
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
                    <label className="aspect-video rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-[#4a3032] transition-colors">
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
          </>
        )}

        {/* Step 3: Pricing & Inventory */}
        {currentStep === 3 && (
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
                    placeholder="0.00"
                    className={!basePrice && isSubmitting ? 'border-red-500' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="compareAtPrice">Compare at Price (₦)</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Original price before discount. Shows as strikethrough to display savings.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="compareAtPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={compareAtPrice}
                    onChange={(e) => setCompareAtPrice(e.target.value)}
                    placeholder="Original price for discount display"
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
            </CardContent>
          </Card>
        )}

        {/* Step 4: Product Details */}
        {currentStep === 4 && (
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
                        style={{ backgroundColor: '#f5f3f3', color: '#4a3032' }}
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(index)}
                          className="hover:text-red-500"
                          style={{ color: '#4a3032' }}
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
        )}

        {/* Step 5: Customization & Badges */}
        {currentStep === 5 && (
          <>
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Personalization Options</CardTitle>
                  <CardDescription>Allow customers to personalize this product</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={isPersonalizable}
                      onCheckedChange={setIsPersonalizable}
                    />
                    <Label className="text-sm">Enable Personalization</Label>
                  </div>
                  {isPersonalizable && (
                    <Button type="button" variant="outline" size="sm" onClick={addPersonalizationOption}>
                      <Plus className="w-4 h-4 mr-1" /> Add Option
                    </Button>
                  )}
                </div>
              </CardHeader>
              {isPersonalizable && (
                <CardContent>
                  {personalizationOptions.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No personalization options added yet</p>
                  ) : (
                    <div className="space-y-4">
                      {personalizationOptions.map((option, index) => (
                        <div key={index} className="p-4 border rounded-lg space-y-3">
                          <div className="flex gap-2 items-start">
                            <Input
                              placeholder="Option name (e.g., Engraving Text)"
                              value={option.name}
                              onChange={(e) => updatePersonalizationOption(index, 'name', e.target.value)}
                              className="flex-1"
                            />
                            <Select
                              value={option.type}
                              onValueChange={(value) => updatePersonalizationOption(index, 'type', value as 'text' | 'select' | 'color')}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="select">Select</SelectItem>
                                <SelectItem value="color">Color</SelectItem>
                              </SelectContent>
                            </Select>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={option.required}
                                onCheckedChange={(value) => updatePersonalizationOption(index, 'required', value)}
                              />
                              <span className="text-xs text-gray-500">Required</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removePersonalizationOption(index)}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              placeholder="Placeholder text"
                              value={option.placeholder || ''}
                              onChange={(e) => updatePersonalizationOption(index, 'placeholder', e.target.value)}
                            />
                            <Input
                              type="number"
                              placeholder="Price modifier (₦)"
                              value={option.priceModifier || ''}
                              onChange={(e) => updatePersonalizationOption(index, 'priceModifier', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
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
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Navigation Buttons */}
        <div className="space-y-4">
          {/* Progress Bar */}
          {isSubmitting && uploadProgress > 0 && (
            <div className="w-full">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Uploading product...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: '#4a3032',
                    width: `${uploadProgress}%`,
                  }}
                ></div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
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

            <div className="text-sm text-gray-500">
              Step {currentStep} of {STEPS.length}
            </div>

            {currentStep < STEPS.length ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={isSubmitting}
                className="text-white gap-2"
                style={{ backgroundColor: '#4a3032' }}
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="text-white px-8 hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#4a3032' }}
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
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
