"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Step2Props {
  data: any
  updateData: (data: any) => void
  onNext: () => void
  onBack: () => void
}

export function ProfessionalStep2({ data, updateData, onNext, onBack }: Step2Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="profession">Profession *</Label>
          <Select value={data.profession} onValueChange={(value) => updateData({ profession: value })}>
            <SelectTrigger id="profession">
              <SelectValue placeholder="Select profession" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="civil-engineer">Civil Engineer</SelectItem>
              <SelectItem value="structural-engineer">Structural Engineer</SelectItem>
              <SelectItem value="electrical-engineer">Electrical Engineer</SelectItem>
              <SelectItem value="mechanical-engineer">Mechanical Engineer</SelectItem>
              <SelectItem value="architect">Architect</SelectItem>
              <SelectItem value="landscape-architect">Landscape Architect</SelectItem>
              <SelectItem value="quantity-surveyor">Quantity Surveyor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="specialization">Specialization *</Label>
          <Input
            id="specialization"
            value={data.specialization}
            onChange={(e) => updateData({ specialization: e.target.value })}
            placeholder="e.g., Structural Design, Urban Planning"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="degree">Highest Degree *</Label>
          <Select value={data.degree} onValueChange={(value) => updateData({ degree: value })}>
            <SelectTrigger id="degree">
              <SelectValue placeholder="Select degree" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
              <SelectItem value="master">Master's Degree</SelectItem>
              <SelectItem value="phd">PhD/Doctorate</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="university">University/Institution *</Label>
          <Input
            id="university"
            value={data.university}
            onChange={(e) => updateData({ university: e.target.value })}
            placeholder="Name of institution"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="graduationYear">Graduation Year *</Label>
          <Input
            id="graduationYear"
            type="number"
            min="1950"
            max={new Date().getFullYear()}
            value={data.graduationYear}
            onChange={(e) => updateData({ graduationYear: e.target.value })}
            placeholder="2015"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="licenseNumber">Previous License Number (if any)</Label>
          <Input
            id="licenseNumber"
            value={data.licenseNumber}
            onChange={(e) => updateData({ licenseNumber: e.target.value })}
            placeholder="LIC-2026-000123"
          />
        </div>
      </div>

      <div className="flex justify-between gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit">Continue</Button>
      </div>
    </form>
  )
}
