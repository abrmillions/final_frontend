"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Building2, ArrowLeft, Save, Bell, Shield, Database, Mail, Pencil } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { settingsApi } from "@/lib/api/django-client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SystemSettings() {
  const { toast } = useToast()
  interface Settings {
    systemName: string
    supportEmail: string
    supportPhone: string
    sessionTimeout: number
    maxLoginAttempts: number
    passwordMinLength: number
    smtpHost: string
    smtpPort: number
    smtpUser: string
    smtpPassword: string
    useTls: boolean
    notificationTemplate: string
  }
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [autoApproval, setAutoApproval] = useState(false)
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [docVerificationEnabled, setDocVerificationEnabled] = useState(false)
  const [settings, setSettings] = useState<Settings>({
    systemName: "",
    supportEmail: "",
    supportPhone: "",
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPassword: "",
    useTls: true,
    notificationTemplate: "",
  })

  const onText =
    <K extends keyof Settings>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      updateSetting(key, e.target.value as Settings[K])

  const onNumber =
    <K extends keyof Settings>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const n = Number.parseInt(e.target.value, 10)
      updateSetting(key, (Number.isNaN(n) ? 0 : n) as Settings[K])
    }

  useEffect(() => {
    (async () => {
      try {
        const data = await settingsApi.get()
        setSettings({
          systemName: data.systemName || "",
          supportEmail: data.supportEmail || "",
          supportPhone: data.supportPhone || "",
          sessionTimeout: data.sessionTimeout ?? 30,
          maxLoginAttempts: data.maxLoginAttempts ?? 5,
          passwordMinLength: data.passwordMinLength ?? 8,
          smtpHost: data.smtpHost || "",
          smtpPort: data.smtpPort ?? 587,
          smtpUser: data.smtpUser || "",
          smtpPassword: data.smtpPassword || "",
          useTls: !!data.useTls,
          notificationTemplate: data.notificationTemplate || "",
        })
        setEmailNotifications(!!data.emailNotifications)
        setSmsNotifications(!!data.smsNotifications)
        setAutoApproval(!!data.autoApproval)
        setMaintenanceMode(!!data.maintenanceMode)
        setDocVerificationEnabled(!!data.documentVerificationEnabled)
      } catch (e: any) {
        toast({ title: "Failed to load settings", description: e?.error?.detail || e?.message || "Error", variant: "destructive" })
      }
    })()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updated = await settingsApi.update({
        ...settings,
        emailNotifications,
        smsNotifications,
        autoApproval,
        maintenanceMode,
        documentVerificationEnabled: docVerificationEnabled,
      })
      try {
        const fresh = await settingsApi.get()
        setSettings({
          systemName: fresh.systemName || settings.systemName,
          supportEmail: fresh.supportEmail || settings.supportEmail,
          supportPhone: fresh.supportPhone || settings.supportPhone,
          sessionTimeout: fresh.sessionTimeout ?? settings.sessionTimeout,
          maxLoginAttempts: fresh.maxLoginAttempts ?? settings.maxLoginAttempts,
          passwordMinLength: fresh.passwordMinLength ?? settings.passwordMinLength,
          smtpHost: fresh.smtpHost || settings.smtpHost,
          smtpPort: fresh.smtpPort ?? settings.smtpPort,
          smtpUser: fresh.smtpUser || settings.smtpUser,
          smtpPassword: fresh.smtpPassword || settings.smtpPassword,
          useTls: !!fresh.useTls,
          notificationTemplate: fresh.notificationTemplate || settings.notificationTemplate,
        })
        setEmailNotifications(!!fresh.emailNotifications)
        setSmsNotifications(!!fresh.smsNotifications)
        setAutoApproval(!!fresh.autoApproval)
        setMaintenanceMode(!!fresh.maintenanceMode)
        setDocVerificationEnabled(!!fresh.documentVerificationEnabled)
      } catch {
        setSettings({
          systemName: updated.systemName || settings.systemName,
          supportEmail: updated.supportEmail || settings.supportEmail,
          supportPhone: updated.supportPhone || settings.supportPhone,
          sessionTimeout: updated.sessionTimeout ?? settings.sessionTimeout,
          maxLoginAttempts: updated.maxLoginAttempts ?? settings.maxLoginAttempts,
          passwordMinLength: updated.passwordMinLength ?? settings.passwordMinLength,
          smtpHost: updated.smtpHost || settings.smtpHost,
          smtpPort: updated.smtpPort ?? settings.smtpPort,
          smtpUser: updated.smtpUser || settings.smtpUser,
          smtpPassword: updated.smtpPassword || settings.smtpPassword,
          useTls: !!updated.useTls,
          notificationTemplate: updated.notificationTemplate || settings.notificationTemplate,
        })
      }

      toast({
        title: "changes system settings succesfully",
        description: "",
      })
      setIsEditing(false)
    } catch (error) {
      toast({
        title: "Error",
        description: (error as any)?.error?.detail || (error as any)?.message || "Failed to save settings.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">System Settings</h1>
                <p className="text-sm text-slate-600">Configure system parameters</p>
              </div>
            </div>
            <Button variant="outline" asChild>
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
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-600" />
                  <CardTitle>General Settings</CardTitle>
                </div>
                <CardDescription>Configure basic system settings</CardDescription>
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
                    <p className="text-sm text-slate-500">Show Verify Documents button in application review</p>
                  </div>
                  <Switch checked={docVerificationEnabled} onCheckedChange={setDocVerificationEnabled} disabled={!isEditing} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-slate-500">Disable public access for maintenance</p>
                  </div>
                  <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} disabled={!isEditing} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Auto-Approval for Renewals</Label>
                    <p className="text-sm text-slate-500">Automatically approve license renewals</p>
                  </div>
                  <Switch checked={autoApproval} onCheckedChange={setAutoApproval} disabled={!isEditing} />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(true)} disabled={isEditing}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button onClick={handleSave} disabled={!isEditing || isSaving}>
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
                <CardDescription>Configure how users receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-slate-500">Send email alerts for application updates</p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} disabled={!isEditing} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-slate-500">Send SMS alerts for urgent updates</p>
                  </div>
                  <Switch checked={smsNotifications} onCheckedChange={setSmsNotifications} disabled={!isEditing} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notification-template">Email Template</Label>
                  <Textarea
                    id="notification-template"
                    rows={6}
                    value={settings.notificationTemplate}
                    onChange={onText("notificationTemplate")}
                    disabled={!isEditing}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(true)} disabled={isEditing}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button onClick={handleSave} disabled={!isEditing || isSaving}>
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
                <CardDescription>Configure security and access controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
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
                  <Label htmlFor="password-min-length">Minimum Password Length</Label>
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
                    <p className="text-sm text-slate-500">Require 2FA for admin accounts</p>
                  </div>
                  <Switch defaultChecked disabled={!isEditing} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>IP Whitelist</Label>
                    <p className="text-sm text-slate-500">Restrict admin access to specific IPs</p>
                  </div>
                  <Switch disabled={!isEditing} />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(true)} disabled={isEditing}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button onClick={handleSave} disabled={!isEditing || isSaving}>
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
                <CardDescription>Configure SMTP settings for email delivery</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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
                  <Label htmlFor="smtp-pass">SMTP Password</Label>
                  <Input
                    id="smtp-pass"
                    type="password"
                    value={settings.smtpPassword}
                    onChange={onText("smtpPassword")}
                    placeholder="••••••••"
                    disabled={!isEditing}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Use TLS</Label>
                    <p className="text-sm text-slate-500">Enable TLS encryption</p>
                  </div>
                  <Switch checked={settings.useTls} onCheckedChange={(checked) => updateSetting("useTls", checked)} disabled={!isEditing} />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(true)} disabled={isEditing}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button onClick={handleSave} disabled={!isEditing || isSaving}>
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
  )
}
