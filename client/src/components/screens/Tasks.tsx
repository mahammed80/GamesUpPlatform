import { useState } from 'react';
import { Plus, Calendar, User, Flag } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Modal } from '../ui/Modal';

type TaskStatus = 'todo' | 'inprogress' | 'completed';
type TaskPriority = 'low' | 'medium' | 'high';

interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignees: { name: string; avatar: string }[];
  deadline: string;
}

const AVAILABLE_USERS = [
  { name: 'Alex Johnson', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop' },
  { name: 'Sarah Williams', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
  { name: 'Mike Chen', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
  { name: 'Emma Davis', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop' },
  { name: 'James Wilson', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' },
];

const initialTasks: Task[] = [
  {
    id: 1,
    title: 'Update product inventory',
    description: 'Review and update stock levels for PS5 consoles',
    status: 'todo',
    priority: 'high',
    assignees: [{ name: 'Alex Johnson', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop' }],
    deadline: '2026-01-08',
  },
  {
    id: 2,
    title: 'Process refund requests',
    description: 'Handle pending refund requests from last week',
    status: 'todo',
    priority: 'medium',
    assignees: [{ name: 'Sarah Williams', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' }],
    deadline: '2026-01-06',
  },
  {
    id: 3,
    title: 'Create marketing campaign',
    description: 'Design email campaign for new game releases',
    status: 'inprogress',
    priority: 'high',
    assignees: [{ name: 'Mike Chen', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' }],
    deadline: '2026-01-10',
  },
  {
    id: 4,
    title: 'Customer support tickets',
    description: 'Respond to high-priority support tickets',
    status: 'inprogress',
    priority: 'high',
    assignees: [{ name: 'Emma Davis', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop' }],
    deadline: '2026-01-05',
  },
  {
    id: 5,
    title: 'Monthly sales report',
    description: 'Compile and analyze December sales data',
    status: 'completed',
    priority: 'medium',
    assignees: [{ name: 'James Wilson', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' }],
    deadline: '2026-01-03',
  },
  {
    id: 6,
    title: 'Website maintenance',
    description: 'Update product pages and fix broken links',
    status: 'completed',
    priority: 'low',
    assignees: [{ name: 'Alex Johnson', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop' }],
    deadline: '2026-01-02',
  },
];

export function Tasks() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    assignees: [],
    deadline: '',
  });

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'low':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
    }
  };

  const getTasksByStatus = (status: TaskStatus) => tasks.filter((task) => task.status === status && task.assignees.length > 0);

  const handleCreateTask = () => {
    if (!newTask.title || !newTask.deadline || !newTask.assignees || newTask.assignees.length === 0) return;

    const task: Task = {
      id: tasks.length + 1,
      title: newTask.title || '',
      description: newTask.description || '',
      status: 'todo',
      priority: (newTask.priority as TaskPriority) || 'medium',
      assignees: newTask.assignees,
      deadline: newTask.deadline,
    };

    setTasks([...tasks, task]);
    setIsAddModalOpen(false);
    setNewTask({
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      assignees: [],
      deadline: '',
    });
  };

  const toggleAssignee = (user: typeof AVAILABLE_USERS[0]) => {
    const currentAssignees = newTask.assignees || [];
    const exists = currentAssignees.find(a => a.name === user.name);
    
    if (exists) {
      setNewTask({
        ...newTask,
        assignees: currentAssignees.filter(a => a.name !== user.name)
      });
    } else {
      setNewTask({
        ...newTask,
        assignees: [...currentAssignees, user]
      });
    }
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-medium text-gray-900 dark:text-white">{task.title}</h4>
        <span className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${getPriorityColor(task.priority)}`}>
          <Flag className="w-3 h-3" />
          {task.priority}
        </span>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{task.description}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center -space-x-2">
          {task.assignees.map((assignee, index) => (
            <img 
              key={index} 
              src={assignee.avatar} 
              alt={assignee.name} 
              className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800"
              title={assignee.name}
            />
          ))}
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <Calendar className="w-3 h-3" />
          {new Date(task.deadline).toLocaleDateString()}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage team tasks and assignments</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <button
              onClick={() => setView('kanban')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                view === 'kanban'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Kanban
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                view === 'list'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              List
            </button>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)} icon={Plus}>
            Create Task
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="text-center p-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Tasks</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{tasks.filter(t => t.assignees && t.assignees.length > 0).length}</p>
        </Card>
        <Card className="text-center p-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">To Do</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{getTasksByStatus('todo').length}</p>
        </Card>
        <Card className="text-center p-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{getTasksByStatus('inprogress').length}</p>
        </Card>
        <Card className="text-center p-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{getTasksByStatus('completed').length}</p>
        </Card>
      </div>

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* To Do */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                To Do
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({getTasksByStatus('todo').length})
                </span>
              </h3>
            </div>
            <div className="space-y-3">
              {getTasksByStatus('todo').map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>

          {/* In Progress */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                In Progress
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({getTasksByStatus('inprogress').length})
                </span>
              </h3>
            </div>
            <div className="space-y-3">
              {getTasksByStatus('inprogress').map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>

          {/* Completed */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                Completed
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({getTasksByStatus('completed').length})
                </span>
              </h3>
            </div>
            <div className="space-y-3">
              {getTasksByStatus('completed').map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <Card className="p-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Task</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Assignees</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Priority</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Deadline</th>
                </tr>
              </thead>
              <tbody>
                {tasks.filter(task => task.assignees && task.assignees.length > 0).map((task) => (
                  <tr
                    key={task.id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{task.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{task.description}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center -space-x-2">
                        {task.assignees.map((assignee, index) => (
                          <img 
                            key={index} 
                            src={assignee.avatar} 
                            alt={assignee.name} 
                            className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800"
                            title={assignee.name}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          task.status === 'completed'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : task.status === 'inprogress'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        }`}
                      >
                        {task.status === 'inprogress' ? 'In Progress' : task.status === 'todo' ? 'To Do' : 'Completed'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-300">{task.deadline}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create Task Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Create New Task">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Task Title</label>
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter task title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              placeholder="Task description"
            ></textarea>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
              <select 
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Deadline</label>
              <input
                type="date"
                value={newTask.deadline}
                onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assign To</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_USERS.map((user) => {
                const isSelected = newTask.assignees?.some(a => a.name === user.name);
                return (
                  <button
                    key={user.name}
                    onClick={() => toggleAssignee(user)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors ${
                      isSelected
                        ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <img src={user.avatar} alt={user.name} className="w-5 h-5 rounded-full" />
                    <span className="text-sm">{user.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTask}>Create Task</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}