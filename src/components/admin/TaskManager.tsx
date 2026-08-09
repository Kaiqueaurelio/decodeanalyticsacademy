import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Search, 
  Trash2, 
  Clock, 
  Filter,
  CheckSquare,
  AlertCircle,
  MoreVertical,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'completed';
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
}

export function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('admin_tasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    localStorage.setItem('admin_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: newTaskTitle.trim(),
      description: '',
      status: 'pending',
      priority: 'medium',
      createdAt: Date.now(),
    };
    
    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
    toast.success('Tarefa adicionada com sucesso!');
  };

  const toggleTaskStatus = (id: string) => {
    setTasks(tasks.map(t => 
      t.id === id ? { ...t, status: t.status === 'pending' ? 'completed' : 'pending' } : t
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
    toast.info('Tarefa removida.');
  };

  const filteredTasks = tasks.filter(t => {
    const matchesFilter = filter === 'all' || t.status === filter;
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = tasks.filter(t => t.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Gerenciador de Tarefas</h2>
          <p className="text-sm text-muted-foreground">Controle operacional de afazeres administrativos</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="px-3 py-1 text-xs gap-1.5 rounded-lg border-primary/20 bg-primary/5 text-primary">
            <Clock className="h-3 w-3" /> {pendingCount} pendentes
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/50 bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center justify-between">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Pesquisar tarefas..." 
                  className="pl-9 bg-muted/30 border-none h-10 rounded-xl focus-visible:ring-primary/30"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Tabs value={filter} onValueChange={(v: any) => setFilter(v)} className="ml-4">
                <TabsList className="bg-muted/50 rounded-xl p-1 h-10">
                  <TabsTrigger value="all" className="rounded-lg text-xs font-bold data-[state=active]:bg-card data-[state=active]:shadow-sm">Todas</TabsTrigger>
                  <TabsTrigger value="pending" className="rounded-lg text-xs font-bold data-[state=active]:bg-card data-[state=active]:shadow-sm">Pendentes</TabsTrigger>
                  <TabsTrigger value="completed" className="rounded-lg text-xs font-bold data-[state=active]:bg-card data-[state=active]:shadow-sm">Feitas</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/30">
              {filteredTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                  <div className="h-16 w-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                    <CheckSquare className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Nada por aqui</h3>
                  <p className="text-sm text-muted-foreground max-w-[240px] mt-1">
                    Não encontramos tarefas com esses critérios de busca.
                  </p>
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className={`group flex items-center justify-between p-4 hover:bg-muted/30 transition-all ${
                      task.status === 'completed' ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <button 
                        onClick={() => toggleTaskStatus(task.id)}
                        className={`transition-all duration-200 transform active:scale-90 ${
                          task.status === 'completed' ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                        }`}
                      >
                        {task.status === 'completed' ? (
                          <CheckCircle2 className="h-6 w-6" />
                        ) : (
                          <Circle className="h-6 w-6" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <p className={`text-sm font-bold truncate ${
                          task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'
                        }`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(task.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 rounded-xl border-border/50 bg-card/95 backdrop-blur-md">
                          <DropdownMenuItem 
                            onClick={() => deleteTask(task.id)}
                            className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm rounded-[2rem] overflow-hidden border-primary/20 shadow-xl shadow-primary/5">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" /> Nova Tarefa
              </CardTitle>
              <CardDescription>Adicione um lembrete operacional</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input 
                placeholder="O que precisa ser feito?"
                className="bg-muted/30 border-none h-12 rounded-2xl focus-visible:ring-primary/30"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
              />
              <Button 
                className="w-full h-12 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                onClick={addTask}
                disabled={!newTaskTitle.trim()}
              >
                Criar Tarefa
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm rounded-[2rem] overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Dica Rápida</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 items-start text-xs text-muted-foreground leading-relaxed">
                <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p>Use este espaço para anotar rascunhos de apostilas que precisam de revisão ou pendências de alunos para resolver mais tarde.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
