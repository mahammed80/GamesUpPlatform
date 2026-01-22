import { Card } from '../ui/Card';
import { Mail, Phone, Calendar, TrendingUp } from 'lucide-react';

const teamMembers = [
  {
    id: 1,
    name: 'Alex Johnson',
    role: 'Product Manager',
    email: 'alex.j@psstore.com',
    phone: '+1 (555) 123-4567',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
    activeTasks: 8,
    completedTasks: 156,
    joinDate: 'Jan 2023',
    performance: 94,
  },
  {
    id: 2,
    name: 'Sarah Williams',
    role: 'Customer Support Lead',
    email: 'sarah.w@psstore.com',
    phone: '+1 (555) 234-5678',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    activeTasks: 12,
    completedTasks: 234,
    joinDate: 'Mar 2023',
    performance: 98,
  },
  {
    id: 3,
    name: 'Mike Chen',
    role: 'Marketing Director',
    email: 'mike.c@psstore.com',
    phone: '+1 (555) 345-6789',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    activeTasks: 6,
    completedTasks: 189,
    joinDate: 'Feb 2023',
    performance: 91,
  },
  {
    id: 4,
    name: 'Emma Davis',
    role: 'Operations Manager',
    email: 'emma.d@psstore.com',
    phone: '+1 (555) 456-7890',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
    activeTasks: 10,
    completedTasks: 203,
    joinDate: 'Apr 2023',
    performance: 96,
  },
  {
    id: 5,
    name: 'James Wilson',
    role: 'Data Analyst',
    email: 'james.w@psstore.com',
    phone: '+1 (555) 567-8901',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
    activeTasks: 5,
    completedTasks: 142,
    joinDate: 'Jun 2023',
    performance: 88,
  },
  {
    id: 6,
    name: 'Lisa Anderson',
    role: 'UX Designer',
    email: 'lisa.a@psstore.com',
    phone: '+1 (555) 678-9012',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
    activeTasks: 7,
    completedTasks: 178,
    joinDate: 'May 2023',
    performance: 93,
  },
];

export function TeamMembers() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Team Members</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage your team and track performance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="text-center p-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Members</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{teamMembers.length}</p>
        </Card>
        <Card className="text-center p-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">Active Tasks</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {teamMembers.reduce((acc, m) => acc + m.activeTasks, 0)}
          </p>
        </Card>
        <Card className="text-center p-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">Completed Tasks</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
            {teamMembers.reduce((acc, m) => acc + m.completedTasks, 0)}
          </p>
        </Card>
        <Card className="text-center p-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Performance</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
            {Math.round(teamMembers.reduce((acc, m) => acc + m.performance, 0) / teamMembers.length)}%
          </p>
        </Card>
      </div>

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {teamMembers.map((member) => (
          <Card key={member.id} className="hover:shadow-lg transition-shadow p-8">
            <div className="flex items-start gap-4 mb-4">
              <img src={member.avatar} alt={member.name} className="w-16 h-16 rounded-full object-cover" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">{member.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{member.role}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-3 h-3 text-green-500" />
                  <span className="text-xs font-medium text-green-500">{member.performance}% Performance</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Mail className="w-4 h-4" />
                <span>{member.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Phone className="w-4 h-4" />
                <span>{member.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>Joined {member.joinDate}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Active Tasks</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{member.activeTasks}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{member.completedTasks}</p>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">Task Completion</span>
                <span className="text-xs font-medium text-gray-900 dark:text-white">
                  {Math.round((member.completedTasks / (member.completedTasks + member.activeTasks)) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full"
                  style={{
                    width: `${Math.round((member.completedTasks / (member.completedTasks + member.activeTasks)) * 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
