import * as React from 'react';
import clsx, { ClassValue } from 'clsx';
import styles from '../styles/ContentBox.module.css';

export function ContentBox({
  className,
  children,
  style,
}: {
  className: ClassValue;
  children: JSX.Element[];
  style: React.CSSProperties;
}): JSX.Element {
  return (
    <div className={clsx(styles.ContentBox, className)} style={style}>
      {children}
    </div>
  );
}

export function ContentBoxHeader({
  text,
  sourceLink,
  docsLink,
}: {
  text: string;
  sourceLink: string;
  docsLink: string;
}): JSX.Element {
  const links = [];

  if (sourceLink) {
    links.push(
      <a className={styles.Link} href={sourceLink} key="sourceLink">
        Source
      </a>,
    );
  }

  if (sourceLink && docsLink) {
    links.push(<span key="separator"> | </span>);
  }

  if (docsLink) {
    links.push(
      <a className={styles.Link} href={docsLink} key="docsLink">
        Docs
      </a>,
    );
  }

  return (
    <h1 className={styles.Header}>
      {text}

      {links.length > 0 && <small className={styles.Small}>{links}</small>}
    </h1>
  );
}

export function ContentBoxParagraph({
  children,
}: {
  children: string | JSX.Element | JSX.Element[];
}): JSX.Element {
  return <div className={styles.Paragraph}>{children}</div>;
}
