import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Clock, FileText, IdCard, Mail, Stamp, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { onboardingApi, uploadsApi } from "@/api/endpoints";
import { toErrorMessage } from "@/api/client";
import type { OnboardingDocumentSlot } from "@/api/types";

const Onboarding = () => {
  const navigate = useNavigate();
  const [ack, setAck] = useState(false);
  const [docs, setDocs] = useState<OnboardingDocumentSlot[]>([]);
  const [signingContact, setSigningContact] = useState<{ name: string; email: string } | null>(null);
  const [uploading, setUploading] = useState("");
  const [submittingAck, setSubmittingAck] = useState(false);
  const [error, setError] = useState("");

  const loadDocuments = () => {
    onboardingApi.documents()
      .then((response) => {
        setDocs(response.required_documents);
        setSigningContact(response.campus_signing_contact || null);
      })
      .catch((err) => setError(toErrorMessage(err)));
  };

  useEffect(loadDocuments, []);

  const uploadDocument = async (slot: OnboardingDocumentSlot, file: File) => {
    setUploading(slot.document_type);
    setError("");
    try {
      const presign = await uploadsApi.presign({
        purpose: "onboarding_document",
        filename: file.name,
        mime_type: file.type || "application/octet-stream",
      });
      await uploadsApi.uploadToPresignedUrl(presign.upload_url, file);
      await onboardingApi.submitDocument({
        document_type: slot.document_type,
        file_url: presign.file_url,
        original_filename: file.name,
      });
      loadDocuments();
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setUploading("");
    }
  };

  const acknowledge = async () => {
    setSubmittingAck(true);
    setError("");
    try {
      const response = await onboardingApi.acknowledge();
      navigate(response.application.dashboard_state === "full_learning" ? "/dashboard" : "/status");
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setSubmittingAck(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-5 lg:px-10 py-5 flex items-center justify-between border-b border-border">
        <Logo />
      </header>

      <div className="flex-1 px-5 py-10 lg:py-14 max-w-4xl w-full mx-auto">
        <div className="mb-8 animate-fade-up">
          <p className="text-sm font-mono uppercase tracking-widest text-secondary mb-2">// onboarding documents</p>
          <h1 className="font-display text-3xl lg:text-4xl font-bold">Prepare your SIWES documents</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Check your mail for the address and instructions from the admin. Passed users will be told where to submit SIWES forms for physical signing and stamping by the campus team.
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-6 lg:p-8 space-y-5">
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 flex gap-3">
            <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Check your email before submitting physical documents</p>
              <p className="text-sm text-muted-foreground mt-1">
                {signingContact
                  ? `${signingContact.name} (${signingContact.email}) is your campus signing contact.`
                  : "Admin will send the Code Zone address and signing instructions. Bring the physical SIWES form for signing/stamping when requested."}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {docs.map((doc) => (
              <div key={doc.document_type} className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary grid place-items-center">
                    <DocumentIcon type={doc.document_type} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="font-display font-semibold">{doc.title}</h2>
                      {doc.uploaded ? (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{doc.description || "Upload required document"}</p>
                    {doc.requires_physical_signature && (
                      <p className="text-xs text-warning mt-2">Requires physical signature</p>
                    )}
                    {doc.uploaded && <p className="text-xs text-primary mt-2">Uploaded - {doc.uploaded.status}</p>}
                    <label className="mt-4 inline-flex">
                      <input
                        type="file"
                        className="hidden"
                        disabled={uploading === doc.document_type}
                        onChange={(event) => event.target.files?.[0] && uploadDocument(doc, event.target.files[0])}
                      />
                      <span className="inline-flex h-9 items-center gap-2 border border-border bg-muted px-3 text-sm cursor-pointer hover:border-primary">
                        <Upload className="h-4 w-4" />
                        {uploading === doc.document_type ? "Uploading..." : doc.uploaded ? "Replace document" : "Upload document"}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <label className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border cursor-pointer hover:border-primary/40 transition-colors">
            <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-0.5 h-5 w-5 rounded accent-primary" />
            <span className="text-sm">
              I understand that physical SIWES forms must be signed/stamped by the assigned campus team and submitted according to the admin email.
            </span>
          </label>
        </div>

        {error && <p className="mt-4 border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

        <div className="flex justify-end mt-6">
          <Button variant="hero" size="xl" onClick={acknowledge} disabled={!ack || submittingAck} className="gap-2">
            {submittingAck ? "Submitting..." : "Acknowledge onboarding"} <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const DocumentIcon = ({ type }: { type: string }) => {
  if (type === "logbook") return <Stamp className="h-5 w-5" />;
  if (type === "other") return <IdCard className="h-5 w-5" />;
  return <FileText className="h-5 w-5" />;
};

export default Onboarding;
