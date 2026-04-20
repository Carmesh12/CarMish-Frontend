import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, SlidersHorizontal, Heart, MapPin, Fuel, Cog, X } from 'lucide-react';

import { vehiclesApi } from '../api/vehiclesApi';
import type { Vehicle, VehicleQueryParams } from '../types';
import { favoritesApi } from '../../favorites/api/favoritesApi';
import { useAuthStore } from '../../../stores/authStore';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Spinner } from '../../../components/ui/Spinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Pagination } from '../../../components/ui/Pagination';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { notifySuccess, notifyError } from '../../../lib/toast';
import { resolveMediaUrl } from '../../../lib/api';

const FUEL_OPTIONS = [
  { value: '', label: '' },
  { value: 'PETROL', label: 'PETROL' },
  { value: 'DIESEL', label: 'DIESEL' },
  { value: 'ELECTRIC', label: 'ELECTRIC' },
  { value: 'HYBRID', label: 'HYBRID' },
  { value: 'GAS', label: 'GAS' },
  { value: 'OTHER', label: 'OTHER' },
];

const TRANSMISSION_OPTIONS = [
  { value: '', label: '' },
  { value: 'MANUAL', label: 'MANUAL' },
  { value: 'AUTOMATIC', label: 'AUTOMATIC' },
  { value: 'CVT', label: 'CVT' },
  { value: 'SEMI_AUTOMATIC', label: 'SEMI_AUTOMATIC' },
  { value: 'OTHER', label: 'OTHER' },
];

const LISTING_TYPE_OPTIONS = [
  { value: '', label: '' },
  { value: 'SALE', label: 'SALE' },
  { value: 'RENT', label: 'RENT' },
  { value: 'BOTH', label: 'BOTH' },
];

const SORT_BY_OPTIONS = [
  { value: 'createdAt', label: 'createdAt' },
  { value: 'price', label: 'price' },
  { value: 'year', label: 'year' },
];

const SORT_ORDER_OPTIONS = [
  { value: 'desc', label: 'desc' },
  { value: 'asc', label: 'asc' },
];

function getPrimaryImage(vehicle: Vehicle): string | null {
  if (!vehicle.images || vehicle.images.length === 0) return null;
  const primary = vehicle.images.find((img) => img.isPrimary);
  return resolveMediaUrl((primary ?? vehicle.images[0]).imageUrl);
}

