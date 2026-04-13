'use client';

import React from 'react';
import { motion } from 'motion/react';
import { 
  Plus, Search, Filter, MoreVertical, 
  Eye, Edit2, Trash2, FileText, 
  CheckCircle2, Clock, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';

const MOCK_TEMPLATES = [
  { id: '1', name: 'Standard Govt Format', category: 'Govt', status: 'Active', usage: 12450, rating: 4.9, popular: true },
  { id: '2', name: 'Modern Corporate', category: 'Modern', status: 'Active', usage: 8500, rating: 4.8, popular: true },
  { id: '3', name: 'Academic CV', category: 'Academic', status: 'Draft', usage: 0, rating: 0, popular: false },
  { id: '4', name: 'Technical Resume', category: 'Modern', status: 'Active', usage: 3200, rating: 4.7, popular: false },
];

const AdminCV = () => {
  return (
    <div className="p-6 md:p-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2">CV Templates</h1>
          <p className="text-muted-foreground font-medium">Manage and monitor CV builder templates.</p>
        </div>
        <Button className="h-14 px-8 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 gap-2">
          <Plus className="w-6 h-6" />
          Add New Template
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Templates', value: '12', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Active Templates', value: '8', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Total CVs Created', value: '24.5K', icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
          { label: 'Pending Review', value: '3', icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        ].map((stat, i) => (
          <Card key={i} className="rounded-3xl border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="p-6 flex items-center gap-4">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", stat.bg)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              <div>
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-card rounded-[2.5rem] border border-border/50 shadow-xl shadow-primary/5 overflow-hidden">
        <div className="p-8 border-b border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input placeholder="Search templates..." className="pl-12 h-12 rounded-xl border-border/50 bg-muted/30" />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="h-12 rounded-xl font-bold border-border/50 gap-2">
              <Filter className="w-5 h-5" />
              Filter
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30">
                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-muted-foreground">Template Name</th>
                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-muted-foreground">Category</th>
                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-muted-foreground">Status</th>
                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-muted-foreground">Usage</th>
                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-muted-foreground">Rating</th>
                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {MOCK_TEMPLATES.map((template) => (
                <tr key={template.id} className="hover:bg-muted/20 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-black text-lg group-hover:text-primary transition-colors">{template.name}</p>
                        {template.popular && (
                          <Badge className="bg-secondary text-white text-[10px] font-black uppercase tracking-widest border-none h-5">Popular</Badge>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <Badge variant="outline" className="rounded-lg px-3 py-1 font-bold border-border/50">{template.category}</Badge>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        template.status === 'Active' ? 'bg-green-500' : 'bg-orange-500'
                      )} />
                      <span className="font-bold text-sm">{template.status}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-black text-sm">{template.usage.toLocaleString()}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-black text-sm">{template.rating || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <MoreVertical className="w-5 h-5 text-muted-foreground" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl">
                        <DropdownMenuItem className="gap-2 font-bold">
                          <Eye className="w-4 h-4" /> View Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 font-bold">
                          <Edit2 className="w-4 h-4" /> Edit Template
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 font-bold text-destructive">
                          <Trash2 className="w-4 h-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("bg-card border border-border rounded-xl overflow-hidden", className)}>
    {children}
  </div>
);

export default AdminCV;
