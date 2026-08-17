'use client'

import { Achievement } from '@/lib/achievements'
import { CheckCircle, Lock, Star, Trophy } from 'lucide-react'

interface AchievementTreeProps {
  achievements: Achievement[]
}

const COLOR_STYLES: Record<string, { from: string; to: string; border: string; shadow: string }> = {
  purple: { from: '#a855f7', to: '#7c3aed', border: '#c084fc', shadow: '#a855f7' },
  blue: { from: '#3b82f6', to: '#2563eb', border: '#60a5fa', shadow: '#3b82f6' },
  green: { from: '#22c55e', to: '#16a34a', border: '#4ade80', shadow: '#22c55e' },
}

export function AchievementTree({ achievements }: AchievementTreeProps) {
  const categories = [
    {
      name: 'Assistir',
      achievements: achievements.filter((item) => item.category === 'watch').sort((a, b) => a.requirement - b.requirement),
      color: 'purple',
    },
    {
      name: 'Social',
      achievements: achievements.filter((item) => item.category === 'social').sort((a, b) => a.requirement - b.requirement),
      color: 'blue',
    },
    {
      name: 'Explorar',
      achievements: achievements.filter((item) => item.category === 'explore').sort((a, b) => a.requirement - b.requirement),
      color: 'green',
    },
  ].filter((category) => category.achievements.length > 0)

  return (
    <div className="min-w-0 space-y-10 sm:space-y-12">
      {categories.map((category) => {
        const unlockedCount = category.achievements.filter((item) => item.unlocked).length
        const nextAchievementIndex = category.achievements.findIndex((item) => !item.unlocked)
        const color = COLOR_STYLES[category.color] || COLOR_STYLES.purple

        return (
          <section key={category.name} className="relative min-w-0">
            <div className="mb-6 flex items-center gap-3 sm:mb-8">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12"
                style={{ background: `linear-gradient(to bottom right, ${color.from}, ${color.to})` }}
              >
                {category.name === 'Assistir' && <Star className="h-5 w-5 text-white sm:h-6 sm:w-6" />}
                {category.name === 'Social' && <Trophy className="h-5 w-5 text-white sm:h-6 sm:w-6" />}
                {category.name === 'Explorar' && <CheckCircle className="h-5 w-5 text-white sm:h-6 sm:w-6" />}
              </div>
              <div className="min-w-0">
                <h3 className="text-xl font-bold text-white sm:text-2xl">{category.name}</h3>
                <p className="text-xs text-gray-400 sm:text-sm">
                  {unlockedCount} de {category.achievements.length} conquistadas
                </p>
              </div>
            </div>

            <div className="relative min-w-0 px-0.5 sm:px-1">
              <div className="absolute inset-x-1 top-1/2 h-1 -translate-y-1/2 rounded-full bg-gray-800 sm:inset-x-2" />
              <div
                className="absolute left-1 top-1/2 h-1 -translate-y-1/2 rounded-full transition-all duration-700 sm:left-2"
                style={{
                  width: unlockedCount === 0
                    ? '0'
                    : `calc(${(unlockedCount / category.achievements.length) * 100}% - 0.5rem)`,
                  maxWidth: 'calc(100% - 0.5rem)',
                  background: `linear-gradient(to right, ${color.from}, ${color.from}80)`,
                  boxShadow: `0 0 20px ${color.shadow}80`,
                }}
              />

              <div
                className="relative grid min-w-0 items-center"
                style={{ gridTemplateColumns: `repeat(${category.achievements.length}, minmax(0, 1fr))` }}
              >
                {category.achievements.map((achievement, index) => {
                  const progress = Math.min((achievement.progress / Math.max(achievement.requirement, 1)) * 100, 100)
                  const isNext = !achievement.unlocked && index === nextAchievementIndex

                  return (
                    <div key={achievement.id} className="group relative flex min-w-0 justify-center">
                      <div
                        className={`relative z-10 flex aspect-square w-[min(100%,4rem)] min-w-0 items-center justify-center rounded-full border-[3px] transition-transform duration-300 hover:scale-105 focus:scale-105 focus:outline-none sm:border-4 sm:hover:scale-110 ${
                          achievement.unlocked ? '' : 'border-gray-700 bg-gray-800'
                        } ${isNext ? 'ring-2 ring-yellow-400/50 sm:ring-4' : ''}`}
                        style={achievement.unlocked ? {
                          background: `linear-gradient(to bottom right, ${color.from}, ${color.to})`,
                          borderColor: color.border,
                          boxShadow: `0 10px 25px -5px ${color.shadow}80`,
                        } : undefined}
                        tabIndex={0}
                        aria-label={`${achievement.title}: ${achievement.description}`}
                        title={`${achievement.title} — ${achievement.description}`}
                      >
                        {achievement.unlocked ? (
                          <CheckCircle className="h-[48%] w-[48%] text-white" />
                        ) : (
                          <Lock className="h-[48%] w-[48%] text-gray-500" />
                        )}

                        {!achievement.unlocked && progress > 0 && (
                          <div className="absolute -bottom-2 left-1/2 w-[calc(100%-0.25rem)] -translate-x-1/2">
                            <div className="h-1 overflow-hidden rounded-full bg-gray-800 sm:h-1.5">
                              <div
                                className="h-full transition-all duration-500"
                                style={{
                                  width: `${progress}%`,
                                  background: `linear-gradient(to right, ${color.from}, ${color.from}cc)`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-4 hidden -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 sm:block">
                        <div className="glass-effect w-64 rounded-xl border border-purple-500/30 p-4 shadow-2xl">
                          <div className="mb-2 flex items-start gap-3">
                            <div className={`text-3xl ${achievement.unlocked ? '' : 'grayscale'}`}>{achievement.icon}</div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-bold text-white">{achievement.title}</h4>
                              <p className="mt-1 text-xs text-gray-400">{achievement.description}</p>
                            </div>
                          </div>

                          {achievement.unlocked ? (
                            <div className="mt-3 flex items-center gap-2 text-xs text-green-400">
                              <CheckCircle className="h-4 w-4" />
                              <span className="font-semibold">Conquistado!</span>
                            </div>
                          ) : (
                            <div className="mt-3 space-y-2">
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-400">Progresso</span>
                                <span className="font-semibold text-white">
                                  {achievement.progress} / {achievement.requirement}
                                </span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-gray-800">
                                <div
                                  className="h-full transition-all duration-500"
                                  style={{
                                    width: `${progress}%`,
                                    background: `linear-gradient(to right, ${color.from}, ${color.from}99)`,
                                  }}
                                />
                              </div>
                              {isNext && <p className="mt-2 text-xs font-semibold text-yellow-400">⭐ Próxima conquista!</p>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )
      })}
    </div>
  )
}
