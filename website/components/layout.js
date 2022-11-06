import Link from 'next/link';
import Head from 'next/head';
import styles from '../styles/Layout.module.css'

export default function RootLayout({children}) {
  return (<>
      <Head>
        <title>Jay • A dynamic, object oriented, prototype based language that compiles to JavaScript</title>
        <meta name="description" content="Home of the Jay programming language. A dynamic, object oriented, prototype based language that compiles to JavaScript." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.container}>

        <header className={styles.header}>
          <h1 className={styles.title}>
            Jay
          </h1>

          <nav className={styles.nav}>
            <ul>
              <li><Link href="/">Overview</Link></li>
              <li><Link href="/docs/expressions">Expressions</Link></li>
              <li><Link href="/docs/objects">Objects</Link></li>
              <li><Link href="/repl">Try</Link></li>
            </ul>
          </nav>
        </header>

        <main className={styles.main}>
          {children}
        </main>

        <footer className={styles.footer}>
          <a href="http://github.com/boucher/jay">Source</a> • Created by <a href="https://twitter.com/boucher">Ross Boucher</a> • Based on <a href="http://finch.stuffwithstuff.com/">Finch</a> by <a href="https://twitter.com/munificentbob">Bob Nystrom</a>
        </footer>

      </div>
    </>)
}
