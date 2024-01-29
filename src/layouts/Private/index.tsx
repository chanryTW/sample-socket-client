import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSetAtom } from 'jotai';
import { useCookies } from 'react-cookie';
import { getUser } from '@/service/api.service';
import { userAtom } from '@/states/userAtom';
import Header from './Header';

const Private = () => {
  const setUser = useSetAtom(userAtom);
  const [cookies, setCookie] = useCookies(['isAuth']);
  const { isAuth } = cookies;

  const handleGetUser = async () => {
    try {
      const user = await getUser();
      setUser(user);
    } catch (error) {
      setCookie('isAuth', false);
    }
  };

  useEffect(() => {
    handleGetUser();
  }, [isAuth]);

  if (!isAuth) return <Navigate to="/login"></Navigate>;

  return (
    <>
      <Header />
      <main className="mt-[68px]">
        <Outlet />
      </main>
    </>
  );
};

export default Private;
