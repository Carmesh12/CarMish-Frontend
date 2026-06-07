import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, ArrowLeft, Star, Trash2 } from 'lucide-react';
import { vehiclesApi } from '../../vehicles/api/vehiclesApi';
import type { Vehicle, VehicleImage } from '../../vehicles/types';
import { resolveMediaUrl } from '../../../lib/api';
import { notifySuccess, notifyError } from '../../../lib/toast';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { ImageUpload } from '../../../components/ui/ImageUpload';

interface VehicleForm {
  title?: string;
  description?: string;
  brand: string;
  model: string;
  trim?: string;
  year: number;
  condition: 'NEW' | 'USED';
  color: string;
  fuelType: string;
  engineType: string;
  engineCapacity: string;
  horsepower: number;
  transmission: string;
  drivetrain: string;
  cylinders?: number | '';
  acceleration: number;
  topSpeed: number;
  fuelConsumption: number;
  fuelTankCapacity: number;
  bodyType: string;
  doors: number;
  wheelsSize?: string;
  seats: number;
  interiorMaterial: string;
  hasSunroof: boolean;
  hasNavigation: boolean;
  hasBluetooth: boolean;
  hasCamera: boolean;
  mileage?: number | '';
  price?: number | '';
  currency: 'USD' | 'JOD';
  negotiable: boolean;
  rentalPricePerDay?: number | '';
  listingType: 'SALE' | 'RENT' | 'BOTH';
  vinNumber?: string;
  locationCity: string;
  locationCountry: string;
}

const vehicleSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  brand: z.string().min(1),
  model: z.string().min(1),
  trim: z.string().optional(),
  year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1),
  condition: z.enum(['NEW', 'USED']),
  color: z.string().min(1),
  fuelType: z.string().min(1),
  engineType: z.string().min(1),
  engineCapacity: z.string().min(1),
  horsepower: z.coerce.number().min(1),
  transmission: z.string().min(1),
  drivetrain: z.string().min(1),
  cylinders: z.coerce.number().min(1).optional().or(z.literal('')),
  acceleration: z.coerce.number().min(1),
  topSpeed: z.coerce.number().min(1),
  fuelConsumption: z.coerce.number().min(0),
  fuelTankCapacity: z.coerce.number().min(0),
  bodyType: z.string().min(1),
  doors: z.coerce.number().min(2),
  wheelsSize: z.string().optional(),
  seats: z.coerce.number().min(1),
  interiorMaterial: z.string().min(1),
  hasSunroof: z.preprocess((value) => value === true || value === 'true', z.boolean()),
  hasNavigation: z.preprocess((value) => value === true || value === 'true', z.boolean()),
  hasBluetooth: z.preprocess((value) => value === true || value === 'true', z.boolean()),
  hasCamera: z.preprocess((value) => value === true || value === 'true', z.boolean()),
  mileage: z.coerce.number().min(0).optional().or(z.literal('')),
  price: z.coerce.number().min(0).optional().or(z.literal('')),
  currency: z.enum(['USD', 'JOD']),
  negotiable: z.preprocess((value) => value === true || value === 'true', z.boolean()),
  rentalPricePerDay: z.coerce.number().min(0).optional().or(z.literal('')),
  listingType: z.enum(['SALE', 'RENT', 'BOTH']),
  vinNumber: z.string().optional(),
  locationCity: z.string().min(1),
  locationCountry: z.string().min(1),
});

