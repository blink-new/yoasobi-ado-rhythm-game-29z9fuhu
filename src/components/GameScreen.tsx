import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Pause, Play, AlertTriangle, Volume2 } from 'lucide-react'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import { Card } from './ui/card'

interface Song {
  id: string
  title: string
  artist: string
  difficulty: 'Easy' | 'Normal' | 'Hard'
  bpm: number
  duration: string
  color: string
  audioUrl?: string
}

interface Note {
  id: string
  lane: number
  timing: number
  hit: boolean
  missed?: boolean
}

interface GameScreenProps {
  song: Song
  onExit: () => void
}

const LANES = 4
const NOTE_SPEED = 2
const HIT_ZONE_Y = 550
const MISS_THRESHOLD = 650

export default function GameScreen({ song, onExit }: GameScreenProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [gameTime, setGameTime] = useState(0)
  const [activeKeys, setActiveKeys] = useState<Set<number>>(new Set())
  const [missCount, setMissCount] = useState(0)
  const [isGameOver, setIsGameOver] = useState(false)
  const [showHitEffect, setShowHitEffect] = useState<{ lane: number; type: 'perfect' | 'good' | 'miss' } | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const gameLoopRef = useRef<number | null>(null)

  // Generate notes pattern based on song BPM
  const generateNotes = useCallback(() => {
    const notePattern: Note[] = []
    const beatInterval = 60000 / song.bpm // ms per beat
    const totalBeats = 60 // About 1 minute of gameplay
    
    for (let beat = 0; beat < totalBeats; beat++) {
      // Create varying patterns based on difficulty
      const notesPerBeat = song.difficulty === 'Hard' ? Math.random() > 0.3 ? 2 : 1 
                          : song.difficulty === 'Normal' ? Math.random() > 0.5 ? 2 : 1 
                          : 1
      
      for (let i = 0; i < notesPerBeat; i++) {
        notePattern.push({
          id: `${beat}-${i}`,
          lane: Math.floor(Math.random() * LANES),
          timing: beat * beatInterval + (i * beatInterval / notesPerBeat),
          hit: false,
          missed: false
        })
      }
    }
    
    return notePattern
  }, [song.bpm, song.difficulty])

  // Initialize notes
  useEffect(() => {
    setNotes(generateNotes())
  }, [generateNotes])

  // Initialize audio
  useEffect(() => {
    if (song.audioUrl) {
      audioRef.current = new Audio(song.audioUrl)
      audioRef.current.volume = 0.5
      
      // Wait for user interaction to play audio
      const playAudio = () => {
        if (audioRef.current && !isPaused) {
          audioRef.current.play().catch(() => {
            console.log("Audio autoplay prevented, will play on first user interaction")
          })
        }
      }
      
      playAudio()
      
      return () => {
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current.src = ''
        }
      }
    }
  }, [song.audioUrl])

  // Handle pause/resume
  useEffect(() => {
    if (!audioRef.current) return
    
    if (isPaused) {
      audioRef.current.pause()
    } else if (!isGameOver) {
      audioRef.current.play().catch(() => {
        // Silently handle if audio can't play
      })
    }
  }, [isPaused, isGameOver])

  // Game loop
  useEffect(() => {
    if (isPaused || isGameOver) {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
      return
    }

    let lastTime = performance.now()
    
    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastTime
      lastTime = currentTime
      
      setGameTime(prev => prev + deltaTime)
      
      // Check for missed notes
      setNotes(prevNotes => {
        return prevNotes.map(note => {
          const noteY = (gameTime - note.timing) * NOTE_SPEED / 16
          if (noteY > MISS_THRESHOLD && !note.hit && !note.missed) {
            setMissCount(prev => {
              const newCount = prev + 1
              if (newCount >= 10) {
                setIsGameOver(true)
              }
              return newCount
            })
            setCombo(0)
            return { ...note, missed: true }
          }
          return note
        })
      })
      
      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }
    
    gameLoopRef.current = requestAnimationFrame(gameLoop)
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }
  }, [isPaused, isGameOver, gameTime])

  // Handle game over
  useEffect(() => {
    if (isGameOver && audioRef.current) {
      audioRef.current.pause()
    }
  }, [isGameOver])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver) return
      
      const keyMap: { [key: string]: number } = {
        'd': 0, 'f': 1, 'j': 2, 'k': 3
      }
      
      const lane = keyMap[e.key.toLowerCase()]
      if (lane !== undefined && !activeKeys.has(lane)) {
        setActiveKeys(prev => new Set([...prev, lane]))
        hitNote(lane)
      }
      
      if (e.key === ' ') {
        e.preventDefault()
        setIsPaused(prev => !prev)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const keyMap: { [key: string]: number } = {
        'd': 0, 'f': 1, 'j': 2, 'k': 3
      }
      
      const lane = keyMap[e.key.toLowerCase()]
      if (lane !== undefined) {
        setActiveKeys(prev => {
          const newSet = new Set(prev)
          newSet.delete(lane)
          return newSet
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [activeKeys, isGameOver])

  const hitNote = (lane: number) => {
    const currentNotes = notes.filter(note => 
      note.lane === lane && 
      !note.hit && 
      !note.missed
    )
    
    let closestNote = null
    let closestDistance = Infinity
    
    currentNotes.forEach(note => {
      const noteY = (gameTime - note.timing) * NOTE_SPEED / 16
      const distance = Math.abs(noteY - HIT_ZONE_Y)
      if (distance < closestDistance && distance < 100) {
        closestDistance = distance
        closestNote = note
      }
    })
    
    if (closestNote) {
      setNotes(prev => prev.map(note => 
        note.id === closestNote.id ? { ...note, hit: true } : note
      ))
      
      // Score based on accuracy
      let points = 0
      let hitType: 'perfect' | 'good' = 'good'
      
      if (closestDistance < 30) {
        points = 300
        hitType = 'perfect'
      } else {
        points = 100
      }
      
      setScore(prev => prev + points)
      setCombo(prev => {
        const newCombo = prev + 1
        setMaxCombo(max => Math.max(max, newCombo))
        return newCombo
      })
      setMissCount(0)
      
      // Show hit effect
      setShowHitEffect({ lane, type: hitType })
      setTimeout(() => setShowHitEffect(null), 300)
    } else {
      // Miss
      setShowHitEffect({ lane, type: 'miss' })
      setTimeout(() => setShowHitEffect(null), 300)
    }
  }

  const getActiveNotes = () => {
    return notes.filter(note => {
      const noteY = (gameTime - note.timing) * NOTE_SPEED / 16
      return noteY > -50 && noteY < 700 && !note.hit && !note.missed
    })
  }

  const restartGame = () => {
    setScore(0)
    setCombo(0)
    setMaxCombo(0)
    setMissCount(0)
    setGameTime(0)
    setIsGameOver(false)
    setNotes(generateNotes())
    setIsPaused(false)
    
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    }
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${song.color} relative overflow-hidden`}>
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Header */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 p-4 flex items-center justify-between"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onExit}
          className="text-white hover:bg-white/20"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <div className="text-center">
          <h2 className="text-xl font-bold text-white">{song.title}</h2>
          <p className="text-white/80 text-sm">{song.artist}</p>
        </div>
        
        <div className="flex items-center gap-2">
          {!song.audioUrl && (
            <Volume2 className="w-4 h-4 text-yellow-400" />
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPaused(!isPaused)}
            className="text-white hover:bg-white/20"
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </Button>
        </div>
      </motion.header>

      {/* Game Stats */}
      <div className="relative z-10 px-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <div className="text-white">
            <span className="text-2xl font-bold">{score.toLocaleString()}</span>
            <span className="text-white/80 ml-2">pts</span>
          </div>
          <div className="text-white text-center">
            <span className="text-lg">Combo: </span>
            <span className="text-2xl font-bold text-yellow-400">{combo}</span>
          </div>
          <div className="text-white text-right">
            <span className="text-lg">Miss: </span>
            <span className={`text-2xl font-bold ${missCount >= 7 ? 'text-red-400' : 'text-white'}`}>
              {missCount}/10
            </span>
          </div>
        </div>
        <Progress value={(gameTime / 60000) * 100} className="h-2" />
        
        {/* Warning when close to game over */}
        {missCount >= 7 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 mt-2 text-red-400"
          >
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-bold">Danger! {10 - missCount} misses left!</span>
          </motion.div>
        )}
      </div>

      {/* Game Area */}
      <div className="relative z-10 h-[600px] mx-auto max-w-md">
        {/* Lanes */}
        <div className="absolute inset-0 flex">
          {[...Array(LANES)].map((_, index) => (
            <div
              key={index}
              className={`flex-1 border-l border-r border-white/20 ${
                activeKeys.has(index) ? 'bg-white/20' : ''
              } transition-colors duration-75 relative`}
            >
              {/* Lane indicator */}
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-white/10 border-t-2 border-white/50" />
              
              {/* Hit effect */}
              <AnimatePresence>
                {showHitEffect?.lane === index && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 1 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`absolute bottom-14 left-1/2 -translate-x-1/2 text-2xl font-bold ${
                      showHitEffect.type === 'perfect' ? 'text-yellow-400' :
                      showHitEffect.type === 'good' ? 'text-green-400' :
                      'text-red-400'
                    }`}
                  >
                    {showHitEffect.type === 'perfect' ? 'Perfect!' :
                     showHitEffect.type === 'good' ? 'Good!' :
                     'Miss!'}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Hit Zone */}
        <div 
          className="absolute left-0 right-0 h-4 bg-yellow-400/50 border-y-2 border-yellow-400"
          style={{ top: HIT_ZONE_Y }}
        />

        {/* Notes */}
        <AnimatePresence>
          {getActiveNotes().map((note) => {
            const noteY = (gameTime - note.timing) * NOTE_SPEED / 16
            return (
              <motion.div
                key={note.id}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ 
                  exit: { duration: 0.2 }
                }}
                className="absolute w-20 h-8 bg-gradient-to-b from-pink-400 to-purple-600 rounded-lg shadow-lg border border-white/20"
                style={{
                  left: `${(note.lane * 100 / LANES) + (100 / LANES - 20) / 2}%`,
                  top: noteY,
                }}
              />
            )
          })}
        </AnimatePresence>
      </div>

      {/* Controls Help */}
      <div className="relative z-10 text-center mt-4">
        <div className="flex justify-center gap-8 text-white/80 text-sm">
          <div className="font-bold">D</div>
          <div className="font-bold">F</div>
          <div className="font-bold">J</div>
          <div className="font-bold">K</div>
        </div>
        <p className="text-white/60 text-xs mt-2">Use D-F-J-K keys to hit notes • SPACE to pause</p>
      </div>

      {/* Pause Overlay */}
      <AnimatePresence>
        {isPaused && !isGameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 flex items-center justify-center z-20"
          >
            <div className="text-center">
              <h3 className="text-3xl font-bold text-white mb-4">Paused</h3>
              <Button
                onClick={() => setIsPaused(false)}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Resume
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Overlay */}
      <AnimatePresence>
        {isGameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 flex items-center justify-center z-20"
          >
            <Card className="bg-black/50 border-red-500/50 p-8 max-w-md w-full mx-4">
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                >
                  <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                </motion.div>
                
                <h3 className="text-3xl font-bold text-white mb-2">Game Over!</h3>
                <p className="text-white/80 mb-6">You missed 10 notes in a row</p>
                
                <div className="space-y-2 mb-6">
                  <div className="text-white">
                    <span className="text-gray-400">Final Score: </span>
                    <span className="text-2xl font-bold">{score.toLocaleString()}</span>
                  </div>
                  <div className="text-white">
                    <span className="text-gray-400">Max Combo: </span>
                    <span className="text-xl font-bold text-yellow-400">{maxCombo}</span>
                  </div>
                </div>
                
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={restartGame}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                  >
                    Try Again
                  </Button>
                  <Button
                    onClick={onExit}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Back to Menu
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}