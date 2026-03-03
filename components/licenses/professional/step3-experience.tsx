"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash2 } from "lucide-react"
import { useState } from "react"

interface Step3Props {
  data: any
  updateData: (data: any) => void
  onNext: () => void
  onBack: () => void
}

export function ProfessionalStep3({ data, updateData, onNext, onBack }: Step3Props) {
  const [projects, setProjects] = useState(data.projects || [])

  const addProject = () => {
    const newProjects = [...projects, { name: "", role: "", year: "", description: "" }]
    setProjects(newProjects)
    updateData({ projects: newProjects })
  }

  const removeProject = (index: number) => {
    const newProjects = projects.filter((_: any, i: number) => i !== index)
    setProjects(newProjects)
    updateData({ projects: newProjects })
  }

  const updateProject = (index: number, field: string, value: string) => {
    const newProjects = [...projects]
    newProjects[index][field] = value
    setProjects(newProjects)
    updateData({ projects: newProjects })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
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

        <div className="space-y-2">
          <Label htmlFor="currentEmployer">Current Employer *</Label>
          <Input
            id="currentEmployer"
            value={data.currentEmployer}
            onChange={(e) => updateData({ currentEmployer: e.target.value })}
            placeholder="Company name"
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="position">Current Position *</Label>
          <Input
            id="position"
            value={data.position}
            onChange={(e) => updateData({ position: e.target.value })}
            placeholder="Senior Engineer, Project Manager, etc."
            required
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Notable Projects (at least 2) *</Label>
          <Button type="button" variant="outline" size="sm" onClick={addProject}>
            <Plus className="w-4 h-4 mr-2" />
            Add Project
          </Button>
        </div>

        {projects.map((project: any, index: number) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-4">
                <h4 className="font-semibold text-sm">Project {index + 1}</h4>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeProject(index)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Project Name *</Label>
                  <Input
                    value={project.name}
                    onChange={(e) => updateProject(index, "name", e.target.value)}
                    placeholder="Project name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Your Role *</Label>
                  <Input
                    value={project.role}
                    onChange={(e) => updateProject(index, "role", e.target.value)}
                    placeholder="Lead Engineer, Designer, etc."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Year *</Label>
                  <Input
                    value={project.year}
                    onChange={(e) => updateProject(index, "year", e.target.value)}
                    placeholder="2020"
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description *</Label>
                  <Textarea
                    value={project.description}
                    onChange={(e) => updateProject(index, "description", e.target.value)}
                    placeholder="Brief description of the project"
                    rows={2}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {projects.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No projects added yet. Click "Add Project" to get started.</p>
          </div>
        )}
      </div>

      <div className="flex justify-between gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" disabled={projects.length < 2}>
          Continue
        </Button>
      </div>
    </form>
  )
}
