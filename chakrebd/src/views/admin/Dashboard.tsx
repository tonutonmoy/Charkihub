'use client';

import React from 'react';
import { motion } from 'motion/react';
import { 
  Briefcase, Users, FileText, PenTool, 
  TrendingUp, TrendingDown, ArrowUpRight,
  Clock, CheckCircle2, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area,
  BarChart, Bar
} from 'recharts';

const data = [
  { name: 'Jan', users: 4000, jobs: 2400 },
  { name: 'Feb', users: 3000, jobs: 1398 },
  { name: 'Mar', users: 2000, jobs: 9800 },
  { name: 'Apr', users: 2780, jobs: 3908 },
  { name: 'May', users: 1890, jobs: 4800 },
  { name: 'Jun', users: 2390, jobs: 3800 },
  { name: 'Jul', users: 3490, jobs: 4300 },
];

const AdminDashboard = () => {
  const stats = [
    { label: 'Total Jobs', value: '12,450', change: '+12.5%', icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Active Users', value: '850K', change: '+5.2%', icon: Users, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Total Posts', value: '4,230', change: '+8.1%', icon: PenTool, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'CVs Created', value: '125K', change: '+15.3%', icon: FileText, color: 'text-green-500', bg: 'bg-green-500/10' },
  ];

  const recentActivity = [
    { id: 1, type: 'job', title: 'New Govt Job: 46th BCS Preliminary', time: '2 mins ago', status: 'published' },
    { id: 2, type: 'user', title: 'New User Registered: tonmoy@example.com', time: '15 mins ago', status: 'new' },
    { id: 3, type: 'cv', title: 'CV Template Updated: Standard Govt', time: '1 hour ago', status: 'updated' },
    { id: 4, type: 'blog', title: 'New Blog Post: BCS Preparation Tips', time: '3 hours ago', status: 'published' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">Welcome back, Admin. Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", stat.bg)}>
                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-green-500">
                    <TrendingUp className="w-3 h-3" />
                    {stat.change}
                  </div>
                </div>
                <h3 className="text-2xl font-bold tracking-tight">{stat.value}</h3>
                <p className="text-sm text-muted-foreground font-medium mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 rounded-2xl border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-8">
            <CardTitle className="text-lg font-bold">User Growth & Job Trends</CardTitle>
            <Button variant="outline" size="sm" className="rounded-lg font-bold text-xs">
              Last 7 Months
            </Button>
          </CardHeader>
          <CardContent className="px-2">
            <div className="h-[350px] w-full min-w-0">
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorJobs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F97316" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#888' }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#888' }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="users" 
                    stroke="#2563EB" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorUsers)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="jobs" 
                    stroke="#F97316" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorJobs)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    {activity.type === 'job' && <Briefcase className="w-5 h-5 text-blue-500" />}
                    {activity.type === 'user' && <Users className="w-5 h-5 text-orange-500" />}
                    {activity.type === 'cv' && <FileText className="w-5 h-5 text-green-500" />}
                    {activity.type === 'blog' && <PenTool className="w-5 h-5 text-purple-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{activity.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground font-medium">{activity.time}</span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{activity.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-8 rounded-xl font-bold text-sm group">
              View All Activity
              <ArrowUpRight className="ml-2 w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
