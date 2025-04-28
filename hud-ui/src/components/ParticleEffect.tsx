import { useRef, useEffect } from 'react';

interface ParticleEffectProps {
  containerId: string;
  particleCount?: number;
  color?: string;
  size?: number;
  speed?: number;
  opacity?: number;
}

export default function ParticleEffect({
  containerId,
  particleCount = 25,
  color = '#00e0ff',
  size = 2,
  speed = 0.5,
  opacity = 0.3
}: ParticleEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<any[]>([]);
  const animationFrameRef = useRef<number>(0);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
      initParticles();
    });
    
    resizeObserver.observe(container);
    
    const updateCanvasSize = () => {
      if (!canvas || !container) return;
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
    };
    
    const initParticles = () => {
      if (!canvas) return;
      particles.current = [];
      
      for (let i = 0; i < particleCount; i++) {
        particles.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * size + 0.5,
          speedX: (Math.random() - 0.5) * speed,
          speedY: (Math.random() - 0.5) * speed,
          opacity: Math.random() * opacity + 0.1
        });
      }
    };
    
    const drawParticles = () => {
      if (!ctx || !canvas) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.current.forEach(particle => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = color + Math.floor(particle.opacity * 255).toString(16).padStart(2, '0');
        ctx.fill();
        
        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // Boundary check and bounce
        if (particle.x < 0 || particle.x > canvas.width) {
          particle.speedX *= -1;
        }
        
        if (particle.y < 0 || particle.y > canvas.height) {
          particle.speedY *= -1;
        }
      });
      
      animationFrameRef.current = requestAnimationFrame(drawParticles);
    };
    
    updateCanvasSize();
    initParticles();
    drawParticles();
    
    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [containerId, particleCount, color, size, speed, opacity]);
  
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
      style={{ opacity }}
    />
  );
}
