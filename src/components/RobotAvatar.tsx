import { motion } from 'framer-motion';
import avatarImage from '../images/avatar.png';

function RobotAvatar() {
  return (
    <motion.div
      className="relative"
      animate={{
        y: [0, -40, 0],  // Floats up and down (more pronounced movement)
      }}
      transition={{
        duration: 2,  // Faster cycle to make it more noticeable
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <motion.div
        className="w-48 h-48 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 shadow-2xl flex items-center justify-center relative overflow-hidden"
        animate={{
          boxShadow: [
            '0 0 20px hsla(263, 70%, 64%, 0.5)',
            '0 0 40px hsla(263, 70%, 64%, 0.8)',
            '0 0 20px hsla(263, 70%, 64%, 0.5)',
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <img 
          src={avatarImage} 
          alt="AI Assistant Avatar" 
          className="w-full h-full object-cover rounded-full"
        />
        
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-cyan-400/20 rounded-full"></div>
      </motion.div>
      
      {/* Orbital rings */}
      <motion.div
        className="absolute inset-0 border-2 border-cyan-400 rounded-full opacity-30"
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Status Indicator */}
      <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full animate-pulse flex items-center justify-center">
        <div className="w-2 h-2 bg-white rounded-full"></div>
      </div>
      
      {/* Floating Particles */}
      <div className="absolute -top-4 -left-4 w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
      <div className="absolute -bottom-4 -right-4 w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
      <div className="absolute top-1/2 -left-6 w-1 h-1 bg-purple-300 rounded-full animate-pulse"></div>
    </motion.div>
  );
}

export default RobotAvatar;
