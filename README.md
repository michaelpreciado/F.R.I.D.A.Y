# F.R.I.D.A.Y Assistant

A futuristic neural-HUD AI chat interface with immersive design:
1. **Direct API Integration** - Connects directly to the DeepSeek AI API for seamless responses
2. **Mobile Optimized** - Responsive design works beautifully on all device sizes

![F.R.I.D.A.Y Interface](https://i.imgur.com/placeholder.png)

## Features

- 🧠 Powerful AI chat powered by DeepSeek's API
- 🔊 Built-in browser-based text-to-speech
- 🎨 Futuristic blue "neural-HUD" look & feel
- 💻 Fully responsive design for mobile and desktop
- ⚡ Dynamic animated interface with thinking indicators
- 🌐 Zero backend dependency - works entirely in browser

## Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/friday-assistant.git
   cd friday-assistant
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or if using yarn
   yarn
   ```

3. **Configure your API key**:
   Edit `src/services/api.ts` to add your DeepSeek API key

4. **Start the development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open the web interface**:
   Open [http://localhost:5173](http://localhost:5173) in your browser

## Deployment

To build for production deployment:

```bash
npm run build
# or
yarn build
```

The build output will be in the `dist` directory, which can be deployed to any static hosting service like Netlify, Vercel, or GitHub Pages.

### Configuration

The app uses a direct connection to the DeepSeek API. To use your own API key for production, update the `DEEPSEEK_API_KEY` constant in `src/services/api.ts`.

## Styling Guide

The UI uses a futuristic blue neural-HUD theme inspired by sci-fi interfaces:

- **Color Palette**:
  - Neon Blue: `#00e0ff`
  - Dark Blue: `#001a2c`
  - Cyber Black: `#0a0a0a`
  - Neural Gray: `#2a2a3a`

- **3D Background**:
  - The neural network visualization is rendered using React Three Fiber
  - Optimized for mobile with adaptive detail levels
  - Performance settings in `NeonBackground.tsx` can be adjusted based on device capabilities

- **Responsive Design**:
  - Mobile-first approach with Tailwind's responsive classes
  - Adapts to different screen sizes with appropriate spacing and font sizes
  - Dynamic UI elements that scale with the viewport

- **Chat Interface**:
  - Uses glassmorphic panels with backdrop blur
  - Animated thinking indicator during API requests
  - Optimized input handling for mobile and desktop

## Browser Compatibility

The application works best in modern browsers that support:
- Web Speech API for text-to-speech functionality
- WebGL for 3D neural network visualization
- ES6+ JavaScript features

Tested and optimized for:
- Chrome/Edge (latest versions)
- Safari (14+)
- Firefox (88+)
- Mobile browsers (iOS Safari, Chrome for Android)

## Credits

- 3D visualization built with [React Three Fiber](https://github.com/pmndrs/react-three-fiber)
- UI animations powered by [Framer Motion](https://www.framer.com/motion/)
- State management using [Zustand](https://github.com/pmndrs/zustand)
- AI capabilities provided by [DeepSeek AI](https://deepseek.ai)

## Security Notes

- **API Keys**: Never commit your `.env` file with real API keys. Always use the `.env.example` as a template.
- **CORS**: The backend is configured to allow all origins in development mode. In production, restrict this to your frontend URL.
- **HTTPS**: Use the `dev_proxy.sh` script to set up HTTPS for local development.
- **Local-file RAG**: The RAG system only has access to files you explicitly add to the `~/Documents/RAG` directory.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [DeepSeek](https://deepseek.ai/) for their powerful language models
- [Ollama](https://ollama.ai/) for making local LLM deployment easy
- [ElevenLabs](https://elevenlabs.io/) for their realistic text-to-speech API
- [React Three Fiber](https://github.com/pmndrs/react-three-fiber) for 3D rendering capabilities
