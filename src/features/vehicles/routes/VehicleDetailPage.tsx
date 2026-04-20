import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Heart,
  MapPin,
  Fuel,
  Cog,
  Calendar,
  Palette,
  Gauge,
  ShoppingCart,
  KeyRound,
  Flag,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';

import { vehiclesApi } from '../api/vehiclesApi';
import type { Vehicle, VehicleImage, Review } from '../types';
import { favoritesApi } from '../../favorites/api/favoritesApi';
import { purchaseRequestsApi } from '../../purchase-requests/api/purchaseRequestsApi';
import { rentalRequestsApi } from '../../rental-requests/api/rentalRequestsApi';
import { reportsApi } from '../../reports/api/reportsApi';
import { useAuthStore } from '../../../stores/authStore';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Select } from '../../../components/ui/Select';
import { Spinner } from '../../../components/ui/Spinner';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { Modal } from '../../../components/ui/Modal';
import { StarRating } from '../../../components/ui/StarRating';
import { Pagination } from '../../../components/ui/Pagination';
import { notifySuccess, notifyError } from '../../../lib/toast';
import { resolveMediaUrl } from '../../../lib/api';

const REPORT_REASONS = [
  { value: 'SPAM', label: 'SPAM' },
  { value: 'FRAUD', label: 'FRAUD' },
  { value: 'INAPPROPRIATE', label: 'INAPPROPRIATE' },
  { value: 'OTHER', label: 'OTHER' },
];

