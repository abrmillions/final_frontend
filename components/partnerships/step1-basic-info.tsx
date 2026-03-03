"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { PhotoUpload } from "@/components/photo-upload"

interface Step1Props {
  data: any
  updateData: (data: any) => void
  onNext: () => void
}

export function PartnershipStep1({ data, updateData, onNext }: Step1Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext()
  }

  const handlePhotoUpload = (file: File) => {
    updateData({
      lead_representative_photo: file,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="partnershipName">Partnership/Joint Venture Name *</Label>
          <Input
            id="partnershipName"
            value={data.partnershipName}
            onChange={(e) => updateData({ partnershipName: e.target.value })}
            placeholder="ABC Construction Consortium"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="partnershipType">Partnership Type *</Label>
          <Select value={data.partnershipType} onValueChange={(value) => updateData({ partnershipType: value })}>
            <SelectTrigger id="partnershipType">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="joint-venture">Joint Venture</SelectItem>
              <SelectItem value="general-partnership">General Partnership</SelectItem>
              <SelectItem value="consortium">Consortium</SelectItem>
              <SelectItem value="strategic-alliance">Strategic Alliance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="registrationNumber">Registration Number (if applicable)</Label>
          <Input
            id="registrationNumber"
            value={data.registrationNumber}
            onChange={(e) => updateData({ registrationNumber: e.target.value })}
            placeholder="REG-123456"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate">Partnership Start Date *</Label>
          <Input
            id="startDate"
            type="date"
            value={data.startDate}
            onChange={(e) => updateData({ startDate: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">Partnership End Date *</Label>
          <Input
            id="endDate"
            type="date"
            value={data.endDate}
            onChange={(e) => updateData({ endDate: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="projectScope">Project Scope & Objectives *</Label>
          <Textarea
            id="projectScope"
            value={data.projectScope}
            onChange={(e) => updateData({ projectScope: e.target.value })}
            placeholder="Describe the project scope, objectives, and deliverables"
            rows={4}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="projectLocation">Project Location *</Label>
          <Input
            id="projectLocation"
            value={data.projectLocation}
            onChange={(e) => updateData({ projectLocation: e.target.value })}
            placeholder="City, Region"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimatedValue">Estimated Project Value (USD) *</Label>
          <Input
            id="estimatedValue"
            type="number"
            min="0"
            step="0.01"
            value={data.estimatedValue}
            onChange={(e) => updateData({ estimatedValue: e.target.value })}
            placeholder="1000000"
            required
          />
        </div>
      </div>

      {/* <div className="border-t pt-6">
        <PhotoUpload
          label="Lead Representative Photo"
          required={true}
          onPhotoUpload={handlePhotoUpload}
          photoUrl={data.photo}
        />
      </div> */}

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="submit">Continue</Button>
      </div>
    </form>
  )
}
