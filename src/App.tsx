import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Music, Star, Headphones } from 'lucide-react'
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
  preview?: string
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
  },
  {
    id: 'monster',
    title: 'Monster',
    artist: 'YOASOBI',
    difficulty: 'Hard',
    bpm: 140,
    duration: '3:02',
    color: 'from-red-500 to-orange-600',
  },
  {
    id: 'racing',
    title: 'Racing Into The Night',
    artist: 'YOASOBI',
    difficulty: 'Normal',
    bpm: 150,
    duration: '3:24',
    color: 'from-blue-500 to-cyan-600',
  },
  {
    id: 'usseewa',
    title: 'Usseewa',
    artist: 'Ado',
    difficulty: 'Hard',
    bpm: 132,
    duration: '3:14',
    color: 'from-yellow-500 to-red-500',
  },
  {
    id: 'aishite',
    title: 'Aishite',
    artist: 'Ado',
    difficulty: 'Easy',
    bpm: 108,
    duration: '3:33',
    color: 'from-green-500 to-teal-600',
  },
]

function App() {
  const [selectedSong, setSelectedSong] = useState<Song | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

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
            <span className="text-sm text-gray-300">Best Score: 0</span>
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
                    <div className="flex items-center gap-1">
                      {[...Array(3)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3 h-3 ${i < 2 ? 'text-yellow-400 fill-current' : 'text-gray-600'}`} 
                        />
                      ))}
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
        </motion.footer>
      </div>
    </div>
  )
}

export default App