export function VehicleDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, role } = useAuthStore();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [images, setImages] = useState<VehicleImage[]>([]);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotalPages, setReviewTotalPages] = useState(1);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseMessage, setPurchaseMessage] = useState('');
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  const [rentalModalOpen, setRentalModalOpen] = useState(false);
  const [rentalStart, setRentalStart] = useState('');
  const [rentalEnd, setRentalEnd] = useState('');
  const [rentalMessage, setRentalMessage] = useState('');
  const [rentalLoading, setRentalLoading] = useState(false);

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  const isUser = isAuthenticated && role === 'USER';

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([vehiclesApi.getById(id), vehiclesApi.getImages(id)])
      .then(([v, imgs]) => {
        setVehicle(v);
        const sorted = [...imgs].sort((a, b) => {
          if (a.isPrimary) return -1;
          if (b.isPrimary) return 1;
          return a.sortOrder - b.sortOrder;
        });
        setImages(sorted);
        setSelectedImageIdx(0);
      })
      .catch(() => notifyError(t('detail.fetchError', 'Failed to load vehicle')))
      .finally(() => setLoading(false));
  }, [id, t]);

  useEffect(() => {
    if (!id || !isUser) return;
    favoritesApi.check(id).then((res) => setIsFavorited(res.isFavorited)).catch(() => {});
  }, [id, isUser]);

  const fetchReviews = useCallback(async () => {
    if (!id) return;
    setReviewsLoading(true);
    try {
      const res = await vehiclesApi.getReviews(id, reviewPage);
      setReviews(res.data);
      setReviewTotalPages(res.meta.totalPages);
    } catch {
      /* silent */
    } finally {
      setReviewsLoading(false);
    }
  }, [id, reviewPage]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  async function toggleFavorite() {
    if (!id || favLoading) return;
    setFavLoading(true);
    try {
      const res = await favoritesApi.toggle(id);
      setIsFavorited(res.isFavorited);
      notifySuccess(
        res.isFavorited
          ? t('detail.favoriteAdded', 'Added to favorites')
          : t('detail.favoriteRemoved', 'Removed from favorites'),
      );
    } catch {
      notifyError(t('detail.favoriteError', 'Failed to update favorite'));
    } finally {
      setFavLoading(false);
    }
  }

  async function submitReview() {
    if (!id || newRating === 0) return;
    setSubmittingReview(true);
    try {
      await vehiclesApi.createReview(id, {
        rating: newRating,
        comment: newComment.trim() || undefined,
      });
      notifySuccess(t('detail.reviewSuccess', 'Review submitted'));
      setNewRating(0);
      setNewComment('');
      setReviewPage(1);
      fetchReviews();
    } catch {
      notifyError(t('detail.reviewError', 'Failed to submit review'));
    } finally {
      setSubmittingReview(false);
    }
  }

  async function submitPurchase() {
    if (!id) return;
    setPurchaseLoading(true);
    try {
      await purchaseRequestsApi.create({
        vehicleId: id,
        offeredPrice: purchasePrice ? Number(purchasePrice) : undefined,
        message: purchaseMessage.trim() || undefined,
      });
      notifySuccess(t('detail.purchaseSuccess', 'Purchase request sent'));
      setPurchaseModalOpen(false);
      setPurchasePrice('');
      setPurchaseMessage('');
    } catch {
      notifyError(t('detail.purchaseError', 'Failed to send purchase request'));
    } finally {
      setPurchaseLoading(false);
    }
  }

  async function submitRental() {
    if (!id || !rentalStart || !rentalEnd) return;
    setRentalLoading(true);
    try {
      await rentalRequestsApi.create({
        vehicleId: id,
        startDate: rentalStart,
        endDate: rentalEnd,
        message: rentalMessage.trim() || undefined,
      });
      notifySuccess(t('detail.rentalSuccess', 'Rental request sent'));
      setRentalModalOpen(false);
      setRentalStart('');
      setRentalEnd('');
      setRentalMessage('');
    } catch {
      notifyError(t('detail.rentalError', 'Failed to send rental request'));
    } finally {
      setRentalLoading(false);
    }
  }

  async function submitReport() {
    if (!id || !reportReason) return;
    setReportLoading(true);
    try {
      await reportsApi.create({
        vehicleId: id,
        reason: reportReason,
        description: reportDescription.trim() || undefined,
      });
      notifySuccess(t('detail.reportSuccess', 'Report submitted'));
      setReportModalOpen(false);
      setReportReason('');
      setReportDescription('');
    } catch {
      notifyError(t('detail.reportError', 'Failed to submit report'));
    } finally {
      setReportLoading(false);
    }
  }

  function prevImage() {
    setSelectedImageIdx((i) => (i > 0 ? i - 1 : images.length - 1));
  }

  function nextImage() {
    setSelectedImageIdx((i) => (i < images.length - 1 ? i + 1 : 0));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-mesh-bg flex items-center justify-center">
        <Spinner size={48} label={t('detail.loading', 'Loading vehicle...')} />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-mesh-bg flex flex-col items-center justify-center gap-4">
        <p className="text-mesh-muted text-lg">{t('detail.notFound', 'Vehicle not found')}</p>
        <Link to="/vehicles">
          <Button variant="outline">
            <ArrowLeft size={16} className="mr-2 rtl:mr-0 rtl:ml-2" />
            {t('detail.backToCatalog', 'Back to catalog')}
          </Button>
        </Link>
      </div>
    );
  }

  const selectedImage = images[selectedImageIdx];
  const selectedImageUrl = selectedImage ? resolveMediaUrl(selectedImage.imageUrl) : null;
  const canBuy = vehicle.listingType === 'SALE' || vehicle.listingType === 'BOTH';
  const canRent = vehicle.listingType === 'RENT' || vehicle.listingType === 'BOTH';

  const localizedReportReasons = REPORT_REASONS.map((r) => ({
    value: r.value,
    label: t(`report.reason.${r.value}`, r.label),
  }));

  const specs = [
    { icon: <Calendar size={18} />, label: t('detail.year', 'Year'), value: vehicle.year },
    { icon: <Cog size={18} />, label: t('detail.brand', 'Brand'), value: vehicle.brand },
    { icon: <Cog size={18} />, label: t('detail.model', 'Model'), value: vehicle.model },
    { icon: <Fuel size={18} />, label: t('detail.fuelType', 'Fuel Type'), value: vehicle.fuelType ? t(`fuel.${vehicle.fuelType}`, vehicle.fuelType) : '—' },
    { icon: <Cog size={18} />, label: t('detail.transmission', 'Transmission'), value: vehicle.transmission ? t(`transmission.${vehicle.transmission}`, vehicle.transmission) : '—' },
    { icon: <Gauge size={18} />, label: t('detail.mileage', 'Mileage'), value: vehicle.mileage != null ? `${vehicle.mileage.toLocaleString()} km` : '—' },
    { icon: <Palette size={18} />, label: t('detail.color', 'Color'), value: vehicle.color ?? '—' },
    { icon: <MapPin size={18} />, label: t('detail.city', 'City'), value: vehicle.locationCity ?? '—' },
  ];

  return (
    <div className="min-h-screen bg-mesh-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link
          to="/vehicles"
          className="inline-flex items-center gap-1.5 text-mesh-muted hover:text-mesh-gold transition-all duration-200 mb-6"
        >
          <ArrowLeft size={18} />
          {t('detail.backToCatalog', 'Back to catalog')}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left column: Gallery + Description */}
          <div className="lg:col-span-3 space-y-6">
            {/* Image gallery */}
            <Card padding={false} className="overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.4),0_0_40px_rgba(212,168,83,0.04)]">
              {images.length > 0 ? (
                <>
                  <div className="relative aspect-[16/10] bg-white/[0.02]">
                    {selectedImageUrl && (
                      <img
                        src={selectedImageUrl}
                        alt={vehicle.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/[0.1] text-white flex items-center justify-center hover:bg-black/60 transition-all duration-200 cursor-pointer"
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/[0.1] text-white flex items-center justify-center hover:bg-black/60 transition-all duration-200 cursor-pointer"
                        >
                          <ChevronRight size={20} />
                        </button>
                        <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm border border-white/[0.1] text-white text-xs px-2.5 py-1 rounded-full">
                          {selectedImageIdx + 1} / {images.length}
                        </div>
                      </>
                    )}
                  </div>
                  {images.length > 1 && (
                    <div className="flex gap-2 p-3 overflow-x-auto">
                      {images.map((img, idx) => {
                        const thumbUrl = resolveMediaUrl(img.imageUrl);
                        return (
                          <button
                            key={img.id}
                            onClick={() => setSelectedImageIdx(idx)}
                            className={`flex-shrink-0 w-20 h-16 rounded-[var(--radius-mesh-sm)] overflow-hidden border-2 transition-all duration-200 cursor-pointer ${
                              idx === selectedImageIdx
                                ? 'border-mesh-gold shadow-[0_0_10px_rgba(212,168,83,0.2)]'
                                : 'border-transparent hover:border-white/[0.15]'
                            }`}
                          >
                            {thumbUrl && (
                              <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="aspect-[16/10] bg-white/[0.02] flex items-center justify-center">
                  <Cog size={64} className="text-mesh-muted/20" />
                </div>
              )}
            </Card>

            {/* Description */}
            {vehicle.description && (
              <Card>
                <h2 className="text-lg font-semibold text-mesh-text mb-3">
                  {t('detail.description', 'Description')}
                </h2>
                <p className="text-mesh-muted leading-relaxed whitespace-pre-line">
                  {vehicle.description}
                </p>
              </Card>
            )}

            {/* Reviews section */}
            <Card>
              <h2 className="text-lg font-semibold text-mesh-text mb-4">
                {t('detail.reviews', 'Reviews')}
              </h2>

              {isUser && (
                <div className="mb-6 p-4 bg-white/[0.03] rounded-[var(--radius-mesh-sm)] border border-white/[0.06]">
                  <h3 className="text-sm font-medium text-mesh-text mb-3">
                    {t('detail.writeReview', 'Write a review')}
                  </h3>
                  <div className="mb-3">
                    <StarRating value={newRating} onChange={setNewRating} />
                  </div>
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={t('detail.reviewPlaceholder', 'Share your experience...')}
                    rows={3}
                  />
                  <div className="mt-3">
                    <Button
                      size="sm"
                      onClick={submitReview}
                      loading={submittingReview}
                      disabled={newRating === 0}
                    >
                      {t('detail.submitReview', 'Submit Review')}
                    </Button>
                  </div>
                </div>
              )}

              {reviewsLoading ? (
                <div className="py-8 flex justify-center">
                  <Spinner size={32} />
                </div>
              ) : reviews.length === 0 ? (
                <p className="text-mesh-muted text-sm text-center py-6">
                  {t('detail.noReviews', 'No reviews yet. Be the first to review!')}
                </p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="p-4 bg-white/[0.03] rounded-[var(--radius-mesh-sm)] border border-white/[0.06]"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-mesh-text">
                            {review.user
                              ? `${review.user.firstName} ${review.user.lastName}`
                              : t('detail.anonymous', 'Anonymous')}
                          </span>
                          <StarRating value={review.rating} readonly size={14} />
                        </div>
                        <span className="text-xs text-mesh-muted">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-mesh-muted">{review.comment}</p>
                      )}
                    </div>
                  ))}

                  <Pagination
                    page={reviewPage}
                    totalPages={reviewTotalPages}
                    onPageChange={setReviewPage}
                  />
                </div>
              )}
            </Card>
          </div>

          {/* Right column: Info + Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Price */}
            <Card>
              <h1 className="text-2xl font-bold text-mesh-text mb-2">{vehicle.title}</h1>

              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="gold">
                  {t(`listingType.${vehicle.listingType}`, vehicle.listingType)}
                </Badge>
                <Badge
                  variant={vehicle.availabilityStatus === 'AVAILABLE' ? 'success' : 'warning'}
                >
                  {t(`availability.${vehicle.availabilityStatus}`, vehicle.availabilityStatus)}
                </Badge>
              </div>

              <div className="space-y-1 mb-4">
                {(vehicle.listingType === 'SALE' || vehicle.listingType === 'BOTH') && vehicle.price && (
                  <p className="text-2xl font-bold text-gradient-gold inline-block">
                    ${Number(vehicle.price).toLocaleString()}
                    <span className="text-sm font-normal text-mesh-muted ml-1">
                      {t('detail.salePrice', 'sale price')}
                    </span>
                  </p>
                )}
                {(vehicle.listingType === 'RENT' || vehicle.listingType === 'BOTH') && vehicle.rentalPricePerDay && (
                  <p className="text-xl font-bold text-mesh-gold">
                    ${Number(vehicle.rentalPricePerDay).toLocaleString()}
                    <span className="text-sm font-normal text-mesh-muted ml-1">
                      {t('detail.perDay', '/ day')}
                    </span>
                  </p>
                )}
              </div>

              {vehicle.vendor && (
                <div className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-[var(--radius-mesh-sm)] border border-white/[0.06]">
                  {vehicle.vendor.logoUrl ? (
                    <img
                      src={resolveMediaUrl(vehicle.vendor.logoUrl) ?? ''}
                      alt={vehicle.vendor.businessName}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-mesh-gold/20"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-mesh-gold/30 to-mesh-accent/20 flex items-center justify-center text-mesh-gold font-bold text-sm">
                      {vehicle.vendor.businessName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-mesh-text">{vehicle.vendor.businessName}</p>
                    <p className="text-xs text-mesh-muted">{vehicle.vendor.contactPersonName}</p>
                  </div>
                </div>
              )}
            </Card>

            {/* Specs grid */}
            <Card>
              <h2 className="text-lg font-semibold text-mesh-text mb-4">
                {t('detail.specifications', 'Specifications')}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {specs.map((spec) => (
                  <div
                    key={spec.label}
                    className="flex items-start gap-2.5 p-3 bg-white/[0.03] rounded-[var(--radius-mesh-sm)] border border-white/[0.06] transition-all duration-200 hover:bg-white/[0.05]"
                  >
                    <span className="text-mesh-gold mt-0.5">{spec.icon}</span>
                    <div>
                      <p className="text-xs text-mesh-muted">{spec.label}</p>
                      <p className="text-sm font-medium text-mesh-text">{spec.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Actions (USER only) */}
            {isUser && (
              <Card>
                <h2 className="text-lg font-semibold text-mesh-text mb-4">
                  {t('detail.actions', 'Actions')}
                </h2>
                <div className="space-y-3">
                  {canBuy && (
                    <Button fullWidth onClick={() => setPurchaseModalOpen(true)} className="flex items-center justify-center gap-2">
                      <ShoppingCart size={18} />
                      {t('detail.buyVehicle', 'Buy This Vehicle')}
                    </Button>
                  )}
                  {canRent && (
                    <Button
                      fullWidth
                      variant="secondary"
                      onClick={() => setRentalModalOpen(true)}
                      className="flex items-center justify-center gap-2"
                    >
                      <KeyRound size={18} />
                      {t('detail.rentVehicle', 'Rent This Vehicle')}
                    </Button>
                  )}
                  <Button
                    fullWidth
                    variant="outline"
                    onClick={toggleFavorite}
                    loading={favLoading}
                    className="flex items-center justify-center gap-2"
                  >
                    <Heart
                      size={18}
                      className={isFavorited ? 'fill-red-500 text-red-500' : ''}
                    />
                    {isFavorited
                      ? t('detail.unfavorite', 'Remove from Favorites')
                      : t('detail.favorite', 'Add to Favorites')}
                  </Button>
                  <Button
                    fullWidth
                    variant="ghost"
                    onClick={() => setReportModalOpen(true)}
                    className="flex items-center justify-center gap-2 text-mesh-muted"
                  >
                    <Flag size={18} />
                    {t('detail.reportVehicle', 'Report')}
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Purchase modal */}
      <Modal
        open={purchaseModalOpen}
        onClose={() => setPurchaseModalOpen(false)}
        title={t('detail.purchaseTitle', 'Purchase Request')}
      >
        <div className="space-y-4">
          <p className="text-sm text-mesh-muted">
            {t('detail.purchaseDescription', 'Send a purchase request to the vendor for this vehicle.')}
          </p>
          <Input
            label={t('detail.offeredPrice', 'Offered Price (optional)')}
            type="number"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            placeholder={vehicle.price ? `$${Number(vehicle.price).toLocaleString()}` : '0'}
          />
          <Textarea
            label={t('detail.message', 'Message (optional)')}
            value={purchaseMessage}
            onChange={(e) => setPurchaseMessage(e.target.value)}
            placeholder={t('detail.purchaseMessagePlaceholder', 'Add a message to the vendor...')}
            rows={3}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setPurchaseModalOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={submitPurchase} loading={purchaseLoading}>
              {t('detail.sendRequest', 'Send Request')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Rental modal */}
      <Modal
        open={rentalModalOpen}
        onClose={() => setRentalModalOpen(false)}
        title={t('detail.rentalTitle', 'Rental Request')}
      >
        <div className="space-y-4">
          <p className="text-sm text-mesh-muted">
            {t('detail.rentalDescription', 'Select dates and send a rental request.')}
          </p>
          <Input
            label={t('detail.startDate', 'Start Date')}
            type="date"
            value={rentalStart}
            onChange={(e) => setRentalStart(e.target.value)}
          />
          <Input
            label={t('detail.endDate', 'End Date')}
            type="date"
            value={rentalEnd}
            onChange={(e) => setRentalEnd(e.target.value)}
          />
          <Textarea
            label={t('detail.message', 'Message (optional)')}
            value={rentalMessage}
            onChange={(e) => setRentalMessage(e.target.value)}
            placeholder={t('detail.rentalMessagePlaceholder', 'Add a message to the vendor...')}
            rows={3}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setRentalModalOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={submitRental} loading={rentalLoading} disabled={!rentalStart || !rentalEnd}>
              {t('detail.sendRequest', 'Send Request')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Report modal */}
      <Modal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title={t('detail.reportTitle', 'Report Vehicle')}
      >
        <div className="space-y-4">
          <p className="text-sm text-mesh-muted">
            {t('detail.reportDescription', 'Let us know why you are reporting this listing.')}
          </p>
          <Select
            label={t('detail.reportReason', 'Reason')}
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            options={localizedReportReasons}
            placeholder={t('detail.selectReason', 'Select a reason')}
          />
          <Textarea
            label={t('detail.reportDetails', 'Details (optional)')}
            value={reportDescription}
            onChange={(e) => setReportDescription(e.target.value)}
            placeholder={t('detail.reportDetailsPlaceholder', 'Provide additional details...')}
            rows={3}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setReportModalOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button variant="danger" onClick={submitReport} loading={reportLoading} disabled={!reportReason}>
              {t('detail.submitReport', 'Submit Report')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
