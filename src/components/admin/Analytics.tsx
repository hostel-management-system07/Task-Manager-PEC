import { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Task {
  id: string;
  projectId: string;
  assignedTo: string[];
  status: string;
  completedAt?: any;
}

interface User {
  uid: string;
  displayName: string;
}

interface Project {
  id: string;
  name: string;
}

export function Analytics() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const tasksQuery = query(collection(db, 'tasks'));
    const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      setTasks(tasksData);
    });

    const usersQuery = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        uid: doc.id,
        displayName: doc.data().displayName
      })) as User[];
      setUsers(usersData);
    });

    const projectsQuery = query(collection(db, 'projects'));
    const unsubProjects = onSnapshot(projectsQuery, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      })) as Project[];
      setProjects(projectsData);
    });

    return () => {
      unsubTasks();
      unsubUsers();
      unsubProjects();
    };
  }, []);

  const completedTasks = tasks.filter(t => t.status === 'completed');

  const userTaskData = users.map(user => ({
    name: user.displayName,
    completed: completedTasks.filter(t => t.assignedTo.includes(user.uid)).length,
    total: tasks.filter(t => t.assignedTo.includes(user.uid)).length
  }));

  const projectTaskData = projects.map(project => ({
    name: project.name,
    completed: completedTasks.filter(t => t.projectId === project.id).length,
    total: tasks.filter(t => t.projectId === project.id).length
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{tasks.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Completed Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{completedTasks.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">
              {tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tasks by User</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userTaskData.map((user) => (
                <TableRow key={user.name}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.completed}</TableCell>
                  <TableCell>{user.total}</TableCell>
                  <TableCell>{user.total > 0 ? Math.round((user.completed / user.total) * 100) : 0}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tasks by Project</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectTaskData.map((project) => (
                <TableRow key={project.name}>
                  <TableCell>{project.name}</TableCell>
                  <TableCell>{project.completed}</TableCell>
                  <TableCell>{project.total}</TableCell>
                  <TableCell>{project.total > 0 ? Math.round((project.completed / project.total) * 100) : 0}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
