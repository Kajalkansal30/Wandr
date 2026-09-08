import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { isVerificationRequiredError } from "../api/auth";
import {
  claimPlace,
  fetchClaimMethods,
  fetchMyClaim,
  fetchPlace,
  startClaimPhoneOtp,
  verifyClaimPhoneOtp,
  startClaimBusinessEmail,
  verifyClaimBusinessEmail,
  startClaimDomain,
  checkClaimDomain,
  submitClaimVideo,
  submitClaimDocument,
} from "../api/places";
import { uploadClaimDocument, uploadClaimVideo } from "../utils/uploadSpot";
import { trackEvent } from "../api/analytics";

const ROLES = ["OWNER", "MANAGER", "AUTHORIZED_REPRESENTATIVE"];

/**
 * Full claim / verification wizard for a place.
 * @param {{ placeId: string|number, onComplete?: (place) => void, initialOpen?: boolean, mode?: 'claim'|'managed'|'upgrade' }} props
 */
export default function ClaimVerificationPanel({ placeId, onComplete, initialOpen = false, mode = "claim" }) {
  const { user, emailVerified } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(initialOpen);
  const [busy, setBusy] = useState(false);
  const [role, setRole] = useState("OWNER");
  const [claimId, setClaimId] = useState(null);
  const [step, setStep] = useState("role");
  const [methods, setMethods] = useState(null);
  const [otpCode, setOtpCode] = useState("");
  const [bizEmail, setBizEmail] = useState("");
  const [emailToken, setEmailToken] = useState("");
  const [domainTxt, setDomainTxt] = useState("");
  const [domainHost, setDomainHost] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [msg, setMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pendingHint, setPendingHint] = useState(false);

  // Resume pending claim on mount (even when collapsed) so refresh doesn't lose progress.
  useEffect(() => {
    if (!user || !placeId) return;
    let cancelled = false;
    (async () => {
      try {
        const pending = await fetchMyClaim(placeId).catch(() => null);
        if (cancelled || !pending?.id) return;
        setClaimId(pending.id);
        setStep("methods");
        setMsg(pending.message || "Resume verification.");
        if (pending.requestedRole) setRole(pending.requestedRole);
        setPendingHint(true);
        setOpen(true);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, placeId]);

  useEffect(() => {
    if (!user || !placeId || !open) return;
    (async () => {
      try {
        const m = await fetchClaimMethods(placeId);
        setMethods(m);
      } catch {
        /* ignore */
      }
    })();
  }, [user, placeId, open]);

  function gateVerify(err) {
    if (isVerificationRequiredError(err)) {
      alert("Verify your email first (links expire in 24 hours).");
      navigate("/verify-email");
      return true;
    }
    return false;
  }

  async function startClaim(kind = mode === "upgrade" ? "VERIFICATION_UPGRADE" : "CLAIM") {
    if (!user) {
      navigate(`/login?next=/cafe/${placeId}`);
      return;
    }
    if (emailVerified === false) {
      alert("Verify your email before claiming a business.");
      navigate("/verify-email");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const m = methods || (await fetchClaimMethods(placeId));
      setMethods(m);
      if (kind === "CLAIM" && m.alreadyManaged && !m.canClaim) {
        kind = "ACCESS_REQUEST";
      }
      const body = {
        requestedRole: role,
        claimKind: kind,
        verificationRequest: kind === "VERIFICATION_UPGRADE",
      };
      const res = await claimPlace(placeId, body);
      if (kind === "ACCESS_REQUEST" || kind === "DISPUTE") {
        setMsg(res.message || "Submitted for review.");
        setStep("done");
        return;
      }
      setClaimId(res.id);
      setPendingHint(false);
      setMsg(res.message || "Choose a verification method.");
      setStep("methods");
      trackEvent("claim_start", { placeId: Number(placeId), source: "panel" });
    } catch (err) {
      if (!gateVerify(err)) alert(err.message || "Could not start claim");
    } finally {
      setBusy(false);
    }
  }

  async function run(action) {
    if (!claimId) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await action();
      setMsg(res.message || "Updated.");
      if (res.domainTxtRecord) {
        setDomainTxt(res.domainTxtRecord);
        setDomainHost(res.domainHost || "");
      }
      if (res.autoApproved || res.status === "APPROVED") {
        setStep("done");
        setPendingHint(false);
        trackEvent("claim_complete", { placeId: Number(placeId), source: "panel" });
        const place = await fetchPlace(placeId);
        onComplete?.(place);
      }
    } catch (err) {
      if (!gateVerify(err)) alert(err.message || "Step failed");
    } finally {
      setBusy(false);
    }
  }

  async function onFile(kind, file) {
    if (!file || !claimId) return;
    setUploading(true);
    try {
      const url = kind === "video" ? await uploadClaimVideo(file) : await uploadClaimDocument(file);
      await run(() =>
        kind === "video"
          ? submitClaimVideo(claimId, url, "Verification video")
          : submitClaimDocument(claimId, url, "Business document")
      );
      if (step !== "done") setMsg("Submitted for admin review.");
    } catch (err) {
      alert(err.message || "Upload failed — paste a Cloudinary URL below instead.");
    } finally {
      setUploading(false);
    }
  }

  const recommended = methods?.recommended || [];
  const other = methods?.other || [];
  const showMethod = (key) => recommended.includes(key) || other.includes(key);
  const isRecommended = (key) => recommended.includes(key);

  if (!open) {
    return (
      <div className="mt-3">
        {pendingHint ? (
          <p className="mb-2 text-xs font-semibold text-sage-600">You have a verification in progress.</p>
        ) : null}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-xl bg-warm-700 px-4 py-2 text-sm font-semibold text-white"
        >
          {mode === "managed"
            ? "Request access / dispute"
            : mode === "upgrade"
              ? "Complete verification"
              : pendingHint
                ? "Resume verification"
                : "Claim this business"}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3">
      {step === "role" && (
        <>
          <p className="text-xs font-semibold text-warm-600">How are you associated?</p>
          {ROLES.map((r) => (
            <label key={r} className="flex items-center gap-2 text-sm text-warm-700">
              <input type="radio" name="claimRole" checked={role === r} onChange={() => setRole(r)} />
              {r.replaceAll("_", " ")}
            </label>
          ))}
          {mode === "managed" ? (
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={() => startClaim("ACCESS_REQUEST")} className="rounded-xl bg-warm-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                Request access
              </button>
              <button type="button" disabled={busy} onClick={() => startClaim("DISPUTE")} className="rounded-xl border border-warm-300 px-4 py-2 text-sm font-semibold text-warm-700 disabled:opacity-50">
                Ownership dispute
              </button>
            </div>
          ) : (
            <button type="button" disabled={busy} onClick={() => startClaim(mode === "upgrade" ? "VERIFICATION_UPGRADE" : "CLAIM")} className="rounded-xl bg-warm-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {busy ? "Starting…" : "Continue"}
            </button>
          )}
        </>
      )}

      {step === "methods" && (
        <>
          <p className="text-xs font-semibold text-warm-600">Verify your association</p>
          <p className="text-[11px] text-warm-400">
            OTP / email / domain prove contact or website control — not legal ownership by itself. Video and documents go to admin review.
          </p>

          {showMethod("PHONE_OTP") && (
            <div className={`rounded-lg border p-3 ${isRecommended("PHONE_OTP") ? "border-sage-300 bg-white" : "border-warm-200 bg-warm-50"}`}>
              {isRecommended("PHONE_OTP") ? <p className="mb-1 text-[11px] font-bold uppercase text-sage-500">Recommended</p> : null}
              <button type="button" disabled={busy} className="text-sm font-semibold text-warm-700 disabled:opacity-40" onClick={() => run(() => startClaimPhoneOtp(claimId))}>
                📱 Send OTP to listing phone {methods?.listingPhoneMasked || ""}
              </button>
              <div className="mt-2 flex gap-2">
                <input value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="OTP code" className="flex-1 rounded-lg border border-warm-200 px-3 py-2 text-sm" />
                <button type="button" disabled={busy} className="rounded-lg bg-warm-700 px-3 py-2 text-xs font-semibold text-white" onClick={() => run(() => verifyClaimPhoneOtp(claimId, otpCode))}>
                  Verify
                </button>
              </div>
            </div>
          )}

          {showMethod("DOMAIN_TXT") && (
            <div className={`rounded-lg border p-3 ${isRecommended("DOMAIN_TXT") ? "border-sage-300 bg-white" : "border-warm-200 bg-warm-50"}`}>
              {isRecommended("DOMAIN_TXT") ? <p className="mb-1 text-[11px] font-bold uppercase text-sage-500">Recommended</p> : null}
              <button type="button" disabled={busy} className="text-sm font-semibold text-warm-700 disabled:opacity-40" onClick={() => run(() => startClaimDomain(claimId))}>
                🌐 Start website DNS verification
              </button>
              {domainTxt ? (
                <div className="mt-2 text-xs text-warm-600">
                  Add TXT on <strong>{domainHost}</strong>: <code className="break-all">{domainTxt}</code>
                  <button type="button" className="ml-2 font-semibold underline" onClick={() => run(() => checkClaimDomain(claimId))}>
                    Check DNS
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {showMethod("BUSINESS_EMAIL") && (
            <div className={`rounded-lg border p-3 ${isRecommended("BUSINESS_EMAIL") ? "border-sage-300 bg-white" : "border-warm-200 bg-warm-50"}`}>
              <div className="flex gap-2">
                <input value={bizEmail} onChange={(e) => setBizEmail(e.target.value)} placeholder="Business email" className="flex-1 rounded-lg border border-warm-200 px-3 py-2 text-sm" />
                <button type="button" disabled={busy} className="rounded-lg border border-warm-200 px-3 py-2 text-xs font-semibold" onClick={() => run(() => startClaimBusinessEmail(claimId, bizEmail))}>
                  Send
                </button>
              </div>
              <div className="mt-2 flex gap-2">
                <input value={emailToken} onChange={(e) => setEmailToken(e.target.value)} placeholder="Email token / code" className="flex-1 rounded-lg border border-warm-200 px-3 py-2 text-sm" />
                <button type="button" disabled={busy} className="rounded-lg border border-warm-200 px-3 py-2 text-xs font-semibold" onClick={() => run(() => verifyClaimBusinessEmail(claimId, emailToken))}>
                  Verify
                </button>
              </div>
              <p className="mt-1 text-[11px] text-warm-400">
                Or open the link in the email — <Link className="underline" to="/claim-verify">/claim-verify</Link>
              </p>
            </div>
          )}

          {showMethod("VIDEO") && (
            <div className="rounded-lg border border-warm-200 bg-warm-50 p-3">
              <p className="text-sm font-semibold text-warm-700">🎥 Verification video (admin review)</p>
              <input type="file" accept="video/*" className="mt-2 block w-full text-xs" disabled={uploading || busy} onChange={(e) => onFile("video", e.target.files?.[0])} />
              <div className="mt-2 flex gap-2">
                <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Or paste Cloudinary video URL" className="flex-1 rounded-lg border border-warm-200 px-3 py-2 text-sm" />
                <button
                  type="button"
                  disabled={busy || !videoUrl.trim()}
                  className="rounded-lg border border-warm-200 px-3 py-2 text-xs font-semibold disabled:opacity-40"
                  onClick={() => run(() => submitClaimVideo(claimId, videoUrl.trim(), "Verification video"))}
                >
                  Submit URL
                </button>
              </div>
            </div>
          )}

          {showMethod("DOCUMENT") && (
            <div className="rounded-lg border border-warm-200 bg-warm-50 p-3">
              <p className="text-sm font-semibold text-warm-700">📄 Documents (admin review, private)</p>
              <input type="file" accept="image/*,.pdf" className="mt-2 block w-full text-xs" disabled={uploading || busy} onChange={(e) => onFile("doc", e.target.files?.[0])} />
              <div className="mt-2 flex gap-2">
                <input value={docUrl} onChange={(e) => setDocUrl(e.target.value)} placeholder="Or paste Cloudinary document URL" className="flex-1 rounded-lg border border-warm-200 px-3 py-2 text-sm" />
                <button
                  type="button"
                  disabled={busy || !docUrl.trim()}
                  className="rounded-lg border border-warm-200 px-3 py-2 text-xs font-semibold disabled:opacity-40"
                  onClick={() => run(() => submitClaimDocument(claimId, docUrl.trim(), "Business document"))}
                >
                  Submit URL
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {step === "done" && (
        <p className="text-sm font-semibold text-sage-500">Done. {msg || "We'll notify you if more review is needed."}</p>
      )}
      {msg && step !== "done" ? <p className="text-xs text-warm-500">{msg}</p> : null}
    </div>
  );
}
