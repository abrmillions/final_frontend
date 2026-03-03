"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface Step2Props {
  data: any
  updateData: (data: any) => void
  onNext: () => void
  onBack: () => void
}

export function ImportExportStep2({ data, updateData, onNext, onBack }: Step2Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="permitType">Permit Type *</Label>
          <Select value={data.permitType} onValueChange={(value) => updateData({ permitType: value })}>
            <SelectTrigger id="permitType">
              <SelectValue placeholder="Select permit type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="import">Import Permit</SelectItem>
              <SelectItem value="export">Export Permit</SelectItem>
              <SelectItem value="import-export">Import & Export Permit</SelectItem>
              <SelectItem value="temporary">Temporary Import/Export</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Permit Duration *</Label>
          <Select value={data.duration} onValueChange={(value) => updateData({ duration: value })}>
            <SelectTrigger id="duration">
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3-months">3 Months</SelectItem>
              <SelectItem value="6-months">6 Months</SelectItem>
              <SelectItem value="1-year">1 Year</SelectItem>
              <SelectItem value="2-years">2 Years</SelectItem>
              <SelectItem value="5-years">5 Years</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="customsOffice">Customs Office *</Label>
          <Select value={data.customsOffice} onValueChange={(value) => updateData({ customsOffice: value })}>
            <SelectTrigger id="customsOffice">
              <SelectValue placeholder="Select customs office" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="main-port">Main Port Authority</SelectItem>
              <SelectItem value="airport">International Airport</SelectItem>
              <SelectItem value="border-crossing">Border Crossing Station</SelectItem>
              <SelectItem value="inland-depot">Inland Customs Depot</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="purposeOfImport">Purpose of Import/Export *</Label>
          <Textarea
            id="purposeOfImport"
            value={data.purposeOfImport}
            onChange={(e) => updateData({ purposeOfImport: e.target.value })}
            placeholder="Describe the purpose and intended use of the equipment/materials"
            rows={4}
            required
          />
        </div>
      </div>

      <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-foreground mb-2">Important Information</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• All construction equipment and materials must comply with local regulations</li>
          <li>• Customs duties and taxes will be calculated based on item values</li>
          <li>• Processing time: 5-10 business days after document verification</li>
        </ul>
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
