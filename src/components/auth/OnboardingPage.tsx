import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { GraduationCap, BookOpen, PenTool, Briefcase, Users, ArrowRight } from 'lucide-react'

const roles = [
  {
    id: 'student' as const,
    title: 'Student',
    description: 'Manage assignments, projects, and study schedules',
    icon: GraduationCap,
    color: 'from-blue-500 to-blue-600',
    features: ['Assignment tracking', 'Study schedules', 'Grade management']
  },
  {
    id: 'teacher' as const,
    title: 'Teacher',
    description: 'Organize lesson plans, track student progress, and manage curriculum',
    icon: BookOpen,
    color: 'from-green-500 to-green-600',
    features: ['Lesson planning', 'Student tracking', 'Curriculum management']
  },
  {
    id: 'writer' as const,
    title: 'Writer',
    description: 'Track writing projects, deadlines, and creative workflows',
    icon: PenTool,
    color: 'from-purple-500 to-purple-600',
    features: ['Project tracking', 'Deadline management', 'Creative workflows']
  },
  {
    id: 'freelancer' as const,
    title: 'Freelancer',
    description: 'Manage client projects, invoices, and business development',
    icon: Briefcase,
    color: 'from-orange-500 to-orange-600',
    features: ['Client management', 'Project tracking', 'Invoice organization']
  },
  {
    id: 'project_manager' as const,
    title: 'Project Manager',
    description: 'Coordinate teams, track milestones, and manage resources',
    icon: Users,
    color: 'from-red-500 to-red-600',
    features: ['Team coordination', 'Milestone tracking', 'Resource management']
  }
]

type RoleId = (typeof roles)[number]['id']

export function OnboardingPage() {
  const { updateProfile, refetchProfile } = useAuth()
  const [selectedRole, setSelectedRole] = useState<RoleId | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleRoleSelect = async () => {
    if (!selectedRole) return

    setIsUpdating(true)

    try {
      await updateProfile({
        role: selectedRole,
        onboarded: true
      })

      await refetchProfile()
    } catch (error) {
      alert(
        `Failed to complete onboarding: ${
          error instanceof Error ? error.message : 'Unknown error'
        }. Please try again.`
      )
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Role</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We&apos;ll customize your workspace with templates and features tailored to your work
            style
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {roles.map((role) => {
            const Icon = role.icon
            const isSelected = selectedRole === role.id

            return (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                disabled={isUpdating}
                className={`p-6 rounded-2xl border-2 transition-all duration-200 text-left ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${role.color} mb-4`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-2">{role.title}</h3>

                <p className="text-gray-600 mb-4">{role.description}</p>

                <ul className="space-y-1">
                  {role.features.map((feature, index) => (
                    <li key={index} className="text-sm text-gray-500 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </button>
            )
          })}
        </div>

        {selectedRole && (
          <div className="text-center">
            <button
              onClick={handleRoleSelect}
              disabled={isUpdating}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isUpdating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Setting up...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
