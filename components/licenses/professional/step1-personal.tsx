"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PhotoUpload } from "@/components/photo-upload"

interface Step1Props {
  data: any
  updateData: (data: any) => void
  onNext: () => void
}

export function ProfessionalStep1({ data, updateData, onNext }: Step1Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
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
            onChange={(e) => updateData({ dateOfBirth: e.target.value })}
            required
          />
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
          label="Enter Your 4x4 size  Photo"
          required={true}
          onPhotoUpload={handlePhotoUpload}
          photoUrl={typeof data.professional_photo === 'string' ? data.professional_photo : undefined}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="submit">Continue</Button>
      </div>
    </form>
  )
}
