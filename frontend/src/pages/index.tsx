import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAppSelector } from '../store/hooks';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector(state => state.auth);
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/feed');
    } else {
      router.push('/login');
    }
  }, []);
  return <></>;
}
