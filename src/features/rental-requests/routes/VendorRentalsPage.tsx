import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CalendarDays, Check, X, MessageSquare } from "lucide-react";
import { rentalRequestsApi } from "../api/rentalRequestsApi";
import type { RentalRequest } from "../types";
import { notifySuccess, notifyError } from "../../../lib/toast";
import { Card } from "../../../components/ui/Card";
import { Spinner } from "../../../components/ui/Spinner";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import { useAuthStore } from "../../../stores/authStore";
import { findOrCreateRequestConversation } from "../../messaging/api";

const STATUS_VARIANT: Record<
  string,
  "warning" | "success" | "danger" | "info" | "default"
> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  CANCELLED: "default",
  COMPLETED: "info",
};

const AVAILABILITY_VARIANT: Record<
  string,
  "success" | "info" | "warning" | "danger" | "sold"
> = {
  AVAILABLE: "success",
  SOLD: "sold",
  RENTED: "warning",
  UNAVAILABLE: "danger",
};

export function VendorRentalsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const accountId = useAuthStore((s) => s.user?.id) ?? '';
  const [requests, setRequests] = useState<RentalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [chattingId, setChattingId] = useState<string | null>(null);

  const handleChat = async (req: RentalRequest) => {
    if (!req.user?.accountId) return;
    setChattingId(req.id);
    try {
      await findOrCreateRequestConversation({
        vendorAccountId: accountId,
        userAccountId: req.user.accountId,
        context: 'RENTAL_REQUEST',
        contextEntityId: req.id,
      });
      navigate('/vendor/messages');
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Failed to open chat');
    } finally {
      setChattingId(null);
    }
  };

  useEffect(() => {
    let cancelled = false;
    rentalRequestsApi
      .getVendorRequests()
      .then((data) => {
        if (!cancelled) setRequests(data);
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAction = async (id: string, status: "APPROVED" | "REJECTED") => {
    setActionId(id);
    try {
      await rentalRequestsApi.updateStatus(id, status);
      const refreshed = await rentalRequestsApi.getVendorRequests();
      setRequests(refreshed);
      notifySuccess(t(`rental.${status.toLowerCase()}`));
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionId(null);
    }
  };

  if (loading) return <Spinner label={t("common.loading")} />;
  if (error)
    return (
      <Card>
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      </Card>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CalendarDays size={22} className="text-mesh-gold" />
        <h1 className="text-2xl font-bold text-mesh-text">
          {t("rental.incomingRequests")}
        </h1>
        <Badge variant="gold">{requests.length}</Badge>
      </div>

      {requests.length === 0 ? (
        <EmptyState
          icon={<CalendarDays size={48} />}
          title={t("rental.noRequests")}
        />
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-mesh-border text-mesh-muted text-xs uppercase tracking-wider">
                  <th className="text-start p-4">{t("purchase.vehicle")}</th>
                  <th className="text-start p-4">
                    {t("vendor.availabilityStatus")}
                  </th>
                  <th className="text-start p-4">{t("rental.startDate")}</th>
                  <th className="text-start p-4">{t("rental.endDate")}</th>
                  <th className="text-start p-4">{t("rental.totalPrice")}</th>
                  <th className="text-start p-4 hidden sm:table-cell">
                    {t("common.message")}
                  </th>
                  <th className="text-start p-4">{t("common.status")}</th>
                  <th className="text-start p-4">{t("common.actions")}</th>
                  <th className="text-start p-4">Chat</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => {
                  const availabilityStatus = req.vehicle?.availabilityStatus;

                  return (
                    <tr
                      key={req.id}
                      className="border-b border-mesh-border/50 hover:bg-mesh-surface/50 transition-colors"
                    >
                      <td className="p-4 text-mesh-text font-medium">
                        {req.vehicle?.title ?? `${req.vehicleId.slice(0, 8)}…`}
                      </td>
                      <td className="p-4">
                        {availabilityStatus ? (
                          <Badge
                            variant={
                              AVAILABILITY_VARIANT[availabilityStatus] ??
                              "default"
                            }
                          >
                            {t(
                              `vehicles.${availabilityStatus.toLowerCase()}`,
                              availabilityStatus,
                            )}
                          </Badge>
                        ) : (
                          <span className="text-mesh-muted text-xs">—</span>
                        )}
                      </td>
                      <td className="p-4 text-mesh-text">
                        {new Date(req.startDate).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-mesh-text">
                        {new Date(req.endDate).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-mesh-gold font-semibold">
                        {req.totalPrice
                          ? `$${Number(req.totalPrice).toLocaleString()}`
                          : "—"}
                      </td>
                      <td className="p-4 text-mesh-muted truncate max-w-[200px] hidden sm:table-cell">
                        {req.message || "—"}
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={STATUS_VARIANT[req.status] ?? "default"}
                        >
                          {t(`rental.${req.status.toLowerCase()}`)}
                        </Badge>
                      </td>
                      <td className="p-4">
                        {req.status === "PENDING" ? (
                          <div className="flex gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              loading={actionId === req.id}
                              onClick={() => handleAction(req.id, "APPROVED")}
                              title={t("rental.approve")}
                            >
                              <Check size={14} className="text-emerald-400" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              loading={actionId === req.id}
                              onClick={() => handleAction(req.id, "REJECTED")}
                              title={t("rental.reject")}
                            >
                              <X size={14} className="text-red-400" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-mesh-muted text-xs">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        <Button variant="ghost" size="sm" loading={chattingId === req.id} onClick={() => handleChat(req)} title="Chat with Customer">
                          <MessageSquare size={14} className="text-mesh-gold" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
