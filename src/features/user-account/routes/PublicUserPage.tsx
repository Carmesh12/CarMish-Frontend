import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CalendarDays, MapPin, User } from 'lucide-react';

import { Card } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Spinner } from '../../../components/ui/Spinner';
import { resolveMediaUrl } from '../../../lib/api';
import { getPublicUserProfile } from '../api/userProfileApi';
import type { PublicUserProfileResponse } from '../types';

export function PublicUserPage() {
  const { t } = useTranslation();
  const { accountId } = useParams<{ accountId: string }>();
  const [profile, setProfile] = useState<PublicUserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!accountId) return;

    let cancelled = false;

    getPublicUserProfile(accountId)
      .then((response) => {
        if (!cancelled) {
          setProfile(response);
          setNotFound(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProfile(null);
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
            title={t('userPublic.notFoundTitle', 'User not found')}
            description={t(
              'userPublic.notFoundDescription',
              'This user profile is not available right now.',
            )}
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-mesh-bg flex items-center justify-center">
        <Spinner size={48} label={t('userPublic.loading', 'Loading user...')} />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-mesh-bg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <EmptyState
            icon={<User size={48} />}
            title={t('userPublic.notFoundTitle', 'User not found')}
            description={t(
              'userPublic.notFoundDescription',
              'This user profile is not available right now.',
            )}
            action={
              <Link
                to="/vehicles"
                className="inline-flex items-center justify-center rounded-[var(--radius-mesh-sm)] px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-mesh-gold to-mesh-gold-hover text-mesh-bg"
              >
                {t('userPublic.backToVehicles', 'Back to vehicles')}
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const fullName = `${profile.firstName} ${profile.lastName}`.trim();
  const imageUrl = resolveMediaUrl(profile.profileImageUrl);

  return (
    <div className="min-h-screen bg-mesh-bg">
      <div className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 bg-gradient-to-br from-mesh-accent/[0.07] via-transparent to-mesh-gold/[0.06]" />
        <div className="absolute -top-20 right-1/4 h-64 w-64 rounded-full bg-mesh-gold/[0.08] blur-3xl" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link
            to="/vehicles"
            className="inline-flex items-center gap-1.5 text-mesh-muted hover:text-mesh-gold transition-all duration-200 mb-8"
          >
            <ArrowLeft size={18} />
            {t('userPublic.backToVehicles', 'Back to vehicles')}
          </Link>

          <Card className="max-w-2xl">
            <div className="flex flex-col sm:flex-row gap-5 sm:items-center">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={fullName}
                  className="w-24 h-24 rounded-full object-cover ring-2 ring-mesh-gold/25 bg-white/[0.04]"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-mesh-gold/30 to-mesh-accent/20 flex items-center justify-center text-mesh-gold text-3xl font-bold ring-2 ring-mesh-gold/20">
                  {fullName.charAt(0) || 'U'}
                </div>
              )}

              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-mesh-gold mb-2">
                  {t('userPublic.profileLabel', 'Customer profile')}
                </p>
                <h1 className="text-3xl font-bold text-mesh-text">{fullName}</h1>
                <div className="flex items-center gap-2 text-sm text-mesh-muted mt-3">
                  <CalendarDays size={16} />
                  <span>
                    {t('userPublic.memberSince', 'Member since')}{' '}
                    {new Date(profile.memberSince).toLocaleDateString()}
                  </span>
                </div>
                {profile.city && (
                  <div className="flex items-center gap-2 text-sm text-mesh-muted mt-2">
                    <MapPin size={16} />
                    <span>{profile.city}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
