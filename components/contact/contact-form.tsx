'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export default function ContactForm() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    const form = e.currentTarget
    const fd = new FormData(form)
    const payload = {
      name: String(fd.get('name') || ''),
      email: String(fd.get('email') || ''),
      subject: String(fd.get('subject') || ''),
      message: String(fd.get('message') || ''),
    }
    try {
      const res = await fetch('/api/contact/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        form.reset()
        toast({
          title: 'your messages sent succesffuly ',
          description: '',
        })
      } else {
        const data = await res.json().catch(() => ({}))
        toast({
          title: 'Failed to send',
          description: data?.detail || 'Please try again later.',
          variant: 'destructive',
        })
      }
    } catch (err: any) {
      toast({
        title: 'Failed to send',
        description: err?.message || 'Please try again later.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="space-y-4" aria-label="Contact form" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" name="name" placeholder="Your name" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="you@example.com" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" name="subject" placeholder="Subject" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" name="message" placeholder="How can we help?" rows={5} />
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Sending…' : 'Send Message'}
      </Button>
    </form>
  )
}
