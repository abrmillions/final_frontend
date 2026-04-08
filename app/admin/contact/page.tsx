"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { 
  Mail, 
  Search, 
  Filter, 
  MoreVertical, 
  Trash2, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  User,
  ArrowLeft,
  RefreshCcw,
  Edit2,
  Save,
  X,
  Plus,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Reply,
  Archive,
  Flag,
  Star,
  Paperclip,
  AtSign,
  Phone,
  Building2,
  Calendar,
  CornerDownLeft
} from "lucide-react"
import { contactApi } from "@/lib/api/django-client"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Reply {
  id: number
  text: string
  sent_at: string
  created_at: string
  send_status: string
  send_error: string
  sender_name?: string
}

interface ContactMessage {
  id: number
  name: string
  email: string
  subject: string
  message: string
  status: "open" | "pending" | "closed"
  created_at: string
  updated_at: string
  replies: Reply[]
}

export default function ContactManagement() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState("")
  const [sendingReply, setSendingReply] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isDeleting, setIsDeleting] = useState<number | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showMobileDetail, setShowMobileDetail] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState("details")
  
  const [isMounted, setIsMounted] = useState(false)
  
  // Compose mode states
  const [isComposing, setIsComposing] = useState(false)
  const [composeData, setComposeData] = useState({ name: "", email: "", subject: "", message: "" })
  const [isSendingNew, setIsSendingNew] = useState(false)
  
  // Edit mode states
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<ContactMessage>>({})
  const [isSaving, setIsSaving] = useState(false)
  
  // Reply edit states
  const [editingReplyId, setEditingReplyId] = useState<number | null>(null)
  const [editReplyText, setEditReplyText] = useState("")
  const [isUpdatingReply, setIsUpdatingReply] = useState(false)

  const replyInputRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    setIsMounted(true)
    const userStr = localStorage.getItem("clms_user")
    if (userStr) {
      const user = JSON.parse(userStr)
      setIsAdmin(String(user.role || "").toLowerCase() === "admin")
    }
    fetchMessages()
  }, [])

  useEffect(() => {
    if (selectedMessage && replyInputRef.current) {
      replyInputRef.current.focus()
    }
  }, [selectedMessage])

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (activeTab === "conversation" && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [selectedMessage?.replies, activeTab])

  const fetchMessages = async (manual = false) => {
    try {
      setLoading(true)
      const data = await contactApi.listMessages();
      
      if (Array.isArray(data)) {
        setMessages(data);
      } else if (data && Array.isArray(data.results)) {
        setMessages(data.results);
      } else if (data && Array.isArray(data.data)) {
        setMessages(data.data);
      } else {
        console.error("Unexpected data format:", data);
        setMessages([]);
      }
      
      if (manual) {
        toast({
          title: "Refreshed",
          description: "Message list updated successfully.",
        })
      }
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: "Failed to fetch messages",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectMessage = async (msg: ContactMessage) => {
    try {
      setIsComposing(false)
      setLoading(true)
      const detail = await contactApi.getMessageDetail(msg.id)
      setSelectedMessage(detail)
      setEditData(detail)
      setIsEditing(false)
      setShowMobileDetail(true)
      setActiveTab("details")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load message details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSendNewMessage = async () => {
    if (!composeData.email || !composeData.message) {
      toast({
        title: "Missing Info",
        description: "Email and message are required",
        variant: "destructive",
      })
      return
    }

    setIsSendingNew(true)
    try {
      const msg = await contactApi.createMessage({
        name: composeData.name || "User",
        email: composeData.email,
        subject: composeData.subject || "Message from Support",
        message: `[Initiated by Support]\n${composeData.message}`,
        status: "open"
      })

      await contactApi.replyToMessage(msg.id, composeData.message)

      toast({
        title: "Message Sent",
        description: `Your message has been sent to ${composeData.email}`,
      })

      setIsComposing(false)
      setComposeData({ name: "", email: "", subject: "", message: "" })
      fetchMessages()
      handleSelectMessage(msg)
    } catch (error: any) {
      toast({
        title: "Failed to Send",
        description: error?.error?.detail || "Could not send the message. Check your connection.",
        variant: "destructive",
      })
    } finally {
      setIsSendingNew(false)
    }
  }

  const handleSendReply = async () => {
    if (!selectedMessage || !replyText.trim()) return
    
    setSendingReply(true)
    try {
      await contactApi.replyToMessage(selectedMessage.id, replyText)
      toast({
        title: "Reply Sent",
        description: `Successfully sent reply to ${selectedMessage.email}`,
      })
      setReplyText("")
      fetchMessages()
      handleSelectMessage(selectedMessage)
    } catch (error: any) {
      toast({
        title: "Send Failed",
        description: error?.error?.detail || "Only admins can send email replies.",
        variant: "destructive",
      })
    } finally {
      setSendingReply(false)
    }
  }

  const handleUpdateReply = async (replyId: number) => {
    if (!editReplyText.trim()) return
    setIsUpdatingReply(true)
    try {
      await contactApi.updateReply(replyId, editReplyText)
      toast({
        title: "Updated",
        description: "Reply updated successfully",
      })
      setEditingReplyId(null)
      if (selectedMessage) {
        handleSelectMessage(selectedMessage)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update reply",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingReply(false)
    }
  }

  const handleDeleteReply = async (replyId: number) => {
    try {
      await contactApi.deleteReply(replyId)
      toast({
        title: "Deleted",
        description: "Reply deleted successfully",
      })
      if (selectedMessage) {
        handleSelectMessage(selectedMessage)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete reply",
        variant: "destructive",
      })
    }
  }

  const handleDeleteMessage = async () => {
    if (isDeleting === null) return
    
    try {
      await contactApi.deleteMessage(isDeleting)
      setMessages(prev => prev.filter(m => m.id !== isDeleting))
      if (selectedMessage?.id === isDeleting) {
        setSelectedMessage(null)
        setShowMobileDetail(false)
      }
      toast({
        title: "Deleted",
        description: "Message deleted successfully",
      })
    } catch (error: any) {
      console.error("Delete failed:", error)
      toast({
        title: "Error",
        description: error?.error?.detail || "Failed to delete message",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const handleUpdateMessage = async () => {
    if (!selectedMessage) return
    
    setIsSaving(true)
    try {
      const updated = await contactApi.updateMessage(selectedMessage.id, editData)
      setSelectedMessage(updated)
      setMessages(messages.map(m => m.id === updated.id ? updated : m))
      setIsEditing(false)
      toast({
        title: "Updated",
        description: "Message details updated successfully",
      })
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Could not save changes",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const filteredMessages = messages.filter(msg => {
    const matchesSearch = 
      msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.subject.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || msg.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open": return <Clock className="w-4 h-4 text-blue-500" />
      case "pending": return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case "closed": return <CheckCircle2 className="w-4 h-4 text-green-500" />
      default: return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-100 text-blue-800 border-blue-200"
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "closed": return "bg-green-100 text-green-800 border-green-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        {/* Sidebar */}
        <div className={`
          ${showMobileDetail ? 'hidden md:flex' : 'flex'}
          w-full md:w-96 md:flex flex-col bg-white border-r transition-all duration-300
        `}>
          {/* Sidebar Header */}
          <div className="p-4 border-b bg-linear-to-r from-white to-slate-50/50 sticky top-0 z-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold bg-linear-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <span className="truncate">Messages</span>
              </h2>
              <div className="flex gap-0.5 sm:gap-1">
                {isAdmin && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => {
                          setIsComposing(true)
                          setSelectedMessage(null)
                          setShowMobileDetail(true)
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Compose new message</TooltipContent>
                  </Tooltip>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => fetchMessages(true)}>
                      <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh messages</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    >
                      {isSidebarCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isSidebarCollapsed ? "Show search & filters" : "Hide search & filters"}</TooltipContent>
                </Tooltip>
              </div>
            </div>
            
            {!isSidebarCollapsed && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    placeholder="Search messages..." 
                    className="pl-9 h-9 text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Messages</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto">
            {loading && messages.length === 0 ? (
              <div className="p-12 text-center">
                <RefreshCcw className="w-8 h-8 text-blue-200 animate-spin mx-auto mb-4" />
                <p className="text-slate-400 text-sm font-medium">Fetching messages...</p>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-slate-200" />
                </div>
                <p className="text-slate-500 font-semibold">No messages found</p>
                <p className="text-xs text-slate-400 mt-1 max-w-50 mx-auto">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => handleSelectMessage(msg)}
                  className={`group p-4 cursor-pointer transition-all duration-200 border-b hover:bg-slate-50/80 ${
                    selectedMessage?.id === msg.id ? "bg-blue-50/50 border-l-4 border-l-blue-600 shadow-inner" : "border-l-4 border-l-transparent"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 shrink-0 border shadow-sm">
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-bold">
                        {msg.name[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className="font-bold text-sm text-slate-900 truncate">{msg.name}</p>
                        <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap bg-slate-100 px-1.5 py-0.5 rounded-full">
                          {isMounted && new Date(msg.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className={`text-xs truncate mb-1 ${selectedMessage?.id === msg.id ? 'text-blue-700 font-medium' : 'text-slate-700'}`}>
                        {msg.subject}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {msg.message}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge className={`text-[9px] font-bold px-1.5 py-0 h-4.5 uppercase flex items-center gap-1 shadow-xs border-0 ${getStatusColor(msg.status)}`}>
                            {getStatusIcon(msg.status)}
                            {msg.status}
                          </Badge>
                          {msg.replies && msg.replies.length > 0 && (
                            <Badge variant="outline" className="bg-white text-green-700 border-green-200 text-[9px] font-bold px-1.5 py-0 h-4.5 flex items-center gap-1 shadow-xs">
                              <Reply className="w-2.5 h-2.5" />
                              {msg.replies.length}
                            </Badge>
                          )}
                        </div>
                        {isAdmin && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setIsDeleting(msg.id)
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-all"
                            title="Delete message"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className={`flex-1 flex flex-col overflow-hidden bg-slate-50 ${!showMobileDetail ? "hidden md:flex" : "flex"}`}>
          {isComposing ? (
            <div className="flex flex-col h-full bg-white">
              {/* Compose Header */}
              <div className="sticky top-0 z-10 bg-white border-b px-4 py-3 md:px-6 md:py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="md:hidden"
                      onClick={() => {
                        setIsComposing(false)
                        setShowMobileDetail(false)
                      }}
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white shadow-lg">
                      <Send className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">New Message</h3>
                      <p className="text-xs text-slate-500">Start a conversation</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setIsComposing(false)}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>

              {/* Compose Form */}
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Recipient Name
                        </Label>
                        <Input 
                          placeholder="John Doe"
                          value={composeData.name}
                          onChange={(e) => setComposeData({...composeData, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <AtSign className="w-4 h-4" />
                          Email Address
                        </Label>
                        <Input 
                          type="email"
                          placeholder="user@example.com"
                          value={composeData.email}
                          onChange={(e) => setComposeData({...composeData, email: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Input 
                        placeholder="Support regarding your application"
                        value={composeData.subject}
                        onChange={(e) => setComposeData({...composeData, subject: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Message</Label>
                      <Textarea 
                        rows={12}
                        placeholder="Write your message here..."
                        className="resize-none font-mono"
                        value={composeData.message}
                        onChange={(e) => setComposeData({...composeData, message: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button 
                      variant="outline"
                      onClick={() => setIsComposing(false)}
                    >
                      Discard
                    </Button>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={isSendingNew || !composeData.email || !composeData.message}
                      onClick={handleSendNewMessage}
                    >
                      {isSendingNew ? (
                        <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Send Message
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : selectedMessage ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden bg-white">
              {/* Header */}
              <div className="bg-white border-b px-4 py-3 md:px-6 md:py-4 sticky top-0 z-20">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 md:gap-3 min-w-0">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="md:hidden shrink-0 h-8 w-8"
                      onClick={() => setShowMobileDetail(false)}
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <Avatar className="h-9 w-9 md:h-12 md:w-12 shrink-0 border shadow-sm">
                      <AvatarFallback className="bg-blue-600 text-white font-bold text-sm md:text-base">
                        {selectedMessage?.name?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 text-sm md:text-base truncate leading-tight">{selectedMessage?.name}</h3>
                      <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-slate-500 mt-0.5">
                        <AtSign className="w-3 h-3 shrink-0" />
                        <span className="truncate">{selectedMessage?.email}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 shrink-0">
                    {!isEditing ? (
                      <>
                        <Button variant="outline" size="sm" className="h-8 text-xs md:h-9 md:text-sm" onClick={() => setIsEditing(true)}>
                          <Edit2 className="w-3.5 h-3.5 md:mr-2" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button>
                        
                        {isAdmin && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => selectedMessage && setIsDeleting(selectedMessage.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Message
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-8 text-xs px-2 md:px-3" onClick={() => setIsEditing(false)}>
                          <X className="w-4 h-4 md:mr-2" />
                          <span className="hidden xs:inline">Cancel</span>
                        </Button>
                        <Button size="sm" className="h-8 text-xs px-2 md:px-3 bg-blue-600 hover:bg-blue-700" onClick={handleUpdateMessage} disabled={isSaving}>
                          <Save className="w-4 h-4 md:mr-2" />
                          <span className="hidden xs:inline">{isSaving ? "Saving..." : "Save"}</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b px-4 bg-slate-50/30">
                <TabsList className="w-full justify-start bg-transparent h-auto p-0 gap-4 md:gap-8">
                  <TabsTrigger 
                    value="details" 
                    className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-0 pb-2.5 pt-3 text-xs md:text-sm font-semibold transition-all"
                  >
                    <MessageSquare className="w-4 h-4 mr-2 text-slate-400" />
                    Details
                  </TabsTrigger>
                  <TabsTrigger 
                    value="conversation" 
                    className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-0 pb-2.5 pt-3 text-xs md:text-sm font-semibold transition-all"
                  >
                    <Reply className="w-4 h-4 mr-2 text-slate-400" />
                    Conversation
                    <Badge variant="secondary" className="ml-2 h-4.5 min-w-4.5 px-1 bg-slate-200 text-slate-700 text-[10px] font-bold">
                      {selectedMessage?.replies?.length || 0}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-hidden relative bg-slate-50/30">
                <TabsContent value="details" className="h-full m-0 outline-none overflow-y-auto p-4 md:p-8">
                  <div className="max-w-4xl mx-auto space-y-6">
                    <Card className="border-none shadow-sm overflow-hidden bg-white ring-1 ring-slate-200">
                      <CardHeader className="border-b bg-slate-50/50 p-4 md:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base md:text-xl font-bold text-slate-900 leading-snug">
                              {isEditing ? (
                                <Input 
                                  value={editData.subject || ""} 
                                  onChange={(e) => setEditData({...editData, subject: e.target.value})}
                                  className="text-base md:text-lg font-bold h-10 md:h-12 border-blue-200 focus:border-blue-600"
                                />
                              ) : (
                                selectedMessage?.subject
                              )}
                            </CardTitle>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3">
                              <div className="flex items-center gap-1.5 text-[11px] md:text-xs text-slate-500 bg-white px-2 py-1 rounded-md border shadow-xs">
                                <Clock className="w-3.5 h-3.5 text-blue-500" />
                                <span>{isMounted && selectedMessage && new Date(selectedMessage.created_at).toLocaleString()}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] md:text-xs text-slate-500 bg-white px-2 py-1 rounded-md border shadow-xs">
                                <User className="w-3.5 h-3.5 text-blue-500" />
                                <span className="font-medium">{selectedMessage?.name}</span>
                              </div>
                            </div>
                          </div>
                          <div className="shrink-0">
                            {isEditing ? (
                              <Select 
                                value={editData.status} 
                                onValueChange={(v: any) => setEditData({...editData, status: v})}
                              >
                                <SelectTrigger className="w-full sm:w-32 h-9 md:h-10 border-blue-200">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="open">Open</SelectItem>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="closed">Closed</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge className={`capitalize px-3 py-1 h-7 text-xs font-bold shadow-sm border-0 ${selectedMessage ? getStatusColor(selectedMessage.status) : ""}`}>
                                {selectedMessage ? getStatusIcon(selectedMessage.status) : null}
                                <span className="ml-1.5">{selectedMessage?.status}</span>
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 md:p-8">
                        {isEditing ? (
                          <Textarea 
                            rows={15}
                            className="font-mono text-sm leading-relaxed border-blue-100 focus:border-blue-600 resize-none p-4"
                            value={editData.message || ""} 
                            onChange={(e) => setEditData({...editData, message: e.target.value})}
                          />
                        ) : (
                          <div className="bg-slate-50/50 p-4 md:p-6 rounded-xl border border-slate-100 shadow-inner">
                            <div className="prose prose-sm md:prose-base max-w-none">
                              <div className="whitespace-pre-wrap text-slate-700 leading-relaxed font-medium italic opacity-90">
                                {selectedMessage?.message}
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Card className="border-none shadow-xs ring-1 ring-slate-200">
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">Recipient Information</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-slate-500">Name</p>
                              <p className="text-sm font-semibold truncate">{selectedMessage?.name}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                              <AtSign className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-slate-500">Email</p>
                              <p className="text-sm font-semibold truncate">{selectedMessage?.email}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-none shadow-xs ring-1 ring-slate-200">
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">Message Status</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                              <Clock className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-slate-500">Status</p>
                              <p className="text-sm font-semibold capitalize">{selectedMessage?.status}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                              <Calendar className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-slate-500">Last Updated</p>
                              <p className="text-sm font-semibold">
                                {isMounted && selectedMessage && new Date(selectedMessage.updated_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="conversation" className="h-full m-0 outline-none flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                    {selectedMessage?.replies && selectedMessage.replies.length > 0 ? (
                      <div className="max-w-4xl mx-auto space-y-8 pb-10">
                        <div className="flex items-center gap-4">
                          <Separator className="flex-1" />
                          <Badge variant="outline" className="text-[10px] uppercase tracking-widest text-slate-400 font-bold bg-white">
                            Conversation History
                          </Badge>
                          <Separator className="flex-1" />
                        </div>

                        {selectedMessage.replies.map((reply, index) => (
                          <div key={reply.id} className="flex flex-col items-end w-full animate-in slide-in-from-bottom-3 duration-500 ease-out">
                            <div className="bg-white border border-slate-200 p-4 md:p-6 rounded-2xl rounded-tr-none max-w-[95%] md:max-w-[85%] shadow-sm relative group hover:shadow-md transition-shadow">
                              <div className="flex items-center justify-between gap-4 mb-3 pb-2 border-b border-slate-100">
                                <div className="flex items-center gap-2.5">
                                  <Avatar className="h-7 w-7 md:h-8 md:w-8 ring-2 ring-blue-50">
                                    <AvatarFallback className="bg-blue-600 text-white text-[10px] md:text-xs font-bold">
                                      {reply.sender_name?.[0] || 'A'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0">
                                    <p className="text-xs md:text-sm font-bold text-slate-900 truncate">
                                      {reply.sender_name || "Support Team"}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-medium">
                                      {isMounted && new Date(reply.sent_at || reply.created_at).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                                
                                {isAdmin && (
                                  <div className="opacity-0 group-hover:opacity-100 transition-all flex gap-1">
                                    <button 
                                      onClick={() => {
                                        setEditingReplyId(reply.id)
                                        setEditReplyText(reply.text)
                                      }}
                                      className="p-1.5 hover:bg-blue-50 text-blue-400 hover:text-blue-600 rounded-lg transition-colors"
                                      title="Edit reply"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteReply(reply.id)}
                                      className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors"
                                      title="Delete reply"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                              
                              <div className="whitespace-pre-wrap text-sm md:text-base text-slate-700 leading-relaxed font-medium">
                                {reply.text}
                              </div>

                              <div className="mt-4 flex items-center justify-end gap-1.5">
                                {reply.send_status === "success" ? (
                                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-[10px] font-bold border border-green-100">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Delivered via Email</span>
                                  </div>
                                ) : (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-[10px] font-bold border border-red-100 cursor-help">
                                        <AlertCircle className="w-3 h-3" />
                                        <span>Delivery Failed</span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                      <p className="text-xs font-medium">{reply.send_error || "Check mail server configuration"}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center py-20 bg-white/50 rounded-3xl border border-dashed border-slate-200 mx-auto max-w-2xl">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 ring-8 ring-slate-50">
                          <MessageSquare className="w-10 h-10 text-slate-300" />
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 mb-1">No replies yet</h4>
                        <p className="text-sm text-slate-500 text-center max-w-xs px-6">
                          Start a conversation by typing a response below. The user will receive an email notification.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Reply Input */}
                  {isAdmin && (
                    <div className="bg-white border-t p-4 md:p-6 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] sticky bottom-0 z-10">
                      <div className="max-w-4xl mx-auto">
                        <div className="flex gap-2 items-end bg-slate-50 rounded-2xl border border-slate-200 p-2 md:p-3 focus-within:ring-2 focus-within:ring-blue-600/20 focus-within:border-blue-600 transition-all shadow-inner">
                          <Textarea 
                            ref={replyInputRef}
                            placeholder="Type your reply here..."
                            className="flex-1 min-h-20 md:min-h-25 max-h-60 overflow-y-auto border-0 focus-visible:ring-0 resize-none bg-transparent text-sm md:text-base font-medium py-2 px-3 leading-relaxed"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSendReply()
                              }
                            }}
                          />
                          <div className="flex flex-col gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="icon"
                                  className="bg-blue-600 hover:bg-blue-700 h-10 w-10 md:h-12 md:w-12 shrink-0 rounded-xl shadow-lg transition-all active:scale-95 group"
                                  disabled={sendingReply || !replyText.trim()}
                                  onClick={handleSendReply}
                                >
                                  {sendingReply ? (
                                    <RefreshCcw className="w-5 h-5 animate-spin" />
                                  ) : (
                                    <Send className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="left">
                                <p className="text-xs font-bold">Send Email Reply</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                        <div className="hidden md:flex items-center justify-center gap-4 mt-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          <div className="flex items-center gap-1.5">
                            <kbd className="px-1.5 py-0.5 bg-slate-100 rounded-md border shadow-xs">Enter</kbd> 
                            <span>to send</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <kbd className="px-1.5 py-0.5 bg-slate-100 rounded-md border shadow-xs">Shift + Enter</kbd> 
                            <span>for new line</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="w-24 h-24 rounded-full bg-linear-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-6 shadow-inner">
                <Mail className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No message selected</h3>
              <p className="text-slate-500 text-center max-w-md mb-8">
                Select a message from the list to view details, reply, or manage the conversation.
              </p>
              {isAdmin && (
                <Button 
                  onClick={() => {
                    setIsComposing(true)
                    setShowMobileDetail(true)
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Compose New Message
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleting !== null} onOpenChange={(o) => !o && setIsDeleting(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this message?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the message
                and all associated replies from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteMessage} className="bg-red-600 hover:bg-red-700">
                Delete Message
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Reply Dialog */}
        <Dialog open={editingReplyId !== null} onOpenChange={(open) => !open && setEditingReplyId(null)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                Edit Reply
              </DialogTitle>
              <DialogDescription>
                Modify your reply. Changes will be saved and visible to the recipient.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea 
                className="min-h-50 resize-none focus-visible:ring-blue-600"
                placeholder="Edit your reply..."
                value={editReplyText}
                onChange={(e) => setEditReplyText(e.target.value)}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setEditingReplyId(null)}
                disabled={isUpdatingReply}
              >
                Cancel
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isUpdatingReply || !editReplyText.trim()}
                onClick={() => editingReplyId !== null && handleUpdateReply(editingReplyId)}
              >
                {isUpdatingReply ? (
                  <>
                    <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}