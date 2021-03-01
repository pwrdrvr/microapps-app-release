import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { ApplicationClient, ApplicationResponse } from '../clients/DeployerClient';
import fetch from 'node-fetch';
import { NextPageContext } from 'next';

interface IPageProps {
  apps: ApplicationResponse[];
}

export default function Home(props: IPageProps): JSX.Element {
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
            {props.apps.map(({ appName, displayName }) => (
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
export async function getServerSideProps(ctx: NextPageContext): Promise<{ props: IPageProps }> {
  try {
    const client = new ApplicationClient(process.env.DEPLOYER_BASE_URL ?? undefined, { fetch });

    const apps = await client.get();

    console.log(`Got apps:`, apps);

    // Pass data to the page via props
    return { props: { apps } };
  } catch (error) {
    console.log(`Error getting apps: ${error.message}}`);
    return { props: { apps: [{ appName: 'cat', displayName: 'dog' }] } };
  }
}
