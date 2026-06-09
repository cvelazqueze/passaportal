"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Save,
  Upload,
  Pencil,
  X,
  Loader2,
  Plus,
  Trash2,
  ChevronUp,
} from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { interpolate } from "@/lib/i18n";

interface Experience {
  id: string;
  company: string;
  location: string | null;
  position: string;
  startDate: string | Date;
  endDate: string | Date | null;
  isCurrent: boolean;
  achievements: string[];
  technologies: string[];
}

interface PassportData {
  id: string;
  professionalTitle: string | null;
  professionalSummary: string | null;
  phone: string | null;
  linkedIn: string | null;
  portfolio: string | null;
  github: string | null;
  city: string | null;
  country: string | null;
  careerGoals: string | null;
  technologies: string[];
  completeness: number;
  experiences: Experience[];
  skills: { id: string; name: string; category: string | null; proficiency: string }[];
  education: {
    id: string;
    institution: string;
    location: string | null;
    degree: string;
    startDate: string | Date;
    endDate: string | Date | null;
  }[];
  certifications: { id: string; name: string; issuer: string }[];
  projects: {
    id: string;
    title: string;
    description: string | null;
    technologies: string[];
  }[];
  languages: { id: string; name: string; proficiency: string }[];
}

interface ProfileEditorProps {
  email: string;
  passport: PassportData;
  autoSummary: string;
}