export function VehicleFormPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);
  const [existingImages, setExistingImages] = useState<VehicleImage[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [imageActionId, setImageActionId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const form = useForm<VehicleForm>({
    resolver: zodResolver(vehicleSchema) as never,
    defaultValues: {
      listingType: 'SALE',
      condition: 'USED',
      fuelType: 'PETROL',
      engineType: 'PETROL',
      engineCapacity: '2.0L',
      transmission: 'AUTOMATIC',
      drivetrain: 'FWD',
      bodyType: 'SEDAN',
      doors: 4,
      seats: 5,
      interiorMaterial: 'FABRIC',
      hasSunroof: false,
      hasNavigation: true,
      hasBluetooth: true,
      hasCamera: true,
      currency: 'USD',
      negotiable: true,
      locationCountry: 'Jordan',
    },
  });

  const listingType = form.watch('listingType');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const [vehicle, images] = await Promise.all([
          vehiclesApi.getById(id),
          vehiclesApi.getImages(id),
        ]);
        if (cancelled) return;
        setExistingImages(images);
        form.reset({
          title: vehicle.title,
          description: vehicle.description ?? '',
          brand: vehicle.brand,
          model: vehicle.model,
          trim: vehicle.trim ?? '',
          year: vehicle.year,
          condition: vehicle.condition,
          color: vehicle.color ?? 'White',
          fuelType: vehicle.fuelType ?? vehicle.engineType,
          engineType: vehicle.engineType,
          engineCapacity: vehicle.engineCapacity,
          horsepower: vehicle.horsepower,
          transmission: vehicle.transmission ?? 'AUTOMATIC',
          drivetrain: vehicle.drivetrain,
          cylinders: vehicle.cylinders ?? ('' as unknown as undefined),
          acceleration: vehicle.acceleration ? Number(vehicle.acceleration) : 8.5,
          topSpeed: vehicle.topSpeed ?? 180,
          fuelConsumption: vehicle.fuelConsumption ? Number(vehicle.fuelConsumption) : 7.5,
          fuelTankCapacity: vehicle.fuelTankCapacity ?? 55,
          bodyType: vehicle.bodyType,
          doors: vehicle.doors,
          wheelsSize: vehicle.wheelsSize ?? '',
          seats: vehicle.seats,
          interiorMaterial: vehicle.interiorMaterial,
          hasSunroof: vehicle.hasSunroof,
          hasNavigation: vehicle.hasNavigation,
          hasBluetooth: vehicle.hasBluetooth,
          hasCamera: vehicle.hasCamera,
          mileage: vehicle.mileage ?? ('' as unknown as undefined),
          price: vehicle.price ? Number(vehicle.price) : ('' as unknown as undefined),
          currency: vehicle.currency,
          negotiable: vehicle.negotiable,
          rentalPricePerDay: vehicle.rentalPricePerDay ? Number(vehicle.rentalPricePerDay) : ('' as unknown as undefined),
          listingType: vehicle.listingType,
          vinNumber: vehicle.vinNumber ?? '',
          locationCity: vehicle.locationCity ?? 'Amman',
          locationCountry: vehicle.locationCountry,
        });
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : t('vehicles.loadError'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (data: VehicleForm) => {
    const body: Record<string, unknown> = { ...data };
    if (!isEdit && newFiles.length < 3) {
      notifyError('Please upload at least 3 vehicle images');
      return;
    }
    if (!isEdit && newFiles.length > 8) {
      notifyError('A vehicle can have at most 8 images');
      return;
    }
    if (isEdit && existingImages.length + newFiles.length > 8) {
      notifyError('A vehicle can have at most 8 images');
      return;
    }
    if (data.condition === 'USED' && (data.mileage === '' || data.mileage == null)) {
      notifyError(t('vehicles.mileageRequiredUsed'));
      return;
    }
    if (typeof body.mileage === 'string' && body.mileage === '') delete body.mileage;
    if (typeof body.cylinders === 'string' && body.cylinders === '') delete body.cylinders;
    if (typeof body.price === 'string' && body.price === '') delete body.price;
    if (typeof body.rentalPricePerDay === 'string' && body.rentalPricePerDay === '') delete body.rentalPricePerDay;
    if (typeof body.trim === 'string' && body.trim.trim() === '') delete body.trim;
    if (typeof body.wheelsSize === 'string' && body.wheelsSize.trim() === '') delete body.wheelsSize;
    if (typeof body.vinNumber === 'string' && body.vinNumber.trim() === '') delete body.vinNumber;
    delete body.title;

    try {
      let vehicle: Vehicle;
      if (isEdit && id) {
        vehicle = await vehiclesApi.update(id, body);
      } else {
        vehicle = await vehiclesApi.create(body);
      }

      if (newFiles.length > 0) {
        setUploading(true);
        await vehiclesApi.uploadImages(vehicle.id, newFiles);
        setUploading(false);
      }

      notifySuccess(isEdit ? t('profile.updateSuccess') : t('vendor.addVehicle'));
      navigate('/vendor/vehicles');
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : t('vehicles.saveError'));
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    setImageActionId(imageId);
    try {
      await vehiclesApi.deleteImage(imageId);
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
      notifySuccess(t('vendor.deleteImage'));
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : t('vehicles.deleteError'));
    } finally {
      setImageActionId(null);
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    setImageActionId(imageId);
    try {
      await vehiclesApi.setPrimaryImage(imageId);
      setExistingImages((prev) =>
        prev.map((img) => ({ ...img, isPrimary: img.id === imageId })),
      );
      notifySuccess(t('vendor.setPrimary'));
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : t('vehicles.actionError'));
    } finally {
      setImageActionId(null);
    }
  };

  const fuelOptions = [
    { value: 'PETROL', label: t('vehicles.petrol') },
    { value: 'DIESEL', label: t('vehicles.diesel') },
    { value: 'ELECTRIC', label: t('vehicles.electric') },
    { value: 'HYBRID', label: t('vehicles.hybrid') },
    { value: 'GAS', label: t('vehicles.gas') },
  ];

  const transmissionOptions = [
    { value: 'MANUAL', label: t('vehicles.manual') },
    { value: 'AUTOMATIC', label: t('vehicles.automatic') },
    { value: 'CVT', label: t('vehicles.cvt') },
    { value: 'SEMI_AUTOMATIC', label: t('vehicles.semiAutomatic') },
  ];

  const listingTypeOptions = [
    { value: 'SALE', label: t('vehicles.forSale') },
    { value: 'RENT', label: t('vehicles.forRent') },
    { value: 'BOTH', label: t('vehicles.saleAndRent') },
  ];

  const conditionOptions = [
    { value: 'NEW', label: t('vehicles.conditionNew') },
    { value: 'USED', label: t('vehicles.conditionUsed') },
  ];

  const drivetrainOptions = [
    { value: 'FWD', label: t('vehicles.fwd') },
    { value: 'RWD', label: t('vehicles.rwd') },
    { value: 'AWD', label: t('vehicles.awd') },
    { value: 'FOUR_WD', label: t('vehicles.fourWd') },
  ];

  const bodyTypeOptions = [
    { value: 'SUV', label: t('vehicles.suv') },
    { value: 'SEDAN', label: t('vehicles.sedan') },
    { value: 'HATCHBACK', label: t('vehicles.hatchback') },
    { value: 'COUPE', label: t('vehicles.coupe') },
    { value: 'TRUCK', label: t('vehicles.truck') },
  ];

  const interiorMaterialOptions = [
    { value: 'LEATHER', label: t('vehicles.leather') },
    { value: 'FABRIC', label: t('vehicles.fabric') },
    { value: 'MIXED', label: t('vehicles.mixed') },
  ];

  const booleanOptions = [
    { value: 'true', label: t('common.yes') },
    { value: 'false', label: t('common.no') },
  ];

  const currencyOptions = [
    { value: 'USD', label: 'USD' },
    { value: 'JOD', label: 'JOD' },
  ];

  if (loading) return <Spinner label={t('common.loading')} />;
  if (error) return <Card><p className="text-sm text-red-400" role="alert">{error}</p></Card>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/vendor/vehicles')}>
          <ArrowLeft size={16} />
          {t('common.back')}
        </Button>
        <h1 className="text-2xl font-bold text-mesh-text">
          {isEdit ? t('vendor.editVehicle') : t('vendor.addVehicle')}
        </h1>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <h2 className="text-sm font-medium uppercase tracking-wider text-mesh-muted mb-4">
            {t('common.details')}
          </h2>
          <div className="space-y-4">
            <Input
              label={t('vendor.vehicleTitle')}
              error={form.formState.errors.title?.message}
              {...form.register('title')}
            />
            <Textarea
              label={t('vendor.vehicleDescription')}
              placeholder={t('common.optional')}
              error={form.formState.errors.description?.message}
              {...form.register('description')}
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Input
                label={t('vehicles.brand')}
                error={form.formState.errors.brand?.message}
                {...form.register('brand')}
              />
              <Input
                label={t('vehicles.model')}
                error={form.formState.errors.model?.message}
                {...form.register('model')}
              />
              <Input
                label={t('vehicles.year')}
                type="number"
                error={form.formState.errors.year?.message}
                {...form.register('year')}
              />
              <Input
                label={t('detail.trim')}
                placeholder={t('common.optional')}
                {...form.register('trim')}
              />
              <Select
                label={t('detail.condition')}
                options={conditionOptions}
                error={form.formState.errors.condition?.message}
                {...form.register('condition')}
              />
              <Input
                label={t('vehicles.color')}
                error={form.formState.errors.color?.message}
                {...form.register('color')}
              />
              <Select
                label={t('vehicles.fuelType')}
                options={fuelOptions}
                error={form.formState.errors.fuelType?.message}
                {...form.register('fuelType')}
              />
              <Select
                label={t('vehicles.engineType', 'Engine Type')}
                options={fuelOptions.filter((option) => option.value !== 'GAS')}
                error={form.formState.errors.engineType?.message}
                {...form.register('engineType')}
              />
              <Input
                label={t('vehicles.engineCapacity', 'Engine Capacity')}
                placeholder="2.0L"
                error={form.formState.errors.engineCapacity?.message}
                {...form.register('engineCapacity')}
              />
              <Input
                label={t('vehicles.horsepower')}
                type="number"
                error={form.formState.errors.horsepower?.message}
                {...form.register('horsepower')}
              />
              <Select
                label={t('vehicles.transmission')}
                options={transmissionOptions}
                error={form.formState.errors.transmission?.message}
                {...form.register('transmission')}
              />
              <Select
                label={t('detail.drivetrain')}
                options={drivetrainOptions}
                error={form.formState.errors.drivetrain?.message}
                {...form.register('drivetrain')}
              />
              <Input
                label={t('vehicles.cylinders')}
                type="number"
                placeholder={t('common.optional')}
                {...form.register('cylinders')}
              />
              <Input
                label="0-100 km/h (sec)"
                type="number"
                step="0.1"
                error={form.formState.errors.acceleration?.message}
                {...form.register('acceleration')}
              />
              <Input
                label={t('detail.topSpeed')}
                type="number"
                error={form.formState.errors.topSpeed?.message}
                {...form.register('topSpeed')}
              />
              <Input
                label="Fuel Consumption (L/100km)"
                type="number"
                step="0.1"
                error={form.formState.errors.fuelConsumption?.message}
                {...form.register('fuelConsumption')}
              />
              <Input
                label={t('vehicles.fuelTankCapacity')}
                type="number"
                error={form.formState.errors.fuelTankCapacity?.message}
                {...form.register('fuelTankCapacity')}
              />
              <Select
                label={t('vehicles.bodyType', 'Body Type')}
                options={bodyTypeOptions}
                error={form.formState.errors.bodyType?.message}
                {...form.register('bodyType')}
              />
              <Input
                label={t('vehicles.doors')}
                type="number"
                error={form.formState.errors.doors?.message}
                {...form.register('doors')}
              />
              <Input
                label={t('vehicles.wheelSize')}
                placeholder={t('common.optional')}
                {...form.register('wheelsSize')}
              />
              <Input
                label={t('vehicles.seats')}
                type="number"
                error={form.formState.errors.seats?.message}
                {...form.register('seats')}
              />
              <Select
                label={t('vehicles.interiorMaterial', 'Interior Material')}
                options={interiorMaterialOptions}
                error={form.formState.errors.interiorMaterial?.message}
                {...form.register('interiorMaterial')}
              />
              <Select
                label={t('vehicles.sunroof')}
                options={booleanOptions}
                {...form.register('hasSunroof')}
              />
              <Select
                label={t('vehicles.navigation')}
                options={booleanOptions}
                {...form.register('hasNavigation')}
              />
              <Select
                label={t('vehicles.bluetooth')}
                options={booleanOptions}
                {...form.register('hasBluetooth')}
              />
              <Select
                label={t('vehicles.camera')}
                options={booleanOptions}
                {...form.register('hasCamera')}
              />
              <Input
                label={t('vehicles.mileage')}
                type="number"
                error={form.formState.errors.mileage?.message}
                {...form.register('mileage')}
              />
              <Input
                label="VIN"
                placeholder={t('common.optional')}
                {...form.register('vinNumber')}
              />
              <Input
                label={t('vehicles.city')}
                error={form.formState.errors.locationCity?.message}
                {...form.register('locationCity')}
              />
              <Input
                label={t('vehicles.country')}
                error={form.formState.errors.locationCountry?.message}
                {...form.register('locationCountry')}
              />
            </div>
          </div>
        </Card>

        {/* Pricing */}
        <Card>
          <h2 className="text-sm font-medium uppercase tracking-wider text-mesh-muted mb-4">
            {t('vehicles.listingType')} & {t('common.price')}
          </h2>
          <div className="space-y-4">
            <Select
              label={t('vehicles.listingType')}
              options={listingTypeOptions}
              error={form.formState.errors.listingType?.message}
              {...form.register('listingType')}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label={t('vehicles.currency')}
                options={currencyOptions}
                error={form.formState.errors.currency?.message}
                {...form.register('currency')}
              />
              <Select
                label={t('vehicles.negotiable')}
                options={booleanOptions}
                {...form.register('negotiable')}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {(listingType === 'SALE' || listingType === 'BOTH') && (
                <Input
                  label={t('common.price')}
                  type="number"
                  step="0.01"
                  error={form.formState.errors.price?.message}
                  {...form.register('price')}
                />
              )}
              {(listingType === 'RENT' || listingType === 'BOTH') && (
                <Input
                  label={t('vendor.rentalPricePerDay')}
                  type="number"
                  step="0.01"
                  error={form.formState.errors.rentalPricePerDay?.message}
                  {...form.register('rentalPricePerDay')}
                />
              )}
            </div>
          </div>
        </Card>

        {/* Images (edit mode) */}
        {isEdit && (
          <Card>
            <h2 className="text-sm font-medium uppercase tracking-wider text-mesh-muted mb-4">
              {t('vendor.images')}
            </h2>

            {existingImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-4">
                {existingImages.map((img) => {
                  const url = resolveMediaUrl(img.imageUrl);
                  return (
                    <div key={img.id} className="relative aspect-[4/3] rounded-[var(--radius-mesh-sm)] overflow-hidden border border-mesh-border group">
                      {url && <img src={url} alt="" className="w-full h-full object-cover" />}
                      {img.isPrimary && (
                        <span className="absolute top-1.5 start-1.5 bg-mesh-gold text-mesh-bg text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                          Primary
                        </span>
                      )}
                      <div className="absolute bottom-1.5 end-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!img.isPrimary && (
                          <button
                            type="button"
                            className="p-1 bg-black/60 rounded-full text-mesh-gold cursor-pointer"
                            title={t('vendor.setPrimary')}
                            disabled={imageActionId === img.id}
                            onClick={() => handleSetPrimary(img.id)}
                          >
                            <Star size={12} />
                          </button>
                        )}
                        <button
                          type="button"
                          className="p-1 bg-black/60 rounded-full text-red-400 cursor-pointer"
                          title={t('vendor.deleteImage')}
                          disabled={imageActionId === img.id}
                          onClick={() => handleDeleteImage(img.id)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <ImageUpload images={newFiles} onChange={setNewFiles} max={Math.max(0, 8 - existingImages.length)} />
          </Card>
        )}

        {/* Images (create mode) */}
        {!isEdit && (
          <Card>
            <h2 className="text-sm font-medium uppercase tracking-wider text-mesh-muted mb-4">
              {t('vendor.images')}
            </h2>
            <ImageUpload images={newFiles} onChange={setNewFiles} max={8} />
          </Card>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button type="submit" loading={form.formState.isSubmitting || uploading}>
            <Save size={16} />
            {isEdit ? t('common.save') : t('common.create')}
          </Button>
          <Button variant="secondary" type="button" onClick={() => navigate('/vendor/vehicles')}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
}
