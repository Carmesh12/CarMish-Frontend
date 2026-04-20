import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, Trash2 } from 'lucide-react';
import { favoritesApi } from '../api/favoritesApi';
import { resolveMediaUrl } from '../../../lib/api';
import { notifySuccess, notifyError } from '../../../lib/toast';
import { Card } from '../../../components/ui/Card';
import { Spinner } from '../../../components/ui/Spinner';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';

type FavoriteItem = Awaited<ReturnType<typeof favoritesApi.getMyFavorites>>[number];

export function FavoritesPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchFavorites = useCallback(() => {
    setLoading(true);
    favoritesApi.getMyFavorites()
      .then(setItems)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load favorites'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchFavorites(); }, [fetchFavorites]);

  const handleRemove = async (vehicleId: string) => {
    setRemovingId(vehicleId);
    try {
      await favoritesApi.remove(vehicleId);
      setItems((prev) => prev.filter((f) => f.vehicleId !== vehicleId));
      notifySuccess(t('favorites.removed'));
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Failed to remove');
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) return <Spinner label={t('common.loading')} />;
  if (error) return <Card><p className="text-sm text-red-400" role="alert">{error}</p></Card>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Heart size={22} className="text-mesh-gold" />
        <h1 className="text-2xl font-bold text-mesh-text">{t('favorites.title')}</h1>
        <Badge variant="gold">{items.length}</Badge>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<Heart size={48} />}
          title={t('favorites.empty')}
          action={
            <Link to="/vehicles">
              <Button variant="primary" size="sm">{t('nav.vehicles')}</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((fav) => {
            const v = fav.vehicle;
            const primaryImg = v.images?.find((i) => i.isPrimary) ?? v.images?.[0];
            const imgUrl = resolveMediaUrl(primaryImg?.imageUrl ?? null);

            return (
              <Card key={fav.id} padding={false} className="overflow-hidden group">
                <Link to={`/vehicles/${v.id}`} className="block">
                  <div className="aspect-[16/10] bg-mesh-surface relative">
                    {imgUrl ? (
                      <img src={imgUrl} alt={v.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-mesh-muted text-sm">
                        No image
                      </div>
                    )}
                    <div className="absolute top-2 end-2">
                      <Badge variant={v.listingType === 'SALE' ? 'info' : v.listingType === 'RENT' ? 'warning' : 'gold'}>
                        {v.listingType === 'SALE' ? t('vehicles.forSale') : v.listingType === 'RENT' ? t('vehicles.forRent') : t('vehicles.saleAndRent')}
                      </Badge>
                    </div>
                  </div>
                </Link>

                <div className="p-4 space-y-2">
                  <Link to={`/vehicles/${v.id}`} className="block">
                    <h3 className="text-mesh-text font-semibold truncate hover:text-mesh-gold transition-colors">
                      {v.title}
                    </h3>
                    <p className="text-xs text-mesh-muted">{v.brand} {v.model} &middot; {v.year}</p>
                  </Link>

                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      {v.price && (
                        <span className="text-mesh-gold font-semibold">
                          ${Number(v.price).toLocaleString()}
                        </span>
                      )}
                      {v.rentalPricePerDay && (
                        <span className="text-mesh-muted text-xs ms-2">
                          ${Number(v.rentalPricePerDay).toLocaleString()}{t('vehicles.perDay')}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      loading={removingId === fav.vehicleId}
                      onClick={() => handleRemove(fav.vehicleId)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
