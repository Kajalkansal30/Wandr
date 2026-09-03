import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Shield, Clock, CheckCircle, XCircle, Eye, Users, Store, Flag, ArrowLeft,
  ScrollText, Image, UserCheck, Ban,
} from "lucide-react";
import {
  fetchAdminPlaces,
  fetchAdminStats,
  fetchAuditLog,
  fetchAdminClaims,
  fetchPendingMedia,
  approveClaim,
  rejectClaim,
  approveMedia,
  rejectMedia,
} from "../../api/admin";

export default function AdminPage() {
  const navigate = useNavigate();
  const [view, setView] = useState("listings");
  const [statusTab, setStatusTab] = useState("PENDING_REVIEW");
  const [cafes, setCafes] = useState([]);
  const [claims, setClaims] = useState([]);
  const [media, setMedia] = useState([]);
  const [audit, setAudit] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const nextStats = await fetchAdminStats();
        setStats(nextStats || {});
        if (view === "listings") {
          const st = statusTab === "pending" ? "PENDING_REVIEW" : statusTab.toUpperCase();
          setCafes(await fetchAdminPlaces(st));
        } else if (view === "claims") {
          setClaims(await fetchAdminClaims());
        } else if (view === "media") {
          setMedia(await fetchPendingMedia());
        } else if (view === "audit") {
          setAudit(await fetchAuditLog());
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, [view, statusTab]);

  return (
    <div className="page-shell page-with-nav pt-6 md:pt-8">
      <button type="button" onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm text-warm-500">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="mb-6 flex items-center gap-2">
        <Shield size={22} className="text-warm-600" />
        <div>
          <h1 className="text-2xl font-bold text-warm-700" style={{ fontFamily: "var(--font-display)" }}>
            Command Center
          </h1>
          <p className="text-sm text-warm-400">Moderation · claims · audit</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {[
          ["Live", stats.approved, Store],
          ["Pending", stats.pending, Clock],
          ["Unclaimed", stats.unclaimed, UserCheck],
          ["Claims", stats.claimPending, Flag],
          ["Reports", stats.reports, Flag],
          ["Users", stats.users, Users],
        ].map(([label, val, Icon]) => (
          <div key={label} className="rounded-xl border border-warm-100 bg-white p-3 text-center">
            <Icon size={14} className="mx-auto mb-1 text-warm-400" />
            <p className="text-lg font-bold text-warm-700">{val ?? 0}</p>
            <p className="text-[10px] text-warm-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-warm-100 p-1">
        {[
          { id: "listings", label: "Listings", icon: Store },
          { id: "claims", label: "Claims", icon: UserCheck },
          { id: "media", label: "Photos", icon: Image },
          { id: "audit", label: "Audit", icon: ScrollText },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setView(t.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg py-2.5 text-sm font-medium ${
                view === t.id ? "bg-white text-warm-700 shadow-sm" : "text-warm-400"
              }`}
            >
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {view === "listings" && (
        <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-warm-50 p-1">
          {[
            ["PENDING_REVIEW", "Pending"],
            ["APPROVED", "Approved"],
            ["REJECTED", "Rejected"],
            ["SUSPENDED", "Suspended"],
            ["CLOSED", "Closed"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setStatusTab(id)}
              className={`flex-1 rounded-lg py-2 text-xs font-medium ${
                statusTab === id ? "bg-white text-warm-700 shadow-sm" : "text-warm-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-warm-200 border-t-warm-500" />
        </div>
      ) : view === "listings" ? (
        cafes.length === 0 ? (
          <p className="py-12 text-center text-sm text-warm-400">No listings in this queue.</p>
        ) : (
          <div className="space-y-3">
            {cafes.map((cafe) => (
              <div key={cafe.id} className="overflow-hidden rounded-xl border border-warm-100 bg-white shadow-sm">
                {cafe.image && <img src={cafe.image} alt="" className="h-28 w-full object-cover" />}
                <div className="flex items-start justify-between gap-2 p-4">
                  <div>
                    <h3 className="font-semibold text-warm-700">{cafe.name}</h3>
                    <p className="text-xs text-warm-400">
                      {cafe.locationType || cafe.category} · {cafe.ownershipStatus}
                    </p>
                  </div>
                  <Link
                    to={`/admin/verify/${cafe.id}`}
                    className="flex shrink-0 items-center gap-1 rounded-lg bg-warm-100 px-3 py-1.5 text-xs font-semibold text-warm-600"
                  >
                    <Eye size={12} /> Review
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )
      ) : view === "claims" ? (
        claims.length === 0 ? (
          <p className="py-12 text-center text-sm text-warm-400">No pending claims.</p>
        ) : (
          <div className="space-y-3">
            {claims.map((c) => (
              <div key={c.id} className="rounded-xl border border-warm-100 bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-warm-700">{c.placeName}</h3>
                    <p className="text-xs text-warm-400">
                      {c.verificationRequest ? "Verification request" : "Ownership claim"} · {c.phone || "no phone"}
                    </p>
                    {c.evidence && <p className="mt-2 text-sm text-warm-500">{c.evidence}</p>}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await approveClaim(c.id, { note: "Approved" });
                      setClaims((prev) => prev.filter((x) => x.id !== c.id));
                    }}
                    className="rounded-lg bg-sage-100 px-3 py-1.5 text-xs font-semibold text-sage-500"
                  >
                    <CheckCircle size={12} className="mr-1 inline" /> Approve
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await rejectClaim(c.id, { note: "Rejected" });
                      setClaims((prev) => prev.filter((x) => x.id !== c.id));
                    }}
                    className="rounded-lg bg-terracotta-50 px-3 py-1.5 text-xs font-semibold text-terracotta-500"
                  >
                    <XCircle size={12} className="mr-1 inline" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : view === "media" ? (
        media.length === 0 ? (
          <p className="py-12 text-center text-sm text-warm-400">No pending photos.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {media.map((m) => (
              <div key={m.id} className="overflow-hidden rounded-xl border border-warm-100 bg-white">
                <img src={m.url} alt="" className="aspect-video w-full object-cover" />
                <div className="flex gap-2 p-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await approveMedia(m.id);
                      setMedia((prev) => prev.filter((x) => x.id !== m.id));
                    }}
                    className="flex-1 rounded-lg bg-sage-100 py-1.5 text-xs font-semibold text-sage-500"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await rejectMedia(m.id, { note: "Rejected" });
                      setMedia((prev) => prev.filter((x) => x.id !== m.id));
                    }}
                    className="flex-1 rounded-lg bg-warm-100 py-1.5 text-xs font-semibold text-warm-500"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-2">
          {audit.length === 0 ? (
            <p className="py-12 text-center text-sm text-warm-400">No audit entries yet.</p>
          ) : (
            audit.map((a) => (
              <div key={a.id} className="rounded-xl border border-warm-100 bg-white px-4 py-3 text-sm">
                <p className="font-semibold text-warm-700">{a.action}</p>
                <p className="text-xs text-warm-400">
                  Place #{a.placeId}
                  {a.note ? ` · ${a.note}` : ""}
                  {a.reasons ? ` · ${a.reasons}` : ""}
                </p>
                <p className="mt-1 text-[11px] text-warm-300">
                  {a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
