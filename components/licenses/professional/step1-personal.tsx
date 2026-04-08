"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PhotoUpload } from "@/components/photo-upload"
import { useEffect, useState } from "react"

interface Step1Props {
  data: any
  updateData: (data: any) => void
  onNext: () => void
}

export function ProfessionalStep1({ data, updateData, onNext }: Step1Props) {
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [dobError, setDobError] = useState<string | null>(null)
  const hasPhoto = Boolean(
    data?.professional_photo &&
    ((typeof data.professional_photo === 'string' && data.professional_photo.trim().length > 0) ||
     (typeof File !== 'undefined' && data.professional_photo instanceof File))
  )
  useEffect(() => {
    if (hasPhoto && photoError) setPhotoError(null)
  }, [hasPhoto, photoError])

  const validateDOB = (dateString: string) => {
    if (!dateString) return null
    const selectedDate = new Date(dateString)
    const today = new Date()
    
    // Check if the date is in the future
    if (selectedDate > today) {
      return "Date of Birth is invalid";
    }

    // Optional: Check if the user is at least 18 years old
    const eighteenYearsAgo = new Date()
    eighteenYearsAgo.setFullYear(today.getFullYear() - 18)
    if (selectedDate > eighteenYearsAgo) {
      return "You must be at least 18 years old to apply"
    }

    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Clear previous errors
    setPhotoError(null)
    setDobError(null)

    const dobValidationError = validateDOB(data.dateOfBirth)
    if (dobValidationError) {
      setDobError(dobValidationError)
      return
    }

    if (!hasPhoto) {
      setPhotoError("Professional photo is required")
      return
    }
    onNext()
  }

  const handlePhotoUpload = (file: File) => {
    updateData({
      professional_photo: file,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            value={data.fullName}
            onChange={(e) => updateData({ fullName: e.target.value })}
            placeholder="Dr. John Smith"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => updateData({ email: e.target.value })}
            placeholder="john.smith@example.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            value={data.phone}
            onChange={(e) => updateData({ phone: e.target.value })}
            placeholder="+1234567890"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nationalId">National ID *</Label>
          <Input
            id="nationalId"
            value={data.nationalId}
            onChange={(e) => updateData({ nationalId: e.target.value })}
            placeholder="ID Number"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of Birth *</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={data.dateOfBirth}
            onChange={(e) => {
              updateData({ dateOfBirth: e.target.value })
              setDobError(null)
            }}
            className={dobError ? "border-destructive focus-visible:ring-destructive" : ""}
            required
          />
          {dobError && (
            <p className="text-xs text-destructive mt-1 font-medium">{dobError}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Full Address *</Label>
        <Textarea
          id="address"
          value={data.address}
          onChange={(e) => updateData({ address: e.target.value })}
          placeholder="Street address, city, postal code"
          rows={3}
          required
        />
      </div>

      <div className="border-t pt-6">
        <PhotoUpload
          label="Enter Your 4x3 size Photo"
          required={true}
          requireAspectRatio={[4, 3]}
          minWidthPx={400}
          minHeightPx={300}
          onPhotoUpload={handlePhotoUpload}
          photoUrl={typeof data.professional_photo === 'string' ? data.professional_photo : undefined}
        />
        {photoError && (
          <p className="mt-2 text-sm text-destructive">{photoError}</p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="submit" disabled={!hasPhoto}>Continue</Button>
      </div>
    </form>
  )
}
