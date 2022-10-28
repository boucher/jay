import Link from 'next/link';

import './globals.css'
import styles from './layout.module.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <title>Jay • A dynamic, object oriented, prototype based language that compiles to JavaScript</title>
        <meta name="description" content="Home of the Jay programming language. A dynamic, object oriented, prototype based language that compiles to JavaScript." />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>

        <div className={styles.container}>

          <header className={styles.header}>

            <h1 className={styles.title}>
              Jay
            </h1>

            <nav className={styles.nav}>
              <ul>
                <li><Link href="/">Overview</Link></li>
                <li><Link href="/expressions">Expressions</Link></li>
                <li><Link href="/objects">Objects</Link></li>
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
    
        </body>
    </html>
  )
}
