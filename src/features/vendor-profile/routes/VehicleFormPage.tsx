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
  title: string;
  description?: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  fuelType?: string;
  transmission?: string;
  mileage?: number | '';
  price?: number | '';
  rentalPricePerDay?: number | '';
  listingType: 'SALE' | 'RENT' | 'BOTH';
  locationCity?: string;
}

const vehicleSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  brand: z.string().min(1),
  model: z.string().min(1),
  year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1),
  color: z.string().optional(),
  fuelType: z.string().optional(),
  transmission: z.string().optional(),
  mileage: z.coerce.number().min(0).optional().or(z.literal('')),
  price: z.coerce.number().min(0).optional().or(z.literal('')),
  rentalPricePerDay: z.coerce.number().min(0).optional().or(z.literal('')),
  listingType: z.enum(['SALE', 'RENT', 'BOTH']),
  locationCity: z.string().optional(),
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
    defaultValues: { listingType: 'SALE' },
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
          year: vehicle.year,
          color: vehicle.color ?? '',
          fuelType: vehicle.fuelType ?? '',
          transmission: vehicle.transmission ?? '',
          mileage: vehicle.mileage ?? ('' as unknown as undefined),
          price: vehicle.price ? Number(vehicle.price) : ('' as unknown as undefined),
          rentalPricePerDay: vehicle.rentalPricePerDay ? Number(vehicle.rentalPricePerDay) : ('' as unknown as undefined),
          listingType: vehicle.listingType,
          locationCity: vehicle.locationCity ?? '',
        });
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load vehicle');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (data: VehicleForm) => {
    const body: Record<string, unknown> = { ...data };
    if (typeof body.mileage === 'string' && body.mileage === '') delete body.mileage;
    if (typeof body.price === 'string' && body.price === '') delete body.price;
    if (typeof body.rentalPricePerDay === 'string' && body.rentalPricePerDay === '') delete body.rentalPricePerDay;

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
      notifyError(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    setImageActionId(imageId);
    try {
      await vehiclesApi.deleteImage(imageId);
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
      notifySuccess(t('vendor.deleteImage'));
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Delete failed');
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
      notifyError(err instanceof Error ? err.message : 'Failed');
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
                label={t('vehicles.color')}
                placeholder={t('common.optional')}
                {...form.register('color')}
              />
              <Select
                label={t('vehicles.fuelType')}
                placeholder={t('common.optional')}
                options={fuelOptions}
                {...form.register('fuelType')}
              />
              <Select
                label={t('vehicles.transmission')}
                placeholder={t('common.optional')}
                options={transmissionOptions}
                {...form.register('transmission')}
              />
              <Input
                label={t('vehicles.mileage')}
                type="number"
                placeholder={t('common.optional')}
                {...form.register('mileage')}
              />
              <Input
                label={t('vehicles.city')}
                placeholder={t('common.optional')}
                {...form.register('locationCity')}
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

            <ImageUpload images={newFiles} onChange={setNewFiles} max={10 - existingImages.length} />
          </Card>
        )}

        {/* Images (create mode) */}
        {!isEdit && (
          <Card>
            <h2 className="text-sm font-medium uppercase tracking-wider text-mesh-muted mb-4">
              {t('vendor.images')}
            </h2>
            <ImageUpload images={newFiles} onChange={setNewFiles} max={10} />
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