export function CatalogPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, role } = useAuthStore();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [togglingFav, setTogglingFav] = useState<Set<string>>(new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);

  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') ?? '';
  const brand = searchParams.get('brand') ?? '';
  const model = searchParams.get('model') ?? '';
  const locationCity = searchParams.get('locationCity') ?? '';
  const yearFrom = searchParams.get('yearFrom') ?? '';
  const yearTo = searchParams.get('yearTo') ?? '';
  const priceMin = searchParams.get('priceMin') ?? '';
  const priceMax = searchParams.get('priceMax') ?? '';
  const fuelType = searchParams.get('fuelType') ?? '';
  const transmission = searchParams.get('transmission') ?? '';
  const listingType = searchParams.get('listingType') ?? '';
  const sortBy = (searchParams.get('sortBy') as VehicleQueryParams['sortBy']) || 'createdAt';
  const sortOrder = (searchParams.get('sortOrder') as VehicleQueryParams['sortOrder']) || 'desc';

  const [searchInput, setSearchInput] = useState(search);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const params: VehicleQueryParams = { page, limit: 12, sortBy, sortOrder };
      if (search) params.search = search;
      if (brand) params.brand = brand;
      if (model) params.model = model;
      if (locationCity) params.locationCity = locationCity;
      if (yearFrom) params.yearFrom = Number(yearFrom);
      if (yearTo) params.yearTo = Number(yearTo);
      if (priceMin) params.priceMin = Number(priceMin);
      if (priceMax) params.priceMax = Number(priceMax);
      if (fuelType) params.fuelType = fuelType;
      if (transmission) params.transmission = transmission;
      if (listingType) params.listingType = listingType;

      const res = await vehiclesApi.list(params);
      setVehicles(res.data);
      setTotalPages(res.meta.totalPages);
    } catch {
      notifyError(t('catalog.fetchError', 'Failed to load vehicles'));
    } finally {
      setLoading(false);
    }
  }, [page, search, brand, model, locationCity, yearFrom, yearTo, priceMin, priceMax, fuelType, transmission, listingType, sortBy, sortOrder, t]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  useEffect(() => {
    if (!isAuthenticated || role !== 'USER') return;
    favoritesApi.getMyFavorites().then((favs) => {
      setFavoriteIds(new Set(favs.map((f) => f.vehicleId)));
    }).catch(() => {});
  }, [isAuthenticated, role]);

  function setParam(key: string, value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      if (key !== 'page') next.delete('page');
      return next;
    });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setParam('search', searchInput.trim());
  }

  function clearFilters() {
    setSearchParams({});
    setSearchInput('');
  }

  async function toggleFavorite(vehicleId: string) {
    if (togglingFav.has(vehicleId)) return;
    setTogglingFav((prev) => new Set(prev).add(vehicleId));
    try {
      const res = await favoritesApi.toggle(vehicleId);
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (res.isFavorited) next.add(vehicleId);
        else next.delete(vehicleId);
        return next;
      });
      notifySuccess(res.isFavorited ? t('catalog.favoriteAdded', 'Added to favorites') : t('catalog.favoriteRemoved', 'Removed from favorites'));
    } catch {
      notifyError(t('catalog.favoriteError', 'Failed to update favorite'));
    } finally {
      setTogglingFav((prev) => {
        const next = new Set(prev);
        next.delete(vehicleId);
        return next;
      });
    }
  }

  const hasActiveFilters = brand || model || locationCity || yearFrom || yearTo || priceMin || priceMax || fuelType || transmission || listingType;

  const localizedFuelOptions = FUEL_OPTIONS.map((o) =>
    o.value ? { value: o.value, label: t(`fuel.${o.value}`, o.value) } : { value: '', label: t('catalog.allFuelTypes', 'All') },
  );
  const localizedTransmissionOptions = TRANSMISSION_OPTIONS.map((o) =>
    o.value ? { value: o.value, label: t(`transmission.${o.value}`, o.value) } : { value: '', label: t('catalog.allTransmissions', 'All') },
  );
  const localizedListingTypeOptions = LISTING_TYPE_OPTIONS.map((o) =>
    o.value ? { value: o.value, label: t(`listingType.${o.value}`, o.value) } : { value: '', label: t('catalog.allListingTypes', 'All') },
  );
  const localizedSortByOptions = SORT_BY_OPTIONS.map((o) => ({
    value: o.value,
    label: t(`catalog.sortBy.${o.value}`, o.label),
  }));
  const localizedSortOrderOptions = SORT_ORDER_OPTIONS.map((o) => ({
    value: o.value,
    label: t(`catalog.sortOrder.${o.value}`, o.label),
  }));

  return (
    <div className="min-h-screen bg-mesh-bg">
      {/* Hero section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-mesh-accent/[0.06] via-transparent to-mesh-gold/[0.04]" />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-mesh-accent/[0.06] rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-mesh-gold/[0.05] rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
          <h1 className="text-4xl sm:text-5xl font-bold mb-3">
            <span className="text-gradient-gold">{t('catalog.title', 'Vehicle Catalog')}</span>
          </h1>
          <p className="text-mesh-muted text-lg max-w-xl">
            {t('catalog.subtitle', 'Browse and find your perfect vehicle')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-mesh-muted" size={18} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('catalog.searchPlaceholder', 'Search vehicles...')}
              className="w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-2.5 bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-[var(--radius-mesh-sm)] text-mesh-text placeholder-mesh-muted/40 outline-none transition-all duration-250 focus:bg-white/[0.05] focus:border-mesh-gold/50 focus:shadow-[0_0_16px_rgba(212,168,83,0.12)]"
            />
          </div>
          <Button type="submit">{t('catalog.search', 'Search')}</Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex items-center gap-2"
          >
            <SlidersHorizontal size={18} />
            <span className="hidden sm:inline">{t('catalog.filters', 'Filters')}</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-mesh-gold shadow-[0_0_6px_rgba(212,168,83,0.4)]" />
            )}
          </Button>
        </form>

        {/* Filters panel */}
        {filtersOpen && (
          <Card className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-mesh-text">
                {t('catalog.filterTitle', 'Filters')}
              </h2>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="flex items-center gap-1">
                    <X size={14} />
                    {t('catalog.clearFilters', 'Clear all')}
                  </Button>
                )}
                <button onClick={() => setFiltersOpen(false)} className="text-mesh-muted hover:text-mesh-text transition-colors cursor-pointer">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                label={t('catalog.brand', 'Brand')}
                value={brand}
                onChange={(e) => setParam('brand', e.target.value)}
                placeholder={t('catalog.brandPlaceholder', 'e.g. Toyota')}
              />
              <Input
                label={t('catalog.model', 'Model')}
                value={model}
                onChange={(e) => setParam('model', e.target.value)}
                placeholder={t('catalog.modelPlaceholder', 'e.g. Camry')}
              />
              <Input
                label={t('catalog.locationCity', 'City')}
                value={locationCity}
                onChange={(e) => setParam('locationCity', e.target.value)}
                placeholder={t('catalog.cityPlaceholder', 'e.g. Amman')}
              />
              <Select
                label={t('catalog.fuelType', 'Fuel Type')}
                value={fuelType}
                onChange={(e) => setParam('fuelType', e.target.value)}
                options={localizedFuelOptions}
              />
              <Select
                label={t('catalog.transmission', 'Transmission')}
                value={transmission}
                onChange={(e) => setParam('transmission', e.target.value)}
                options={localizedTransmissionOptions}
              />
              <Select
                label={t('catalog.listingType', 'Listing Type')}
                value={listingType}
                onChange={(e) => setParam('listingType', e.target.value)}
                options={localizedListingTypeOptions}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label={t('catalog.yearFrom', 'Year From')}
                  type="number"
                  value={yearFrom}
                  onChange={(e) => setParam('yearFrom', e.target.value)}
                  placeholder="2015"
                />
                <Input
                  label={t('catalog.yearTo', 'Year To')}
                  type="number"
                  value={yearTo}
                  onChange={(e) => setParam('yearTo', e.target.value)}
                  placeholder="2025"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label={t('catalog.priceMin', 'Min Price')}
                  type="number"
                  value={priceMin}
                  onChange={(e) => setParam('priceMin', e.target.value)}
                  placeholder="0"
                />
                <Input
                  label={t('catalog.priceMax', 'Max Price')}
                  type="number"
                  value={priceMax}
                  onChange={(e) => setParam('priceMax', e.target.value)}
                  placeholder="100000"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Sort & results count */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <p className="text-sm text-mesh-muted">
            {loading
              ? t('catalog.loading', 'Loading...')
              : t('catalog.resultsCount', '{{count}} vehicles found', { count: vehicles.length })}
          </p>
          <div className="flex items-center gap-3">
            <Select
              value={sortBy}
              onChange={(e) => setParam('sortBy', e.target.value)}
              options={localizedSortByOptions}
              label={t('catalog.sortByLabel', 'Sort by')}
            />
            <Select
              value={sortOrder}
              onChange={(e) => setParam('sortOrder', e.target.value)}
              options={localizedSortOrderOptions}
              label={t('catalog.orderLabel', 'Order')}
            />
          </div>
        </div>

        {/* Vehicle grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size={48} label={t('catalog.loadingVehicles', 'Loading vehicles...')} />
          </div>
        ) : vehicles.length === 0 ? (
          <EmptyState
            title={t('catalog.emptyTitle', 'No vehicles found')}
            description={t('catalog.emptyDescription', 'Try adjusting your search or filters')}
            action={
              hasActiveFilters ? (
                <Button variant="outline" onClick={clearFilters}>
                  {t('catalog.clearFilters', 'Clear all filters')}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {vehicles.map((vehicle) => {
                const imgUrl = getPrimaryImage(vehicle);
                const isFav = favoriteIds.has(vehicle.id);
                const showPrice =
                  vehicle.listingType === 'RENT'
                    ? vehicle.rentalPricePerDay
                    : vehicle.price;
                const priceLabel =
                  vehicle.listingType === 'RENT'
                    ? t('catalog.perDay', '/day')
                    : '';

                return (
                  <Card key={vehicle.id} padding={false} className="group overflow-hidden flex flex-col hover:shadow-[0_24px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.06)] hover:border-white/[0.12] transition-all duration-300">
                    {/* Image */}
                    <Link to={`/vehicles/${vehicle.id}`} className="relative aspect-[4/3] overflow-hidden">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={vehicle.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-white/[0.02] flex items-center justify-center">
                          <Cog size={40} className="text-mesh-muted/20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute top-3 left-3 rtl:left-auto rtl:right-3">
                        <Badge variant="gold">
                          {t(`listingType.${vehicle.listingType}`, vehicle.listingType)}
                        </Badge>
                      </div>
                    </Link>

                    {/* Body */}
                    <div className="flex flex-col flex-1 p-4">
                      <Link to={`/vehicles/${vehicle.id}`} className="hover:text-mesh-gold transition-colors">
                        <h3 className="font-semibold text-mesh-text line-clamp-1 mb-1">
                          {vehicle.title}
                        </h3>
                      </Link>

                      <p className="text-lg font-bold text-mesh-gold mb-2">
                        {showPrice ? `$${Number(showPrice).toLocaleString()}` : t('catalog.contactForPrice', 'Contact for price')}
                        {showPrice && priceLabel && (
                          <span className="text-sm font-normal text-mesh-muted">{priceLabel}</span>
                        )}
                      </p>

                      {vehicle.locationCity && (
                        <div className="flex items-center gap-1.5 text-sm text-mesh-muted mb-3">
                          <MapPin size={14} />
                          <span>{vehicle.locationCity}</span>
                        </div>
                      )}

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

                    {/* Favorite button */}
                    {isAuthenticated && role === 'USER' && (
                      <div className="px-4 pb-4">
                        <button
                          onClick={() => toggleFavorite(vehicle.id)}
                          disabled={togglingFav.has(vehicle.id)}
                          className="flex items-center gap-1.5 text-sm transition-all duration-200 cursor-pointer disabled:opacity-50"
                        >
                          <Heart
                            size={18}
                            className={
                              isFav
                                ? 'fill-red-500 text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.4)]'
                                : 'text-mesh-muted hover:text-red-400'
                            }
                          />
                          <span className={isFav ? 'text-red-400' : 'text-mesh-muted'}>
                            {isFav ? t('catalog.favorited', 'Favorited') : t('catalog.addFavorite', 'Favorite')}
                          </span>
                        </button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>

            <div className="mt-8">
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={(p) => setParam('page', String(p))}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
