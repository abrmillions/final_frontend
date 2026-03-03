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

export function ImportExportStep1({ data, updateData, onNext }: Step1Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext()
  }

  const handlePhotoUpload = (file: File) => {
    updateData({
      company_representative_photo: file,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="companyName">Company Name *</Label>
          <Input
            id="companyName"
            value={data.companyName}
            onChange={(e) => updateData({ companyName: e.target.value })}
            placeholder="ABC Trading Co."
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="registrationNumber">Registration Number *</Label>
          <Input
            id="registrationNumber"
            value={data.registrationNumber}
            onChange={(e) => updateData({ registrationNumber: e.target.value })}
            placeholder="REG-123456"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="taxId">Tax ID *</Label>
          <Input
            id="taxId"
            value={data.taxId}
            onChange={(e) => updateData({ taxId: e.target.value })}
            placeholder="TAX-123456"
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Company Address *</Label>
          <Textarea
            id="address"
            value={data.address}
            onChange={(e) => updateData({ address: e.target.value })}
            placeholder="Full company address"
            rows={3}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactPerson">Contact Person *</Label>
          <Input
            id="contactPerson"
            value={data.contactPerson}
            onChange={(e) => updateData({ contactPerson: e.target.value })}
            placeholder="John Doe"
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
            placeholder="contact@company.com"
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
      </div>

      <div className="border-t pt-6">
        <PhotoUpload
          label="Enter Your 4x4 size  Photo/Company Representative Photo"
          required={true}
          onPhotoUpload={handlePhotoUpload}
          photoUrl={typeof data.company_representative_photo === 'string' ? data.company_representative_photo : undefined}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="submit">Continue</Button>
      </div>
    </form>
  )
}
