import { useAuth } from '../../contexts/AuthContext'
import { Plus, BookOpen, GraduationCap, PenTool, Briefcase, Users } from 'lucide-react'

const roleTemplates = {
  student: {
    icon: GraduationCap,
    templates: [
      { name: 'Study Planner', description: 'Track assignments, exams, and study sessions' },
      { name: 'Project Management', description: 'Organize group projects and deadlines' },
      { name: 'Course Tracker', description: 'Monitor progress across all your courses' }
    ]
  },
  teacher: {
    icon: BookOpen,
    templates: [
      { name: 'Lesson Planning', description: 'Plan and organize your curriculum' },
      { name: 'Student Progress', description: 'Track student assignments and grades' },
      { name: 'Class Management', description: 'Manage classroom activities and events' }
    ]
  },
  writer: {
    icon: PenTool,
    templates: [
      { name: 'Writing Projects', description: 'Track articles, books, and creative works' },
      { name: 'Editorial Calendar', description: 'Plan and schedule your content' },
      { name: 'Research Board', description: 'Organize research and reference materials' }
    ]
  },
  freelancer: {
    icon: Briefcase,
    templates: [
      { name: 'Client Projects', description: 'Manage client work and deliverables' },
      { name: 'Business Development', description: 'Track leads and opportunities' },
      { name: 'Invoice Tracker', description: 'Monitor payments and finances' }
    ]
  },
  project_manager: {
    icon: Users,
    templates: [
      { name: 'Sprint Planning', description: 'Organize agile development cycles' },
      { name: 'Team Coordination', description: 'Track team tasks and milestones' },
      { name: 'Resource Management', description: 'Monitor resources and budgets' }
    ]
  }
}

export function EmptyState() {
  const { profile } = useAuth()
  
  if (!profile?.role) return null

  const roleData = roleTemplates[profile.role]
  const Icon = roleData.icon

  return (
    <div className="min-h-full flex items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <div className="inline-flex p-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl mb-4">
            <Icon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to your {profile.role} workspace!
          </h1>
          <p className="text-gray-600 text-lg">
            Get started with a template designed for your role, or create a custom board
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {roleData.templates.map((template, index) => (
            <button
              key={index}
              className="p-6 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 text-left"
            >
              <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
              <p className="text-sm text-gray-600">{template.description}</p>
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200">
            <Plus className="h-5 w-5" />
            Create Custom Board
          </button>
          <button className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium hover:border-gray-300 hover:bg-gray-50 transition-all duration-200">
            Browse Templates
          </button>
        </div>
      </div>
    </div>
  )
}
