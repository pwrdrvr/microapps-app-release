import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { ApplicationClient, ApplicationResponse } from '../clients/DeployerClient';
import fetch from 'node-fetch';

interface IPageProps {
  props: {
    apps: ApplicationResponse[];
  };
}

export default function Home(context): JSX.Element {
  return (
    <div className={styles.container}>
      <Head>
        <title>Release Console</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Release Console</h1>

        <section>
          <h2>Applications</h2>
          <ul>
            {context.props?.apps.map(({ appName, displayName }) => (
              <li key={appName}>
                <a>{displayName}</a>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

// This gets called on every request
Home.getInitialProps = async function (): Promise<IPageProps> {
  try {
    const client = new ApplicationClient(undefined, { fetch });

    const apps = await client.get();

    console.log(`Got apps: ${apps}`);

    // Pass data to the page via props
    return { props: { apps } };
  } catch (error) {
    console.log(`Error getting apps: ${error.message}}`);
    return { props: { apps: [{ appName: 'cat', displayName: 'dog' }] } };
  }
};
