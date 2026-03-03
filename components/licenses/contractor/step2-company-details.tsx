"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

interface Step2Props {
  data: any
  updateData: (data: any) => void
  onNext: () => void
  onBack: () => void
}

export function ContractorStep2({ data, updateData, onNext, onBack }: Step2Props) {
  const workScopeOptions = [
    "Building Construction",
    "Road Construction",
    "Bridge Construction",
    "Water & Sewage",
    "Electrical Works",
    "HVAC Systems",
    "Landscaping",
    "Demolition",
  ]

  const toggleWorkScope = (scope: string) => {
    const current = data.workScope || []
    if (current.includes(scope)) {
      updateData({ workScope: current.filter((s: string) => s !== scope) })
    } else {
      updateData({ workScope: [...current, scope] })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name *</Label>
          <Input
            id="companyName"
            value={data.companyName}
            onChange={(e) => updateData({ companyName: e.target.value })}
            placeholder="ABC Construction Ltd."
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

        <div className="space-y-2">
          <Label htmlFor="yearsOfExperience">Years of Experience *</Label>
          <Input
            id="yearsOfExperience"
            type="number"
            min="0"
            value={data.yearsOfExperience}
            onChange={(e) => updateData({ yearsOfExperience: e.target.value })}
            placeholder="10"
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Company Address *</Label>
          <Input
            id="address"
            value={data.address}
            onChange={(e) => updateData({ address: e.target.value })}
            placeholder="123 Main Street"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={data.city}
            onChange={(e) => updateData({ city: e.target.value })}
            placeholder="New York"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="postalCode">Postal Code *</Label>
          <Input
            id="postalCode"
            value={data.postalCode}
            onChange={(e) => updateData({ postalCode: e.target.value })}
            placeholder="10001"
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="licenseType">License Type *</Label>
          <Select value={data.licenseType} onValueChange={(value) => updateData({ licenseType: value })}>
            <SelectTrigger id="licenseType">
              <SelectValue placeholder="Select license type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grade-a">Grade 1 - Large Projects</SelectItem>
              <SelectItem value="grade-b">Grade 2 - Medium Projects</SelectItem>
              <SelectItem value="grade-c">Grade 3 - Small Projects</SelectItem>
              <SelectItem value="specialized">Specialized Contractor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Work Scope (Select all that apply) *</Label>
        <div className="grid md:grid-cols-2 gap-3">
          {workScopeOptions.map((scope) => (
            <div key={scope} className="flex items-center space-x-2">
              <Checkbox
                id={scope}
                checked={(data.workScope || []).includes(scope)}
                onCheckedChange={() => toggleWorkScope(scope)}
              />
              <label
                htmlFor={scope}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {scope}
              </label>
            </div>
          ))}
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
