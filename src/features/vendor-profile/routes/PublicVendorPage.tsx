import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  CalendarDays,
  Car,
  Cog,
  Fuel,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react';

import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Spinner } from '../../../components/ui/Spinner';
import { resolveMediaUrl } from '../../../lib/api';
import type { Vehicle } from '../../vehicles/types';
import { getPublicVendorProfile } from '../api/vendorProfileApi';
import type { PublicVendorProfileResponse } from '../types';

function getPrimaryImage(vehicle: Vehicle): string | null {
  if (!vehicle.images || vehicle.images.length === 0) return null;
  const primary = vehicle.images.find((image) => image.isPrimary);
  return resolveMediaUrl((primary ?? vehicle.images[0]).imageUrl);
}

function getVehiclePrice(vehicle: Vehicle): string | null {
  if (vehicle.listingType === 'RENT') {
    return vehicle.rentalPricePerDay
      ? `$${Number(vehicle.rentalPricePerDay).toLocaleString()} / day`
      : null;
  }

  if (vehicle.price) {
    return `$${Number(vehicle.price).toLocaleString()}`;
  }

  if (vehicle.rentalPricePerDay) {
    return `$${Number(vehicle.rentalPricePerDay).toLocaleString()} / day`;
  }

  return null;
}

function getStatusVariant(
  status: string,
): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gold' | 'sold' {
  if (status === 'APPROVED') return 'success';
  if (status === 'PENDING') return 'warning';
  if (status === 'REJECTED') return 'danger';
  return 'default';
}

