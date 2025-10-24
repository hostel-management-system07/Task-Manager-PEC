import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, Plus, Edit, Trash2, Users } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  assignedTo: string[];
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  createdAt: any;
}

interface Project {
  id: string;
  name: string;
}

interface User {
  uid: string;
  displayName: string;
}

export function TaskManagement() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterProject, setFilterProject] = useState<string>('all');

  useEffect(() => {
    const tasksQuery = query(collection(db, 'tasks'));
    const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      setTasks(tasksData);
    });

    const projectsQuery = query(collection(db, 'projects'));
    const unsubProjects = onSnapshot(projectsQuery, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      })) as Project[];
      setProjects(projectsData);
    });

    const usersQuery = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        uid: doc.id,
        displayName: doc.data().displayName
      })) as User[];
      setUsers(usersData);
    });

    return () => {
      unsubTasks();
      unsubProjects();
      unsubUsers();
    };
  }, []);

  const filteredTasks = filterProject === 'all' 
    ? tasks 
    : tasks.filter(task => task.projectId === filterProject);

  const handleAddTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      await addDoc(collection(db, 'tasks'), {
        title: formData.get('title'),
        description: formData.get('description'),
        projectId: formData.get('projectId'),
        assignedTo: selectedUsers,
        status: 'todo',
        priority: formData.get('priority'),
        dueDate: formData.get('dueDate'),
        createdAt: new Date(),
        createdBy: 'admin'
      });

      toast.success('Task created successfully');
      setIsAddModalOpen(false);
      setSelectedUsers([]);
    } catch (error) {
      toast.error('Failed to create task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTask) return;
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      await updateDoc(doc(db, 'tasks', editingTask.id), {
        title: formData.get('title'),
        description: formData.get('description'),
        projectId: formData.get('projectId'),
        assignedTo: selectedUsers,
        priority: formData.get('priority'),
        dueDate: formData.get('dueDate'),
        updatedAt: new Date()
      });

      toast.success('Task updated successfully');
      setIsEditModalOpen(false);
      setEditingTask(null);
      setSelectedUsers([]);
    } catch (error) {
      toast.error('Failed to update task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await deleteDoc(doc(db, 'tasks', id));
      toast.success('Task deleted successfully');
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const handleBulkAssign = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updatePromises = selectedTasks.map(taskId =>
        updateDoc(doc(db, 'tasks', taskId), {
          assignedTo: selectedUsers,
          updatedAt: new Date()
        })
      );

      await Promise.all(updatePromises);
      toast.success(`${selectedTasks.length} tasks assigned successfully`);
      setIsBulkAssignOpen(false);
      setSelectedTasks([]);
      setSelectedUsers([]);
    } catch (error) {
      toast.error('Failed to assign tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const toggleTask = (taskId: string) => {
    setSelectedTasks(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Task Management</CardTitle>
        <div className="flex gap-2">
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setIsBulkAssignOpen(true)} disabled={selectedTasks.length === 0}>
            <Users className="mr-2 h-4 w-4" />
            Bulk Assign ({selectedTasks.length})
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create New Task
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedTasks.length === filteredTasks.length && filteredTasks.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedTasks(filteredTasks.map(t => t.id));
                    } else {
                      setSelectedTasks([]);
                    }
                  }}
                />
              </TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedTasks.includes(task.id)}
                    onCheckedChange={() => toggleTask(task.id)}
                  />
                </TableCell>
                <TableCell className="font-medium">{task.title}</TableCell>
                <TableCell>{projects.find(p => p.id === task.projectId)?.name}</TableCell>
                <TableCell>{task.assignedTo.length} users</TableCell>
                <TableCell className="capitalize">{task.status}</TableCell>
                <TableCell className="capitalize">{task.priority}</TableCell>
                <TableCell>{task.dueDate}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingTask(task);
                        setSelectedUsers(task.assignedTo);
                        setIsEditModalOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Add Task Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddTask}>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label htmlFor="title">Task Title</Label>
                  <Input id="title" name="title" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectId">Project</Label>
                  <Select name="projectId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select name="priority" defaultValue="medium">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input id="dueDate" name="dueDate" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label>Assign To</Label>
                  <div className="border rounded-md p-4 max-h-48 overflow-y-auto space-y-2">
                    {users.map(user => (
                      <div key={user.uid} className="flex items-center space-x-2">
                        <Checkbox
                          id={`assign-${user.uid}`}
                          checked={selectedUsers.includes(user.uid)}
                          onCheckedChange={() => toggleUser(user.uid)}
                        />
                        <label htmlFor={`assign-${user.uid}`} className="text-sm cursor-pointer">
                          {user.displayName}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Task
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Task Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditTask}>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Task Title</Label>
                  <Input id="edit-title" name="title" defaultValue={editingTask?.title} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea id="edit-description" name="description" defaultValue={editingTask?.description} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-projectId">Project</Label>
                  <Select name="projectId" defaultValue={editingTask?.projectId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-priority">Priority</Label>
                  <Select name="priority" defaultValue={editingTask?.priority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-dueDate">Due Date</Label>
                  <Input id="edit-dueDate" name="dueDate" type="date" defaultValue={editingTask?.dueDate} required />
                </div>
                <div className="space-y-2">
                  <Label>Assign To</Label>
                  <div className="border rounded-md p-4 max-h-48 overflow-y-auto space-y-2">
                    {users.map(user => (
                      <div key={user.uid} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-assign-${user.uid}`}
                          checked={selectedUsers.includes(user.uid)}
                          onCheckedChange={() => toggleUser(user.uid)}
                        />
                        <label htmlFor={`edit-assign-${user.uid}`} className="text-sm cursor-pointer">
                          {user.displayName}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Task
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Bulk Assign Modal */}
        <Dialog open={isBulkAssignOpen} onOpenChange={setIsBulkAssignOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Assign Tasks</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleBulkAssign}>
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">
                  Assigning {selectedTasks.length} task(s) to selected users
                </p>
                <div className="space-y-2">
                  <Label>Select Users</Label>
                  <div className="border rounded-md p-4 max-h-48 overflow-y-auto space-y-2">
                    {users.map(user => (
                      <div key={user.uid} className="flex items-center space-x-2">
                        <Checkbox
                          id={`bulk-${user.uid}`}
                          checked={selectedUsers.includes(user.uid)}
                          onCheckedChange={() => toggleUser(user.uid)}
                        />
                        <label htmlFor={`bulk-${user.uid}`} className="text-sm cursor-pointer">
                          {user.displayName}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsBulkAssignOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || selectedUsers.length === 0}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Assign Tasks
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
