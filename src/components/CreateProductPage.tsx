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
import { Loader2, Plus, X, Upload, Image as ImageIcon } from 'lucide-react';

export function CreateProductPage() {
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vendorId || !name || !description || !category || !basePrice || !sku) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
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

      await apiClient.createProduct(formData);
      toast.success('Product created successfully!');
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vendor & Basic Info */}
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
                  <SelectTrigger>
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
                  <SelectTrigger>
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortDescription">Short Description</Label>
              <Input
                id="shortDescription"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Brief product summary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Full Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed product description"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g., CB-001"
              />
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Product Images</CardTitle>
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
                    <span className="absolute bottom-1 left-1 text-xs bg-amber-500 text-white px-2 py-0.5 rounded">
                      Main
                    </span>
                  )}
                </div>
              ))}
              {images.length < 10 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 transition-colors">
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

        {/* Pricing */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Pricing & Inventory</CardTitle>
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="compareAtPrice">Compare at Price (₦)</Label>
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

        {/* Product Details */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
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
                <Label htmlFor="estimatedDeliveryDays">Est. Delivery (days)</Label>
                <Input
                  id="estimatedDeliveryDays"
                  type="number"
                  min="1"
                  value={estimatedDeliveryDays}
                  onChange={(e) => setEstimatedDeliveryDays(e.target.value)}
                  placeholder="e.g., 5"
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
                      className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="text-amber-600 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Key Info */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Key Information</CardTitle>
              <CardDescription>Add key product specifications</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addKeyInfo}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Personalization */}
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
                          onValueChange={(value) => updatePersonalizationOption(index, 'type', value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
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

        {/* Badges */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Product Badges</CardTitle>
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

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={resetForm}>
            Reset Form
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-8"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Product'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
