'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import parse from 'html-react-parser'

//import { useRouter } from "next/navigation";
//import Router from "next/router";

//import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { uuid } from './../../node_modules/@supabase/supabase-js/dist/module/lib/helpers';


interface Task {
  id: string;
  title: string;
  is_complete: boolean;
  description: string | null;
  title_enriched: string | null;
  description_enriched: string | null;
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [session, setSession] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  //const cookieStore = cookies()
  const supabase = createClient()

  // Fetches tasks on component mount
  const fetchTasks = async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    if (currentSession) {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', currentSession.user.id)
        .order('created_at', { ascending: false })
      if (error) {
        console.error('Error fetching tasks for user with id :'+currentSession.user.id, error)
      } else {
        setTasks(data as Task[])
      }
    }
  }

  // Sets up a real-time listener for task updates
  useEffect(() => {
    const channel = supabase.channel('tasks-realtime-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
      console.log('Realtime change received!', payload)
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        fetchTasks()
      } else if (payload.eventType === 'DELETE') {
        setTasks(currentTasks => currentTasks.filter(task => task.id !== (payload.old as { id: string }).id))
      }
    })
    .subscribe()

    // Clean up the subscription on component unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Checks for the user session on page load
  useEffect(() => {
    const getSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      setSession(currentSession)
      if (currentSession) {
        fetchTasks()
      }
    }
    getSession()
  }, [])

  // --- Auth Handlers ---
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      alert("use has been authorized");

      //const router = useRouter();
      //router.refresh

    } catch (error: any) {
      alert(error.message)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
    } catch (error: any) {
      alert(error.message)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setTasks([])
  }

  // --- Task Handlers ---
  const handleAddTask = async (e: React.FormEvent) => {

    e.preventDefault()
    if (newTaskTitle.trim() === '') return

        try {
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            title: newTaskTitle,
          }),
        })

        console.log("Server response :"+response)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to add new task')
        }

        setNewTaskTitle('')
        fetchTasks()
        
      } catch (error: any) {
        alert(error.message)
      }

  }

  const handleUpdateTask = async (id: string, isComplete: boolean) => {
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    if(currentSession){

        try {

        const response = await fetch('/api/tasks', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, is_complete: isComplete }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update task')
        }

        fetchTasks()

      } catch (error: any) {
        alert(error.message)
      }

    }
    
  }

  const handleDeleteTask = async (id: string) => {

    const { data: { session: currentSession } } = await supabase.auth.getSession()
    if(currentSession){

          try {
          const response = await fetch('/api/tasks', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to delete task')
          }

          fetchTasks()
          
        } catch (error: any) {
          alert(error.message)
        }

    }

    
  }

  // --- UI Rendering ---
  const renderAuthForm = () => (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">Sign In or Sign Up</h2>
      <form onSubmit={handleSignIn} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="••••••••"
          />
        </div>
        <div className="flex justify-between">
          <button
            type="submit"
            className="flex-1 mr-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={handleSignUp}
            className="flex-1 ml-2 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          >
            Sign Up
          </button>
        </div>
      </form>
    </div>
  )

  const renderTodoApp = () => (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Shadow Lights To-Do 
        </h2>
        <button
          onClick={handleSignOut}
          className="bg-red-500 text-white py-1 px-3 rounded-md hover:bg-red-600 transition-colors"
        >
          Sign Out
        </button>
      </div>

      {/* Add New Task Form */}
      <form onSubmit={handleAddTask} className="flex mb-6">
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="Add a new task..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-r-md hover:bg-blue-700 transition-colors"
        >
          Add Task
        </button>
      </form>

      {/* Task List */}
      <div className="space-y-4">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`p-4 rounded-md border border-gray-200 dark:border-gray-700 transition-all duration-300 ${
                task.is_complete ? 'bg-gray-100 dark:bg-gray-700' : 'bg-gray-50 dark:bg-gray-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={task.is_complete}
                    onChange={(e) => handleUpdateTask(task.id, e.target.checked)}
                    className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 dark:bg-gray-600 dark:border-gray-500"
                  />
                  <span
                    className={`ml-3 text-lg font-medium ${
                      task.is_complete
                        ? 'text-gray-500 line-through dark:text-gray-400'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {task.title}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              {task.description_enriched && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  <b>
                  *{parse(task.title_enriched)}*
                  </b><br/>
                  
                    {parse(task.description_enriched)}
                  
                  
                </p>
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400">No tasks yet. Add one above! ✨</p>
        )}
      </div>
    </div>
  )

  
  return (
    <div className="min-h-screen flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      {
      session ? 
      renderTodoApp() : renderAuthForm()
      
      }
    </div>
  )
}