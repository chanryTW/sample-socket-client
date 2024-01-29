import { Suspense, lazy } from 'react';
import PublicLayout from '@/layouts/Public';
import PrivateLayout from '@/layouts/Private';
import Page404 from '@/pages/Page404';
import Login from '@/pages/Login';
import Register from '@/pages/Register';

// Page
const Chat = lazy(async () => import('@/pages/Chat'));

const routes = [
  {
    path: '/*',
    element: <Page404 />,
  },
  {
    element: <PublicLayout />,
    children: [
      {
        path: '/',
        index: true,
        element: <Login />,
      },
      {
        path: '/login',
        element: <Login />,
      },
      {
        path: '/register',
        element: <Register />,
      },
    ],
  },
  {
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <PrivateLayout />
      </Suspense>
    ),
    children: [
      {
        path: '/chat',
        element: <Chat />,
      },
    ],
  },
];

export default routes;
