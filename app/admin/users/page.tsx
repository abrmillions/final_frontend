"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Building2, Search, UserPlus, ArrowLeft, Mail, Phone, MoreVertical, Shield, Ban, Loader2, Users } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { DJANGO_API_URL } from "@/lib/config/django-api"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { usersApi } from "@/lib/api/django-client"

interface User {
  id: string
  name: string
  email: string
  phone: string
  role: "applicant" | "admin" | "reviewer"
  status: "active" | "suspended" | "pending"
  joinedDate: string
  licensesCount: number
}

export default function UsersManagement() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newRole, setNewRole] = useState<"applicant" | "admin" | "reviewer">("applicant")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showRoleDialog, setShowRoleDialog] = useState(false)
  const [showSuspendDialog, setShowSuspendDialog] = useState(false)
  const [showPhotoDialog, setShowPhotoDialog] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserName, setNewUserName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)

  const checkAuthAndFetchUsers = async () => {
    try {
      setLoading(true)
      // Check local user role first
      const userStr = localStorage.getItem('clms_user')
      if (userStr) {
          const user = JSON.parse(userStr)
          if (user.role !== 'Admin') {
              setError("Access Denied: You do not have administrator privileges.")
              setLoading(false)
              return
          }
      }

      const data = await usersApi.list()
      const mappedUsers: User[] = (data as any[]).map((u: any) => ({
        id: String(u.id ?? u.pk ?? ''),
        name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username,
        email: u.email,
        phone: u.phone || "N/A",
        role: (
          (u.role && (["admin","reviewer","applicant"].includes(String(u.role).toLowerCase())))
            ? String(u.role).toLowerCase()
            : (u.is_staff ? "admin" : "applicant")
        ) as "admin" | "reviewer" | "applicant",
        status: (u.is_active ? "active" : "suspended") as "active" | "suspended" | "pending",
        joinedDate: u.date_joined ? u.date_joined.split("T")[0] : "N/A",
        licensesCount: u.licenses_count || 0,
      })).filter((u) => !!u.id && u.id !== 'undefined')
      setUsers(mappedUsers)
    } catch (error: any) {
      // Handle 403 specifically
      if (error?.status === 403 || error?.response?.status === 403 || error?.message?.includes("Permission denied")) {
           setError("Access Denied: You do not have administrator privileges.")
      } else if (error?.status === 401 || /Authentication credentials were not provided/i.test(String(error?.message || ""))) {
           setError("Authentication required. Please sign in as an administrator.")
           toast({
             title: "Sign In Required",
             description: "Please sign in to access User Management.",
             variant: "destructive",
           })
           try {
             window.location.href = "/admin-login"
           } catch {}
      } else {
           toast({
            title: "Error",
            description: "Failed to load users",
            variant: "destructive",
          })
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuthAndFetchUsers()
  }, [])

  if (error) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-red-600 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Access Denied
                    </CardTitle>
                    <CardDescription>
                        {error}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild className="w-full">
                        <Link href="/dashboard">Return to User Portal</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  const handleAddUser = async () => {
    if (!newUserEmail || !newUserName) {
      toast({
        title: "Error",
        description: "Please enter both name and email",
        variant: "destructive",
      })
      return
    }

    try {
      // Create user with default password
      await usersApi.create({
        username: newUserEmail.split("@")[0],
        email: newUserEmail,
        first_name: newUserName,
        password: "ChangeMe123!", // Default password
      })

      setShowAddDialog(false)
      setNewUserEmail("")
      setNewUserName("")
      checkAuthAndFetchUsers()
      
      toast({
        title: "User Added",
        description: `User ${newUserEmail} has been added successfully`,
      })
    } catch (error: any) {
      const msg =
        (error?.error?.detail && String(error.error.detail).trim()) ||
        (error?.message && String(error.message).trim()) ||
        "Failed to add user. Email might already be taken."
      toast({
        title: "Add User Failed",
        description: msg,
        variant: "destructive",
      })
    }
  }

  const handleChangeRole = async () => {
    if (!selectedUser) return

    try {
      const isStaff = newRole === "admin" || newRole === "reviewer"
      const payload: any = { is_staff: isStaff }
      await usersApi.update(selectedUser.id, payload)
      
      setShowRoleDialog(false)
      checkAuthAndFetchUsers()
      
      toast({
        title: "Role Updated",
        description: `${selectedUser.name}'s role has been changed to ${newRole}`,
      })
    } catch (error: any) {
      const msg =
        (error?.error?.detail && String(error.error.detail).trim()) ||
        (error?.message && String(error.message).trim()) ||
        "Failed to update user role"
      toast({
        title: "Role Update Failed",
        description: msg,
        variant: "destructive",
      })
    }
  }

  const handleSuspendUser = async () => {
    if (!selectedUser) return
    try {
      const currentlySuspended = selectedUser.status === "suspended"
      const targetActive = currentlySuspended ? true : false
      await usersApi.update(selectedUser.id, { is_active: targetActive })
      setShowSuspendDialog(false)
      checkAuthAndFetchUsers()
      if (targetActive) {
        toast({
          title: "User Activated",
          description: `${selectedUser.name} has been reactivated`,
        })
      } else {
        toast({
          title: "User Suspended",
          description: `${selectedUser.name} has been suspended`,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      const msg =
        (error?.error?.detail && String(error.error.detail).trim()) ||
        (error?.message && String(error.message).trim()) ||
        "Failed to suspend user"
      toast({
        title: "User Update Failed",
        description: msg,
        variant: "destructive",
      })
    }
  }

  const handleViewDetails = (user: User) => {
    toast({
      title: "User Details",
      description: `${user.name} - ${user.email} - Joined: ${user.joinedDate}`,
    })
  }

  const handleViewLicenses = (user: User) => {
    toast({
      title: "User Licenses",
      description: `${user.name} has ${user.licensesCount} active license(s)`,
    })
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-purple-600">Admin</Badge>
      case "reviewer":
        return <Badge className="bg-blue-600">Reviewer</Badge>
      case "applicant":
        return <Badge variant="outline">Applicant</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-600">Active</Badge>
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>
      case "pending":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
            Pending
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">User Management</h1>
              <p className="text-sm text-slate-500">Manage system users, roles, and permissions</p>
            </div>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new user account. A default password will be assigned.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddUser}>Add User</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Users Directory</CardTitle>
            <CardDescription>View and manage all registered users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search users..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="applicant">Applicant</SelectItem>
                    <SelectItem value="reviewer">Reviewer</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                      <tr className="border-b transition-colors hover:bg-slate-100/50 data-[state=selected]:bg-slate-100">
                        <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">User</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">Role</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">Status</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">Joined</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">Licenses</th>
                        <th className="h-12 px-4 text-right align-middle font-medium text-slate-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {filteredUsers.length === 0 ? (
                         <tr>
                          <td colSpan={6} className="h-24 text-center">
                            No users found.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <tr
                            key={user.id}
                            className="border-b transition-colors hover:bg-slate-100/50 data-[state=selected]:bg-slate-100"
                          >
                            <td className="p-4 align-middle">
                              <div className="flex flex-col">
                                <span className="font-medium text-slate-900">{user.name}</span>
                                <span className="text-xs text-slate-500">{user.email}</span>
                              </div>
                            </td>
                            <td className="p-4 align-middle">{getRoleBadge(user.role)}</td>
                            <td className="p-4 align-middle">{getStatusBadge(user.status)}</td>
                            <td className="p-4 align-middle text-slate-500">{user.joinedDate}</td>
                            <td className="p-4 align-middle">
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-slate-400" />
                                <span className="text-slate-700">{user.licensesCount}</span>
                              </div>
                            </td>
                            <td className="p-4 align-middle text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                                    <Search className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleViewLicenses(user)}>
                                    <Building2 className="mr-2 h-4 w-4" />
                                    View Licenses
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedUser(user)
                                      setNewRole(user.role)
                                      setShowRoleDialog(true)
                                    }}
                                  >
                                    <Shield className="mr-2 h-4 w-4" />
                                    Change Role
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600"
                                    onClick={() => {
                                      setSelectedUser(user)
                                      setShowSuspendDialog(true)
                                    }}
                                  >
                                    <Ban className="mr-2 h-4 w-4" />
                                    {user.status === "suspended" ? "Activate User" : "Suspend User"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedUser(user)
                                      setPhotoFile(null)
                                      setShowPhotoDialog(true)
                                    }}
                                  >
                                    <Mail className="mr-2 h-4 w-4" />
                                    Upload Photo
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change User Role</DialogTitle>
              <DialogDescription>
                Update the role for {selectedUser?.name}. This will affect their permissions.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="role">Select Role</Label>
                <Select
                  value={newRole}
                  onValueChange={(value: "applicant" | "admin" | "reviewer") => setNewRole(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="applicant">Applicant</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    {/* Reviewer role logic to be implemented on backend if needed, currently treating as admin or custom perms */}
                    <SelectItem value="reviewer">Reviewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleChangeRole}>Update Role</Button>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
          <AlertDialogContent>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will {selectedUser?.status === "suspended" ? "activate" : "suspend"} the user account for{" "}
              <span className="font-semibold text-slate-900">{selectedUser?.name}</span>.
              {selectedUser?.status !== "suspended" && " They will no longer be able to access the system."}
            </AlertDialogDescription>
            <div className="flex justify-end gap-3">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className={selectedUser?.status === "suspended" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}
                onClick={() => {
                    // Logic for toggle
                     if (!selectedUser) return
                     const isActive = selectedUser.status === "suspended" // If suspended, we activate
                     usersApi.update(selectedUser.id, { is_active: isActive }).then(() => {
                        setShowSuspendDialog(false)
                        checkAuthAndFetchUsers()
                        toast({
                            title: isActive ? "User Activated" : "User Suspended",
                            description: `${selectedUser.name} has been ${isActive ? "activated" : "suspended"}`,
                            variant: isActive ? "default" : "destructive",
                        })
                     }).catch((error: any) => {
                        const msg =
                          (error?.error?.detail && String(error.error.detail).trim()) ||
                          (error?.message && String(error.message).trim()) ||
                          "Failed to update user status"
                        toast({
                          title: "User Update Failed",
                          description: msg,
                          variant: "destructive",
                        })
                     })
                }}
              >
                {selectedUser?.status === "suspended" ? "Activate" : "Suspend"}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Profile Photo</DialogTitle>
              <DialogDescription>
                Select an image to set as the user's profile photo.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="photo">Profile Photo</Label>
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null
                    setPhotoFile(f)
                  }}
                />
                {photoFile && (
                  <div className="mt-2">
                    <img
                      src={URL.createObjectURL(photoFile)}
                      alt="Preview"
                      className="h-24 w-24 rounded-md object-cover border"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowPhotoDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!selectedUser || !photoFile) {
                    toast({
                      title: "No file selected",
                      description: "Please choose an image to upload.",
                      variant: "destructive",
                    })
                    return
                  }
                  try {
                    await usersApi.update(selectedUser.id, { profile_photo: photoFile })
                    setShowPhotoDialog(false)
                    setPhotoFile(null)
                    checkAuthAndFetchUsers()
                    toast({
                      title: "Photo Updated",
                      description: `${selectedUser.name}'s profile photo has been updated.`,
                    })
                  } catch (error: any) {
                    const msg =
                      (error?.error?.detail && String(error.error.detail).trim()) ||
                      (error?.message && String(error.message).trim()) ||
                      "Could not update the user's photo."
                    toast({
                      title: "Upload Failed",
                      description: msg,
                      variant: "destructive",
                    })
                  }
                }}
              >
                Upload
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
