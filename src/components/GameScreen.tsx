import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Pause, Play } from 'lucide-react'
import { Button } from './ui/button'
import { Progress } from './ui/progress'

interface Song {
  id: string
  title: string
  artist: string
  difficulty: 'Easy' | 'Normal' | 'Hard'
  bpm: number
  duration: string
  color: string
}

interface Note {
  id: string
  lane: number
  timing: number
  hit: boolean
}

interface GameScreenProps {
  song: Song
  onExit: () => void
}

const LANES = 4
const NOTE_SPEED = 2
const HIT_ZONE_Y = 550

export default function GameScreen({ song, onExit }: GameScreenProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [gameTime, setGameTime] = useState(0)
  const [activeKeys, setActiveKeys] = useState<Set<number>>(new Set())

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
          hit: false
        })
      }
    }
    
    return notePattern
  }, [song.bpm, song.difficulty])

  // Initialize notes
  useEffect(() => {
    setNotes(generateNotes())
  }, [generateNotes])

  // Game loop
  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      setGameTime(prev => prev + 16) // 60 FPS
    }, 16)

    return () => clearInterval(interval)
  }, [isPaused])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
  }, [activeKeys])

  const hitNote = (lane: number) => {
    const currentNotes = notes.filter(note => 
      note.lane === lane && 
      !note.hit && 
      Math.abs((gameTime - note.timing) + HIT_ZONE_Y / NOTE_SPEED) < 100
    )
    
    if (currentNotes.length > 0) {
      const noteToHit = currentNotes[0]
      setNotes(prev => prev.map(note => 
        note.id === noteToHit.id ? { ...note, hit: true } : note
      ))
      setScore(prev => prev + 100)
      setCombo(prev => prev + 1)
    } else {
      setCombo(0) // Reset combo on miss
    }
  }

  const getActiveNotes = () => {
    return notes.filter(note => {
      const noteY = (gameTime - note.timing) * NOTE_SPEED / 16
      return noteY > -50 && noteY < 700 && !note.hit
    })
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
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsPaused(!isPaused)}
          className="text-white hover:bg-white/20"
        >
          {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </Button>
      </motion.header>

      {/* Game Stats */}
      <div className="relative z-10 px-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <div className="text-white">
            <span className="text-2xl font-bold">{score.toLocaleString()}</span>
            <span className="text-white/80 ml-2">pts</span>
          </div>
          <div className="text-white">
            <span className="text-lg">Combo: </span>
            <span className="text-2xl font-bold text-yellow-400">{combo}</span>
          </div>
        </div>
        <Progress value={(gameTime / 60000) * 100} className="h-2" />
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
              } transition-colors duration-75`}
            >
              {/* Lane indicator */}
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-white/10 border-t-2 border-white/50" />
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
                exit={{ scale: 0.5, opacity: 0 }}
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
          <div>D</div>
          <div>F</div>
          <div>J</div>
          <div>K</div>
        </div>
        <p className="text-white/60 text-xs mt-2">Use D-F-J-K keys to hit notes • SPACE to pause</p>
      </div>

      {/* Pause Overlay */}
      <AnimatePresence>
        {isPaused && (
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
    </div>
  )
}