'use client'

import { Achievement } from '@/lib/achievements'
import { Lock, CheckCircle, Star, Trophy } from 'lucide-react'

interface AchievementTreeProps {
  achievements: Achievement[]
}

interface TreeNode {
  achievement: Achievement
  x: number
  y: number
  dependencies: string[]
}

export function AchievementTree({ achievements }: AchievementTreeProps) {
  // Organizar conquistas por categoria e nível
  const watchAchievements = achievements.filter(a => a.category === 'watch').sort((a, b) => a.requirement - b.requirement)
  const socialAchievements = achievements.filter(a => a.category === 'social').sort((a, b) => a.requirement - b.requirement)
  const exploreAchievements = achievements.filter(a => a.category === 'explore').sort((a, b) => a.requirement - b.requirement)

  const categories = [
    { name: 'Assistir', achievements: watchAchievements, color: 'purple' },
    { name: 'Social', achievements: socialAchievements, color: 'blue' },
    { name: 'Explorar', achievements: exploreAchievements, color: 'green' },
  ]

  const getNodeStyle = (unlocked: boolean, color: string) => {
    if (unlocked) {
      return `bg-gradient-to-br from-${color}-500 to-${color}-700 border-${color}-400 shadow-lg shadow-${color}-500/50`
    }
    return 'bg-gray-800 border-gray-700'
  }

  const getProgressColor = (color: string) => {
    const colors: Record<string, string> = {
      purple: '#a855f7',
      blue: '#3b82f6',
      green: '#22c55e',
    }
    return colors[color] || colors.purple
  }

  return (
    <div className="space-y-12">
      {categories.map((category, categoryIndex) => (
        <div key={categoryIndex} className="relative">
          {/* Título da Categoria */}
          <div className="flex items-center gap-3 mb-8">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${category.color}-500 to-${category.color}-700 flex items-center justify-center`}>
              {category.name === 'Assistir' && <Star className="w-6 h-6 text-white" />}
              {category.name === 'Social' && <Trophy className="w-6 h-6 text-white" />}
              {category.name === 'Explorar' && <CheckCircle className="w-6 h-6 text-white" />}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">{category.name}</h3>
              <p className="text-sm text-gray-400">
                {category.achievements.filter(a => a.unlocked).length} de {category.achievements.length} conquistadas
              </p>
            </div>
          </div>

          {/* Linha de Progresso */}
          <div className="relative mb-8">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-800 -translate-y-1/2" />
            <div
              className="absolute top-1/2 left-0 h-1 -translate-y-1/2 transition-all duration-700"
              style={{
                width: `${(category.achievements.filter(a => a.unlocked).length / category.achievements.length) * 100}%`,
                background: `linear-gradient(to right, ${getProgressColor(category.color)}, ${getProgressColor(category.color)}80)`,
                boxShadow: `0 0 20px ${getProgressColor(category.color)}80`,
              }}
            />

            {/* Nós das Conquistas */}
            <div className="relative flex justify-between items-center">
              {category.achievements.map((achievement, index) => {
                const progress = (achievement.progress / achievement.requirement) * 100
                const isNext = !achievement.unlocked && index === category.achievements.findIndex(a => !a.unlocked)

                return (
                  <div key={achievement.id} className="relative group">
                    {/* Linha de Conexão para o próximo */}
                    {index < category.achievements.length - 1 && (
                      <div className="absolute top-1/2 left-full w-full h-1 bg-gray-800 -translate-y-1/2 z-0" />
                    )}

                    {/* Nó da Conquista */}
                    <div
                      className={`
                        relative z-10 w-16 h-16 rounded-full border-4 flex items-center justify-center
                        transition-all duration-300 cursor-pointer
                        ${achievement.unlocked
                          ? `bg-gradient-to-br from-${category.color}-500 to-${category.color}-700 border-${category.color}-400`
                          : 'bg-gray-800 border-gray-700'
                        }
                        ${isNext ? 'ring-4 ring-yellow-400/50' : ''}
                        hover:scale-110
                      `}
                    >
                      {achievement.unlocked ? (
                        <CheckCircle className="w-8 h-8 text-white" />
                      ) : (
                        <Lock className="w-8 h-8 text-gray-500" />
                      )}

                      {/* Barra de Progresso para conquista não desbloqueada */}
                      {!achievement.unlocked && progress > 0 && (
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20">
                          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r from-${category.color}-500 to-${category.color}-600 transition-all duration-500`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                      <div className="glass-effect border border-purple-500/30 rounded-xl p-4 w-64 shadow-2xl">
                        <div className="flex items-start gap-3 mb-2">
                          <div className={`text-3xl ${achievement.unlocked ? '' : 'grayscale'}`}>
                            {achievement.icon}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-white text-sm">{achievement.title}</h4>
                            <p className="text-xs text-gray-400 mt-1">{achievement.description}</p>
                          </div>
                        </div>

                        {achievement.unlocked ? (
                          <div className="flex items-center gap-2 text-xs text-green-400 mt-3">
                            <CheckCircle className="w-4 h-4" />
                            <span className="font-semibold">Conquistado!</span>
                          </div>
                        ) : (
                          <div className="mt-3 space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Progresso</span>
                              <span className="text-white font-semibold">
                                {achievement.progress} / {achievement.requirement}
                              </span>
                            </div>
                            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full bg-gradient-to-r from-${category.color}-500 to-${category.color}-600 transition-all duration-500`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            {isNext && (
                              <p className="text-xs text-yellow-400 font-semibold mt-2">
                                ⭐ Próxima conquista!
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
