import React from 'react';
import ReactDOM from 'react-dom/client';
import { Router } from '../src/router';
import '@elastic/eui/dist/eui_theme_dark.css';

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

root.render(
    <React.StrictMode>
        <Router />
    </React.StrictMode>
);
