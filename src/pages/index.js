import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';

import Heading from '@theme/Heading';
import styles from './index.module.css';

function Section({ className, title, border = false, children }) {
  return (
    <div className={clsx('hero', className)}
      style={{ 
        display: "flex", 
        justifyContent: "space-evenly",
        border: border ? "1px solid #808080" : undefined
      }}
    >
      <Heading as="h1" className="hero__title">
        {title}
      </Heading>
      {children}
    </div>
  )
}

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
      </div>
    </header>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="@dxbox documentation website">
      <HomepageHeader />
      <main>
        
        <Section
          title={<code>use-less-react</code>}
        >
          <div className={styles.buttons}>
            <Link
              className="button button--secondary button--lg"
              style={{ width: "100%"}}
              to="/docs/use-less-react/intro"
            >
              read documentation
            </Link>

            <Link
              className="button button--secondary button--lg"
              style={{ width: "100%"}}
              to="https://github.com/fabfog/use-less-react"
            >
              view GitHub repo
            </Link>
          </div>
        </Section>
      </main>
    </Layout>
  );
}
