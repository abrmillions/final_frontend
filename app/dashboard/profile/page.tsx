"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { authApi } from "@/lib/api/django-client"
import { DJANGO_API_URL } from "@/lib/config/django-api"
import { Loader2, Upload, User as UserIcon, Mail, Phone, Save, Camera } from "lucide-react"

export default function ProfilePage() {
  const { user, isLoading: isAuthLoading, updateUser } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  })
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Initialize form data when user is loaded
  useEffect(() => {
    if (user) {
        // cast user to any to access snake_case properties if they exist
        const u = user as any
        setFormData({
            firstName: u.firstName || u.first_name || "",
            lastName: u.lastName || u.last_name || "",
            email: u.email || "",
            phone: u.phone || "",
        })
        setProfilePhoto(u.profilePhoto || u.profile_photo || null)
    }
  }, [user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
        setPhotoFile(file)
        // Create preview URL
        const previewUrl = URL.createObjectURL(file)
        setProfilePhoto(previewUrl)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
        const updateData: any = {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
        }
        
        if (photoFile) {
            updateData.profile_photo = photoFile
        }

        const updatedUser = await authApi.updateProfile(updateData)
        
        // Map snake_case to camelCase
        const mappedUser = {
            id: updatedUser.id,
            email: updatedUser.email,
            firstName: updatedUser.first_name,
            lastName: updatedUser.last_name,
            fullName: `${updatedUser.first_name || ''} ${updatedUser.last_name || ''}`.trim() || updatedUser.username,
            phone: updatedUser.phone,
            profilePhoto: updatedUser.profile_photo ? (updatedUser.profile_photo.startsWith('http') ? updatedUser.profile_photo : `${DJANGO_API_URL}${updatedUser.profile_photo}`) : null,
            role: updatedUser.is_staff ? 'Admin' : 'User'
        }

        updateUser(mappedUser)

        toast({
            title: "Profile Updated",
            description: "Your profile information has been saved successfully.",
        })
        
        router.push("/dashboard")

    } catch (error) {
        console.error("Profile update failed:", error)
        toast({
            title: "Update Failed",
            description: "Failed to update profile. Please try again.",
            variant: "destructive",
        })
    } finally {
        setIsSaving(false)
    }
  }

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }
  
  if (!user) return null

  const initials = (formData.firstName?.[0] || "") + (formData.lastName?.[0] || "") || formData.email?.[0]?.toUpperCase() || "U"

  return (
    <div className="container max-w-5xl py-10 mx-auto space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[300px_1fr]">
        {/* Left Column: Profile Card */}
        <div className="space-y-6">
          <Card className="overflow-hidden border-none shadow-md">
            <div className="h-32 bg-gradient-to-r from-primary/10 to-primary/5"></div>
            <CardContent className="relative px-6 pt-0 pb-6 text-center">
              <div className="relative inline-block mx-auto -mt-16 mb-4">
                <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
                  <AvatarImage src={profilePhoto || "/placeholder.svg"} className="object-cover" />
                  <AvatarFallback className="text-4xl bg-muted">{initials}</AvatarFallback>
                </Avatar>
                <Button 
                    size="icon" 
                    variant="secondary" 
                    className="absolute bottom-0 right-0 rounded-full shadow-lg hover:scale-105 transition-transform"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Camera className="w-4 h-4" />
                </Button>
                <input 
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoSelect}
                />
              </div>
              <h2 className="text-2xl font-bold mb-1">{formData.firstName} {formData.lastName}</h2>
              <p className="text-sm text-muted-foreground mb-4">{formData.email}</p>
              
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/50 py-2 rounded-full">
                <span className="capitalize">{user.role || 'User'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Edit Form */}
        <div className="space-y-6">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="First Name"
                      className="pl-9"
                      value={formData.firstName}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="Last Name"
                      className="pl-9"
                      value={formData.lastName}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="pl-9 bg-muted/50"
                  />
                </div>
                <p className="text-[0.8rem] text-muted-foreground">
                    Email address cannot be changed directly. Contact support for assistance.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    className="pl-9"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t bg-muted/20 px-6 py-4">
              <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
