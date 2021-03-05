import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { NextPageContext } from 'next';
import Manager, { Application } from '@pwrdrvr/microapps-datalib';
import * as dynamodb from '@aws-sdk/client-dynamodb';

interface IApplication {
  AppName: string;
  DisplayName: string;
}

interface IPageProps {
  apps: IApplication[];
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
            {props.apps.map(({ AppName, DisplayName }) => (
              <li key={AppName}>
                <a>{DisplayName}</a>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

let dbclient: dynamodb.DynamoDB;
let manager: Manager;

// This gets called on every request
export async function getServerSideProps(ctx: NextPageContext): Promise<{ props: IPageProps }> {
  try {
    if (manager === undefined) {
      dbclient = new dynamodb.DynamoDB({});
      manager = new Manager(dbclient);
    }
    const appsRaw = await Application.LoadAllAppsAsync(dbclient);

    const apps = [] as IApplication[];
    for (const app of appsRaw) {
      apps.push({ AppName: app.AppName, DisplayName: app.DisplayName });
    }

    console.log(`Got apps:`, apps);

    // Pass data to the page via props
    return { props: { apps } };
  } catch (error) {
    console.log(`Error getting apps: ${error.message}}`);
    return { props: { apps: [{ AppName: 'cat', DisplayName: 'dog' }] } };
  }
}
