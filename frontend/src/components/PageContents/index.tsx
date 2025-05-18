import { JSX, ReactNode } from "react";
import styles from "./PageContents.module.css";

interface Props {
  children: ReactNode;
}

const PageContents = ({ children }: Props): JSX.Element => {
  return <div className={styles.container}>{children}</div>;
};

export default PageContents;