export function PublicVendorPage() {
  const { t } = useTranslation();
  const { accountId } = useParams<{ accountId: string }>();
  const [vendor, setVendor] = useState<PublicVendorProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!accountId) return;

    let cancelled = false;

    getPublicVendorProfile(accountId)
      .then((response) => {
        if (!cancelled) {
          setVendor(response);
          setNotFound(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setVendor(null);
          setNotFound(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accountId]);

  if (!accountId) {
    return (
      <div className="min-h-screen bg-mesh-bg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <EmptyState
            icon={<User size={48} />}
            title={t('vendorPublic.notFoundTitle', 'Vendor not found')}
            description={t(
              'vendorPublic.notFoundDescription',
              'This vendor profile is not available right now.',
            )}
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-mesh-bg flex items-center justify-center">
        <Spinner size={48} label={t('vendorPublic.loading', 'Loading vendor...')} />
      </div>
    );
  }

  if (notFound || !vendor) {
    return (
      <div className="min-h-screen bg-mesh-bg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <EmptyState
            icon={<User size={48} />}
            title={t('vendorPublic.notFoundTitle', 'Vendor not found')}
            description={t(
              'vendorPublic.notFoundDescription',
              'This vendor profile is not available right now.',
            )}
            action={
              <Link
                to="/vehicles"
                className="inline-flex items-center justify-center rounded-[var(--radius-mesh-sm)] px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-mesh-gold to-mesh-gold-hover text-mesh-bg"
              >
                {t('vendorPublic.backToVehicles', 'Back to vehicles')}
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const logoUrl = resolveMediaUrl(vendor.logoUrl);

  return (
    <div className="min-h-screen bg-mesh-bg">
      <div className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 bg-gradient-to-br from-mesh-gold/[0.08] via-transparent to-mesh-accent/[0.06]" />
        <div className="absolute -top-20 right-1/4 h-64 w-64 rounded-full bg-mesh-gold/[0.08] blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link
            to="/vehicles"
            className="inline-flex items-center gap-1.5 text-mesh-muted hover:text-mesh-gold transition-all duration-200 mb-8"
          >
            <ArrowLeft size={18} />
            {t('vendorPublic.backToVehicles', 'Back to vehicles')}
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="flex flex-col sm:flex-row gap-5">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={vendor.businessName}
                  className="w-24 h-24 rounded-[var(--radius-mesh)] object-cover ring-2 ring-mesh-gold/25 bg-white/[0.04]"
                />
              ) : (
                <div className="w-24 h-24 rounded-[var(--radius-mesh)] bg-gradient-to-br from-mesh-gold/30 to-mesh-accent/20 flex items-center justify-center text-mesh-gold text-3xl font-bold ring-2 ring-mesh-gold/20">
                  {vendor.businessName.charAt(0)}
                </div>
              )}

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <h1 className="text-3xl sm:text-4xl font-bold text-mesh-text">
                    {vendor.businessName}
                  </h1>
                  <Badge variant={getStatusVariant(vendor.verificationStatus)}>
                    <ShieldCheck size={12} className="mr-1 rtl:mr-0 rtl:ml-1" />
                    {t(
                      `vendorPublic.verification.${vendor.verificationStatus}`,
                      vendor.verificationStatus,
                    )}
                  </Badge>
                </div>
                <p className="text-mesh-muted max-w-2xl">
                  {t(
                    'vendorPublic.subtitle',
                    'Browse public vendor details and available listings from this seller.',
                  )}
                </p>
                <p className="text-xs text-mesh-muted/70 mt-3">
                  {t('vendorPublic.memberSince', 'Member since')}{' '}
                  {new Date(vendor.memberSince).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-[var(--radius-mesh)] bg-white/[0.04] border border-white/[0.08] px-4 py-3">
              <Car size={20} className="text-mesh-gold" />
              <div>
                <p className="text-xs text-mesh-muted">
                  {t('vendorPublic.publicListings', 'Public listings')}
                </p>
                <p className="text-xl font-bold text-mesh-text">{vendor.vehicles.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1 space-y-4">
            <Card>
              <h2 className="text-lg font-semibold text-mesh-text mb-4">
                {t('vendorPublic.contactInfo', 'Contact information')}
              </h2>
              <div className="space-y-4">
                <ContactRow
                  icon={<User size={17} />}
                  label={t('vendorPublic.contactPerson', 'Contact person')}
                  value={vendor.contactPersonName}
                />
                <ContactRow
                  icon={<Phone size={17} />}
                  label={t('vendorPublic.phone', 'Phone')}
                  value={vendor.phoneNumber}
                />
                <ContactRow
                  icon={<Mail size={17} />}
                  label={t('vendorPublic.email', 'Email')}
                  value={vendor.email}
                />
                <ContactRow
                  icon={<MapPin size={17} />}
                  label={t('vendorPublic.address', 'Address')}
                  value={vendor.businessAddress}
                />
              </div>
            </Card>
          </aside>

          <main className="lg:col-span-3">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-2xl font-bold text-mesh-text">
                  {t('vendorPublic.vehiclesTitle', 'Vendor vehicles')}
                </h2>
                <p className="text-sm text-mesh-muted">
                  {t('vendorPublic.vehiclesSubtitle', '{{count}} published listings', {
                    count: vendor.vehicles.length,
                  })}
                </p>
              </div>
            </div>

            {vendor.vehicles.length === 0 ? (
              <Card>
                <EmptyState
                  icon={<Car size={48} />}
                  title={t('vendorPublic.noVehiclesTitle', 'No published vehicles')}
                  description={t(
                    'vendorPublic.noVehiclesDescription',
                    'This vendor does not have public vehicle listings yet.',
                  )}
                />
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {vendor.vehicles.map((vehicle) => (
                  <VendorVehicleCard key={vehicle.id} vehicle={vehicle} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function ContactRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-mesh-gold">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-mesh-muted">{label}</p>
        <p className="text-sm font-medium text-mesh-text break-words">
          {value?.trim() || '—'}
        </p>
      </div>
    </div>
  );
}

function VendorVehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const { t } = useTranslation();
  const imageUrl = getPrimaryImage(vehicle);
  const price = getVehiclePrice(vehicle);

  return (
    <Card
      padding={false}
      className="group overflow-hidden flex flex-col hover:shadow-[0_24px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.06)] hover:border-white/[0.12] transition-all duration-300"
    >
      <Link to={`/vehicles/${vehicle.id}`} className="relative aspect-[4/3] overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={vehicle.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-white/[0.02] flex items-center justify-center">
            <Cog size={40} className="text-mesh-muted/20" />
          </div>
        )}
        <div className="absolute top-3 left-3 rtl:left-auto rtl:right-3">
          <Badge variant="gold">
            {t(`listingType.${vehicle.listingType}`, vehicle.listingType)}
          </Badge>
        </div>
      </Link>

      <div className="flex flex-col flex-1 p-4">
        <Link
          to={`/vehicles/${vehicle.id}`}
          className="hover:text-mesh-gold transition-colors"
        >
          <h3 className="font-semibold text-mesh-text line-clamp-1 mb-1">
            {vehicle.title}
          </h3>
        </Link>

        <p className="text-lg font-bold text-mesh-gold mb-2">
          {price ?? t('catalog.contactForPrice', 'Contact for price')}
        </p>

        <div className="space-y-2 text-sm text-mesh-muted mb-4">
          <div className="flex items-center gap-1.5">
            <CalendarDays size={14} />
            <span>
              {vehicle.year} {vehicle.brand} {vehicle.model}
            </span>
          </div>
          {vehicle.locationCity && (
            <div className="flex items-center gap-1.5">
              <MapPin size={14} />
              <span>{vehicle.locationCity}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mt-auto">
          {vehicle.fuelType && (
            <Badge variant="info">
              <Fuel size={12} className="mr-1 rtl:mr-0 rtl:ml-1" />
              {t(`fuel.${vehicle.fuelType}`, vehicle.fuelType)}
            </Badge>
          )}
          {vehicle.transmission && (
            <Badge variant="default">
              <Cog size={12} className="mr-1 rtl:mr-0 rtl:ml-1" />
              {t(`transmission.${vehicle.transmission}`, vehicle.transmission)}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
