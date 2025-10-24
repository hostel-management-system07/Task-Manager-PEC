import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Chat } from '@/components/shared/Chat';
import { ArrowLeft, CheckCircle2, Circle } from 'lucide-react';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  assignedTo: string[];
  status: 'todo' | 'in-progress' | 'completed';
  priority: string;
  dueDate: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
}

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { userData, currentUser } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!projectId || !userData || !currentUser) return;

    const userId = userData.uid || currentUser.uid;

    // Fetch project details
    const fetchProject = async () => {
      const projectDoc = await getDoc(doc(db, 'projects', projectId));
      if (projectDoc.exists()) {
        setProject({ id: projectDoc.id, ...projectDoc.data() } as Project);
      }
    };
    fetchProject();

    // Fetch tasks assigned to user in this project
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('projectId', '==', projectId),
      where('assignedTo', 'array-contains', userId)
    );

    const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      setTasks(tasksData);
    });

    return unsubTasks;
  }, [projectId, userData, currentUser]);

  const handleTaskStatusChange = async (taskId: string, newStatus: 'in-progress' | 'completed') => {
    try {
      const userId = userData?.uid || currentUser?.uid;
      
      const updates: any = {
        status: newStatus,
        updatedAt: new Date()
      };

      if (newStatus === 'completed') {
        updates.completedAt = new Date();
        
        // Add to completed tasks history
        await addDoc(collection(db, 'completedTasks'), {
          taskId,
          userId,
          projectId,
          completedAt: new Date(),
          notes: ''
        });
      }

      await updateDoc(doc(db, 'tasks', taskId), updates);
      toast.success(`Task marked as ${newStatus === 'in-progress' ? 'in progress' : 'completed'}`);
    } catch (error: any) {
      console.error('Failed to update task:', error);
      toast.error(`Failed to update task: ${error.message || 'Permission denied. Please contact admin.'}`);
    }
  };

  const stats = {
    active: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    completed: tasks.filter(t => t.status === 'completed').length
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <Button variant="outline" onClick={() => navigate('/dashboard/user')} className="mb-3 sm:mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">{project?.name}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">{project?.description}</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Stats Cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-3 mb-4 sm:mb-8">
          <Card>
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-base">Active</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
              <p className="text-2xl sm:text-4xl font-bold">{stats.active}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-base">In Progress</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
              <p className="text-2xl sm:text-4xl font-bold">{stats.inProgress}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-base">Completed</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
              <p className="text-2xl sm:text-4xl font-bold">{stats.completed}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="my-tasks" className="space-y-4 sm:space-y-6">
          <TabsList className="w-full flex flex-wrap h-auto gap-1">
            <TabsTrigger value="my-tasks" className="flex-1 text-xs sm:text-sm">My Tasks</TabsTrigger>
            <TabsTrigger value="todo" className="flex-1 text-xs sm:text-sm">To Do</TabsTrigger>
            <TabsTrigger value="in-progress" className="flex-1 text-xs sm:text-sm">In Progress</TabsTrigger>
            <TabsTrigger value="completed" className="flex-1 text-xs sm:text-sm">Completed</TabsTrigger>
            <TabsTrigger value="chat" className="flex-1 text-xs sm:text-sm">Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="my-tasks" className="space-y-4">
            <TaskList 
              tasks={tasks} 
              onStatusChange={handleTaskStatusChange}
            />
          </TabsContent>

          <TabsContent value="todo" className="space-y-4">
            <TaskList 
              tasks={tasks.filter(t => t.status === 'todo')} 
              onStatusChange={handleTaskStatusChange}
            />
          </TabsContent>

          <TabsContent value="in-progress" className="space-y-4">
            <TaskList 
              tasks={tasks.filter(t => t.status === 'in-progress')} 
              onStatusChange={handleTaskStatusChange}
            />
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <TaskList 
              tasks={tasks.filter(t => t.status === 'completed')} 
              onStatusChange={handleTaskStatusChange}
            />
          </TabsContent>

          <TabsContent value="chat">
            <Chat type="project" projectId={projectId} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function TaskList({ tasks, onStatusChange }: { tasks: Task[], onStatusChange: (id: string, status: 'in-progress' | 'completed') => void }) {
  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No tasks in this category
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 sm:gap-4">
      {tasks.map((task) => (
        <Card key={task.id}>
          <CardContent className="p-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
              <div className="flex-1 w-full">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 className="font-semibold text-base sm:text-lg">{task.title}</h3>
                  <Badge variant={
                    task.priority === 'high' ? 'destructive' :
                    task.priority === 'medium' ? 'default' : 'secondary'
                  } className="text-xs">
                    {task.priority}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">{task.description}</p>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                  <span>Due: {task.dueDate}</span>
                  <Badge variant="outline" className="text-xs">{task.status}</Badge>
                </div>
              </div>
              <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                {task.status === 'todo' && (
                  <Button
                    size="sm"
                    className="flex-1 sm:flex-none text-xs sm:text-sm"
                    onClick={() => onStatusChange(task.id, 'in-progress')}
                  >
                    <Circle className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    Start
                  </Button>
                )}
                {task.status === 'in-progress' && (
                  <Button
                    size="sm"
                    className="flex-1 sm:flex-none text-xs sm:text-sm"
                    onClick={() => onStatusChange(task.id, 'completed')}
                  >
                    <CheckCircle2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    Complete
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
