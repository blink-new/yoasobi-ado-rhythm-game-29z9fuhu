import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Music, Star, Headphones, Info } from 'lucide-react'
import { Button } from './components/ui/button'
import { Card, CardContent } from './components/ui/card'
import { Badge } from './components/ui/badge'
import GameScreen from './components/GameScreen'

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

const songs: Song[] = [
  {
    id: 'idol',
    title: 'Idol',
    artist: 'YOASOBI',
    difficulty: 'Normal',
    bpm: 120,
    duration: '3:17',
    color: 'from-pink-500 to-purple-600',
    // audioUrl: '/audio/idol.mp3'
  },
  {
    id: 'monster',
    title: 'Monster',
    artist: 'YOASOBI',
    difficulty: 'Hard',
    bpm: 140,
    duration: '3:02',
    color: 'from-red-500 to-orange-600',
    // audioUrl: '/audio/monster.mp3'
  },
  {
    id: 'racing',
    title: 'Racing Into The Night',
    artist: 'YOASOBI',
    difficulty: 'Normal',
    bpm: 150,
    duration: '3:24',
    color: 'from-blue-500 to-cyan-600',
    // audioUrl: '/audio/racing.mp3'
  },
  {
    id: 'usseewa',
    title: 'Usseewa',
    artist: 'Ado',
    difficulty: 'Hard',
    bpm: 132,
    duration: '3:14',
    color: 'from-yellow-500 to-red-500',
    // audioUrl: '/audio/usseewa.mp3'
  },
  {
    id: 'aishite',
    title: 'Aishite',
    artist: 'Ado',
    difficulty: 'Easy',
    bpm: 108,
    duration: '3:33',
    color: 'from-green-500 to-teal-600',
    // audioUrl: '/audio/aishite.mp3'
  },
]

function App() {
  const [selectedSong, setSelectedSong] = useState<Song | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const highScores: Record<string, number> = {}

  const startGame = (song: Song) => {
    setSelectedSong(song)
    setIsPlaying(true)
  }

  const exitGame = () => {
    setIsPlaying(false)
    setSelectedSong(null)
  }

  if (isPlaying && selectedSong) {
    return <GameScreen song={selectedSong} onExit={exitGame} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 text-white">
      {/* Header */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="p-6 text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          <Headphones className="w-8 h-8 text-pink-400" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            J-Rhythm
          </h1>
        </div>
        <p className="text-gray-300">Experience Japanese music like never before</p>
      </motion.header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        {/* Stats Bar */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center gap-8 mb-8 p-4 bg-black/30 rounded-xl backdrop-blur-sm"
        >
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-gray-300">5 Songs Available</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            <span className="text-sm text-gray-300">Best Score: {Math.max(...Object.values(highScores), 0).toLocaleString()}</span>
          </div>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg"
        >
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 mt-1" />
            <div className="text-sm text-gray-300">
              <p className="mb-1"><strong>How to play:</strong> Use D-F-J-K keys to hit the notes as they reach the yellow zone.</p>
              <p>Get <span className="text-yellow-400">Perfect</span> hits for maximum points! Miss 10 notes in a row and it's game over!</p>
            </div>
          </div>
        </motion.div>

        {/* Song Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {songs.map((song, index) => (
            <motion.div
              key={song.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="bg-black/40 border-gray-700 hover:border-gray-600 transition-all duration-300 overflow-hidden group">
                <div className={`h-32 bg-gradient-to-br ${song.color} relative`}>
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
                  <div className="absolute top-3 right-3">
                    <Badge variant="secondary" className="bg-black/50 text-white">
                      {song.difficulty}
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <div className="text-white/80 text-sm">{song.duration}</div>
                  </div>
                  {!song.audioUrl && (
                    <div className="absolute top-3 left-3">
                      <Badge variant="secondary" className="bg-yellow-500/50 text-white">
                        No Audio
                      </Badge>
                    </div>
                  )}
                </div>
                
                <CardContent className="p-4">
                  <h3 className="font-bold text-lg mb-1 text-white group-hover:text-pink-300 transition-colors">
                    {song.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-3">{song.artist}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-xs text-gray-500">
                      BPM: {song.bpm}
                    </div>
                    <div className="text-xs text-gray-500">
                      Best: {highScores[song.id]?.toLocaleString() || '0'}
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => startGame(song)}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition-all duration-300"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Play
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <motion.footer 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12 text-gray-500 text-sm"
        >
          <p>Built with ❤️ for Japanese music lovers</p>
          <p className="mt-2 text-xs">Note: Audio files not included. Add your own MP3 files to /public/audio/</p>
        </motion.footer>
      </div>
    </div>
  )
}

export default App