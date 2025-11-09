<script lang="ts">
  import { onDestroy } from 'svelte';
  import Button from '$lib/components/ui/button/button.svelte';
  import * as Drawer from '$lib/components/ui/drawer';
  import { Label } from '$lib/components/ui/label';
  import { Input } from '$lib/components/ui/input';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { Settings, Plus, Trash2 } from '@lucide/svelte';

  let time = 25 * 60;
  let isRunning = false;
  let isBreak = false;
  let pomodoroCount = 0;
  let interval: ReturnType<typeof setInterval> | undefined = undefined;
  
  // Settings
  let pomodoroDuration = 25;
  let breakDuration = 5;
  
  // Checklist
  let tasks: Array<{ id: number; text: string; completed: boolean }> = [];
  let newTaskText = '';
  let taskIdCounter = 0;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleTimerCompletion = () => {
    if (!isBreak) {
      pomodoroCount++;
      isBreak = true;
      time = breakDuration * 60;
    } else {
      isBreak = false;
      time = pomodoroDuration * 60;
    }
  };

  const startTimer = () => {
    if (isRunning) return;
    isRunning = true;
    interval = setInterval(() => {
      if (time > 0) {
        time -= 1;
      } else {
        handleTimerCompletion();
      }
    }, 1000);
  };

  const pauseTimer = () => {
    isRunning = false;
    if (interval) {
      clearInterval(interval);
      interval = undefined;
    }
  };

  const resetTimer = () => {
    pauseTimer();
    isBreak = false;
    time = pomodoroDuration * 60;
    pomodoroCount = 0;
  };

  const toggleMode = () => {
    pauseTimer();
    isBreak = !isBreak;
    time = isBreak ? breakDuration * 60 : pomodoroDuration * 60;
  };

  const applySettings = () => {
    pauseTimer();
    time = (isBreak ? breakDuration : pomodoroDuration) * 60;
  };

  const addTask = () => {
    if (newTaskText.trim()) {
      tasks = [...tasks, { id: taskIdCounter++, text: newTaskText, completed: false }];
      newTaskText = '';
    }
  };

  const toggleTask = (id: number) => {
    tasks = tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
  };

  const deleteTask = (id: number) => {
    tasks = tasks.filter(task => task.id !== id);
  };

  onDestroy(() => {
    if (interval) clearInterval(interval);
  });
</script>


<div class="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
  <div class="w-full max-w-2xl">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-4xl font-bold">Pomodoro Timer</h1>
      <Drawer.Root>
        <Drawer.Trigger>
          <Button variant="outline" size="icon">
            <Settings class="h-5 w-5" />
          </Button>
        </Drawer.Trigger>
        <Drawer.Content>
          <div class="mx-auto w-full max-w-sm">
            <Drawer.Header>
              <Drawer.Title>Settings & Tasks</Drawer.Title>
              <Drawer.Description>Customize your timer and manage your session tasks</Drawer.Description>
            </Drawer.Header>
            <div class="p-4 pb-0 space-y-6">
              <!-- Timer Settings -->
              <div class="space-y-4">
                <h3 class="font-semibold text-lg">Timer Duration</h3>
                <div class="space-y-2">
                  <Label for="pomodoro">Pomodoro (minutes)</Label>
                  <Input 
                    id="pomodoro" 
                    type="number" 
                    bind:value={pomodoroDuration}
                    min="1"
                    max="60"
                  />
                </div>
                <div class="space-y-2">
                  <Label for="break">Break (minutes)</Label>
                  <Input 
                    id="break" 
                    type="number" 
                    bind:value={breakDuration}
                    min="1"
                    max="30"
                  />
                </div>
                <Button onclick={applySettings} class="w-full">Apply Settings</Button>
              </div>

              <!-- Checklist -->
              <div class="space-y-4">
                <h3 class="font-semibold text-lg">Session Tasks</h3>
                <div class="flex gap-2">
                  <Input 
                    placeholder="Add a task..." 
                    bind:value={newTaskText}
                    onkeydown={(e) => e.key === 'Enter' && addTask()}
                  />
                  <Button onclick={addTask} size="icon">
                    <Plus class="h-4 w-4" />
                  </Button>
                </div>
                <div class="space-y-2 max-h-64 overflow-y-auto">
                  {#each tasks as task (task.id)}
                    <div class="flex items-center gap-2 p-2 rounded border">
                      <Checkbox 
                        checked={task.completed}
                        onCheckedChange={() => toggleTask(task.id)}
                      />
                      <span class="flex-1 {task.completed ? 'line-through text-muted-foreground' : ''}">
                        {task.text}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onclick={() => deleteTask(task.id)}
                      >
                        <Trash2 class="h-4 w-4" />
                      </Button>
                    </div>
                  {/each}
                  {#if tasks.length === 0}
                    <p class="text-sm text-muted-foreground text-center py-4">No tasks yet. Add one above!</p>
                  {/if}
                </div>
              </div>
            </div>
            <Drawer.Footer>
              <Drawer.Close>
                <Button variant="outline">Close</Button>
              </Drawer.Close>
            </Drawer.Footer>
          </div>
        </Drawer.Content>
      </Drawer.Root>
    </div>

    <div class="text-center">
      <div class="text-7xl font-mono mb-8">
        {formatTime(time)}
      </div>
      <div class="flex justify-center space-x-4 mb-4">
        {#if !isRunning}
          <Button onclick={startTimer} variant="default" class="px-6 py-3 text-lg">Start</Button>
        {:else}
          <Button onclick={pauseTimer} variant="secondary" class="px-6 py-3 text-lg">Pause</Button>
        {/if}
        <Button onclick={resetTimer} variant="destructive" class="px-6 py-3 text-lg">Reset</Button>
        <Button onclick={toggleMode} variant="outline" class="px-6 py-3 text-lg">
          {isBreak ? 'Work Mode' : 'Break Mode'}
        </Button>
      </div>
      <p class="text-xl">Pomodoros Completed: {pomodoroCount}</p>
      
      {#if tasks.length > 0}
        <div class="mt-8 text-left bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <h3 class="font-semibold mb-2">Quick View</h3>
          <p class="text-sm text-muted-foreground">
            {tasks.filter(t => t.completed).length} of {tasks.length} tasks completed
          </p>
        </div>
      {/if}
    </div>
  </div>
</div>