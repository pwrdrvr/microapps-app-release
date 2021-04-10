import '../styles/globals.scss';
import React, { FC } from 'react';
import { AppProps } from 'next/app';
import { wrapper } from '../store/store';

// function MyApp({ Component, pageProps }: AppProps): JSX.Element {
//   return <Component {...pageProps} />;
// }

// export default MyApp;

const WrappedApp: FC<AppProps> = ({ Component, pageProps }) => <Component {...pageProps} />;

export default wrapper.withRedux(WrappedApp);
