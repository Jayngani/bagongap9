"use client";

import { clearTokens } from "@/lib/auth";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, LogOut, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { apiClient } from "@/lib/api";
import { CONFIG } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// ✅ Updated interface: type_amd → username, type_intel → password
interface User {
  id: number;
  user_id: number;
  username: string;
  password: string;
  role: string;
  refresh_token?: string | null;
  created_at?: string;
  updated_at?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { isChecking } = useAuthGuard({ requireAuth: true });

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // ✅ GET all users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiClient<User[]>(CONFIG.ENDPOINTS.USERS || "/users", {
        method: "GET",
        requiresAuth: true,
      });
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isChecking) {
      fetchUsers();
    }
  }, [isChecking, fetchUsers]);

  // ✅ GET single user
  const handleViewUser = async (userId: number) => {
    setError("");
    setSuccess("");
    try {
      const data = await apiClient<User>(
        `${CONFIG.ENDPOINTS.USERS || "/users"}/${userId}`,
        {
          method: "GET",
          requiresAuth: true,
        }
      );
      setSelectedUser(data);
    } catch (err: any) {
      setError(err.message || "Failed to load user details.");
    }
  };

  const openCreateForm = () => {
    setEditingId(null);
    setUsername("");
    setPassword("");
    setSelectedUser(null);
    setError("");
    setSuccess("");
    setIsFormOpen(true);
  };

  const openEditForm = (user: User) => {
    setEditingId(user.id);
    setUsername(user.username);
    setPassword(user.password);
    setSelectedUser(null);
    setError("");
    setSuccess("");
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setUsername("");
    setPassword("");
  };

  // ✅ CREATE & UPDATE — now sends username & password
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      if (editingId !== null) {
        // UPDATE — PUT /users/:id
        await apiClient(`${CONFIG.ENDPOINTS.USERS || "/users"}/${editingId}`, {
          method: "PUT",
          requiresAuth: true,
          body: JSON.stringify({
            username,
            password,
          }),
        });
        setSuccess(`User #${editingId} updated successfully.`);
      } else {
        // CREATE — POST /users
        await apiClient(CONFIG.ENDPOINTS.USERS || "/users", {
          method: "POST",
          requiresAuth: true,
          body: JSON.stringify({
            username,
            password,
          }),
        });
        setSuccess("New user created successfully.");
      }

      closeForm();
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || "Operation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ DELETE
  const handleDelete = async (userId: number) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete User #${userId}?`
    );
    if (!confirmed) return;

    setError("");
    setSuccess("");
    try {
      await apiClient(`${CONFIG.ENDPOINTS.USERS || "/users"}/${userId}`, {
        method: "DELETE",
        requiresAuth: true,
      });

      if (selectedUser?.id === userId) {
        setSelectedUser(null);
      }
      setSuccess(`User #${userId} deleted successfully.`);
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || "Failed to delete user.");
    }
  };

  const handleLogout = () => {
    clearTokens();
    router.push(CONFIG.ROUTES.LOGIN);
  };

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Verifying session ... </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8 bg-background">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Navbar */}
        <header className="flex justify-between items-center border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-sm text-muted-foreground">
              Manage User Accounts
            </p>
          </div>
          <Button variant="destructive" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </header>

        {/* Status Notifications */}
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/50 rounded-md border border-red-200 dark:border-red-900">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 rounded-md border border-emerald-200 dark:border-emerald-900">
            {success}
          </div>
        )}

        {/* Create/Update Form */}
        {isFormOpen && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>
                  {editingId !== null
                    ? `Update User #${editingId}`
                    : "Add New User"}
                </CardTitle>
                <CardDescription>
                  {editingId !== null
                    ? "Update username and password"
                    : "Enter new username and password"}
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={closeForm}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder="Enter username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={closeForm}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting
                      ? "Saving..."
                      : editingId !== null
                      ? "Save Changes"
                      : "Add User"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Single User Details Card */}
        {selectedUser && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>User Details (#{selectedUser.id})</CardTitle>
                <CardDescription>
                  Full information for this user
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedUser(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground block">User ID</span>
                <span className="font-medium">{selectedUser.id}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Username</span>
                <span className="font-medium">{selectedUser.username}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Role</span>
                <span className="font-medium">{selectedUser.role}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Password</span>
                <span className="font-medium">••••••••</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Users Table */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Users List</CardTitle>
              <CardDescription>
                All registered user accounts
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={fetchUsers}
                disabled={loading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button onClick={openCreateForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        No users found. Click "Add User" to create one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.id}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewUser(user.id)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => openEditForm(user)}
                            >
                              <Pencil className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(user.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