function toMonthValue(date: string | Date | null): string {
  if (!date) return "";
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonth(date: string | Date | null, locale: string): string {
  if (!date) return "";
  const tag = locale === "es" ? "es-ES" : "en-US";
  return new Date(date).toLocaleDateString(tag, { month: "short", year: "numeric" });
}

function splitLines(text: string): string[] {
  return text.split("\n").map((l) => l.trim()).filter(Boolean);
}

function splitComma(text: string): string[] {
  return text.split(",").map((t) => t.trim()).filter(Boolean);
}

export function ProfileEditor({ email, passport, autoSummary }: ProfileEditorProps) {
  const router = useRouter();
  const { t, locale } = useLocale();
  const p = t.profile;
  const m = p.messages;
  const fileRef = useRef<HTMLInputElement>(null);
  const [editingContact, setEditingContact] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expandedExp, setExpandedExp] = useState<string | null>(null);
  const [addingExp, setAddingExp] = useState(false);
  const [addingEdu, setAddingEdu] = useState(false);
  const [addingSkill, setAddingSkill] = useState(false);
  const [addingCert, setAddingCert] = useState(false);
  const [addingProject, setAddingProject] = useState(false);
  const [addingLanguage, setAddingLanguage] = useState(false);
  const [editingSummary, setEditingSummary] = useState(false);

  const [contactForm, setContactForm] = useState({
    professionalTitle: passport.professionalTitle ?? "",
    phone: passport.phone ?? "",
    linkedIn: passport.linkedIn ?? "",
    github: passport.github ?? "",
    portfolio: passport.portfolio ?? "",
    city: passport.city ?? "",
    country: passport.country ?? "",
    careerGoals: passport.careerGoals ?? "",
    technologies: passport.technologies.join(", "),
  });

  const [summaryText, setSummaryText] = useState(passport.professionalSummary ?? "");

  const emptyExp = {
    company: "",
    position: "",
    location: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    achievements: "",
    technologies: "",
  };
  const [newExp, setNewExp] = useState(emptyExp);
  const [editExp, setEditExp] = useState<Record<string, typeof emptyExp>>({});

  const emptyEdu = { institution: "", degree: "", location: "", startDate: "", endDate: "" };
  const [newEdu, setNewEdu] = useState(emptyEdu);
  const [editEdu, setEditEdu] = useState<Record<string, typeof emptyEdu>>({});

  const [newSkill, setNewSkill] = useState("");
  const [newCert, setNewCert] = useState({ name: "", issuer: "" });
  const [editCert, setEditCert] = useState<Record<string, { name: string; issuer: string }>>({});

  const emptyProject = { title: "", description: "", technologies: "" };
  const [newProject, setNewProject] = useState(emptyProject);
  const [editProject, setEditProject] = useState<Record<string, typeof emptyProject>>({});

  const proficiencyOptions = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"] as const;
  const [newLanguage, setNewLanguage] = useState({ name: "", proficiency: "INTERMEDIATE" as const });
  const [editLanguage, setEditLanguage] = useState<
    Record<string, { name: string; proficiency: (typeof proficiencyOptions)[number] }>
  >({});

  function flash(msg: string, isError = false) {
    if (isError) setError(msg);
    else setSuccess(msg);
    setTimeout(() => { setError(""); setSuccess(""); }, 4000);
  }

  async function apiCall(url: string, method: string, body?: unknown) {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? m.requestFailed);
    router.refresh();
    return json;
  }

  async function handleSaveContact() {
    setSaving(true);
    setError("");
    try {
      await apiCall("/api/candidate/profile", "PATCH", {
        professionalTitle: contactForm.professionalTitle || undefined,
        phone: contactForm.phone || undefined,
        linkedIn: contactForm.linkedIn,
        github: contactForm.github,
        portfolio: contactForm.portfolio,
        city: contactForm.city || undefined,
        country: contactForm.country || undefined,
        careerGoals: contactForm.careerGoals || undefined,
        technologies: splitComma(contactForm.technologies),
      });
      flash(m.contactSaved);
      setEditingContact(false);
    } catch (e) {
      flash(e instanceof Error ? e.message : m.saveFailed, true);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveSummary() {
    setSaving(true);
    try {
      await apiCall("/api/candidate/profile", "PATCH", {
        professionalSummary: summaryText || undefined,
      });
      flash(m.summarySaved);
      setEditingSummary(false);
    } catch (e) {
      flash(e instanceof Error ? e.message : m.saveFailed, true);
    } finally {
      setSaving(false);
    }
  }

  async function handleImport(file: File) {
    setImporting(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/candidate/profile/import", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? m.importFailed);
      flash(
        interpolate(m.importSuccess, {
          experiences: json.parsed.experiences,
          education: json.parsed.education,
          skills: json.parsed.skills,
        })
      );
      router.refresh();
    } catch (e) {
      flash(e instanceof Error ? e.message : m.importFailed, true);
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function initEditExp(exp: Experience) {
    setEditExp((prev) => ({
      ...prev,
      [exp.id]: {
        company: exp.company,
        position: exp.position,
        location: exp.location ?? "",
        startDate: toMonthValue(exp.startDate),
        endDate: toMonthValue(exp.endDate),
        isCurrent: exp.isCurrent,
        achievements: exp.achievements.join("\n"),
        technologies: exp.technologies.join(", "),
      },
    }));
    setExpandedExp(exp.id);
  }

  async function saveExperience(id: string) {
    const f = editExp[id];
    if (!f) return;
    setSaving(true);
    try {
      await apiCall(`/api/candidate/profile/experiences/${id}`, "PATCH", {
        company: f.company,
        position: f.position,
        location: f.location || null,
        startDate: f.startDate + "-01",
        endDate: f.isCurrent ? null : f.endDate ? f.endDate + "-01" : null,
        isCurrent: f.isCurrent,
        achievements: splitLines(f.achievements),
        technologies: splitComma(f.technologies),
      });
      flash(m.experienceUpdated);
      setExpandedExp(null);
    } catch (e) {
      flash(e instanceof Error ? e.message : m.updateFailed, true);
    } finally {
      setSaving(false);
    }
  }

  async function deleteExperience(id: string) {
    if (!confirm(m.confirmDeleteRole)) return;
    try {
      await apiCall(`/api/candidate/profile/experiences/${id}`, "DELETE");
      flash(m.experienceDeleted);
    } catch (e) {
      flash(e instanceof Error ? e.message : m.deleteFailed, true);
    }
  }

  async function addExperience() {
    setSaving(true);
    try {
      await apiCall("/api/candidate/profile/experiences", "POST", {
        company: newExp.company,
        position: newExp.position,
        location: newExp.location || undefined,
        startDate: newExp.startDate + "-01",
        endDate: newExp.isCurrent ? null : newExp.endDate ? newExp.endDate + "-01" : null,
        isCurrent: newExp.isCurrent,
        achievements: splitLines(newExp.achievements),
        technologies: splitComma(newExp.technologies),
      });
      flash(m.experienceAdded);
      setNewExp(emptyExp);
      setAddingExp(false);
    } catch (e) {
      flash(e instanceof Error ? e.message : m.addFailed, true);
    } finally {
      setSaving(false);
    }
  }

  function initEditEdu(edu: PassportData["education"][0]) {
    setEditEdu((prev) => ({
      ...prev,
      [edu.id]: {
        institution: edu.institution,
        degree: edu.degree,
        location: edu.location ?? "",
        startDate: toMonthValue(edu.startDate),
        endDate: toMonthValue(edu.endDate),
      },
    }));
  }

  async function saveEducation(id: string) {
    const f = editEdu[id];
    if (!f) return;
    setSaving(true);
    try {
      await apiCall(`/api/candidate/profile/education/${id}`, "PATCH", {
        institution: f.institution,
        degree: f.degree,
        location: f.location || null,
        startDate: f.startDate + "-01",
        endDate: f.endDate ? f.endDate + "-01" : null,
      });
      flash(m.educationUpdated);
    } catch (e) {
      flash(e instanceof Error ? e.message : m.updateFailed, true);
    } finally {
      setSaving(false);
    }
  }

  async function addEducation() {
    setSaving(true);
    try {
      await apiCall("/api/candidate/profile/education", "POST", {
        ...newEdu,
        startDate: newEdu.startDate + "-01",
        endDate: newEdu.endDate ? newEdu.endDate + "-01" : null,
      });
      flash(m.educationAdded);
      setNewEdu(emptyEdu);
      setAddingEdu(false);
    } catch (e) {
      flash(e instanceof Error ? e.message : m.addFailed, true);
    } finally {
      setSaving(false);
    }
  }

  async function deleteEducation(id: string) {
    if (!confirm(m.confirmDeleteEducation)) return;
    try {
      await apiCall(`/api/candidate/profile/education/${id}`, "DELETE");
      flash(m.educationDeleted);
    } catch (e) {
      flash(e instanceof Error ? e.message : m.deleteFailed, true);
    }
  }

  async function addSkill() {
    if (!newSkill.trim()) return;
    try {
      await apiCall("/api/candidate/profile/skills", "POST", { name: newSkill.trim() });
      flash(m.skillAdded);
      setNewSkill("");
      setAddingSkill(false);
    } catch (e) {
      flash(e instanceof Error ? e.message : m.addFailed, true);
    }
  }

  async function deleteSkill(id: string) {
    try {
      await apiCall(`/api/candidate/profile/skills/${id}`, "DELETE");
      flash(m.skillRemoved);
    } catch (e) {
      flash(e instanceof Error ? e.message : m.deleteFailed, true);
    }
  }

  async function saveCert(id: string) {
    const f = editCert[id];
    if (!f) return;
    try {
      await apiCall(`/api/candidate/profile/certifications/${id}`, "PATCH", f);
      flash(m.certUpdated);
    } catch (e) {
      flash(e instanceof Error ? e.message : m.updateFailed, true);
    }
  }

  async function addCert() {
    try {
      await apiCall("/api/candidate/profile/certifications", "POST", newCert);
      flash(m.certAdded);
      setNewCert({ name: "", issuer: "" });
      setAddingCert(false);
    } catch (e) {
      flash(e instanceof Error ? e.message : m.addFailed, true);
    }
  }

  async function deleteCert(id: string) {
    if (!confirm(m.confirmDeleteCert)) return;
    try {
      await apiCall(`/api/candidate/profile/certifications/${id}`, "DELETE");
      flash(m.certDeleted);
    } catch (e) {
      flash(e instanceof Error ? e.message : m.deleteFailed, true);
    }
  }

  async function addProject() {
    setSaving(true);
    try {
      await apiCall("/api/candidate/profile/projects", "POST", {
        title: newProject.title,
        description: newProject.description || undefined,
        technologies: splitComma(newProject.technologies),
      });
      flash(m.projectAdded);
      setNewProject(emptyProject);
      setAddingProject(false);
    } catch (e) {
      flash(e instanceof Error ? e.message : m.addFailed, true);
    } finally {
      setSaving(false);
    }
  }

  async function saveProject(id: string) {
    const f = editProject[id];
    if (!f) return;
    setSaving(true);
    try {
      await apiCall(`/api/candidate/profile/projects/${id}`, "PATCH", {
        title: f.title,
        description: f.description || null,
        technologies: splitComma(f.technologies),
      });
      flash(m.projectUpdated);
      const next = { ...editProject };
      delete next[id];
      setEditProject(next);
    } catch (e) {
      flash(e instanceof Error ? e.message : m.updateFailed, true);
    } finally {
      setSaving(false);
    }
  }

  async function deleteProject(id: string) {
    if (!confirm(m.confirmDeleteProject)) return;
    try {
      await apiCall(`/api/candidate/profile/projects/${id}`, "DELETE");
      flash(m.projectDeleted);
    } catch (e) {
      flash(e instanceof Error ? e.message : m.deleteFailed, true);
    }
  }

  async function addLanguage() {
    setSaving(true);
    try {
      await apiCall("/api/candidate/profile/languages", "POST", newLanguage);
      flash(m.languageAdded);
      setNewLanguage({ name: "", proficiency: "INTERMEDIATE" });
      setAddingLanguage(false);
    } catch (e) {
      flash(e instanceof Error ? e.message : m.addFailed, true);
    } finally {
      setSaving(false);
    }
  }

  async function saveLanguage(id: string) {
    const f = editLanguage[id];
    if (!f) return;
    setSaving(true);
    try {
      await apiCall(`/api/candidate/profile/languages/${id}`, "PATCH", f);
      flash(m.languageUpdated);
      const next = { ...editLanguage };
      delete next[id];
      setEditLanguage(next);
    } catch (e) {
      flash(e instanceof Error ? e.message : m.updateFailed, true);
    } finally {
      setSaving(false);
    }
  }

  async function deleteLanguage(id: string) {
    if (!confirm(m.confirmDeleteLanguage)) return;
    try {
      await apiCall(`/api/candidate/profile/languages/${id}`, "DELETE");
      flash(m.languageDeleted);
    } catch (e) {
      flash(e instanceof Error ? e.message : m.deleteFailed, true);
    }
  }

  function proficiencyLabel(level: string): string {
    const levels = p.proficiencyLevels as Record<string, string>;
    return levels[level] ?? level;
  }

  const ExpForm = ({
    data,
    onChange,
    onSave,
    onCancel,
    saveLabel = t.common.save,
  }: {
    data: typeof emptyExp;
    onChange: (d: typeof emptyExp) => void;
    onSave: () => void;
    onCancel?: () => void;
    saveLabel?: string;
  }) => (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">{p.company}</Label>
          <Input value={data.company} onChange={(e) => onChange({ ...data, company: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{p.position}</Label>
          <Input value={data.position} onChange={(e) => onChange({ ...data, position: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{p.location}</Label>
          <Input value={data.location} onChange={(e) => onChange({ ...data, location: e.target.value })} placeholder={p.locationPlaceholder} />
        </div>
        <div className="space-y-1 flex items-end gap-3">
          <label className="flex items-center gap-2 text-sm pb-2">
            <input type="checkbox" checked={data.isCurrent} onChange={(e) => onChange({ ...data, isCurrent: e.target.checked })} />
            {p.currentRole}
          </label>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{p.startDate}</Label>
          <Input type="month" value={data.startDate} onChange={(e) => onChange({ ...data, startDate: e.target.value })} />
        </div>
        {!data.isCurrent && (
          <div className="space-y-1">
            <Label className="text-xs">{p.endDate}</Label>
            <Input type="month" value={data.endDate} onChange={(e) => onChange({ ...data, endDate: e.target.value })} />
          </div>
        )}
      </div>
      <div className="space-y-1">
        <Label className="text-xs">{p.bullets}</Label>
        <textarea
          className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={data.achievements}
          onChange={(e) => onChange({ ...data, achievements: e.target.value })}
          placeholder={p.bulletsPlaceholder}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">{p.technologies}</Label>
        <Input value={data.technologies} onChange={(e) => onChange({ ...data, technologies: e.target.value })} />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={onSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Save className="mr-2 h-3 w-3" />}
          {saveLabel}
        </Button>
        {onCancel && (
          <Button size="sm" variant="ghost" onClick={onCancel}>{t.common.cancel}</Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {(error || success) && (
        <div className={`rounded-md p-3 text-sm ${error ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}>
          {error || success}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{p.importTitle}</CardTitle>
            <CardDescription>{p.importDesc}</CardDescription>
          </div>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (
                    passport.experiences.length > 0 &&
                    !confirm(p.importConfirm)
                  ) {
                    if (fileRef.current) fileRef.current.value = "";
                    return;
                  }
                  handleImport(file);
                }
              }}
            />
            <Button variant="outline" size="sm" disabled={importing} onClick={() => fileRef.current?.click()}>
              {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {p.uploadRestructure}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{p.contactTitle}</CardTitle>
          {editingContact ? (
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setEditingContact(false)}><X className="mr-1 h-4 w-4" />{t.common.cancel}</Button>
              <Button size="sm" onClick={handleSaveContact} disabled={saving}><Save className="mr-1 h-4 w-4" />{t.common.save}</Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setEditingContact(true)}><Pencil className="mr-1 h-4 w-4" />{t.common.edit}</Button>
          )}
        </CardHeader>
        <CardContent>
          {editingContact ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">{p.professionalTitle}</Label>
                <Input value={contactForm.professionalTitle} onChange={(e) => setContactForm({ ...contactForm, professionalTitle: e.target.value })} />
              </div>
              <div className="space-y-1"><Label className="text-xs">{p.emailLabel}</Label><Input value={email} disabled /></div>
              <div className="space-y-1"><Label className="text-xs">{p.phone}</Label><Input value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">{p.linkedIn}</Label><Input value={contactForm.linkedIn} onChange={(e) => setContactForm({ ...contactForm, linkedIn: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">{p.github}</Label><Input value={contactForm.github} onChange={(e) => setContactForm({ ...contactForm, github: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">{p.portfolio}</Label><Input value={contactForm.portfolio} onChange={(e) => setContactForm({ ...contactForm, portfolio: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">{p.city}</Label><Input value={contactForm.city} onChange={(e) => setContactForm({ ...contactForm, city: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">{p.country}</Label><Input value={contactForm.country} onChange={(e) => setContactForm({ ...contactForm, country: e.target.value })} /></div>
              <div className="space-y-1 sm:col-span-2"><Label className="text-xs">{p.technologies}</Label><Input value={contactForm.technologies} onChange={(e) => setContactForm({ ...contactForm, technologies: e.target.value })} /></div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">{p.personalNotes}</Label>
                <textarea className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={contactForm.careerGoals} onChange={(e) => setContactForm({ ...contactForm, careerGoals: e.target.value })} />
              </div>
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 text-sm">
              <div><span className="text-muted-foreground">{p.titleLabel}: </span>{passport.professionalTitle || t.common.empty}</div>
              <div><span className="text-muted-foreground">{p.emailLabel}: </span>{email}</div>
              <div><span className="text-muted-foreground">{p.phone}: </span>{passport.phone || t.common.empty}</div>
              <div><span className="text-muted-foreground">{p.linkedIn}: </span>{passport.linkedIn || t.common.empty}</div>
              <div><span className="text-muted-foreground">{p.github}: </span>{passport.github || t.common.empty}</div>
              <div><span className="text-muted-foreground">{p.portfolio}: </span>{passport.portfolio || t.common.empty}</div>
              <div><span className="text-muted-foreground">{p.city}: </span>{passport.city || t.common.empty}</div>
              <div><span className="text-muted-foreground">{p.country}: </span>{passport.country || t.common.empty}</div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{p.resumeSummaryTitle}</CardTitle>
            <CardDescription>{p.resumeSummaryDesc}</CardDescription>
          </div>
          {editingSummary ? (
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setEditingSummary(false)}><X className="mr-1 h-4 w-4" />{t.common.cancel}</Button>
              <Button size="sm" onClick={handleSaveSummary} disabled={saving}><Save className="mr-1 h-4 w-4" />{t.common.save}</Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setEditingSummary(true)}><Pencil className="mr-1 h-4 w-4" />{t.common.edit}</Button>
          )}
        </CardHeader>
        <CardContent>
          {editingSummary ? (
            <textarea
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={summaryText}
              onChange={(e) => setSummaryText(e.target.value)}
              placeholder={p.resumeSummaryPlaceholder}
            />
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {passport.professionalSummary || t.common.empty}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{p.autoSummaryTitle}</CardTitle><CardDescription>{p.autoSummaryDesc}</CardDescription></CardHeader>
        <CardContent><p className="text-sm leading-relaxed">{autoSummary}</p></CardContent>
      </Card>

      {/* Experience */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{p.experience} ({passport.experiences.length})</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setAddingExp(!addingExp)}><Plus className="mr-1 h-4 w-4" />{p.addRole}</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {addingExp && (
            <ExpForm data={newExp} onChange={setNewExp} onSave={addExperience} onCancel={() => setAddingExp(false)} saveLabel={p.addRole} />
          )}
          {passport.experiences.length === 0 && !addingExp && (
            <p className="text-sm text-muted-foreground">{p.noExperience}</p>
          )}
          {passport.experiences.map((exp) => (
            <div key={exp.id} className="rounded-lg border">
              <div className="flex items-start justify-between p-4">
                <div className="flex-1 cursor-pointer" onClick={() => { initEditExp(exp); setExpandedExp(expandedExp === exp.id ? null : exp.id); }}>
                  <h4 className="font-semibold">{exp.position}</h4>
                  <p className="text-sm text-muted-foreground">{exp.company}{exp.location && ` — ${exp.location}`}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatMonth(exp.startDate, locale)} – {exp.isCurrent ? t.resume.present : formatMonth(exp.endDate, locale)}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { initEditExp(exp); setExpandedExp(expandedExp === exp.id ? null : exp.id); }}>
                    {expandedExp === exp.id ? <ChevronUp className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteExperience(exp.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {expandedExp === exp.id && editExp[exp.id] && (
                <div className="border-t p-4">
                  <ExpForm
                    data={editExp[exp.id]}
                    onChange={(d) => setEditExp({ ...editExp, [exp.id]: d })}
                    onSave={() => saveExperience(exp.id)}
                    onCancel={() => setExpandedExp(null)}
                  />
                </div>
              )}
              {expandedExp !== exp.id && exp.achievements.length > 0 && (
                <ul className="px-4 pb-4 space-y-1 text-sm text-muted-foreground">
                  {exp.achievements.slice(0, 2).map((a, i) => <li key={i}>• {a}</li>)}
                  {exp.achievements.length > 2 && <li className="text-xs">+{exp.achievements.length - 2} {p.more}</li>}
                </ul>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{p.skills} ({passport.skills.length})</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setAddingSkill(!addingSkill)}><Plus className="mr-1 h-4 w-4" />{t.common.add}</Button>
        </CardHeader>
        <CardContent>
          {addingSkill && (
            <div className="mb-4 flex gap-2">
              <Input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder={p.skillPlaceholder} className="max-w-xs" />
              <Button size="sm" onClick={addSkill}>{t.common.add}</Button>
              <Button size="sm" variant="ghost" onClick={() => setAddingSkill(false)}>{t.common.cancel}</Button>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {passport.skills.map((skill) => (
              <Badge key={skill.id} variant="outline" className="gap-1 pr-1">
                {skill.name}
                <button type="button" className="ml-1 rounded hover:bg-destructive/20 p-0.5" onClick={() => deleteSkill(skill.id)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Education */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{p.education} ({passport.education.length})</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setAddingEdu(!addingEdu)}><Plus className="mr-1 h-4 w-4" />{t.common.add}</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {addingEdu && (
            <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1"><Label className="text-xs">{p.institution}</Label><Input value={newEdu.institution} onChange={(e) => setNewEdu({ ...newEdu, institution: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs">{p.degree}</Label><Input value={newEdu.degree} onChange={(e) => setNewEdu({ ...newEdu, degree: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs">{p.location}</Label><Input value={newEdu.location} onChange={(e) => setNewEdu({ ...newEdu, location: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs">{p.start}</Label><Input type="month" value={newEdu.startDate} onChange={(e) => setNewEdu({ ...newEdu, startDate: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs">{p.end}</Label><Input type="month" value={newEdu.endDate} onChange={(e) => setNewEdu({ ...newEdu, endDate: e.target.value })} /></div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={addEducation} disabled={saving}>{t.common.add}</Button>
                <Button size="sm" variant="ghost" onClick={() => setAddingEdu(false)}>{t.common.cancel}</Button>
              </div>
            </div>
          )}
          {passport.education.map((edu) => (
            <div key={edu.id} className="rounded-lg border p-4 space-y-3">
              {editEdu[edu.id] ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1"><Label className="text-xs">{p.institution}</Label><Input value={editEdu[edu.id].institution} onChange={(e) => setEditEdu({ ...editEdu, [edu.id]: { ...editEdu[edu.id], institution: e.target.value } })} /></div>
                    <div className="space-y-1"><Label className="text-xs">{p.degree}</Label><Input value={editEdu[edu.id].degree} onChange={(e) => setEditEdu({ ...editEdu, [edu.id]: { ...editEdu[edu.id], degree: e.target.value } })} /></div>
                    <div className="space-y-1"><Label className="text-xs">{p.start}</Label><Input type="month" value={editEdu[edu.id].startDate} onChange={(e) => setEditEdu({ ...editEdu, [edu.id]: { ...editEdu[edu.id], startDate: e.target.value } })} /></div>
                    <div className="space-y-1"><Label className="text-xs">{p.end}</Label><Input type="month" value={editEdu[edu.id].endDate} onChange={(e) => setEditEdu({ ...editEdu, [edu.id]: { ...editEdu[edu.id], endDate: e.target.value } })} /></div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveEducation(edu.id)}>{t.common.save}</Button>
                    <Button size="sm" variant="ghost" onClick={() => { const n = { ...editEdu }; delete n[edu.id]; setEditEdu(n); }}>{t.common.cancel}</Button>
                  </div>
                </>
              ) : (
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{edu.degree}</p>
                    <p className="text-sm text-muted-foreground">{edu.institution}{edu.location && ` — ${edu.location}`}</p>
                    <p className="text-xs text-muted-foreground">{formatMonth(edu.startDate, locale)} – {formatMonth(edu.endDate, locale)}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => initEditEdu(edu)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteEducation(edu.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Projects */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{p.projectsTitle} ({passport.projects.length})</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setAddingProject(!addingProject)}><Plus className="mr-1 h-4 w-4" />{t.common.add}</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {addingProject && (
            <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
              <div className="space-y-1"><Label className="text-xs">{p.projectTitle}</Label><Input value={newProject.title} onChange={(e) => setNewProject({ ...newProject, title: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">{p.projectDescription}</Label><textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">{p.projectTechnologies}</Label><Input value={newProject.technologies} onChange={(e) => setNewProject({ ...newProject, technologies: e.target.value })} /></div>
              <div className="flex gap-2">
                <Button size="sm" onClick={addProject} disabled={saving || !newProject.title.trim()}>{t.common.add}</Button>
                <Button size="sm" variant="ghost" onClick={() => setAddingProject(false)}>{t.common.cancel}</Button>
              </div>
            </div>
          )}
          {passport.projects.length === 0 && !addingProject && (
            <p className="text-sm text-muted-foreground">{t.common.empty}</p>
          )}
          {passport.projects.map((project) => (
            <div key={project.id} className="rounded-lg border p-4 space-y-3">
              {editProject[project.id] ? (
                <>
                  <div className="space-y-1"><Label className="text-xs">{p.projectTitle}</Label><Input value={editProject[project.id].title} onChange={(e) => setEditProject({ ...editProject, [project.id]: { ...editProject[project.id], title: e.target.value } })} /></div>
                  <div className="space-y-1"><Label className="text-xs">{p.projectDescription}</Label><textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={editProject[project.id].description} onChange={(e) => setEditProject({ ...editProject, [project.id]: { ...editProject[project.id], description: e.target.value } })} /></div>
                  <div className="space-y-1"><Label className="text-xs">{p.projectTechnologies}</Label><Input value={editProject[project.id].technologies} onChange={(e) => setEditProject({ ...editProject, [project.id]: { ...editProject[project.id], technologies: e.target.value } })} /></div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveProject(project.id)}>{t.common.save}</Button>
                    <Button size="sm" variant="ghost" onClick={() => { const n = { ...editProject }; delete n[project.id]; setEditProject(n); }}>{t.common.cancel}</Button>
                  </div>
                </>
              ) : (
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="font-medium">{project.title}</p>
                    {project.description && <p className="text-sm text-muted-foreground mt-1">{project.description}</p>}
                    {project.technologies.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">{project.technologies.join(", ")}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditProject({ ...editProject, [project.id]: { title: project.title, description: project.description ?? "", technologies: project.technologies.join(", ") } })}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteProject(project.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Languages */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{p.languagesTitle} ({passport.languages.length})</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setAddingLanguage(!addingLanguage)}><Plus className="mr-1 h-4 w-4" />{t.common.add}</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {addingLanguage && (
            <div className="flex flex-wrap gap-2 items-end">
              <div className="space-y-1"><Label className="text-xs">{p.languageName}</Label><Input value={newLanguage.name} onChange={(e) => setNewLanguage({ ...newLanguage, name: e.target.value })} className="max-w-xs" /></div>
              <div className="space-y-1">
                <Label className="text-xs">{p.languageProficiency}</Label>
                <select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={newLanguage.proficiency} onChange={(e) => setNewLanguage({ ...newLanguage, proficiency: e.target.value as typeof newLanguage.proficiency })}>
                  {proficiencyOptions.map((level) => (
                    <option key={level} value={level}>{proficiencyLabel(level)}</option>
                  ))}
                </select>
              </div>
              <Button size="sm" onClick={addLanguage} disabled={saving || !newLanguage.name.trim()}>{t.common.add}</Button>
              <Button size="sm" variant="ghost" onClick={() => setAddingLanguage(false)}>{t.common.cancel}</Button>
            </div>
          )}
          {passport.languages.length === 0 && !addingLanguage && (
            <p className="text-sm text-muted-foreground">{t.common.empty}</p>
          )}
          {passport.languages.map((lang) => (
            <div key={lang.id} className="flex items-center justify-between rounded-lg border p-3">
              {editLanguage[lang.id] ? (
                <div className="flex flex-wrap gap-2 items-end flex-1">
                  <Input value={editLanguage[lang.id].name} onChange={(e) => setEditLanguage({ ...editLanguage, [lang.id]: { ...editLanguage[lang.id], name: e.target.value } })} className="max-w-xs" />
                  <select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={editLanguage[lang.id].proficiency} onChange={(e) => setEditLanguage({ ...editLanguage, [lang.id]: { ...editLanguage[lang.id], proficiency: e.target.value as (typeof proficiencyOptions)[number] } })}>
                    {proficiencyOptions.map((level) => (
                      <option key={level} value={level}>{proficiencyLabel(level)}</option>
                    ))}
                  </select>
                  <Button size="sm" onClick={() => saveLanguage(lang.id)}>{t.common.save}</Button>
                  <Button size="sm" variant="ghost" onClick={() => { const n = { ...editLanguage }; delete n[lang.id]; setEditLanguage(n); }}>{t.common.cancel}</Button>
                </div>
              ) : (
                <>
                  <p className="text-sm"><span className="font-medium">{lang.name}</span> — {proficiencyLabel(lang.proficiency)}</p>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditLanguage({ ...editLanguage, [lang.id]: { name: lang.name, proficiency: lang.proficiency as (typeof proficiencyOptions)[number] } })}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteLanguage(lang.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Certifications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{p.certifications} ({passport.certifications.length})</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setAddingCert(!addingCert)}><Plus className="mr-1 h-4 w-4" />{t.common.add}</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {addingCert && (
            <div className="flex flex-wrap gap-2 items-end">
              <div className="space-y-1"><Label className="text-xs">{p.certName}</Label><Input value={newCert.name} onChange={(e) => setNewCert({ ...newCert, name: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">{p.certIssuer}</Label><Input value={newCert.issuer} onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })} /></div>
              <Button size="sm" onClick={addCert}>{t.common.add}</Button>
              <Button size="sm" variant="ghost" onClick={() => setAddingCert(false)}>{t.common.cancel}</Button>
            </div>
          )}
          {passport.certifications.map((cert) => (
            <div key={cert.id} className="flex items-center justify-between rounded-lg border p-3">
              {editCert[cert.id] ? (
                <div className="flex flex-wrap gap-2 items-end flex-1">
                  <Input value={editCert[cert.id].name} onChange={(e) => setEditCert({ ...editCert, [cert.id]: { ...editCert[cert.id], name: e.target.value } })} className="max-w-xs" />
                  <Input value={editCert[cert.id].issuer} onChange={(e) => setEditCert({ ...editCert, [cert.id]: { ...editCert[cert.id], issuer: e.target.value } })} className="max-w-xs" />
                  <Button size="sm" onClick={() => saveCert(cert.id)}>{t.common.save}</Button>
                  <Button size="sm" variant="ghost" onClick={() => { const n = { ...editCert }; delete n[cert.id]; setEditCert(n); }}>{t.common.cancel}</Button>
                </div>
              ) : (
                <>
                  <p className="text-sm"><span className="font-medium">{cert.name}</span> — {cert.issuer}</p>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditCert({ ...editCert, [cert.id]: { name: cert.name, issuer: cert.issuer } })}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteCert(cert.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
