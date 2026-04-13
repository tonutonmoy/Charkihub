'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Search, Filter, MoreVertical, 
  UserX, Shield, Mail, 
  ChevronLeft, ChevronRight, Users,
  CheckCircle2, ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MOCK_USERS = [
  { id: '1', name: 'Rahat Ahmed', email: 'rahat@example.com', role: 'Admin', status: 'active', joined: '2026-01-10' },
  { id: '2', name: 'Sumaiya Akter', email: 'sumaiya@example.com', role: 'Editor', status: 'active', joined: '2026-02-15' },
  { id: '3', name: 'Anisul Islam', email: 'anis@example.com', role: 'User', status: 'active', joined: '2026-03-01' },
  { id: '4', name: 'Karim Ullah', email: 'karim@example.com', role: 'User', status: 'blocked', joined: '2026-03-10' },
  { id: '5', name: 'Selina Begum', email: 'selina@example.com', role: 'User', status: 'active', joined: '2026-03-15' },
  { id: '6', name: 'Tanvir Hasan', email: 'tanvir@example.com', role: 'Editor', status: 'active', joined: '2026-03-20' },
];

const AdminUsers = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage user accounts, roles, and permissions.</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search users by name or email..." 
            className="pl-10 h-12 rounded-xl bg-card border-border/50 focus-visible:ring-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl h-12 px-4 font-bold border-border/50 gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">User</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Role</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Status</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Joined Date</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {MOCK_USERS.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted overflow-hidden border border-border shrink-0">
                        <img src={`https://i.pravatar.cc/100?u=${user.email}`} alt={user.name} />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground font-medium">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge 
                      variant={user.role === 'Admin' ? 'default' : 'secondary'} 
                      className={cn(
                        "rounded-lg font-bold text-[10px] uppercase tracking-wider",
                        user.role === 'Admin' ? "bg-primary text-white" : ""
                      )}
                    >
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {user.status === 'active' ? (
                        <div className="flex items-center gap-1.5 text-green-500 font-bold text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Active
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-destructive font-bold text-xs">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Blocked
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-muted-foreground">{user.joined}</td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className={cn(
                        "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                        "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
                        "size-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      )}>
                        <MoreVertical className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl w-48">
                        <DropdownMenuItem className="gap-2">
                          <Mail className="w-4 h-4" /> Send Email
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <Shield className="w-4 h-4" /> Change Role
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 text-destructive">
                          <UserX className="w-4 h-4" /> {user.status === 'active' ? 'Block User' : 'Unblock User'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-muted/20 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground font-medium">Showing 1 to 6 of 850,000 results</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="w-8 h-8 rounded-lg border-border/50" disabled>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 rounded-lg border-border/50 font-bold text-xs bg-primary text-white border-primary">1</Button>
            <Button variant="outline" size="sm" className="h-8 rounded-lg border-border/50 font-bold text-xs">2</Button>
            <Button variant="outline" size="sm" className="h-8 rounded-lg border-border/50 font-bold text-xs">3</Button>
            <Button variant="outline" size="icon" className="w-8 h-8 rounded-lg border-border/50">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminUsers;
