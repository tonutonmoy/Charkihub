'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Construction } from 'lucide-react';

interface AdminPlaceholderProps {
  title: string;
}

const AdminPlaceholder: React.FC<AdminPlaceholderProps> = ({ title }) => {
  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col items-center justify-center text-center space-y-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center"
      >
        <Construction className="w-12 h-12 text-primary" />
      </motion.div>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          This section is currently under development. We're building a powerful management tool for your {title.toLowerCase()}.
        </p>
      </div>
    </div>
  );
};

export default AdminPlaceholder;
