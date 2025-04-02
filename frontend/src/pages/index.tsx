import Head from "next/head";

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
        <h1 className="text-3xl font-bold mb-6">Reddit Clone Homepage</h1>
        <p className="mb-4">Welcome to our Reddit clone project!</p>
        <p>
          This is a simple starter page to verify that the Next.js routing is
          working properly.
        </p>
      </main>
    </div>
  );
}
