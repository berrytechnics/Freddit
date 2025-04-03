import { useRouter } from 'next/router';
import { useAppSelector } from '../store/hooks';

export default function Feed() {
  const router = useRouter();
  const { user } = useAppSelector(state => state.auth);

  return (
    <>
      <button
        //style with tailwind classes.
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        onClick={() => {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }}
      >
        logout
      </button>
      <button
        className="m-3 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        onClick={() => router.push('/profile')}
      >
        Profile
      </button>
      <hr />
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </>
  );
}
