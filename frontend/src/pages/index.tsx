import Head from 'next/head';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>Reddit Clone</title>
        <meta
          name="description"
          content="A Reddit clone built with Next.js and Express"
        />
      </Head>

      <main>
        <h1>Welcome</h1>
        <hr />
        <a href="/login">Login</a>
      </main>
    </div>
  );
}
