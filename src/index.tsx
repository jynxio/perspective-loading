import '@/reset.css';
import '@/index.css';
import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import Scene from '@/Scene';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<Scene />
	</StrictMode>,
);
