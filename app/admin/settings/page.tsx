"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  ArrowLeft,
  Save,
  Bell,
  Shield,
  Database,
  Mail,
  Pencil,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { settingsApi } from "@/lib/api/django-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SystemSettings() {
  const { toast } = useToast();
  interface Settings {
    systemName: string;
    supportEmail: string;
    supportPhone: string;
    documentVerificationEnabled: boolean;
    emailNotifications: boolean;
    emailDebugMode: boolean;
    smsNotifications: boolean;
    autoApproval: boolean;
    maintenanceMode: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordMinLength: number;
    deepseekApiKey: string;
    deepseekModel: string;
    deepseekTimeout: number;
    deepseekMaxRetries: number;
    ocrLanguage: string;
    ocrTimeout: number;
    notificationTemplate: string;
    openrouterApiKey: string;
    openrouterModel: string;
    openrouterTimeout: number;
    geminiApiKey: string;
    geminiModel: string;
    geminiTimeout: number;
    preferredAiProvider: string;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    smtpUseTls: boolean;
    twoFactorAuthenticationEnabled: boolean;
    ipWhitelistEnabled: boolean;
    adminIpWhitelist: string;
  }
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [emailDebugMode, setEmailDebugMode] = useState(false);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [autoApproval, setAutoApproval] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [ipWhitelistEnabled, setIpWhitelistEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [docVerificationEnabled, setDocVerificationEnabled] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    systemName: "",
    supportEmail: "",
    supportPhone: "",
    emailNotifications: true,
    emailDebugMode: false,
    smsNotifications: false,
    autoApproval: false,
    maintenanceMode: false,
    documentVerificationEnabled: false,
    twoFactorAuthenticationEnabled: false,
    ipWhitelistEnabled: false,
    adminIpWhitelist: "",
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    deepseekApiKey: "",
    deepseekModel: "deepseek-chat",
    deepseekTimeout: 60,
    deepseekMaxRetries: 3,
    ocrLanguage: "amh+eng",
    ocrTimeout: 30,
    notificationTemplate: "",
    openrouterApiKey: "",
    openrouterModel: "google/gemini-2.0-flash-001",
    openrouterTimeout: 60,
    geminiApiKey: "",
    geminiModel: "gemini-2.0-flash",
    geminiTimeout: 60,
    preferredAiProvider: "deepseek",
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPassword: "",
    smtpUseTls: true,
  });

  const onText =
    <K extends keyof Settings>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      updateSetting(key, e.target.value as Settings[K]);

  const onNumber =
    <K extends keyof Settings>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const n = Number.parseInt(e.target.value, 10);
      updateSetting(key, (Number.isNaN(n) ? 0 : n) as Settings[K]);
    };

  useEffect(() => {
    (async () => {
      try {
        const data = await settingsApi.get();
        setSettings({
          systemName: data.systemName || "",
          supportEmail: data.supportEmail || "",
          supportPhone: data.supportPhone || "",
          sessionTimeout: data.sessionTimeout ?? 30,
          maxLoginAttempts: data.maxLoginAttempts ?? 5,
          passwordMinLength: data.passwordMinLength ?? 8,
          deepseekApiKey: data.deepseekApiKey || "",
          deepseekModel: data.deepseekModel || "deepseek-chat",
          deepseekTimeout: data.deepseekTimeout ?? 60,
          deepseekMaxRetries: data.deepseekMaxRetries ?? 3,
          ocrLanguage: data.ocrLanguage || "amh+eng",
          ocrTimeout: data.ocrTimeout ?? 30,
          notificationTemplate: data.notificationTemplate || "",
          openrouterApiKey: data.openrouterApiKey || "",
          openrouterModel: data.openrouterModel || "google/gemini-2.0-flash-001",
          openrouterTimeout: data.openrouterTimeout ?? 60,
          geminiApiKey: data.geminiApiKey || "",
          geminiModel: data.geminiModel || "gemini-2.0-flash",
          geminiTimeout: data.geminiTimeout ?? 60,
          preferredAiProvider: data.preferredAiProvider || "deepseek",
          smtpHost: data.smtpHost || "",
          smtpPort: data.smtpPort || 587,
          smtpUser: data.smtpUser || "",
          smtpPassword: data.smtpPassword || "",
          smtpUseTls: !!data.smtpUseTls,
          twoFactorAuthenticationEnabled: !!data.twoFactorAuthenticationEnabled,
          ipWhitelistEnabled: !!data.ipWhitelistEnabled,
          adminIpWhitelist: data.adminIpWhitelist || "",
          documentVerificationEnabled: !!data.documentVerificationEnabled,
          emailNotifications: !!data.emailNotifications,
          emailDebugMode: !!data.emailDebugMode,
          smsNotifications: !!data.smsNotifications,
          autoApproval: !!data.autoApproval,
          maintenanceMode: !!data.maintenanceMode,
        });
        setEmailNotifications(!!data.emailNotifications);
        setSmsNotifications(!!data.smsNotifications);
        setAutoApproval(!!data.autoApproval);
        setMaintenanceMode(!!data.maintenanceMode);
        setDocVerificationEnabled(!!data.documentVerificationEnabled);
        setTwoFactorEnabled(!!data.twoFactorAuthenticationEnabled);
        setIpWhitelistEnabled(!!data.ipWhitelistEnabled);
      } catch (e: any) {
        toast({
          title: "Failed to load settings",
          description: e?.error?.detail || e?.message || "Error",
          variant: "destructive",
        });
      }
    })();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await settingsApi.update({
        ...settings,
        emailNotifications,
        smsNotifications,
        autoApproval,
        maintenanceMode,
        documentVerificationEnabled: docVerificationEnabled,
        twoFactorAuthenticationEnabled: twoFactorEnabled,
        ipWhitelistEnabled: ipWhitelistEnabled,
      });
      try {
        const fresh = await settingsApi.get();
        setSettings({
          systemName: fresh.systemName || settings.systemName,
          supportEmail: fresh.supportEmail || settings.supportEmail,
          supportPhone: fresh.supportPhone || settings.supportPhone,
          sessionTimeout: fresh.sessionTimeout ?? settings.sessionTimeout,
          maxLoginAttempts: fresh.maxLoginAttempts ?? settings.maxLoginAttempts,
          passwordMinLength:
            fresh.passwordMinLength ?? settings.passwordMinLength,
          deepseekApiKey: fresh.deepseekApiKey || settings.deepseekApiKey,
          deepseekModel: fresh.deepseekModel || settings.deepseekModel,
          deepseekTimeout: fresh.deepseekTimeout ?? settings.deepseekTimeout,
          deepseekMaxRetries:
            fresh.deepseekMaxRetries ?? settings.deepseekMaxRetries,
          ocrLanguage: fresh.ocrLanguage || settings.ocrLanguage,
          ocrTimeout: fresh.ocrTimeout ?? settings.ocrTimeout,
          notificationTemplate:
            fresh.notificationTemplate || settings.notificationTemplate,
          openrouterApiKey: fresh.openrouterApiKey || settings.openrouterApiKey,
          openrouterModel: fresh.openrouterModel || settings.openrouterModel,
          openrouterTimeout:
            fresh.openrouterTimeout ?? settings.openrouterTimeout,
          geminiApiKey: fresh.geminiApiKey || settings.geminiApiKey,
          geminiModel: fresh.geminiModel || settings.geminiModel,
          geminiTimeout: fresh.geminiTimeout ?? settings.geminiTimeout,
          preferredAiProvider:
            fresh.preferredAiProvider || settings.preferredAiProvider,
          smtpHost: fresh.smtpHost || settings.smtpHost,
          smtpPort: fresh.smtpPort ?? settings.smtpPort,
          smtpUser: fresh.smtpUser || settings.smtpUser,
          smtpPassword: fresh.smtpPassword || settings.smtpPassword,
          smtpUseTls: !!fresh.smtpUseTls,
          emailNotifications: !!fresh.emailNotifications,
          emailDebugMode: !!fresh.emailDebugMode,
          smsNotifications: !!fresh.smsNotifications,
          autoApproval: !!fresh.autoApproval,
          maintenanceMode: !!fresh.maintenanceMode,
          documentVerificationEnabled: !!fresh.documentVerificationEnabled,
          twoFactorAuthenticationEnabled: !!fresh.twoFactorAuthenticationEnabled,
          ipWhitelistEnabled: !!fresh.ipWhitelistEnabled,
          adminIpWhitelist: fresh.adminIpWhitelist || settings.adminIpWhitelist,
        });
        setEmailNotifications(!!fresh.emailNotifications);
        setEmailDebugMode(!!fresh.emailDebugMode);
        setSmsNotifications(!!fresh.smsNotifications);
        setAutoApproval(!!fresh.autoApproval);
        setMaintenanceMode(!!fresh.maintenanceMode);
        setDocVerificationEnabled(!!fresh.documentVerificationEnabled);
      } catch {
        setSettings({
          systemName: updated.systemName || settings.systemName,
          supportEmail: updated.supportEmail || settings.supportEmail,
          supportPhone: updated.supportPhone || settings.supportPhone,
          sessionTimeout: updated.sessionTimeout ?? settings.sessionTimeout,
          maxLoginAttempts:
            updated.maxLoginAttempts ?? settings.maxLoginAttempts,
          passwordMinLength:
            updated.passwordMinLength ?? settings.passwordMinLength,
          deepseekApiKey: updated.deepseekApiKey || settings.deepseekApiKey,
          deepseekModel: updated.deepseekModel || settings.deepseekModel,
          deepseekTimeout: updated.deepseekTimeout ?? settings.deepseekTimeout,
          deepseekMaxRetries:
            updated.deepseekMaxRetries ?? settings.deepseekMaxRetries,
          ocrLanguage: updated.ocrLanguage || settings.ocrLanguage,
          ocrTimeout: updated.ocrTimeout ?? settings.ocrTimeout,
          notificationTemplate:
            updated.notificationTemplate || settings.notificationTemplate,
          openrouterApiKey: updated.openrouterApiKey || settings.openrouterApiKey,
          openrouterModel: updated.openrouterModel || settings.openrouterModel,
          openrouterTimeout:
            updated.openrouterTimeout ?? settings.openrouterTimeout,
          geminiApiKey: updated.geminiApiKey || settings.geminiApiKey,
          geminiModel: updated.geminiModel || settings.geminiModel,
          geminiTimeout: updated.geminiTimeout ?? settings.geminiTimeout,
          preferredAiProvider:
            updated.preferredAiProvider || settings.preferredAiProvider,
          smtpHost: updated.smtpHost || settings.smtpHost,
          smtpPort: updated.smtpPort ?? settings.smtpPort,
          smtpUser: updated.smtpUser || settings.smtpUser,
          smtpPassword: updated.smtpPassword || settings.smtpPassword,
          smtpUseTls: !!updated.smtpUseTls,
          documentVerificationEnabled: !!updated.documentVerificationEnabled,
          emailNotifications: !!updated.emailNotifications,
          emailDebugMode: !!updated.emailDebugMode,
          smsNotifications: !!updated.smsNotifications,
          autoApproval: !!updated.autoApproval,
          maintenanceMode: !!updated.maintenanceMode,
          twoFactorAuthenticationEnabled: !!updated.twoFactorAuthenticationEnabled,
          ipWhitelistEnabled: !!updated.ipWhitelistEnabled,
          adminIpWhitelist: updated.adminIpWhitelist || settings.adminIpWhitelist,
        });
      }

      toast({
        title: "changes system settings succesfully",
        description: "",
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Error",
        description:
          (error as any)?.error?.detail ||
          (error as any)?.message ||
          "Failed to save settings.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = <K extends keyof Settings>(
    key: K,
    value: Settings[K],
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 pb-10">
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 shrink-0">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 line-clamp-1">
                  System Settings
                </h1>
                <p className="text-sm text-slate-600">
                  Configure system parameters
                </p>
              </div>
            </div>
            <Button variant="outlineBlueHover" size="sm" asChild className="w-full sm:w-auto">
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="general" className="space-y-6">
          <div className="overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-full sm:w-auto min-w-max">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="ai">AI Verification</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-600" />
                  <CardTitle>General Settings</CardTitle>
                </div>
                <CardDescription>
                  Configure basic system settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="system-name">System Name</Label>
                  <Input
                    id="system-name"
                    value={settings.systemName}
                    onChange={onText("systemName")}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="support-email">Support Email</Label>
                  <Input
                    id="support-email"
                    type="email"
                    value={settings.supportEmail}
                    onChange={onText("supportEmail")}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="support-phone">Support Phone</Label>
                  <Input
                    id="support-phone"
                    type="tel"
                    value={settings.supportPhone}
                    onChange={onText("supportPhone")}
                    disabled={!isEditing}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Enable Document Verification</Label>
                    <p className="text-sm text-slate-500">
                      Show Verify Documents button in application review
                    </p>
                  </div>
                  <Switch
                    checked={docVerificationEnabled}
                    onCheckedChange={setDocVerificationEnabled}
                    disabled={!isEditing}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-slate-500">
                      Disable public access for maintenance
                    </p>
                  </div>
                  <Switch
                    checked={maintenanceMode}
                    onCheckedChange={setMaintenanceMode}
                    disabled={!isEditing}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Auto-Approval for Renewals</Label>
                    <p className="text-sm text-slate-500">
                      Automatically approve license renewals
                    </p>
                  </div>
                  <Switch
                    checked={autoApproval}
                    onCheckedChange={setAutoApproval}
                    disabled={!isEditing}
                  />
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    disabled={isEditing}
                    className="w-full sm:w-auto"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={!isEditing || isSaving}
                    className="w-full sm:w-auto"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-600" />
                  <CardTitle>Notification Settings</CardTitle>
                </div>
                <CardDescription>
                  Configure how users receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-slate-500">
                      Send email alerts for application updates
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                    disabled={!isEditing}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-slate-500">
                      Send SMS alerts for urgent updates
                    </p>
                  </div>
                  <Switch
                    checked={smsNotifications}
                    onCheckedChange={setSmsNotifications}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notification-template">Email Template</Label>
                  <Textarea
                    id="notification-template"
                    rows={6}
                    value={settings.notificationTemplate}
                    onChange={onText("notificationTemplate")}
                    disabled={!isEditing}
                    placeholder="Enter email template..."
                  />
                  <div className="rounded-md bg-slate-50 p-2 text-[10px] text-slate-500 border border-slate-200">
                    <p className="font-semibold mb-1">Available placeholders:</p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 list-disc list-inside">
                      <li><code className="text-blue-600">{"{name}"}</code> - Applicant name</li>
                      <li><code className="text-blue-600">{"{id}"}</code> - Application ID</li>
                      <li><code className="text-blue-600">{"{status}"}</code> - New status</li>
                      <li><code className="text-blue-600">{"{license_type}"}</code> - Type of license</li>
                    </ul>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    disabled={isEditing}
                    className="w-full sm:w-auto"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={!isEditing || isSaving}
                    className="w-full sm:w-auto"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <CardTitle>Security Settings</CardTitle>
                </div>
                <CardDescription>
                  Configure security and access controls
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">
                    Session Timeout (minutes)
                  </Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={onNumber("sessionTimeout")}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
                  <Input
                    id="max-login-attempts"
                    type="number"
                    value={settings.maxLoginAttempts}
                    onChange={onNumber("maxLoginAttempts")}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password-min-length">
                    Minimum Password Length
                  </Label>
                  <Input
                    id="password-min-length"
                    type="number"
                    value={settings.passwordMinLength}
                    onChange={onNumber("passwordMinLength")}
                    disabled={!isEditing}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-slate-500">
                      Require 2FA for admin accounts
                    </p>
                  </div>
                  <Switch
                    checked={twoFactorEnabled}
                    onCheckedChange={setTwoFactorEnabled}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>IP Whitelist</Label>
                      <p className="text-sm text-slate-500">
                        Restrict admin access to specific IPs
                      </p>
                    </div>
                    <Switch
                      checked={ipWhitelistEnabled}
                      onCheckedChange={setIpWhitelistEnabled}
                      disabled={!isEditing}
                    />
                  </div>

                  {ipWhitelistEnabled && (
                    <div className="space-y-2 pl-4 border-l-2 border-slate-100">
                      <Label htmlFor="admin-ip-whitelist">
                        Allowed IP Addresses
                      </Label>
                      <Textarea
                        id="admin-ip-whitelist"
                        placeholder="Enter IP addresses separated by commas (e.g., 192.168.1.1, 10.0.0.1)"
                        value={settings.adminIpWhitelist}
                        onChange={onText("adminIpWhitelist")}
                        disabled={!isEditing}
                        rows={3}
                      />
                      <p className="text-[10px] text-slate-500">
                        Leave empty to allow all IPs (if whitelist is enabled
                        but list is empty).
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    disabled={isEditing}
                    className="w-full sm:w-auto"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={!isEditing || isSaving}
                    className="w-full sm:w-auto"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <CardTitle>Email Configuration</CardTitle>
                </div>
                <CardDescription>
                  Configure SMTP for email delivery
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtp-host">SMTP Host</Label>
                      <Input
                        id="smtp-host"
                        value={settings.smtpHost}
                        onChange={onText("smtpHost")}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-port">SMTP Port</Label>
                      <Input
                        id="smtp-port"
                        type="number"
                        value={settings.smtpPort}
                        onChange={onNumber("smtpPort")}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-user">SMTP Username</Label>
                    <Input
                      id="smtp-user"
                      value={settings.smtpUser}
                      onChange={onText("smtpUser")}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-password">SMTP Password</Label>
                    <Input
                      id="smtp-password"
                      type="password"
                      value={settings.smtpPassword}
                      onChange={onText("smtpPassword")}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Use TLS</Label>
                      <p className="text-sm text-slate-500">
                        Use a secure (TLS) connection
                      </p>
                    </div>
                    <Switch
                      checked={settings.smtpUseTls}
                      onCheckedChange={(checked) =>
                        updateSetting("smtpUseTls", checked)
                      }
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="space-y-1 pr-4">
                    <Label className="text-yellow-800">Email Debug Mode</Label>
                    <p className="text-xs text-yellow-700">
                      If enabled, emails will be printed to the server console
                      instead of being sent. (Useful for development)
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailDebugMode}
                    onCheckedChange={(checked) =>
                      updateSetting("emailDebugMode", checked)
                    }
                    disabled={!isEditing}
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    disabled={isEditing}
                    className="w-full sm:w-auto"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={!isEditing || isSaving}
                    className="w-full sm:w-auto"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <CardTitle>AI Verification Configuration</CardTitle>
                </div>
                <CardDescription>
                  Configure AI providers for automated document audit
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="preferred-provider">
                    Preferred AI Provider
                  </Label>
                  <Select
                    value={settings.preferredAiProvider}
                    onValueChange={(v) =>
                      updateSetting("preferredAiProvider", v)
                    }
                    disabled={!isEditing}
                  >
                    <SelectTrigger id="preferred-provider">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deepseek">DeepSeek</SelectItem>
                      <SelectItem value="openrouter">OpenRouter</SelectItem>
                      <SelectItem value="gemini">Gemini</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    Switch between DeepSeek, OpenRouter and Gemini for document
                    analysis.
                  </p>
                </div>

                <Tabs defaultValue="deepseek-provider" className="w-full">
                  <div className="overflow-x-auto pb-1 scrollbar-hide -mx-2 px-2">
                    <TabsList className="flex w-full min-w-max gap-2 bg-transparent h-auto p-0">
                      <TabsTrigger value="deepseek-provider" className="border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-1.5 text-xs sm:text-sm">DeepSeek</TabsTrigger>
                      <TabsTrigger value="openrouter-provider" className="border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-1.5 text-xs sm:text-sm">OpenRouter</TabsTrigger>
                      <TabsTrigger value="gemini-provider" className="border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-1.5 text-xs sm:text-sm">Gemini</TabsTrigger>
                      <TabsTrigger value="ocr-settings" className="border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-1.5 text-xs sm:text-sm">OCR Settings</TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent
                    value="deepseek-provider"
                    className="space-y-4 pt-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="deepseek-api-key">DeepSeek API Key</Label>
                      <Input
                        id="deepseek-api-key"
                        type="password"
                        value={settings.deepseekApiKey}
                        onChange={onText("deepseekApiKey")}
                        placeholder="Enter your DeepSeek API Key"
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="deepseek-model">DeepSeek Model</Label>
                        <Select
                          value={settings.deepseekModel}
                          onValueChange={(v) =>
                            updateSetting("deepseekModel", v)
                          }
                          disabled={!isEditing}
                        >
                          <SelectTrigger id="deepseek-model">
                            <SelectValue placeholder="Select model" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="deepseek-chat">
                              DeepSeek Chat
                            </SelectItem>
                            <SelectItem value="deepseek-reasoner">
                              DeepSeek Reasoner
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="deepseek-timeout">
                          API Timeout (s)
                        </Label>
                        <Input
                          id="deepseek-timeout"
                          type="number"
                          value={settings.deepseekTimeout}
                          onChange={onNumber("deepseekTimeout")}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="openrouter-provider"
                    className="space-y-4 pt-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="openrouter-api-key">OpenRouter API Key</Label>
                      <Input
                        id="openrouter-api-key"
                        type="password"
                        value={settings.openrouterApiKey}
                        onChange={onText("openrouterApiKey")}
                        placeholder="sk-or-v1-..."
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="openrouter-model">OpenRouter Model</Label>
                        <Input
                          id="openrouter-model"
                          value={settings.openrouterModel}
                          onChange={onText("openrouterModel")}
                          placeholder="e.g. google/gemini-2.0-flash-001"
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="openrouter-timeout">API Timeout (s)</Label>
                        <Input
                          id="openrouter-timeout"
                          type="number"
                          value={settings.openrouterTimeout}
                          onChange={onNumber("openrouterTimeout")}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="gemini-provider"
                    className="space-y-4 pt-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="gemini-api-key">Gemini API Key</Label>
                      <Input
                        id="gemini-api-key"
                        type="password"
                        value={settings.geminiApiKey}
                        onChange={onText("geminiApiKey")}
                        placeholder="Enter your Gemini API Key"
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="gemini-model">Gemini Model</Label>
                        <Input
                          id="gemini-model"
                          value={settings.geminiModel}
                          onChange={onText("geminiModel")}
                          placeholder="e.g. gemini-2.0-flash"
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gemini-timeout">API Timeout (s)</Label>
                        <Input
                          id="gemini-timeout"
                          type="number"
                          value={settings.geminiTimeout}
                          onChange={onNumber("geminiTimeout")}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="ocr-language">OCR Language</Label>
                    <Input
                      id="ocr-language"
                      value={settings.ocrLanguage}
                      onChange={onText("ocrLanguage")}
                      placeholder="e.g. amh+eng"
                      disabled={!isEditing}
                    />
                    <p className="text-[10px] text-slate-500">
                      Tesseract language codes (e.g. 'amh+eng')
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ocr-timeout">OCR Timeout (seconds)</Label>
                    <Input
                      id="ocr-timeout"
                      type="number"
                      value={settings.ocrTimeout}
                      onChange={onNumber("ocrTimeout")}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    disabled={isEditing}
                    className="w-full sm:w-auto"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={!isEditing || isSaving}
                    className="w-full sm:w-auto"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
