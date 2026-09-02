import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tenali Exam Publishers - India Post LDCE Exam Materials',
    short_name: 'Tenali Exams',
    description: 'Premier preparation books and study materials for India Post LDCE examinations (MTS, Postman, Mail Guard, PA/SA).',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1a2b4c',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
